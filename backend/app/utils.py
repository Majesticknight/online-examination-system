from datetime import datetime, timezone
from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.extensions import db
from app.models import User


def utcnow():
    return datetime.now(timezone.utc)


def as_utc(value):
    """Make a datetime timezone-aware; SQLite may return naive datetimes."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def current_user():
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return db.session.get(User, user_id)


def role_required(role):
    def decorator(view_function):
        @wraps(view_function)
        @jwt_required()
        def wrapped(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") != role:
                return jsonify({"error": "You do not have permission to access this resource."}), 403
            user = current_user()
            if user is None:
                return jsonify({"error": "Account not found."}), 401
            return view_function(*args, **kwargs)

        return wrapped

    return decorator


def user_to_dict(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def exam_to_dict(exam, include_questions=False):
    data = {
        "id": exam.id,
        "title": exam.title,
        "description": exam.description or "",
        "duration_minutes": exam.duration_minutes,
        "passing_marks": float(exam.passing_marks),
        "is_published": exam.is_published,
        "question_count": len(exam.questions),
        "total_marks": round(sum(float(question.marks) for question in exam.questions), 2),
        "attempt_count": len(exam.attempts),
        "created_at": exam.created_at.isoformat() if exam.created_at else None,
    }
    if include_questions:
        data["questions"] = [question_to_dict(q, include_answer=True) for q in exam.questions]
    return data


def question_to_dict(question, include_answer=False):
    data = {
        "id": question.id,
        "exam_id": question.exam_id,
        "text": question.text,
        "options": question.options,
        "marks": float(question.marks),
    }
    if include_answer:
        data["correct_option"] = question.correct_option
    return data


def result_to_dict(result, attempt=None, exam=None):
    attempt = attempt or result.attempt
    exam = exam or attempt.exam
    return {
        "id": result.id,
        "attempt_id": attempt.id,
        "exam_id": exam.id,
        "exam_title": exam.title,
        "student_id": attempt.student_id,
        "student_name": attempt.student.name if attempt.student else None,
        "student_email": attempt.student.email if attempt.student else None,
        "marks_obtained": float(result.marks_obtained),
        "total_marks": float(result.total_marks),
        "percentage": float(result.percentage),
        "passed": result.passed,
        "submitted_at": result.created_at.isoformat() if result.created_at else None,
        "attempt_status": attempt.status,
    }
