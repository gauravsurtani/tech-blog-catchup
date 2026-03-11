"""Tests for user submission fields on Post model."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database import Base
from src.models import Post, User


@pytest.fixture()
def engine():
    """Create an in-memory SQLite engine with all tables."""
    eng = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(eng)
    return eng


@pytest.fixture()
def session(engine):
    """Provide a transactional session for tests."""
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    sess = Session()
    yield sess
    sess.close()


class TestUserSubmissionFields:
    def test_create_user_submitted_post(self, session):
        """User-submitted post should persist all submission fields."""
        user = User(email="submitter@example.com", name="Submitter", provider="github")
        session.add(user)
        session.commit()

        post = Post(
            url="https://myblog.com/my-article",
            source_key="user",
            source_name="User Submission",
            title="My Custom Article",
            is_user_submitted=True,
            submitted_by_user_id=user.id,
            submission_type="url",
        )
        session.add(post)
        session.commit()

        fetched = session.query(Post).filter(Post.url == "https://myblog.com/my-article").first()
        assert fetched is not None
        assert fetched.is_user_submitted is True
        assert fetched.submitted_by_user_id == user.id
        assert fetched.submission_type == "url"
        assert fetched.source_key == "user"

    def test_backward_compatibility_defaults(self, session):
        """Normal crawled post should default is_user_submitted=False, others None."""
        post = Post(
            url="https://engineering.uber.com/some-post",
            source_key="uber",
            source_name="Uber Engineering",
            title="Uber Post",
        )
        session.add(post)
        session.commit()

        fetched = session.query(Post).filter(Post.source_key == "uber").first()
        assert fetched.is_user_submitted is False
        assert fetched.submitted_by_user_id is None
        assert fetched.submission_type is None

    def test_filter_user_submissions(self, session):
        """Filtering by is_user_submitted should return only user-submitted posts."""
        # 3 crawled posts
        for i in range(3):
            session.add(Post(
                url=f"https://example.com/crawled-{i}",
                source_key="meta",
                source_name="Meta Engineering",
                title=f"Crawled Post {i}",
            ))

        # 2 user-submitted posts
        for i in range(2):
            session.add(Post(
                url=f"https://example.com/submitted-{i}",
                source_key="user",
                source_name="User Submission",
                title=f"Submitted Post {i}",
                is_user_submitted=True,
                submission_type="url",
            ))
        session.commit()

        user_posts = session.query(Post).filter(Post.is_user_submitted == True).all()  # noqa: E712
        assert len(user_posts) == 2

        crawled_posts = session.query(Post).filter(Post.is_user_submitted == False).all()  # noqa: E712
        assert len(crawled_posts) == 3

    def test_submitted_by_relationship(self, session):
        """Post.submitted_by should resolve to the User who submitted it."""
        user = User(email="author@example.com", name="Author", provider="google")
        session.add(user)
        session.commit()

        post = Post(
            url="https://example.com/user-post",
            source_key="user",
            source_name="User Submission",
            title="User Article",
            is_user_submitted=True,
            submitted_by_user_id=user.id,
            submission_type="text",
        )
        session.add(post)
        session.commit()

        fetched = session.query(Post).filter(Post.url == "https://example.com/user-post").first()
        assert fetched.submitted_by is not None
        assert fetched.submitted_by.id == user.id
        assert fetched.submitted_by.email == "author@example.com"

    def test_user_submitted_posts_backref(self, session):
        """User.submitted_posts backref should list all posts submitted by that user."""
        user = User(email="prolific@example.com", name="Prolific", provider="github")
        session.add(user)
        session.commit()

        for i in range(3):
            session.add(Post(
                url=f"https://example.com/prolific-{i}",
                source_key="user",
                source_name="User Submission",
                title=f"Prolific Post {i}",
                is_user_submitted=True,
                submitted_by_user_id=user.id,
                submission_type="url",
            ))
        session.commit()

        fetched_user = session.query(User).filter(User.email == "prolific@example.com").first()
        assert len(fetched_user.submitted_posts) == 3

    def test_submission_type_text(self, session):
        """submission_type='text' should persist correctly."""
        post = Post(
            url="https://example.com/text-submission",
            source_key="user",
            source_name="User Submission",
            title="Text Submission",
            is_user_submitted=True,
            submission_type="text",
        )
        session.add(post)
        session.commit()

        fetched = session.query(Post).filter(Post.url == "https://example.com/text-submission").first()
        assert fetched.submission_type == "text"
