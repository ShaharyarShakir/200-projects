import os

import boto3
from botocore.client import Config


S3_ENDPOINT_URL = os.getenv(
    "S3_ENDPOINT_URL",
    "http://localhost:9000",
)

S3_ACCESS_KEY = os.getenv(
    "S3_ACCESS_KEY",
    "GKcb28327c17e97d93cc47163d",
)

S3_SECRET_KEY = os.getenv(
    "S3_SECRET_KEY",
    "50841a497bf4f4e4055c5f377b567158c94dcb983aa1f463f8ad230005b868db",
)

S3_BUCKET = os.getenv(
    "S3_BUCKET",
    "brainrot-assets",
)

S3_REGION = os.getenv(
    "S3_REGION",
    "us-east-1",
)


s3 = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT_URL,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    region_name=S3_REGION,
    config=Config(
        signature_version="s3v4",
    ),
)
