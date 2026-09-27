"""Build-time download with fixed publisher checksums; never downloads during inference."""

import hashlib
from pathlib import Path
import urllib.request
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.podcast.kokoro_worker import ASSETS

root = Path(sys.argv[1] if len(sys.argv) > 1 else "models/kokoro")
root.mkdir(parents=True, exist_ok=True)
for name, digest in ASSETS.items():
    output = root / name
    if output.exists() and hashlib.sha256(output.read_bytes()).hexdigest() == digest:
        continue
    with urllib.request.urlopen(
        "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/"
        + name
    ) as response:
        data = response.read()
    if hashlib.sha256(data).hexdigest() != digest:
        raise RuntimeError("Asset checksum mismatch")
    output.write_bytes(data)
