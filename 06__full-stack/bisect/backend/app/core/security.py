from datetime import datetime, timedelta, timezone
import secrets
from typing import Any, Dict, Optional, Union
import uuid

from cryptography.fernet import Fernet, InvalidToken
import jwt

from app.core.config import settings


# ---------------------------------------------------------------------------
# Fernet Token Encryption / Decryption
# ---------------------------------------------------------------------------

def _get_fernet(key: Optional[str] = None) -> Fernet:
    """Return a Fernet cipher instance using provided or configured secret key."""
    raw_key = key or settings.ENCRYPTION_SECRET_KEY
    if isinstance(raw_key, str):
        return Fernet(raw_key.encode("utf-8"))
    return Fernet(raw_key)


def encrypt_token(plain_token: str, key: Optional[str] = None) -> str:
    """Encrypt a plaintext token using symmetric Fernet encryption."""
    if not plain_token:
        raise ValueError("Token to encrypt cannot be empty")
    cipher = _get_fernet(key)
    encrypted_bytes = cipher.encrypt(plain_token.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt_token(encrypted_token: str, key: Optional[str] = None) -> str:
    """Decrypt a Fernet-encrypted ciphertext token into plaintext."""
    if not encrypted_token:
        raise ValueError("Encrypted token cannot be empty")
    cipher = _get_fernet(key)
    try:
        decrypted_bytes = cipher.decrypt(encrypted_token.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Failed to decrypt token: invalid ciphertext or secret key") from exc


# ---------------------------------------------------------------------------
# JWT Stateless Token Management
# ---------------------------------------------------------------------------

def create_access_token(
    subject: Union[str, uuid.UUID],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Generate a signed JWT access token for API session authentication."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token, returning its payload claims."""
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


# ---------------------------------------------------------------------------
# OAuth State Security Helpers
# ---------------------------------------------------------------------------

def generate_oauth_state() -> str:
    """Generate a cryptographically secure URL-safe random state string."""
    return secrets.token_urlsafe(32)


def verify_oauth_state(received_state: Optional[str], cookie_state: Optional[str]) -> bool:
    """Constant-time comparison verifying incoming OAuth state against cookie state."""
    if not received_state or not cookie_state:
        return False
    return secrets.compare_digest(received_state, cookie_state)
