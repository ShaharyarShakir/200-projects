CREATE TABLE IF NOT EXISTS course_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL
        REFERENCES courses(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    position INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT course_sections_title_not_empty
        CHECK (length(trim(title)) > 0),

    CONSTRAINT course_sections_position_positive
        CHECK (position >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS course_sections_position_unique
    ON course_sections(course_id, position);

CREATE INDEX IF NOT EXISTS idx_course_sections_course
    ON course_sections(course_id);


CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    course_id UUID NOT NULL
        REFERENCES courses(id)
        ON DELETE CASCADE,

    section_id UUID NOT NULL
        REFERENCES course_sections(id)
        ON DELETE CASCADE,

    title TEXT NOT NULL,

    description TEXT NOT NULL DEFAULT '',

    position INTEGER NOT NULL,

    content_type TEXT NOT NULL DEFAULT 'video',

    video_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT lessons_title_not_empty
        CHECK (length(trim(title)) > 0),

    CONSTRAINT lessons_position_positive
        CHECK (position >= 0),

    CONSTRAINT lessons_content_type_check
        CHECK (
            content_type IN (
                'video'
            )
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS lessons_position_unique
    ON lessons(section_id, position);

CREATE INDEX IF NOT EXISTS idx_lessons_course
    ON lessons(course_id);

CREATE INDEX IF NOT EXISTS idx_lessons_section
    ON lessons(section_id);

CREATE INDEX IF NOT EXISTS idx_lessons_video_asset
    ON lessons(video_asset_id);
