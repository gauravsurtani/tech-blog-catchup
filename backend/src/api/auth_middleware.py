"""Short-lived server-to-server identity tokens; membership is always read live."""

import os
import jwt
from fastapi import Request, HTTPException
from sqlalchemy.exc import IntegrityError
from src.database import get_session
from src.models import User


def get_current_user(request: Request) -> User:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise HTTPException(401, "Sign in required")
    secret = os.getenv("API_SIGNING_SECRET")
    if not secret or len(secret) < 32:
        raise HTTPException(503, "Member access is not configured")
    try:
        claims = jwt.decode(
            header[7:],
            secret,
            algorithms=["HS256"],
            issuer="blog2podcast-web",
            audience="blog2podcast-api",
            options={"require": ["exp", "iat", "sub", "iss", "aud"]},
        )
        subject = claims["sub"]
        if not isinstance(subject, str) or not subject.startswith(
            ("google:", "github:")
        ):
            raise ValueError()
        if (
            claims["exp"] - claims["iat"] > 90
            or claims.get("email_verified") is not True
        ):
            raise ValueError()
        email = claims.get("email")
        if not isinstance(email, str) or "@" not in email:
            raise ValueError()
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(401, "Invalid member token")
    with get_session() as session:
        user = session.query(User).filter(User.subject == subject).first()
        if user is None:
            # Never attach a new provider subject to an existing email automatically.
            user = User(
                subject=subject,
                email=email,
                provider=subject.split(":")[0],
                role="pending",
            )
            session.add(user)
            try:
                session.commit()
            except IntegrityError:
                session.rollback()
                user = session.query(User).filter(User.subject == subject).first()
                if user is None:
                    raise HTTPException(409, "Identity requires operator review")
        if user.disabled_at is not None:
            raise HTTPException(403, "Member access revoked")
        session.expunge(user)
        return user


def get_optional_user(request: Request) -> User | None:
    return get_current_user(request) if request.headers.get("Authorization") else None


def require_member(request: Request) -> User:
    user = get_current_user(request)
    if user.role not in ("member", "admin"):
        raise HTTPException(403, "Generation is available to approved members")
    return user


def require_admin(request: Request) -> User:
    user = get_current_user(request)
    if user.role != "admin":
        raise HTTPException(403, "Administrator access required")
    return user


def require_generation_enabled():
    if os.getenv("ENABLE_GENERATION", "").lower() != "true":
        raise HTTPException(503, "Generation is temporarily unavailable")
