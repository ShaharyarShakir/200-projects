CREATE EXTENSION IF NOT EXISTS citext;

-- Ensure users email is CITEXT
ALTER TABLE users ALTER COLUMN email TYPE CITEXT;

-- Sessions token_hash support
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS token_hash BYTEA UNIQUE;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    role TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT memberships_role_check
        CHECK (
            role IN (
                'owner',
                'instructor',
                'staff'
            )
        ),

    CONSTRAINT memberships_user_tenant_unique
        UNIQUE (
            user_id,
            tenant_id
        )
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships(tenant_id);

-- Migrate existing tenant_members data to memberships if any exist
INSERT INTO memberships (id, user_id, tenant_id, role, created_at, updated_at)
SELECT id, user_id, tenant_id, role, created_at, created_at
FROM tenant_members
ON CONFLICT (user_id, tenant_id) DO NOTHING;
