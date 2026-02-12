"""Keyword-based auto-tagging for blog posts."""

import re
from sqlalchemy.orm import Session
from src.config import TagDefinition
from src.models import Post, Tag


def ensure_tags_exist(tag_definitions: list[TagDefinition], session: Session) -> None:
    """Create Tag records in DB for all configured tag definitions. Idempotent."""
    for tag_def in tag_definitions:
        existing = session.query(Tag).filter(Tag.slug == tag_def.slug).first()
        if not existing:
            tag = Tag(name=tag_def.name, slug=tag_def.slug)
            session.add(tag)
    session.commit()


def get_matching_tags(text: str, tag_definitions: list[TagDefinition]) -> list[str]:
    """Return list of tag names whose keywords appear in the text.

    Case-insensitive matching. Matches whole words where possible
    (uses word boundary regex for keywords that are purely alphanumeric,
    substring match for keywords with special chars like 'ci/cd').
    """
    if not text:
        return []

    text_lower = text.lower()
    matched = []

    for tag_def in tag_definitions:
        for keyword in tag_def.keywords:
            kw_lower = keyword.lower()
            # Use word boundary for simple alphanumeric keywords
            if re.match(r'^[\w\s]+$', kw_lower):
                pattern = r'\b' + re.escape(kw_lower) + r'\b'
                if re.search(pattern, text_lower):
                    matched.append(tag_def.name)
                    break
            else:
                # Substring match for keywords with special chars (ci/cd, etc.)
                if kw_lower in text_lower:
                    matched.append(tag_def.name)
                    break

    return matched


def auto_tag_post(
    post: Post,
    tag_definitions: list[TagDefinition],
    session: Session,
) -> list[str]:
    """Scan post title + summary + full_text for keyword matches.
    Assign matching Tag records to the post. Return list of tag names assigned.
    """
    # Combine all text fields for matching
    parts = []
    if post.title:
        parts.append(post.title)
    if post.summary:
        parts.append(post.summary)
    if post.full_text:
        parts.append(post.full_text)

    combined_text = " ".join(parts)
    tag_names = get_matching_tags(combined_text, tag_definitions)

    if not tag_names:
        return []

    # Look up Tag records and assign to post
    for name in tag_names:
        tag = session.query(Tag).filter(Tag.name == name).first()
        if tag and tag not in post.tags:
            post.tags.append(tag)

    session.commit()
    return tag_names
