CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY,

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    lesson_id UUID NOT NULL
        REFERENCES lessons(id)
        ON DELETE CASCADE,

    position_seconds INTEGER NOT NULL DEFAULT 0,

    completed_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (
        tenant_id,
        user_id,
        lesson_id
    )
);

CREATE INDEX IF NOT EXISTS
idx_lesson_progress_user
ON lesson_progress(
    tenant_id,
    user_id
);

CREATE INDEX IF NOT EXISTS
idx_lesson_progress_lesson
ON lesson_progress(
    tenant_id,
    lesson_id
);
