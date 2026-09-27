"""Member submissions are private, owned, validated and idempotent."""

import pytest
from unittest.mock import patch
from src.models import User, Post, Job
from tests.test_beta_boundary import beta, token


@pytest.fixture
def member(beta, monkeypatch):
    c, factory = beta
    with factory() as s:
        s.add(
            User(
                subject="google:123",
                email="member@example.test",
                provider="google",
                role="member",
            )
        )
        s.commit()
    monkeypatch.setenv("ENABLE_GENERATION", "true")
    c.headers.update(
        {"Authorization": "Bearer " + token(), "Idempotency-Key": "request-test-key"}
    )
    return c, factory


@pytest.mark.parametrize(
    "body",
    [
        {},
        {"title": "No body"},
        {"text": "a" * 200},
        {"title": "x" * 501, "text": "a" * 200},
        {"title": "Short", "text": "a"},
        {"title": "Long", "text": "x" * 50001},
    ],
)
def test_validates_member_input(member, body):
    c, factory = member
    assert c.post("/api/posts/submit", json=body).status_code == 422
    with factory() as s:
        assert s.query(Job).count() == 0


def test_owned_idempotent_private_submission(member):
    c, factory = member
    data = {
        "title": "A source",
        "text": "Learning from a permission-cleared source. " * 10,
    }
    first = c.post("/api/posts/submit", json=data)
    assert first.status_code == 200
    again = c.post("/api/posts/submit", json=data)
    assert again.status_code == 200
    assert first.json()["job_id"] == again.json()["job_id"]
    with factory() as s:
        p = s.get(Post, first.json()["post_id"])
        j = s.get(Job, first.json()["job_id"])
        assert p.visibility == "private" and p.submitted_by_user_id == j.owner_id
        assert p.full_text == data["text"].strip() and p.word_count == len(
            data["text"].split()
        )
    c.headers.pop("Authorization")
    assert c.get("/api/posts").json()["total"] == 0
    assert c.get(f"/api/posts/{first.json()['post_id']}").status_code == 404


def test_idempotency_rejects_changed_payload(member):
    c, _ = member
    data = {"title": "First", "text": "Source facts. " * 20}
    assert c.post("/api/posts/submit", json=data).status_code == 200
    assert (
        c.post("/api/posts/submit", json={**data, "title": "Changed"}).status_code
        == 409
    )
