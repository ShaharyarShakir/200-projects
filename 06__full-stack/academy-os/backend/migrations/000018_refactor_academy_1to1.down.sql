-- Revert migration 000018
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'academy_id') THEN
        ALTER TABLE courses RENAME COLUMN academy_id TO tenant_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'academy_id') THEN
        ALTER TABLE enrollments RENAME COLUMN academy_id TO tenant_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'academy_id') THEN
        ALTER TABLE lesson_progress RENAME COLUMN academy_id TO tenant_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'academy_id') THEN
        ALTER TABLE assets RENAME COLUMN academy_id TO tenant_id;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'academies') AND NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'tenants') THEN
        ALTER TABLE academies RENAME TO tenants;
    END IF;
END $$;
