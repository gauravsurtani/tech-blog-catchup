# Quality regression corpus

These 20 original synthetic fixtures were written for this project. They are safe to share and contain no third-party article bodies. They exercise extraction/script hazards; they are not a substitute for the plan's 20 human-reviewed source articles or a voice listening review.

The source and expected claims are test inputs, not a model-generated score. Do not call structural completeness factual accuracy. Public release still requires rights, claim and listening review.

Run `python scripts/evaluate_quality.py` for an offline inventory. Explicit `--live --limit 1` exercises Ollama on the first fixture; maximum three calls per invocation. API credentials stay in the environment. A report marks human approval false until a person actually reviews it.
