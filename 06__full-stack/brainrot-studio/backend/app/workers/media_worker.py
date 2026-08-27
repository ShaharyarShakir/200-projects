from rq import Worker

from app.core.queue import (
    media_queue,
    redis,
)

if __name__ == "__main__":
    worker = Worker(
        [media_queue],
        connection=redis,
    )
    worker.work()
