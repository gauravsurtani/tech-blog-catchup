#!/usr/bin/env python3
"""Seed Railway DB with test posts from a JSON export."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.database import init_db, get_session
from src.models import Post, Tag, post_tags

SEED_FILE = os.path.join(os.path.dirname(__file__), 'seed_posts.json')


def main():
    init_db()
    session = get_session()

    with open(SEED_FILE) as f:
        posts_data = json.load(f)

    print(f"Seeding {len(posts_data)} posts...")

    for data in posts_data:
        # Skip if URL already exists
        existing = session.query(Post).filter(Post.url == data['url']).first()
        if existing:
            print(f"  SKIP: {data['title'][:50]} (already exists)")
            continue

        tag_names = data.pop('tags', [])

        # Remove 'id' so DB auto-assigns
        data.pop('id', None)

        post = Post(**data)
        session.add(post)
        session.flush()  # get the ID

        # Link tags
        for tag_name in tag_names:
            tag = session.query(Tag).filter(Tag.name == tag_name).first()
            if tag:
                session.execute(post_tags.insert().values(
                    post_id=post.id, tag_id=tag.id
                ))

        print(f"  OK: {post.id} | {post.source_key} | {post.audio_path} | {post.title[:50]}")

    session.commit()
    session.close()
    print("Done!")


if __name__ == '__main__':
    main()
