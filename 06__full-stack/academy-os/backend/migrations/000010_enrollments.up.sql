CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY,

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    course_id UUID NOT NULL
        REFERENCES courses(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (
        tenant_id,
        user_id,
        course_id
    )
);

CREATE INDEX IF NOT EXISTS
idx_enrollments_user
ON enrollments(
    tenant_id,
    user_id
);

CREATE INDEX IF NOT EXISTS
idx_enrollments_course
ON enrollments(
    tenant_id,
    course_id
);
