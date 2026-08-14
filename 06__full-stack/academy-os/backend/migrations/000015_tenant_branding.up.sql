ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS favicon_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS secondary_color TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS custom_domain TEXT NOT NULL DEFAULT '';

-- Seed John Academy
INSERT INTO tenants (id, name, slug, description, primary_color, secondary_color)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    'John Academy',
    'john',
    'Learn software engineering, architecture, and system design with John.',
    '#2563eb',
    '#ffffff'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color;

-- Seed Sarah Academy
INSERT INTO tenants (id, name, slug, description, primary_color, secondary_color)
VALUES (
    '00000000-0000-0000-0000-000000000012',
    'Sarah Academy',
    'sarah',
    'Master UI/UX design, design systems, and product strategy with Sarah.',
    '#7c3aed',
    '#ffffff'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color;

-- Assign dev user as owner of John and Sarah academies
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'owner'),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'owner')
ON CONFLICT DO NOTHING;

-- Seed sample courses for John Academy
INSERT INTO courses (id, tenant_id, created_by, title, slug, description, status)
VALUES
    ('00000000-0000-0000-0000-000000000c01', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Go Microservices Masterclass', 'go-microservices-masterclass', 'Build scalable distributed microservices in Go.', 'published')
ON CONFLICT (id) DO NOTHING;

-- Seed sample courses for Sarah Academy
INSERT INTO courses (id, tenant_id, created_by, title, slug, description, status)
VALUES
    ('00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Figma to Code Workflow', 'figma-to-code-workflow', 'Turn design components into production Vue & React code.', 'published')
ON CONFLICT (id) DO NOTHING;
