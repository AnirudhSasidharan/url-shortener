import redis
import os

# In production: load from env
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

redis_client = redis.from_url(REDIS_URL, decode_responses=False)

# Test connection on startup (optional)
try:
    redis_client.ping()
    print("✅ Redis connected")
except redis.ConnectionError:
    print("⚠️  Redis not available — caching disabled (redirects still work via DB)")
