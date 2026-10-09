import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models import User
from app.utils import user_to_dict


auth_bp = Blueprint("auth", __name__)
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def make_token(user):
    return create_access_token(
        identity=str(user.id), additional_claims={"role": user.role, "name": user.name}
    )


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not name:
        return jsonify({"error": "Name is required."}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Enter a valid email address."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must contain at least 8 characters."}), 400
    if db.session.query(User.id).filter(func.lower(User.email) == email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    user = User(name=name, email=email, role="student")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Account created successfully.", "user": user_to_dict(user), "access_token": make_token(user)}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = User.query.filter(func.lower(User.email) == email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password."}), 401
    return jsonify({"message": "Login successful.", "user": user_to_dict(user), "access_token": make_token(user)})


@auth_bp.get("/me")
@jwt_required()
def me():
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid access token."}), 401
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "Account not found."}), 404
    return jsonify({"user": user_to_dict(user)})
