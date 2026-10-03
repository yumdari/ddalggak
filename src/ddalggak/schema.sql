CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('member', 'admin')),
    interests TEXT NOT NULL DEFAULT '[]',
    grade INTEGER CHECK (grade BETWEEN 1 AND 6),
    region TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    homepage_url TEXT,
    feed_url TEXT UNIQUE,
    collection_method TEXT NOT NULL DEFAULT 'manual',
    active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS import_candidates (
    id INTEGER PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    source_url TEXT NOT NULL UNIQUE,
    raw_title TEXT NOT NULL,
    raw_content TEXT NOT NULL DEFAULT '',
    detected_at TEXT NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (review_status IN ('pending', 'published', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id),
    opportunity_id INTEGER REFERENCES opportunities(id)
);

CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('contest', 'scholarship')),
    title TEXT NOT NULL,
    organizer TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    eligibility_text TEXT NOT NULL,
    benefits_text TEXT NOT NULL DEFAULT '',
    application_text TEXT NOT NULL,
    region TEXT,
    grade_min INTEGER CHECK (grade_min BETWEEN 1 AND 6),
    grade_max INTEGER CHECK (grade_max BETWEEN 1 AND 6),
    start_at TEXT,
    deadline_date TEXT,
    deadline_at TEXT,
    deadline_kind TEXT NOT NULL CHECK (deadline_kind IN
        ('datetime', 'date_only', 'always_open', 'unknown')),
    source_url TEXT NOT NULL UNIQUE,
    source_id INTEGER REFERENCES sources(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
    last_verified_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (grade_min IS NULL OR grade_max IS NULL OR grade_min <= grade_max),
    CHECK (
        (deadline_kind = 'datetime' AND deadline_at IS NOT NULL AND deadline_date IS NULL)
        OR (deadline_kind = 'date_only' AND deadline_date IS NOT NULL AND deadline_at IS NULL)
        OR (deadline_kind IN ('always_open', 'unknown') AND deadline_date IS NULL
            AND deadline_at IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS opportunity_tags (
    opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (opportunity_id, tag_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY,
    opportunity_id INTEGER NOT NULL REFERENCES opportunities(id),
    actor_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    changed_fields TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opportunities_public ON opportunities(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(status, deadline_date, deadline_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id, created_at DESC);
