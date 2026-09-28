"""Opt-in real CPU cache regression. Requires speech deps/assets and FFmpeg, no API key."""
import argparse,hashlib,json,sys,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from src.podcast.kokoro_worker import render
from kokoro_onnx import Kokoro
p=argparse.ArgumentParser();p.add_argument('--assets',type=Path,required=True);args=p.parse_args()
request={'source_hash':'a'*64,'run_spec_hash':'b'*64,'script_hash':'c'*64,'turns':[{'speaker':'Person1','voice':'af_sarah','text':'Hello there.'},{'speaker':'Person2','voice':'am_michael','text':'Hello again.'}]}
with tempfile.TemporaryDirectory(prefix='b2p-cache-proof-') as tmp:
    root=Path(tmp)
    first=render(request,root/'attempt-1',args.assets)
    original=Kokoro.create
    def unexpected(*args,**kwargs):raise AssertionError('Second attempt synthesized a cached turn')
    Kokoro.create=unexpected
    try:second=render(request,root/'attempt-2',args.assets)
    finally:Kokoro.create=original
    assert first['audio_sha256']==second['audio_sha256']
    assert first['turns']==second['turns']
    print(json.dumps({'cross_attempt_cache':True,'audio_sha256':second['audio_sha256'],'duration_samples':second['duration_samples'],'second_attempt_speech_calls':0}))
