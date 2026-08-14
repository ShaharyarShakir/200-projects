CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    created_by UUID NOT NULL
        REFERENCES users(id),

    title TEXT NOT NULL,

    slug TEXT NOT NULL,

    description TEXT NOT NULL DEFAULT '',

    status TEXT NOT NULL DEFAULT 'draft',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT courses_status_check
        CHECK (
            status IN (
                'draft',
                'published',
                'archived'
            )
        ),

    CONSTRAINT courses_title_not_empty
        CHECK (length(trim(title)) > 0),

    CONSTRAINT courses_slug_not_empty
        CHECK (length(trim(slug)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS courses_tenant_slug_unique
    ON courses(tenant_id, slug);

CREATE INDEX IF NOT EXISTS idx_courses_tenant
    ON courses(tenant_id);

CREATE INDEX IF NOT EXISTS idx_courses_tenant_status
    ON courses(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_courses_created_by
    ON courses(created_by);
