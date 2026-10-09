from datetime import timedelta

from app.extensions import db
from app.models import Answer, Attempt, Question, Result
from app.utils import as_utc, utcnow


def finalize_attempt(attempt):
    """Grade an in-progress attempt once. Safe to call more than once."""
    if attempt.result is not None:
        return attempt.result

    questions = {question.id: question for question in attempt.exam.questions}
    marks_obtained = 0.0
    for answer in attempt.answers:
        question = questions.get(answer.question_id)
        if question and answer.selected_option is not None and answer.selected_option == question.correct_option:
            marks_obtained += float(question.marks)

    total_marks = sum(float(question.marks) for question in questions.values())
    percentage = (marks_obtained / total_marks * 100) if total_marks > 0 else 0.0
    passed = marks_obtained >= float(attempt.exam.passing_marks)
    now = utcnow()
    expired = as_utc(now) >= as_utc(attempt.expires_at)

    attempt.status = "expired" if expired else "submitted"
    attempt.submitted_at = now
    result = Result(
        attempt=attempt,
        marks_obtained=round(marks_obtained, 2),
        total_marks=round(total_marks, 2),
        percentage=round(percentage, 2),
        passed=passed,
        created_at=now,
    )
    db.session.add(result)
    db.session.flush()
    return result


def attempt_has_expired(attempt):
    return as_utc(utcnow()) >= as_utc(attempt.expires_at)


def create_attempt(student, exam, ordered_questions):
    start = utcnow()
    attempt = Attempt(
        student=student,
        exam=exam,
        status="in_progress",
        started_at=start,
        expires_at=start + timedelta(minutes=exam.duration_minutes),
        question_order=[question.id for question in ordered_questions],
    )
    db.session.add(attempt)
    db.session.flush()
    for question in ordered_questions:
        db.session.add(Answer(attempt_id=attempt.id, question_id=question.id, selected_option=None))
    db.session.flush()
    return attempt
