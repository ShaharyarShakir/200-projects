from pathlib import Path
from typing import BinaryIO

from app.core.storage import (
    S3_BUCKET,
    s3,
)


def upload_file(
    file: BinaryIO,
    object_key: str,
    content_type: str,
) -> None:
    s3.upload_fileobj(
        file,
        S3_BUCKET,
        object_key,
        ExtraArgs={
            "ContentType": content_type,
        },
    )


def download_file(
    object_key: str,
    output_path: Path,
) -> None:
    s3.download_file(
        S3_BUCKET,
        object_key,
        str(output_path),
    )


def delete_file(
    object_key: str,
) -> None:
    s3.delete_object(
        Bucket=S3_BUCKET,
        Key=object_key,
    )


def get_file_url(
    object_key: str,
) -> str:
    return s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": S3_BUCKET,
            "Key": object_key,
        },
        ExpiresIn=3600,
    )
