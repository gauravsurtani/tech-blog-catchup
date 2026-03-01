"""JWT authentication middleware for user endpoints."""

import logging
import os

import jwt
from fastapi import Request, HTTPException

from src.database import get_session
from src.models import User

logger = logging.getLogger(__name__)


def _get_secret() -> str:
    """Return the JWT secret used by NextAuth for token signing."""
    secret = os.environ.get("NEXTAUTH_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="Auth not configured")
    return secret


def _extract_token(request: Request) -> str | None:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:]  # strip "Bearer "


def get_current_user(request: Request) -> User:
    """FastAPI dependency: validate JWT and return the authenticated User.

    Raises 401 if token is missing, invalid, or user not found.
    """
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    try:
        payload = jwt.decode(token, _get_secret(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    email: str | None = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Token missing email claim")

    session = get_session()
    try:
        user = session.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        # Expunge so user can be used after session closes
        session.expunge(user)
        return user
    finally:
        session.close()


def get_optional_user(request: Request) -> User | None:
    """FastAPI dependency: return User if valid token present, else None.

    For public endpoints that optionally personalize for logged-in users.
    """
    token = _extract_token(request)
    if not token:
        return None

    try:
        payload = jwt.decode(token, _get_secret(), algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return None

    email: str | None = payload.get("email")
    if not email:
        return None

    session = get_session()
    try:
        user = session.query(User).filter(User.email == email).first()
        if user:
            session.expunge(user)
        return user
    finally:
        session.close()
