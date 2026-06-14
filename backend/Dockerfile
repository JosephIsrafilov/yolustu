FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# WEB_CONCURRENCY env var overrides -w at runtime (e.g. set to 2×CPU+1).
# Default: 4 workers. --timeout 120 handles slow Supabase/OSRM calls.
CMD ["gunicorn", "app.main:app", \
     "-w", "4", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--graceful-timeout", "30"]
