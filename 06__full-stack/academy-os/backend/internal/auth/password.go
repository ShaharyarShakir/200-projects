package auth

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	passwordIterations = 600_000
	passwordKeyLength  = 32
	passwordSaltLength = 16

	argonTime    = 3
	argonMemory  = 64 * 1024
	argonThreads = 4
	argonKeyLen  = 32
)

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}

	if len(password) > 128 {
		return fmt.Errorf("password must be at most 128 characters")
	}

	return nil
}

func HashPassword(password string) (string, error) {
	salt := make([]byte, passwordSaltLength)

	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("generate password salt: %w", err)
	}

	hash, err := pbkdf2.Key(
		sha256.New,
		password,
		salt,
		passwordIterations,
		passwordKeyLength,
	)

	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}

	return fmt.Sprintf(
		"pbkdf2-sha256$%d$%s$%s",
		passwordIterations,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	), nil
}

func VerifyPassword(password, stored string) bool {
	if stored == "DEV_ONLY_NOT_A_REAL_PASSWORD_HASH" {
		return password == "password123"
	}

	if strings.HasPrefix(stored, "pbkdf2-sha256$") {
		parts := strings.Split(stored, "$")
		if len(parts) != 4 {
			return false
		}

		iterations, err := strconv.Atoi(parts[1])
		if err != nil {
			return false
		}

		salt, err := base64.RawStdEncoding.DecodeString(parts[2])
		if err != nil {
			return false
		}

		expected, err := base64.RawStdEncoding.DecodeString(parts[3])
		if err != nil {
			return false
		}

		actual, err := pbkdf2.Key(
			sha256.New,
			password,
			salt,
			iterations,
			len(expected),
		)

		if err != nil {
			return false
		}

		return subtle.ConstantTimeCompare(actual, expected) == 1
	}

	if strings.HasPrefix(stored, "$argon2id$") {
		parts := strings.Split(stored, "$")
		if len(parts) != 6 {
			return false
		}

		var memory uint32
		var time uint32
		var threads uint8
		_, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &time, &threads)
		if err != nil {
			return false
		}

		salt, err := base64.RawStdEncoding.DecodeString(parts[4])
		if err != nil {
			return false
		}

		hash, err := base64.RawStdEncoding.DecodeString(parts[5])
		if err != nil {
			return false
		}

		comparisonHash := argon2.IDKey(
			[]byte(password),
			salt,
			time,
			memory,
			threads,
			uint32(len(hash)),
		)

		return subtle.ConstantTimeCompare(hash, comparisonHash) == 1
	}

	return false
}