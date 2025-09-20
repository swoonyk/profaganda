-- Professors table
CREATE TABLE IF NOT EXISTS professors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    school VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    source_id VARCHAR(100) NOT NULL,
    source VARCHAR(20) NOT NULL CHECK (source IN ('rmp', 'cureviews')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_id, source)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(50) PRIMARY KEY,
    professor_id VARCHAR(50) NOT NULL REFERENCES professors(id),
    original_text TEXT NOT NULL,
    sanitized_text TEXT,
    source VARCHAR(20) NOT NULL CHECK (source IN ('rmp', 'cureviews')),
    source_review_id VARCHAR(100) NOT NULL,
    safety_flag VARCHAR(20) DEFAULT 'ok' CHECK (safety_flag IN ('ok', 'warning', 'blocked')),
    confidence DECIMAL(3,2) DEFAULT 0.0,
    sanitization_version VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_review_id, source)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_professors_school ON professors(school);
CREATE INDEX IF NOT EXISTS idx_professors_source ON professors(source);
CREATE INDEX IF NOT EXISTS idx_reviews_professor_id ON reviews(professor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_safety_flag ON reviews(safety_flag);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);