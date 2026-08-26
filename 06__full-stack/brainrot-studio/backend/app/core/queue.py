import os

from redis import Redis
from rq import Queue


REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)

redis = Redis.from_url(
    REDIS_URL
)

media_queue = Queue(
    "media",
    connection=redis,
)
