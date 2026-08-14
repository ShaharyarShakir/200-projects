-- Seed Tenant A (Acme Academy)
INSERT INTO tenants (id, name, slug)
VALUES ('00000000-0000-0000-0000-0000000000aa', 'Acme Academy', 'academy-a')
ON CONFLICT (slug) DO NOTHING;

-- Seed Tenant B (Tech Academy)
INSERT INTO tenants (id, name, slug)
VALUES ('00000000-0000-0000-0000-0000000000bb', 'Tech Academy', 'academy-b')
ON CONFLICT (slug) DO NOTHING;

-- Add Dev User to both tenants
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES 
    ('00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-000000000001', 'owner'),
    ('00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-000000000001', 'instructor')
ON CONFLICT DO NOTHING;

-- Seed Courses for Academy A
INSERT INTO courses (id, tenant_id, created_by, title, slug, description, status)
VALUES 
    ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-000000000001', 'Course A1: Intro to Acme Engineering', 'intro-acme-engineering', 'Learn basic engineering principles at Acme.', 'published'),
    ('00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-0000000000aa', '00000000-0000-0000-0000-000000000001', 'Course A2: Advanced Acme Dynamics', 'advanced-acme-dynamics', 'Deep dive into Acme internal tools and workflows.', 'published')
ON CONFLICT (id) DO NOTHING;

-- Seed Courses for Academy B
INSERT INTO courses (id, tenant_id, created_by, title, slug, description, status)
VALUES 
    ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-000000000001', 'Course B1: Fullstack Web Development', 'fullstack-web-development', 'Comprehensive fullstack development course.', 'published'),
    ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000bb', '00000000-0000-0000-0000-000000000001', 'Course B2: Cloud Infrastructure & DevOps', 'cloud-infrastructure-devops', 'Master Kubernetes, Docker, and CI/CD pipelines.', 'published')
ON CONFLICT (id) DO NOTHING;
