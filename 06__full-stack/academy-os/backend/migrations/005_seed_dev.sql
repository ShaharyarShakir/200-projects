INSERT INTO users (
    id,
    email,
    password_hash,
    name
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'owner@academy.local',
    'DEV_ONLY_NOT_A_REAL_PASSWORD_HASH',
    'Academy Owner'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO tenants (
    id,
    name,
    slug
)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    'AcademyOS Demo',
    'academy-demo'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO tenant_members (
    tenant_id,
    user_id,
    role
)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'owner'
)
ON CONFLICT DO NOTHING;
