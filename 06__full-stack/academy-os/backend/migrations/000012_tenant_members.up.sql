CREATE TABLE IF NOT EXISTS tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id UUID NOT NULL
        REFERENCES tenants(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    role TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (
        tenant_id,
        user_id
    )
);

ALTER TABLE tenant_members ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS
idx_tenant_members_user
ON tenant_members(
    user_id
);

CREATE INDEX IF NOT EXISTS
idx_tenant_members_tenant
ON tenant_members(
    tenant_id
);
