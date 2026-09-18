-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Items Table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(10) NOT NULL CHECK (report_type IN ('lost', 'found')),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    contact_info VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Item Matches Table (AI matching engine output)
CREATE TABLE IF NOT EXISTS item_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lost_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    found_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lost_item_id, found_item_id)
);

-- Indexes for fast query filtering and foreign key joins
CREATE INDEX IF NOT EXISTS idx_items_report_type ON items(report_type);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_matches_lost_id ON item_matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found_id ON item_matches(found_item_id);
