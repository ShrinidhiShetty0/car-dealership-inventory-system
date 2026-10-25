"""
One-time helper to create an admin user.

Usage:
    python create_admin.py
"""

from getpass import getpass

from database import SessionLocal, engine, Base
from models import User
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        username = input("Admin username: ").strip()
        email = input("Admin email: ").strip().lower()
        password = getpass("Admin password (min 8 chars): ")

        if len(username) < 3:
            print("Username must be at least 3 characters.")
            return
        if len(password) < 8:
            print("Password must be at least 8 characters.")
            return

        existing = (
            db.query(User)
            .filter((User.username == username) | (User.email == email))
            .first()
        )
        if existing:
            print("Username or email already exists.")
            return

        admin = User(
            username=username,
            email=email,
            hashed_password=password_hash.hash(password),
            role="admin",
        )
        db.add(admin)
        db.commit()
        print(f"Admin user '{username}' created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
