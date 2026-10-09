"""Add a small set of sample exams for demonstrations. Safe to run more than once."""
from app import create_app
from app.extensions import db
from app.models import Exam, Question

app = create_app()
DEMO_EXAMS = [
    {
        "title": "Python Fundamentals",
        "description": "A short MCQ test covering Python basics, functions, collections, and exceptions.",
        "duration_minutes": 10,
        "passing_marks": 3,
        "questions": [
            ("Which keyword is used to define a function in Python?", ["func", "def", "function", "lambda"], 1, 1),
            ("Which data type stores key-value pairs?", ["list", "tuple", "set", "dict"], 3, 1),
            ("What is the result of 3 // 2?", ["1.5", "2", "1", "0"], 2, 1),
            ("Which statement handles an exception?", ["catch", "try/except", "handle", "error"], 1, 1),
            ("Which symbol starts a single-line comment?", ["//", "<!--", "#", "**"], 2, 1),
        ],
    },
    {
        "title": "Database Basics",
        "description": "Test your knowledge of SQL, keys, relationships, and relational databases.",
        "duration_minutes": 8,
        "passing_marks": 3,
        "questions": [
            ("Which SQL command retrieves data?", ["GET", "SELECT", "FETCH ALL", "OPEN"], 1, 1),
            ("Which key uniquely identifies a row?", ["Foreign key", "Candidate group", "Primary key", "Index only"], 2, 1),
            ("Which command adds a new row?", ["INSERT", "UPDATE", "ALTER", "CREATE"], 0, 1),
            ("What does SQL stand for?", ["Structured Query Language", "Simple Question List", "Sequential Query Logic", "System Quality Language"], 0, 1),
            ("Which clause filters rows?", ["ORDER BY", "GROUP BY", "WHERE", "JOIN"], 2, 1),
        ],
    },
    {
        "title": "Web Technology Essentials",
        "description": "A quick assessment of HTML, CSS, JavaScript, and HTTP concepts.",
        "duration_minutes": 8,
        "passing_marks": 3,
        "questions": [
            ("What does HTML primarily define?", ["Page structure", "Database storage", "Server hardware", "Network routing"], 0, 1),
            ("Which CSS property changes text color?", ["font-style", "color", "background-image", "text-align"], 1, 1),
            ("Which HTTP method is commonly used to retrieve a resource?", ["POST", "DELETE", "GET", "PATCH"], 2, 1),
            ("Which language adds behavior to web pages?", ["SQL", "JavaScript", "HTML only", "XML"], 1, 1),
            ("What is React mainly used for?", ["Building user interfaces", "Managing SQL tables directly", "Replacing HTTP", "Compiling Python"], 0, 1),
        ],
    },
]

with app.app_context():
    for item in DEMO_EXAMS:
        if Exam.query.filter_by(title=item["title"]).first():
            print(f"Skipped existing demo exam: {item['title']}")
            continue
        exam = Exam(
            title=item["title"],
            description=item["description"],
            duration_minutes=item["duration_minutes"],
            passing_marks=item["passing_marks"],
            is_published=True,
        )
        for question_text, options, correct_option, marks in item["questions"]:
            exam.questions.append(Question(text=question_text, options=options, correct_option=correct_option, marks=marks))
        db.session.add(exam)
        print(f"Added demo exam: {item['title']}")
    db.session.commit()
    print("Demo exams are ready. No student results have been fabricated.")
