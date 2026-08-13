package database

import (
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func toPgUUID(u uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: u, Valid: true}
}

func toGoogleUUID(p pgtype.UUID) uuid.UUID {
	return uuid.UUID(p.Bytes)
}
