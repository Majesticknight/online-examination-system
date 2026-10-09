import random

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func

from app.extensions import db
from app.models import Answer, Attempt, Exam, Question, Result, User
from app.services import attempt_has_expired, create_attempt, finalize_attempt
from app.utils import as_utc, current_user, exam_to_dict, question_to_dict, result_to_dict, role_required, utcnow


student_bp = Blueprint("student", __name__)


def _attempt_payload(attempt, include_questions=True):
    if attempt.status == "in_progress" and attempt_has_expired(attempt):
        finalize_attempt(attempt)
        db.session.commit()

    data = {
        "id": attempt.id,
        "exam": exam_to_dict(attempt.exam),
        "status": attempt.status,
        "started_at": as_utc(attempt.started_at).isoformat(),
        "expires_at": as_utc(attempt.expires_at).isoformat(),
        "remaining_seconds": max(0, int((as_utc(attempt.expires_at) - as_utc(utcnow())).total_seconds())) if attempt.status == "in_progress" else 0,
        "submitted_at": as_utc(attempt.submitted_at).isoformat() if attempt.submitted_at else None,
    }
    if include_questions:
        answer_by_question = {answer.question_id: answer for answer in attempt.answers}
        question_by_id = {question.id: question for question in attempt.exam.questions}
        ordered = []
        for question_id in attempt.question_order:
            question = question_by_id.get(question_id)
            if question is None:
                continue
            item = question_to_dict(question, include_answer=False)
            answer = answer_by_question.get(question.id)
            item["selected_option"] = answer.selected_option if answer else None
            ordered.append(item)
        data["questions"] = ordered
    if attempt.result:
        data["result"] = result_to_dict(attempt.result, attempt=attempt, exam=attempt.exam)
    return data


@student_bp.get("/dashboard")
@role_required("student")
def dashboard():
    user = current_user()
    completed = (
        Result.query.join(Attempt, Result.attempt_id == Attempt.id)
        .filter(Attempt.student_id == user.id)
        .order_by(Result.created_at.asc())
        .all()
    )
    all_attempts = Attempt.query.filter_by(student_id=user.id).count()
    avg_percentage = sum(result.percentage for result in completed) / len(completed) if completed else 0
    passed = sum(1 for result in completed if result.passed)
    history = [
        {
            "label": result.attempt.exam.title,
            "date": as_utc(result.created_at).strftime("%d %b"),
            "percentage": float(result.percentage),
            "marks_obtained": float(result.marks_obtained),
            "total_marks": float(result.total_marks),
            "attempt_id": result.attempt_id,
        }
        for result in completed[-10:]
    ]
    recent = [result_to_dict(result) for result in completed[-5:][::-1]]
    published_ids = {exam.id for exam in Exam.query.filter_by(is_published=True).all()}
    attempted_ids = {row[0] for row in db.session.query(Attempt.exam_id).filter_by(student_id=user.id).all()}
    available = len(published_ids - attempted_ids)
    return jsonify({
        "stats": {
            "exams_attempted": all_attempts,
            "completed_exams": len(completed),
            "average_percentage": round(avg_percentage, 2),
            "pass_rate": round(passed / len(completed) * 100, 2) if completed else 0,
            "available_exams": available,
        },
        "score_history": history,
        "recent_results": recent,
    })


@student_bp.get("/exams")
@role_required("student")
def list_exams():
    user = current_user()
    exams = Exam.query.filter_by(is_published=True).order_by(Exam.created_at.desc()).all()
    attempts = {attempt.exam_id: attempt for attempt in Attempt.query.filter_by(student_id=user.id).all()}
    output = []
    for exam in exams:
        attempt = attempts.get(exam.id)
        item = exam_to_dict(exam)
        item["attempt_status"] = attempt.status if attempt else None
        item["attempt_id"] = attempt.id if attempt else None
        item["result"] = result_to_dict(attempt.result, attempt=attempt, exam=exam) if attempt and attempt.result else None
        output.append(item)
    return jsonify({"exams": output})


@student_bp.get("/exams/<int:exam_id>")
@role_required("student")
def get_exam(exam_id):
    exam = db.session.get(Exam, exam_id)
    if not exam or not exam.is_published:
        return jsonify({"error": "Exam not found or not available."}), 404
    user = current_user()
    attempt = Attempt.query.filter_by(student_id=user.id, exam_id=exam.id).first()
    payload = exam_to_dict(exam)
    payload["has_attempt"] = attempt is not None
    payload["attempt_id"] = attempt.id if attempt else None
    payload["attempt_status"] = attempt.status if attempt else None
    return jsonify({"exam": payload})


