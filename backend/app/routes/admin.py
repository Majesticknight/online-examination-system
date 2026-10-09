from collections import defaultdict
from datetime import timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app.extensions import db
from app.models import Attempt, Exam, Question, Result, User
from app.utils import as_utc, current_user, exam_to_dict, question_to_dict, result_to_dict, role_required, utcnow


admin_bp = Blueprint("admin", __name__)


def _validate_exam_payload(data, creating=False):
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    try:
        duration = int(data.get("duration_minutes", 30))
        passing_marks = float(data.get("passing_marks", 0))
    except (TypeError, ValueError):
        return None, "Duration and passing marks must be valid numbers."
    if not title:
        return None, "Exam title is required."
    if duration < 1 or duration > 360:
        return None, "Duration must be between 1 and 360 minutes."
    if passing_marks < 0:
        return None, "Passing marks cannot be negative."
    values = {"title": title, "description": description, "duration_minutes": duration, "passing_marks": passing_marks}
    if "is_published" in data:
        values["is_published"] = bool(data["is_published"])
    elif creating:
        values["is_published"] = False
    return values, None


def _validate_question_payload(data):
    text = str(data.get("text", "")).strip()
    options = data.get("options")
    correct_option = data.get("correct_option")
    try:
        marks = float(data.get("marks", 1))
    except (TypeError, ValueError):
        return None, "Marks must be a valid number."
    if not text:
        return None, "Question text is required."
    if not isinstance(options, list) or len(options) != 4 or any(not isinstance(option, str) or not option.strip() for option in options):
        return None, "Provide exactly four non-empty answer options."
    if not isinstance(correct_option, int) or isinstance(correct_option, bool) or correct_option not in range(4):
        return None, "Correct option must be a number from 0 to 3."
    if marks <= 0 or marks > 1000:
        return None, "Question marks must be greater than 0 and at most 1000."
    return {"text": text, "options": [option.strip() for option in options], "correct_option": correct_option, "marks": marks}, None


def _question_counts_by_exam(exams):
    return {exam.id: len(exam.questions) for exam in exams}


@admin_bp.get("/dashboard")
@role_required("admin")
def dashboard():
    total_students = User.query.filter_by(role="student").count()
    total_exams = Exam.query.count()
    total_attempts = Attempt.query.count()
    results = Result.query.all()
    average_percentage = sum(float(result.percentage) for result in results) / len(results) if results else 0
    passed_count = sum(1 for result in results if result.passed)
    failed_count = len(results) - passed_count

    exams = Exam.query.order_by(Exam.created_at.desc()).all()
    exam_performance = []
    for exam in exams:
        exam_results = [result for result in results if result.attempt.exam_id == exam.id]
        exam_performance.append({
            "exam": exam.title,
            "exam_id": exam.id,
            "average_percentage": round(sum(float(result.percentage) for result in exam_results) / len(exam_results), 2) if exam_results else 0,
            "attempts": len(exam_results),
        })
    exam_performance.sort(key=lambda row: row["exam_id"])

    today = utcnow().date()
    day_counts = defaultdict(int)
    attempts = Attempt.query.all()
    for attempt in attempts:
        day_counts[as_utc(attempt.started_at).date()] += 1
    participation = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        participation.append({"date": day.strftime("%d %b"), "attempts": day_counts.get(day, 0)})

    return jsonify({
        "stats": {
            "total_students": total_students,
            "total_exams": total_exams,
            "total_attempts": total_attempts,
            "completed_attempts": len(results),
            "average_percentage": round(average_percentage, 2),
        },
        "pass_fail": [{"name": "Passed", "value": passed_count}, {"name": "Failed", "value": failed_count}],
        "exam_performance": exam_performance,
        "participation": participation,
    })


@admin_bp.get("/exams")
@role_required("admin")
def list_exams():
    exams = Exam.query.order_by(Exam.created_at.desc()).all()
    return jsonify({"exams": [exam_to_dict(exam) for exam in exams]})


@admin_bp.post("/exams")
@role_required("admin")
def create_exam():
    data = request.get_json(silent=True) or {}
    values, error = _validate_exam_payload(data, creating=True)
    if error:
        return jsonify({"error": error}), 400
    if values.get("is_published"):
        values["is_published"] = False
    exam = Exam(**values)
    db.session.add(exam)
    db.session.commit()
    return jsonify({"message": "Exam created. Add questions before publishing.", "exam": exam_to_dict(exam)}), 201


