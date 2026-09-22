from datetime import timedelta
import time
import uuid
from cryptography.fernet import Fernet
import jwt
import pytest

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    decrypt_token,
    encrypt_token,
    generate_oauth_state,
    verify_oauth_state,
)


def test_fernet_encryption_roundtrip():
    """Verify that encrypt_token and decrypt_token preserve plaintext."""
    plain_token = "ghp_secure_github_personal_access_token_12345"
    encrypted = encrypt_token(plain_token)
    assert encrypted != plain_token
    decrypted = decrypt_token(encrypted)
    assert decrypted == plain_token


def test_fernet_custom_key():
    """Verify encryption and decryption with custom key."""
    custom_key = Fernet.generate_key().decode()
    plain_token = "gho_custom_key_token_999"
    encrypted = encrypt_token(plain_token, key=custom_key)
    decrypted = decrypt_token(encrypted, key=custom_key)
    assert decrypted == plain_token


def test_fernet_invalid_inputs():
    """Verify handling of empty or invalid tokens."""
    with pytest.raises(ValueError, match="cannot be empty"):
        encrypt_token("")

    with pytest.raises(ValueError, match="cannot be empty"):
        decrypt_token("")

    with pytest.raises(ValueError, match="Failed to decrypt token"):
        decrypt_token("not-a-valid-fernet-token")


def test_jwt_create_and_decode():
    """Verify JWT token creation with subject and default expiration."""
    user_id = uuid.uuid4()
    token = create_access_token(subject=user_id)
    payload = decode_access_token(token)

    assert payload["sub"] == str(user_id)
    assert "iat" in payload
    assert "exp" in payload
    assert payload["exp"] > payload["iat"]


def test_jwt_extra_claims():
    """Verify JWT includes optional extra claims."""
    user_id = "user-123"
    token = create_access_token(
        subject=user_id,
        extra_claims={"role": "admin", "custom": "value"},
    )
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"
    assert payload["custom"] == "value"


def test_jwt_expiration():
    """Verify expired JWT tokens raise ExpiredSignatureError."""
    user_id = uuid.uuid4()
    token = create_access_token(subject=user_id, expires_delta=timedelta(seconds=-10))
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_jwt_invalid_signature():
    """Verify tokens signed with a different key raise InvalidSignatureError."""
    user_id = uuid.uuid4()
    token = jwt.encode(
        {"sub": str(user_id)},
        "wrong-secret-key-that-is-at-least-32-bytes-long-for-hmac",
        algorithm="HS256",
    )
    with pytest.raises(jwt.InvalidSignatureError):
        decode_access_token(token)


def test_oauth_state_generation_and_verification():
    """Verify generation of random states and constant-time equality check."""
    state1 = generate_oauth_state()
    state2 = generate_oauth_state()

    assert len(state1) >= 32
    assert state1 != state2

    # Matching states
    assert verify_oauth_state(state1, state1) is True

    # Mismatched states
    assert verify_oauth_state(state1, state2) is False

    # Empty / None checks
    assert verify_oauth_state(None, state1) is False
    assert verify_oauth_state(state1, None) is False
    assert verify_oauth_state("", state1) is False
    assert verify_oauth_state(state1, "") is False
