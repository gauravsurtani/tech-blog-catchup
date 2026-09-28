"""Strict complete speaker parsing before any speech spend."""

import re
import xml.etree.ElementTree as ET


def parse_script(script):
    if not isinstance(script, str) or not 1 <= len(script) <= 24000 or "<!" in script:
        raise ValueError("Invalid script size or markup")
    try:
        root = ET.fromstring("<script>" + script + "</script>")
    except ET.ParseError as exc:
        raise ValueError("Malformed script") from exc
    if (root.text or "").strip():
        raise ValueError("Text outside speaker turn")
    turns = []
    for child in root:
        if (
            child.tag not in ("Person1", "Person2")
            or len(child)
            or child.attrib
            or (child.tail or "").strip()
        ):
            raise ValueError("Incomplete speaker turn")
        text = (child.text or "").strip()
        if not 1 <= len(text) <= 1500:
            raise ValueError("Turn must contain 1–1500 characters")
        turns.append({"speaker": child.tag, "text": text})
    if not 2 <= len(turns) <= 80 or {t["speaker"] for t in turns} != {
        "Person1",
        "Person2",
    }:
        raise ValueError("Both speakers are required")
    return turns
