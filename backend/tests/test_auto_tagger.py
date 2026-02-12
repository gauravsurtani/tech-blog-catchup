"""Tests for keyword-based auto-tagging."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database import Base
from src.models import Post, Tag
from src.config import TagDefinition
from src.tagger.auto_tagger import auto_tag_post, ensure_tags_exist, get_matching_tags


# Define tag definitions used across tests (mirrors a subset of config.yaml)
TAG_DEFINITIONS = [
    TagDefinition(name="Generative AI", slug="generative-ai", keywords=[
        "generative ai", "genai", "chatgpt", "copilot", "diffusion",
    ]),
    TagDefinition(name="LLMs", slug="llms", keywords=[
        "llm", "large language model", "gpt", "transformer", "prompt engineering",
    ]),
    TagDefinition(name="Fine Tuning", slug="fine-tuning", keywords=[
        "fine-tuning", "fine tuning", "finetuning", "lora", "rlhf",
    ]),
    TagDefinition(name="Infrastructure", slug="infrastructure", keywords=[
        "infrastructure", "kubernetes", "k8s", "docker", "container", "terraform",
    ]),
    TagDefinition(name="DevOps", slug="devops", keywords=[
        "devops", "ci/cd", "continuous integration", "deployment", "monitoring",
        "observability", "sre",
    ]),
    TagDefinition(name="Frontend", slug="frontend", keywords=[
        "frontend", "front-end", "react", "vue", "angular", "javascript", "typescript",
    ]),
    TagDefinition(name="Data Engineering", slug="data-engineering", keywords=[
        "data engineering", "data pipeline", "etl", "spark", "kafka",
    ]),
    TagDefinition(name="Databases", slug="databases", keywords=[
        "database", "sql", "nosql", "postgresql", "redis",
    ]),
    TagDefinition(name="ML/AI", slug="ml-ai", keywords=[
        "machine learning", "deep learning", "neural network", "computer vision",
    ]),
    TagDefinition(name="Security", slug="security", keywords=[
        "security", "vulnerability", "authentication", "encryption",
    ]),
    TagDefinition(name="Mobile", slug="mobile", keywords=[
        "mobile", "ios", "android", "swift", "kotlin", "react native",
    ]),
    TagDefinition(name="Distributed Systems", slug="distributed-systems", keywords=[
        "distributed system", "consensus", "raft", "eventual consistency",
    ]),
]


@pytest.fixture()
def engine():
    """In-memory SQLite engine with tables created."""
    eng = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(eng)
    return eng


@pytest.fixture()
def session(engine):
    """Session fixture backed by in-memory SQLite."""
    Session = sessionmaker(bind=engine, expire_on_commit=False)
    sess = Session()
    yield sess
    sess.close()


@pytest.fixture()
def session_with_tags(session):
    """Session with all Tag records already created."""
    ensure_tags_exist(TAG_DEFINITIONS, session)
    return session


class TestGetMatchingTags:
    def test_kubernetes_deployment_tags(self):
        """Text about kubernetes deployment should match Infrastructure and DevOps."""
        text = "How to manage kubernetes deployment pipelines in production"
        tags = get_matching_tags(text, TAG_DEFINITIONS)
        assert "Infrastructure" in tags
        assert "DevOps" in tags

    def test_gpt_fine_tuning_tags(self):
        """Text about GPT fine-tuning should match LLMs, Generative AI, and Fine Tuning."""
        text = "GPT fine-tuning with LoRA for domain adaptation in generative AI applications"
        tags = get_matching_tags(text, TAG_DEFINITIONS)
        assert "LLMs" in tags
        assert "Fine Tuning" in tags
        assert "Generative AI" in tags

    def test_react_components_tags(self):
        """Text about React components should match Frontend."""
        text = "Building reusable React components with TypeScript"
        tags = get_matching_tags(text, TAG_DEFINITIONS)
        assert "Frontend" in tags

    def test_no_matching_keywords(self):
        """Text with no matching keywords should return no tags."""
        text = "Today we had a team lunch at the office cafeteria"
        tags = get_matching_tags(text, TAG_DEFINITIONS)
        assert tags == []

    def test_empty_text(self):
        """Empty text should return no tags."""
        tags = get_matching_tags("", TAG_DEFINITIONS)
        assert tags == []

    def test_case_insensitive(self):
        """Matching should be case-insensitive."""
        text = "KUBERNETES and DOCKER are essential tools"
        tags = get_matching_tags(text, TAG_DEFINITIONS)
        assert "Infrastructure" in tags


class TestEnsureTagsExist:
    def test_creates_tags(self, session):
        """ensure_tags_exist should create Tag records for all definitions."""
        ensure_tags_exist(TAG_DEFINITIONS, session)

        all_tags = session.query(Tag).all()
        assert len(all_tags) == len(TAG_DEFINITIONS)

    def test_idempotent(self, session):
        """Calling ensure_tags_exist twice should not create duplicates."""
        ensure_tags_exist(TAG_DEFINITIONS, session)
        ensure_tags_exist(TAG_DEFINITIONS, session)

        all_tags = session.query(Tag).all()
        assert len(all_tags) == len(TAG_DEFINITIONS)


class TestAutoTagPost:
    def test_kubernetes_post(self, session_with_tags):
        """A post about kubernetes deployment should get Infrastructure and DevOps tags."""
        post = Post(
            url="https://example.com/k8s",
            source_key="test",
            source_name="Test",
            title="Kubernetes deployment best practices",
            summary="Managing deployments in production clusters",
        )
        session_with_tags.add(post)
        session_with_tags.commit()

        tag_names = auto_tag_post(post, TAG_DEFINITIONS, session_with_tags)

        assert "Infrastructure" in tag_names
        assert "DevOps" in tag_names
        # Verify relationship is set
        assert len(post.tags) >= 2

    def test_gpt_fine_tuning_post(self, session_with_tags):
        """A post about GPT fine-tuning should get LLMs, Generative AI, and Fine Tuning."""
        post = Post(
            url="https://example.com/gpt-ft",
            source_key="test",
            source_name="Test",
            title="GPT fine-tuning with LoRA",
            full_text="This article covers generative AI and GPT fine-tuning using LoRA adapters",
        )
        session_with_tags.add(post)
        session_with_tags.commit()

        tag_names = auto_tag_post(post, TAG_DEFINITIONS, session_with_tags)

        assert "LLMs" in tag_names
        assert "Fine Tuning" in tag_names
        assert "Generative AI" in tag_names

    def test_react_post(self, session_with_tags):
        """A post about React should get Frontend tag."""
        post = Post(
            url="https://example.com/react",
            source_key="test",
            source_name="Test",
            title="Building React components with hooks",
        )
        session_with_tags.add(post)
        session_with_tags.commit()

        tag_names = auto_tag_post(post, TAG_DEFINITIONS, session_with_tags)

        assert "Frontend" in tag_names

    def test_no_tags_for_generic_post(self, session_with_tags):
        """A post with no keyword matches should get no tags."""
        post = Post(
            url="https://example.com/lunch",
            source_key="test",
            source_name="Test",
            title="Company Picnic Photos",
            summary="We had a wonderful time at the annual company picnic",
        )
        session_with_tags.add(post)
        session_with_tags.commit()

        tag_names = auto_tag_post(post, TAG_DEFINITIONS, session_with_tags)

        assert tag_names == []
        assert len(post.tags) == 0
