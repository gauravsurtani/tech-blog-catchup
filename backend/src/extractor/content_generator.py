"""Source-grounded summary and two-speaker script, through Ollama Cloud."""

import xml.etree.ElementTree as ET
from src.text_client import json_completion
from src.podcast.script import parse_script


async def generate_content(title: str, markdown: str, model: str | None = None) -> dict:
    if not 100 <= len(markdown) <= 50000:
        raise ValueError("Source body must contain 100–50,000 characters")
    budget = min(1600, max(120, len(markdown.split())))
    data = await json_completion(
        "Create a concise educational conversation from only the supplied article. Preserve names, numbers and caveats. "
        "Do not invent examples, claims or endorsements. Cite the source in the opening. "
        f"Use at most {budget} spoken words, 2–80 alternating turns, each at most 1500 characters. "
        "Return JSON with summary (2 sentences), turns (array of objects with speaker equal to Person1 or Person2 and plain text in text), "
        "and evidence (a list of 1–8 exact source quotations supporting the principal claims). "
        'Return exactly this shape, without Markdown fences: {"summary":"...","turns":[{"speaker":"Person1","text":"..."},{"speaker":"Person2","text":"..."}],"evidence":["exact source quotation"]}.',
        f"Title: {title}\nSource article:\n{markdown}",
        model=model,
    )
    raw_turns = data.get("turns")
    if not isinstance(raw_turns, list):
        raise ValueError("Expected structured speaker turns")
    elements = []
    for turn in raw_turns:
        if (
            not isinstance(turn, dict)
            or turn.get("speaker") not in ("Person1", "Person2")
            or not isinstance(turn.get("text"), str)
        ):
            raise ValueError("Invalid speaker turn")
        element = ET.Element(turn["speaker"])
        element.text = turn["text"]
        elements.append(ET.tostring(element, encoding="unicode"))
    script = "".join(elements)
    turns = parse_script(script)
    if sum(len(t["text"].split()) for t in turns) > budget:
        raise ValueError("Script exceeds source budget")
    summary = data.get("summary")
    evidence = data.get("evidence")
    if not isinstance(summary, str) or not 1 <= len(summary) <= 2000:
        raise ValueError("Invalid summary")
    if (
        not isinstance(evidence, list)
        or not 1 <= len(evidence) <= 8
        or any(
            not isinstance(q, str) or len(q) < 10 or q not in markdown for q in evidence
        )
    ):
        raise ValueError("Evidence must quote the captured source")
    return {"summary": summary, "podcast_script": script, "evidence": evidence}


async def generate_summary_only(title: str, markdown: str) -> str:
    data = await json_completion(
        "Summarize only the supplied source in two sentences. Return JSON with summary.",
        f"{title}\n{markdown}",
    )
    summary = data.get("summary")
    if not isinstance(summary, str) or not summary.strip():
        raise ValueError("Empty summary")
    return summary
