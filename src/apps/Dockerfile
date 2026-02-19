FROM python:3.13-slim

# Work from /app (project root inside container)
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # 👇 so Python can see /app/src/config.py as "config"
    PYTHONPATH=/app/src

# System deps (for psycopg2 etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Install Python deps: use src/apps/requirements.txt from your tree
COPY src/apps/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy the whole project
COPY . .

EXPOSE 8000

# Run your main: src/apps/main.py
CMD ["python", "-m", "src.apps.main"]
