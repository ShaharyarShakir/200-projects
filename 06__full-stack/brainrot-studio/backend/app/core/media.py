import os
from pathlib import Path

MEDIA_WORK_DIR = Path(
    os.getenv(
        "MEDIA_WORK_DIR",
        "/tmp/brainrot-media",
    )
)

MEDIA_WORK_DIR.mkdir(
    parents=True,
    exist_ok=True,
)