@admin_bp.get("/exams/<int:exam_id>")
@role_required("admin")
def get_exam(exam_id):
    exam = db.session.get(Exam, exam_id)
    if not exam:
        return jsonify({"error": "Exam not found."}), 404
    return jsonify({"exam": exam_to_dict(exam), "questions": [question_to_dict(q, include_answer=True) for q in exam.questions]})


@admin_bp.put("/exams/<int:exam_id>")
@role_required("admin")
def update_exam(exam_id):
    exam = db.session.get(Exam, exam_id)
    if not exam:
        return jsonify({"error": "Exam not found."}), 404
    data = request.get_json(silent=True) or {}
    values, error = _validate_exam_payload(data)
    if error:
        return jsonify({"error": error}), 400
    for key in ("title", "description", "duration_minutes", "passing_marks"):
        if key in values:
            setattr(exam, key, values[key])
    if "is_published" in values:
        if values["is_published"] and not exam.questions:
            return jsonify({"error": "Add at least one question before publishing this exam."}), 400
        if values["is_published"] and float(values["passing_marks"]) > sum(float(question.marks) for question in exam.questions):
            return jsonify({"error": "Passing marks cannot exceed the exam total marks."}), 400
        exam.is_published = values["is_published"]
    db.session.commit()
    return jsonify({"message": "Exam updated.", "exam": exam_to_dict(exam)})


@admin_bp.delete("/exams/<int:exam_id>")
@role_required("admin")
def delete_exam(exam_id):
    exam = db.session.get(Exam, exam_id)
    if not exam:
        return jsonify({"error": "Exam not found."}), 404
    db.session.delete(exam)
    db.session.commit()
    return jsonify({"message": "Exam deleted."})


@admin_bp.get("/exams/<int:exam_id>/questions")
@role_required("admin")
def list_questions(exam_id):
    exam = db.session.get(Exam, exam_id)
    if not exam:
        return jsonify({"error": "Exam not found."}), 404
    return jsonify({"questions": [question_to_dict(q, include_answer=True) for q in exam.questions]})


@admin_bp.post("/exams/<int:exam_id>/questions")
@role_required("admin")
def create_question(exam_id):
    exam = db.session.get(Exam, exam_id)
    if not exam:
        return jsonify({"error": "Exam not found."}), 404
    if exam.attempts:
        return jsonify({"error": "Questions cannot be changed after a student has started this exam."}), 409
    data = request.get_json(silent=True) or {}
    values, error = _validate_question_payload(data)
    if error:
        return jsonify({"error": error}), 400
    question = Question(exam_id=exam.id, **values)
    db.session.add(question)
    db.session.commit()
    return jsonify({"message": "Question added.", "question": question_to_dict(question, include_answer=True)}), 201


@admin_bp.put("/questions/<int:question_id>")
@role_required("admin")
def update_question(question_id):
    question = db.session.get(Question, question_id)
    if not question:
        return jsonify({"error": "Question not found."}), 404
    if question.exam.attempts:
        return jsonify({"error": "Questions cannot be changed after a student has started this exam."}), 409
    values, error = _validate_question_payload(request.get_json(silent=True) or {})
    if error:
        return jsonify({"error": error}), 400
    for key, value in values.items():
        setattr(question, key, value)
    db.session.commit()
    return jsonify({"message": "Question updated.", "question": question_to_dict(question, include_answer=True)})


@admin_bp.delete("/questions/<int:question_id>")
@role_required("admin")
def delete_question(question_id):
    question = db.session.get(Question, question_id)
    if not question:
        return jsonify({"error": "Question not found."}), 404
    if question.exam.attempts:
        return jsonify({"error": "Questions cannot be changed after a student has started this exam."}), 409
    db.session.delete(question)
    db.session.commit()
    return jsonify({"message": "Question deleted."})


@admin_bp.get("/results")
@role_required("admin")
def list_results():
    results = Result.query.order_by(Result.created_at.desc()).all()
    return jsonify({"results": [result_to_dict(result) for result in results]})


@admin_bp.get("/students")
@role_required("admin")
def list_students():
    students = User.query.filter_by(role="student").order_by(User.created_at.desc()).all()
    output = []
    for student in students:
        completed = [attempt.result for attempt in student.attempts if attempt.result]
        output.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "created_at": as_utc(student.created_at).isoformat(),
            "attempt_count": len(student.attempts),
            "average_percentage": round(sum(r.percentage for r in completed) / len(completed), 2) if completed else 0,
        })
    return jsonify({"students": output})
