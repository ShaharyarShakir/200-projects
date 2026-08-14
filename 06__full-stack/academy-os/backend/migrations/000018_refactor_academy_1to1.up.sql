-- 1. Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'INSTRUCTOR';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('PLATFORM_ADMIN', 'INSTRUCTOR'));

-- 2. Rename tenants table to academies if tenants table exists and academies does not
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'tenants') AND NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'academies') THEN
        ALTER TABLE tenants RENAME TO academies;
    END IF;
END $$;

-- 3. Ensure academies table has 1:1 owner_user_id, subdomain, custom_domain, and status
ALTER TABLE academies ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

-- Backfill subdomain from slug if subdomain is NULL
UPDATE academies SET subdomain = slug WHERE subdomain IS NULL OR subdomain = '';

-- Backfill owner_user_id for seeded academies uniquely
UPDATE academies SET owner_user_id = '00000000-0000-0000-0000-000000000001' WHERE (slug = 'john' OR slug = 'academy-demo') AND owner_user_id IS NULL;

-- Create Sarah user if missing, and assign as owner of Sarah Academy
INSERT INTO users (id, email, password_hash, name, role)
VALUES ('00000000-0000-0000-0000-000000000002', 'sarah@academy.local', 'DEV_ONLY_NOT_A_REAL_PASSWORD_HASH', 'Sarah Owner', 'INSTRUCTOR')
ON CONFLICT (email) DO NOTHING;

UPDATE academies SET owner_user_id = '00000000-0000-0000-0000-000000000002' WHERE slug = 'sarah' AND owner_user_id IS NULL;

-- For any remaining academy without an owner, assign a distinct user or clean up
INSERT INTO users (id, email, password_hash, name, role)
SELECT gen_random_uuid(), 'owner-' || id || '@academy.local', 'DEV_ONLY_NOT_A_REAL_PASSWORD_HASH', 'Academy Owner', 'INSTRUCTOR'
FROM academies WHERE owner_user_id IS NULL;

UPDATE academies SET owner_user_id = (SELECT id FROM users WHERE email = 'owner-' || academies.id || '@academy.local')
WHERE owner_user_id IS NULL;

-- Deduplicate any multiple academies assigned to the same owner_user_id (keep first)
DELETE FROM academies a1 USING academies a2
WHERE a1.owner_user_id IS NOT NULL
  AND a1.owner_user_id = a2.owner_user_id
  AND a1.ctid > a2.ctid;

-- Deduplicate any duplicate subdomains
DELETE FROM academies a1 USING academies a2
WHERE a1.subdomain IS NOT NULL
  AND a1.subdomain = a2.subdomain
  AND a1.ctid > a2.ctid;

ALTER TABLE academies ALTER COLUMN owner_user_id SET NOT NULL;
ALTER TABLE academies ALTER COLUMN subdomain SET NOT NULL;

ALTER TABLE academies DROP CONSTRAINT IF EXISTS academies_owner_user_id_unique;
ALTER TABLE academies ADD CONSTRAINT academies_owner_user_id_unique UNIQUE (owner_user_id);

ALTER TABLE academies DROP CONSTRAINT IF EXISTS academies_subdomain_unique;
ALTER TABLE academies ADD CONSTRAINT academies_subdomain_unique UNIQUE (subdomain);

-- 4. Scoping resource tables to academy_id
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'tenant_id') THEN
        ALTER TABLE courses RENAME COLUMN tenant_id TO academy_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'tenant_id') THEN
        ALTER TABLE enrollments RENAME COLUMN tenant_id TO academy_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'tenant_id') THEN
        ALTER TABLE lesson_progress RENAME COLUMN tenant_id TO academy_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'tenant_id') THEN
        ALTER TABLE assets RENAME COLUMN tenant_id TO academy_id;
    ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'academy_id') THEN
        ALTER TABLE assets ADD COLUMN academy_id UUID REFERENCES academies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Drop legacy membership tables
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS tenant_members CASCADE;

-- 6. Add Platform Admin user seed
INSERT INTO users (id, email, password_hash, name, role)
VALUES (
    '00000000-0000-0000-0000-000000000099',
    'admin@academyos.com',
    'DEV_ONLY_NOT_A_REAL_PASSWORD_HASH',
    'Platform Administrator',
    'PLATFORM_ADMIN'
)
ON CONFLICT (email) DO UPDATE SET role = 'PLATFORM_ADMIN';
