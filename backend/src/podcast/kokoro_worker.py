"""One CPU-only process per episode; immutable validated assets and measured turns."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import uuid

ASSETS = {
    "kokoro-v1.0.int8.onnx": "ae315a79b623f244700e4afb9246c46a26066782e049ba174bf3ba433970ee9c",
    "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d",
}
VOICES = {"Person1": "af_sarah", "Person2": "am_michael"}


def validate_request(data):
    turns = data.get("turns", [])
    if not 2 <= len(turns) <= 80:
        raise ValueError("Invalid turn count")
    if sum(len(t.get("text", "")) for t in turns) > 24000:
        raise ValueError("Episode too long")
    for t in turns:
        if (
            t.get("speaker") not in VOICES
            or t.get("voice") != VOICES[t["speaker"]]
            or not 1 <= len(t.get("text", "")) <= 1500
        ):
            raise ValueError("Invalid turn or voice")
    for key in ("source_hash", "run_spec_hash", "script_hash"):
        if len(data.get(key, "")) != 64:
            raise ValueError("Missing provenance")
    return data


def render(data, output_dir, asset_dir):
    data = validate_request(data)
    for name, expected in ASSETS.items():
        if hashlib.sha256((asset_dir / name).read_bytes()).hexdigest() != expected:
            raise ValueError("Speech asset checksum mismatch")
    import numpy as np
    import onnxruntime as ort
    import soundfile as sf
    from kokoro_onnx import Kokoro

    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 2
    opts.inter_op_num_threads = 1
    opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    session = ort.InferenceSession(
        str(asset_dir / "kokoro-v1.0.int8.onnx"),
        sess_options=opts,
        providers=["CPUExecutionProvider"],
    )
    engine = Kokoro.from_session(session, str(asset_dir / "voices-v1.0.bin"))
    output_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = output_dir.parent / ".segments"
    cache_dir.mkdir(mode=0o700, exist_ok=True)
    cursor = 0
    turns = []
    sr = 24000
    with sf.SoundFile(
        output_dir / "episode.wav", "w", samplerate=sr, channels=1, subtype="PCM_16"
    ) as joined:
        for index, t in enumerate(data["turns"]):
            cache_key = hashlib.sha256(
                json.dumps(
                    [data["source_hash"], data["run_spec_hash"], data["script_hash"], ASSETS, {"speed": 1.0, "lang": "en-us"}, t],
                    sort_keys=True,
                ).encode()
            ).hexdigest()
            segment = cache_dir / (cache_key + ".wav")
            if segment.exists():
                samples, rate = sf.read(segment, dtype="float32")
            else:
                samples, rate = engine.create(
                    t["text"], voice=t["voice"], speed=1.0, lang="en-us"
                )
                samples = np.asarray(samples, dtype=np.float32).reshape(-1)
                if rate != sr or not len(samples) or not np.isfinite(samples).all():
                    raise ValueError("Invalid speech samples")
                temporary = cache_dir / (cache_key + "." + uuid.uuid4().hex + ".tmp.wav")
                sf.write(temporary, samples, sr, subtype="PCM_16")
                temporary.replace(segment)
            if rate != sr or not len(samples) or not np.isfinite(samples).all():
                raise ValueError("Invalid cached speech")
            if index:
                gap = int(0.28 * sr)
                joined.write(np.zeros(gap))
                cursor += gap
            start = cursor
            joined.write(samples)
            cursor += len(samples)
            turns.append(
                {
                    "speaker": t["speaker"],
                    "text": t["text"],
                    "start_sample": start,
                    "end_sample": cursor,
                }
            )
    pending = output_dir / "episode.pending.mp3"
    final = output_dir / "episode.mp3"
    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-i",
            str(output_dir / "episode.wav"),
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "128k",
            str(pending),
        ],
        check=True,
        capture_output=True,
        timeout=60,
    )
    decoded = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(pending),
            "-f",
            "f32le",
            "-ar",
            str(sr),
            "-ac",
            "1",
            "pipe:1",
        ],
        check=True,
        capture_output=True,
        timeout=60,
    )
    actual = len(decoded.stdout) // 4
    if abs(actual - cursor) > sr * 0.15:
        raise ValueError("Incomplete audio")
    pending.replace(final)
    manifest = {
        key: data[key] for key in ("source_hash", "run_spec_hash", "script_hash")
    }
    manifest.update(
        audio_path=f"audio/jobs/{output_dir.name}/episode.mp3",
        audio_sha256=hashlib.sha256(final.read_bytes()).hexdigest(),
        duration_samples=actual,
        sample_rate=sr,
        turns=turns,
    )
    (output_dir / "manifest.json").write_text(json.dumps(manifest))
    return manifest


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--request", required=True)
    p.add_argument("--output-dir", required=True)
    args = p.parse_args()
    request = Path(args.request)
    if request.stat().st_size > 100000:
        raise ValueError("Request too large")
    print(
        json.dumps(
            render(
                json.loads(request.read_text()),
                Path(args.output_dir),
                Path(os.environ.get("KOKORO_ASSET_DIR", "models/kokoro")),
            )
        )
    )


if __name__ == "__main__":
    main()