@student_bp.post("/exams/<int:exam_id>/start")
@role_required("student")
def start_exam(exam_id):
    user = current_user()
    exam = db.session.get(Exam, exam_id)
    if not exam or not exam.is_published:
        return jsonify({"error": "Exam not found or not available."}), 404
    if not exam.questions:
        return jsonify({"error": "This exam has no questions yet."}), 400

    existing = Attempt.query.filter_by(student_id=user.id, exam_id=exam.id).first()
    if existing:
        if existing.status == "in_progress" and attempt_has_expired(existing):
            finalize_attempt(existing)
            db.session.commit()
        if existing.status == "in_progress":
            return jsonify({"error": "You already have an exam in progress.", "attempt_id": existing.id}), 409
        return jsonify({"error": "You have already attempted this exam.", "attempt_id": existing.id}), 409

    ordered_questions = list(exam.questions)
    random.shuffle(ordered_questions)
    attempt = create_attempt(user, exam, ordered_questions)
    db.session.commit()
    return jsonify({"message": "Exam started.", "attempt": _attempt_payload(attempt)}), 201


@student_bp.get("/attempts/<int:attempt_id>")
@role_required("student")
def get_attempt(attempt_id):
    user = current_user()
    attempt = db.session.get(Attempt, attempt_id)
    if not attempt or attempt.student_id != user.id:
        return jsonify({"error": "Attempt not found."}), 404
    return jsonify({"attempt": _attempt_payload(attempt)})


@student_bp.put("/attempts/<int:attempt_id>/answers/<int:question_id>")
@role_required("student")
def save_answer(attempt_id, question_id):
    user = current_user()
    attempt = db.session.get(Attempt, attempt_id)
    if not attempt or attempt.student_id != user.id:
        return jsonify({"error": "Attempt not found."}), 404
    if attempt.status != "in_progress":
        return jsonify({"error": "This exam attempt is already closed."}), 409
    if attempt_has_expired(attempt):
        finalize_attempt(attempt)
        db.session.commit()
        return jsonify({"error": "Time is up. Your saved answers were submitted.", "attempt": _attempt_payload(attempt, include_questions=False)}), 409

    data = request.get_json(silent=True) or {}
    selected = data.get("selected_option")
    question = db.session.get(Question, question_id)
    if not question or question.exam_id != attempt.exam_id:
        return jsonify({"error": "Question does not belong to this exam."}), 404
    if selected is not None and (not isinstance(selected, int) or isinstance(selected, bool) or selected not in range(len(question.options))):
        return jsonify({"error": "Selected option is invalid."}), 400
    answer = Answer.query.filter_by(attempt_id=attempt.id, question_id=question.id).first()
    if not answer:
        return jsonify({"error": "Answer record not found."}), 404
    answer.selected_option = selected
    answer.updated_at = utcnow()
    db.session.commit()
    return jsonify({"message": "Answer saved.", "question_id": question.id, "selected_option": answer.selected_option})


@student_bp.post("/attempts/<int:attempt_id>/submit")
@role_required("student")
def submit_attempt(attempt_id):
    user = current_user()
    attempt = db.session.get(Attempt, attempt_id)
    if not attempt or attempt.student_id != user.id:
        return jsonify({"error": "Attempt not found."}), 404
    if attempt.status == "in_progress":
        finalize_attempt(attempt)
        db.session.commit()
    return jsonify({"message": "Exam submitted.", "result": result_to_dict(attempt.result, attempt=attempt, exam=attempt.exam)})


@student_bp.get("/results")
@role_required("student")
def list_results():
    user = current_user()
    results = (
        Result.query.join(Attempt, Result.attempt_id == Attempt.id)
        .filter(Attempt.student_id == user.id)
        .order_by(Result.created_at.desc())
        .all()
    )
    return jsonify({"results": [result_to_dict(result) for result in results]})


@student_bp.get("/results/<int:attempt_id>")
@role_required("student")
def get_result_detail(attempt_id):
    user = current_user()
    attempt = db.session.get(Attempt, attempt_id)
    if not attempt or attempt.student_id != user.id or not attempt.result:
        return jsonify({"error": "Result not found."}), 404
    answers = {answer.question_id: answer for answer in attempt.answers}
    ordered = []
    for question_id in attempt.question_order:
        question = next((q for q in attempt.exam.questions if q.id == question_id), None)
        if not question:
            continue
        answer = answers.get(question.id)
        selected = answer.selected_option if answer else None
        ordered.append({
            "id": question.id,
            "text": question.text,
            "options": question.options,
            "selected_option": selected,
            "correct_option": question.correct_option,
            "is_correct": selected == question.correct_option,
            "marks": float(question.marks),
            "marks_awarded": float(question.marks) if selected == question.correct_option else 0,
        })
    return jsonify({"result": result_to_dict(attempt.result, attempt=attempt, exam=attempt.exam), "questions": ordered})
