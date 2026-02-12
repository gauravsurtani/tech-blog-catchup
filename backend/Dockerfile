FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir . && \
    crawl4ai-setup || true

COPY . .
RUN mkdir -p data audio

EXPOSE 8000

CMD ["python", "run.py", "api"]
