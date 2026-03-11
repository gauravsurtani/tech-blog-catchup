"""Regenerate podcast script for post 18 with new prompt, then do post 20 fresh."""

import asyncio
import json
from datetime import datetime

from src.database import get_session, init_db
from src.models import Post
from src.extractor.content_generator import generate_content
from src.podcast.generator import generate_podcast_for_post, _parse_script_segments
from src.config import get_config


async def main():
    init_db()
    config = get_config()
    session = get_session()

    # --- PART 1: Redo post 18 (JiTTesting, 644 words) ---
    post18 = session.query(Post).filter(Post.id == 18).first()
    if not post18:
        print("Post 18 not found!")
        return

    print("=" * 70)
    print("PART 1: Regenerating script for Post 18")
    print(f"  Title: {post18.title}")
    print(f"  Article words: {post18.word_count}")
    print(f"  Old script words: {len(post18.podcast_script.split()) if post18.podcast_script else 0}")
    print("=" * 70)

    # Generate new content
    result = await generate_content(post18.title, post18.full_text)
    new_script = result.get("podcast_script", "")
    new_summary = result.get("summary", "")

    if new_script:
        new_word_count = len(new_script.split())
        segments = _parse_script_segments(new_script)
        print(f"\n  NEW script words: {new_word_count}")
        print(f"  NEW script chars: {len(new_script)}")
        print(f"  Segments: {len(segments)}")
        print(f"  Est. duration: ~{new_word_count // 150} min")
        print(f"\n  Summary: {new_summary[:200]}")

        # Update post
        post18.podcast_script = new_script
        post18.summary = new_summary
        session.commit()

        # Generate audio
        print("\n  Generating audio...")
        audio_result = generate_podcast_for_post(post18, config)
        if audio_result:
            path, duration = audio_result
            post18.audio_status = "ready"
            post18.audio_path = path
            post18.audio_duration_secs = duration
            session.commit()
            print(f"  Audio: {path} ({duration}s = {duration // 60}m {duration % 60}s)")
        else:
            print("  Audio generation FAILED")

        # Print full script for review
        print("\n" + "-" * 70)
        print("FULL SCRIPT (Post 18 - new):")
        print("-" * 70)
        print(new_script)
    else:
        print("  Script generation FAILED")

    # --- PART 2: Pick another article (post 20 = Rust at WhatsApp, 1230 words) ---
    post20 = session.query(Post).filter(Post.id == 20).first()
    if not post20:
        print("\nPost 20 not found!")
        return

    print("\n\n" + "=" * 70)
    print("PART 2: Generating script for Post 20")
    print(f"  Title: {post20.title}")
    print(f"  Article words: {post20.word_count}")
    print("=" * 70)

    result2 = await generate_content(post20.title, post20.full_text)
    script2 = result2.get("podcast_script", "")
    summary2 = result2.get("summary", "")

    if script2:
        word_count2 = len(script2.split())
        segments2 = _parse_script_segments(script2)
        print(f"\n  Script words: {word_count2}")
        print(f"  Script chars: {len(script2)}")
        print(f"  Segments: {len(segments2)}")
        print(f"  Est. duration: ~{word_count2 // 150} min")
        print(f"\n  Summary: {summary2[:200]}")

        # Update post
        post20.podcast_script = script2
        post20.summary = summary2
        session.commit()

        # Generate audio
        print("\n  Generating audio...")
        audio_result2 = generate_podcast_for_post(post20, config)
        if audio_result2:
            path2, duration2 = audio_result2
            post20.audio_status = "ready"
            post20.audio_path = path2
            post20.audio_duration_secs = duration2
            session.commit()
            print(f"  Audio: {path2} ({duration2}s = {duration2 // 60}m {duration2 % 60}s)")
        else:
            print("  Audio generation FAILED")

        # Print full script for review
        print("\n" + "-" * 70)
        print("FULL SCRIPT (Post 20 - Rust/WhatsApp):")
        print("-" * 70)
        print(script2)
    else:
        print("  Script generation FAILED")

    # --- COMPARISON ---
    print("\n\n" + "=" * 70)
    print("COMPARISON")
    print("=" * 70)
    print(f"  Post 18 (JiTTesting, {post18.word_count}w article):")
    print(f"    Old script: 3677 words (~24 min)")
    if new_script:
        print(f"    New script: {len(new_script.split())} words (~{len(new_script.split()) // 150} min)")
    if script2:
        print(f"  Post 20 (Rust/WhatsApp, {post20.word_count}w article):")
        print(f"    Script: {len(script2.split())} words (~{len(script2.split()) // 150} min)")

    session.close()


if __name__ == "__main__":
    asyncio.run(main())
