-- Setup script for AgriSat Satellite Monitoring Database
-- Run this script in your Neon database console or using a database client

-- Create extensions if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create fields table
CREATE TABLE IF NOT EXISTS fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinates JSONB NOT NULL,
    area_hectares DECIMAL(10, 2),
    crop_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vegetation_analysis table
CREATE TABLE IF NOT EXISTS vegetation_analysis (
    id SERIAL PRIMARY KEY,
    field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    ndvi_value DECIMAL(5, 3),
    evi_value DECIMAL(5, 3),
    ndwi_value DECIMAL(5, 3),
    savi_value DECIMAL(5, 3),
    stress_level VARCHAR(50),
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    true_color_image_url TEXT,
    ndvi_image_url TEXT,
    analysis_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analysis_history table for tracking processing
CREATE TABLE IF NOT EXISTS analysis_history (
    id SERIAL PRIMARY KEY,
    field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_completed_at TIMESTAMP,
    error_message TEXT,
    bbox JSONB,
    acquisition_date DATE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fields_created_at ON fields(created_at);
CREATE INDEX IF NOT EXISTS idx_fields_crop_type ON fields(crop_type);
CREATE INDEX IF NOT EXISTS idx_vegetation_analysis_field_id ON vegetation_analysis(field_id);
CREATE INDEX IF NOT EXISTS idx_vegetation_analysis_date ON vegetation_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_analysis_history_field_id ON analysis_history(field_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_status ON analysis_history(processing_status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for fields table
DROP TRIGGER IF EXISTS update_fields_updated_at ON fields;
CREATE TRIGGER update_fields_updated_at 
    BEFORE UPDATE ON fields 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample fields for demonstration
INSERT INTO fields (name, description, coordinates, area_hectares, crop_type) VALUES
('North Agricultural Field', 'Primary wheat cultivation area with modern irrigation system and soil monitoring sensors', 
 '{"type":"Polygon","coordinates":[[[13.4,46.05],[13.42,46.05],[13.42,46.07],[13.4,46.07],[13.4,46.05]]]}', 
 45.8, 'Wheat'),
('South Corn Production Field', 'Large-scale corn production field with precision agriculture equipment and GPS guidance', 
 '{"type":"Polygon","coordinates":[[[13.43,46.03],[13.46,46.03],[13.46,46.06],[13.43,46.06],[13.43,46.03]]]}', 
 62.3, 'Corn'),
('East Soybean Research Plot', 'Experimental soybean cultivation area for testing new varieties and farming techniques', 
 '{"type":"Polygon","coordinates":[[[13.47,46.04],[13.49,46.04],[13.49,46.06],[13.47,46.06],[13.47,46.04]]]}', 
 28.5, 'Soybean'),
('West Organic Farm', 'Certified organic mixed crop field with sustainable farming practices', 
 '{"type":"Polygon","coordinates":[[[13.38,46.02],[13.41,46.02],[13.41,46.05],[13.38,46.05],[13.38,46.02]]]}', 
 35.2, 'Mixed Crops')
ON CONFLICT DO NOTHING;

-- Insert sample analysis data for demonstration
INSERT INTO vegetation_analysis (field_id, analysis_date, ndvi_value, evi_value, ndwi_value, savi_value, stress_level, health_score, analysis_metadata) VALUES
(1, CURRENT_DATE - INTERVAL '7 days', 0.75, 0.68, 0.15, 0.72, 'Good', 78, '{"data_source": "Sentinel-2", "processing_level": "L2A"}'),
(1, CURRENT_DATE - INTERVAL '14 days', 0.72, 0.65, 0.18, 0.69, 'Good', 75, '{"data_source": "Sentinel-2", "processing_level": "L2A"}'),
(2, CURRENT_DATE - INTERVAL '5 days', 0.68, 0.61, 0.12, 0.65, 'Fair', 68, '{"data_source": "Sentinel-2", "processing_level": "L2A"}'),
(3, CURRENT_DATE - INTERVAL '3 days', 0.82, 0.76, 0.22, 0.78, 'Excellent', 85, '{"data_source": "Sentinel-2", "processing_level": "L2A"}')
ON CONFLICT DO NOTHING;

-- Create a view for field summary statistics
CREATE OR REPLACE VIEW field_summary AS
SELECT 
    f.id,
    f.name,
    f.crop_type,
    f.area_hectares,
    COUNT(va.id) as analysis_count,
    MAX(va.analysis_date) as last_analysis_date,
    AVG(va.health_score) as avg_health_score,
    AVG(va.ndvi_value) as avg_ndvi
FROM fields f
LEFT JOIN vegetation_analysis va ON f.id = va.field_id
GROUP BY f.id, f.name, f.crop_type, f.area_hectares;

-- Create health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE(status TEXT, fields_count BIGINT, analyses_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'healthy'::TEXT as status,
        (SELECT COUNT(*) FROM fields) as fields_count,
        (SELECT COUNT(*) FROM vegetation_analysis) as analyses_count;
END;
$$ LANGUAGE plpgsql;

-- Verify tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('fields', 'vegetation_analysis', 'analysis_history')
ORDER BY table_name;

-- Show sample data
SELECT 'Fields created:' as info, COUNT(*) as count FROM fields
UNION ALL
SELECT 'Analyses created:' as info, COUNT(*) as count FROM vegetation_analysis;
