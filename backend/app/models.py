from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="student", index=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    attempts = db.relationship(
        "Attempt", back_populates="student", cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Exam(db.Model):
    __tablename__ = "exams"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    duration_minutes = db.Column(db.Integer, nullable=False, default=30)
    passing_marks = db.Column(db.Float, nullable=False, default=0)
    is_published = db.Column(db.Boolean, nullable=False, default=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    questions = db.relationship(
        "Question", back_populates="exam", cascade="all, delete-orphan", order_by="Question.id"
    )
    attempts = db.relationship(
        "Attempt", back_populates="exam", cascade="all, delete-orphan"
    )


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False)
    correct_option = db.Column(db.Integer, nullable=False)
    marks = db.Column(db.Float, nullable=False, default=1)

    exam = db.relationship("Exam", back_populates="questions")
    answers = db.relationship("Answer", back_populates="question", cascade="all, delete-orphan")


class Attempt(db.Model):
    __tablename__ = "attempts"
    __table_args__ = (
        db.UniqueConstraint("student_id", "exam_id", name="uq_student_exam_attempt"),
    )

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.id", ondelete="CASCADE"), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="in_progress", index=True)
    started_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    submitted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    question_order = db.Column(db.JSON, nullable=False, default=list)

    student = db.relationship("User", back_populates="attempts")
    exam = db.relationship("Exam", back_populates="attempts")
    answers = db.relationship("Answer", back_populates="attempt", cascade="all, delete-orphan")
    result = db.relationship(
        "Result", back_populates="attempt", cascade="all, delete-orphan", uselist=False
    )


class Answer(db.Model):
    __tablename__ = "answers"
    __table_args__ = (
        db.UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question_answer"),
    )

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    selected_option = db.Column(db.Integer, nullable=True)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    attempt = db.relationship("Attempt", back_populates="answers")
    question = db.relationship("Question", back_populates="answers")


class Result(db.Model):
    __tablename__ = "results"

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    marks_obtained = db.Column(db.Float, nullable=False, default=0)
    total_marks = db.Column(db.Float, nullable=False, default=0)
    percentage = db.Column(db.Float, nullable=False, default=0)
    passed = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)

    attempt = db.relationship("Attempt", back_populates="result")
