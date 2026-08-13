package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"time"
)

const (
	sessionTokenLength = 32
	SessionLifetime    = 30 * 24 * time.Hour
)

func GenerateSessionToken() (
	string,
	[]byte,
	error,
) {
	raw := make(
		[]byte,
		sessionTokenLength,
	)

	if _, err := rand.Read(raw); err != nil {
		return "", nil, err
	}

	token := base64.RawURLEncoding.EncodeToString(raw)

	hash := sha256.Sum256([]byte(token))

	return token, hash[:], nil
}

func HashSessionToken(token string) []byte {
	hash := sha256.Sum256([]byte(token))
	return hash[:]
}
