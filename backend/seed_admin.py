import os

from dotenv import load_dotenv

from app import create_app
from app.extensions import db
from app.models import User

load_dotenv()
app = create_app()


with app.app_context():
    email = os.getenv("ADMIN_EMAIL", "admin@example.com").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "")
    name = os.getenv("ADMIN_NAME", "System Administrator").strip()
    if not password or len(password) < 8:
        raise SystemExit("Set ADMIN_PASSWORD to a value of at least 8 characters in your .env file first.")
    existing = User.query.filter_by(email=email).first()
    if existing:
        if existing.role != "admin":
            existing.role = "admin"
            db.session.commit()
        print(f"Admin account already exists: {email}")
    else:
        admin = User(name=name or "System Administrator", email=email, role="admin")
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print(f"Admin account created: {email}")
    print("Use the password configured in backend/.env. Do not reuse this demo password in a public deployment.")
