
FROM python:3.11-slim


WORKDIR /app


# If requirements.txt hasn't changed, Docker reuses the cached layer
# and skips reinstalling packages — makes rebuilds much faster
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ── Expose the port FastAPI runs on 
EXPOSE 8000

# ── Start command 
# host 0.0.0.0 means "listen on all network interfaces"
# (not just localhost — needed so Docker can forward traffic to the container)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
