"""Publication-aware audio delivery, including authenticated private Range requests."""

import json
from fastapi import Request, HTTPException
from fastapi.responses import FileResponse
from src.api.auth_middleware import get_optional_user
from src.database import get_session
from src.models import AudioArtifact, Job
from src.podcast.generator import audio_directory


def serve_audio(request: Request, filename: str):
    root = audio_directory()
    path = (root / filename).resolve()
    if not path.is_relative_to(root) or not path.is_file() or path.suffix != ".mp3":
        raise HTTPException(404, "Audio not found")
    relative = "audio/" + filename
    with get_session() as s:
        public = s.query(AudioArtifact).filter_by(path=relative, public=True).first()
        if not public:
            user = get_optional_user(request)
            if not user:
                raise HTTPException(404, "Audio not found")
            jobs = s.query(Job).filter(
                Job.status == "completed", Job.artifact.isnot(None)
            )
            if user.role != "admin":
                jobs = jobs.filter(Job.owner_id == user.id)
            if not any(
                json.loads(j.artifact).get("audio_path") == relative for j in jobs
            ):
                raise HTTPException(404, "Audio not found")
    return FileResponse(
        path, media_type="audio/mpeg", headers={"Cache-Control": "no-store"}
    )
