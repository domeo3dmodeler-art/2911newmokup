-- Migration: Create property_photos table
-- This table stores photos linked to product property values

CREATE TABLE property_photos (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,          -- Category ID (e.g., 'cmg50xcgs001cv7mn0tdyk1wo')
  property_name TEXT NOT NULL,        -- Property name (e.g., 'Артикул поставщика')
  property_value TEXT NOT NULL,       -- Property value (e.g., 'd5', 'Base_1')
  photo_path TEXT NOT NULL,           -- Path to photo file
  photo_type TEXT DEFAULT 'cover',    -- Type: 'cover', 'gallery_1', 'gallery_2', etc.
  original_filename TEXT,             -- Original filename for reference
  file_size INTEGER,                  -- File size in bytes
  mime_type TEXT,                     -- MIME type (e.g., 'image/png')
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX idx_property_photos_category ON property_photos(category_id);
CREATE INDEX idx_property_photos_property ON property_photos(property_name);
CREATE INDEX idx_property_photos_value ON property_photos(property_value);
CREATE INDEX idx_property_photos_lookup ON property_photos(category_id, property_name, property_value);
CREATE INDEX idx_property_photos_type ON property_photos(photo_type);

-- Unique constraint: one photo per property value and type
CREATE UNIQUE INDEX idx_property_photos_unique ON property_photos(
  category_id, 
  property_name, 
  property_value, 
  photo_type
);
