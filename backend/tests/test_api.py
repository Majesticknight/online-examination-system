import pytest

from app import create_app
from app.extensions import db
from app.models import Exam, Question, User


@pytest.fixture()
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "JWT_SECRET_KEY": "test-secret",
        "SECRET_KEY": "test-secret",
        "CORS_ORIGINS": ["http://localhost:5173"],
    })
    with app.app_context():
        db.create_all()
        admin = User(name="Admin", email="admin@example.com", role="admin")
        admin.set_password("password123")
        student = User(name="Student", email="student@example.com", role="student")
        student.set_password("password123")
        exam = Exam(title="Python Basics", description="A sample test", duration_minutes=10, passing_marks=1, is_published=True)
        exam.questions.append(Question(text="Which keyword defines a function?", options=["func", "def", "function", "lambda"], correct_option=1, marks=1))
        db.session.add_all([admin, student, exam])
        db.session.commit()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def login(client, email, password="password123"):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json['access_token']}"}


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json["status"] == "ok"


def test_student_can_start_and_submit_exam(client):
    headers = login(client, "student@example.com")
    start = client.post("/api/student/exams/1/start", headers=headers)
    assert start.status_code == 201
    attempt = start.json["attempt"]
    question = attempt["questions"][0]
    assert "correct_option" not in question

    save = client.put(
        f"/api/student/attempts/{attempt['id']}/answers/{question['id']}",
        headers=headers,
        json={"selected_option": 1},
    )
    assert save.status_code == 200
    submitted = client.post(f"/api/student/attempts/{attempt['id']}/submit", headers=headers)
    assert submitted.status_code == 200
    assert submitted.json["result"]["marks_obtained"] == 1
    assert submitted.json["result"]["passed"] is True


def test_students_cannot_access_admin_dashboard(client):
    headers = login(client, "student@example.com")
    response = client.get("/api/admin/dashboard", headers=headers)
    assert response.status_code == 403


def test_registration_rejects_short_password(client):
    response = client.post("/api/auth/register", json={"name": "New Student", "email": "new@example.com", "password": "short"})
    assert response.status_code == 400
