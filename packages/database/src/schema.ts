export const createTablesSQL = `
-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_code VARCHAR(50) NOT NULL UNIQUE,
  source VARCHAR(20) NOT NULL CHECK (source IN ('rmp', 'cureviews')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  sanitized_text TEXT NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('rmp', 'cureviews')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  sanitized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_professor_id ON reviews(professor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_source ON reviews(source);
CREATE INDEX IF NOT EXISTS idx_reviews_sanitized_at ON reviews(sanitized_at);
CREATE INDEX IF NOT EXISTS idx_professors_source ON professors(source);
CREATE INDEX IF NOT EXISTS idx_professors_internal_code ON professors(internal_code);
`;

export const dropTablesSQL = `
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS professors;
`;
