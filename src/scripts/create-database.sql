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

-- Insert sample fields
INSERT INTO fields (name, description, coordinates, area_hectares, crop_type) VALUES
('North Agricultural Field', 'Primary wheat cultivation area with irrigation system', 
 '{"type":"Polygon","coordinates":[[[13.4,46.05],[13.42,46.05],[13.42,46.07],[13.4,46.07],[13.4,46.05]]]}', 
 45.8, 'Wheat'),
('South Corn Field', 'Large corn production field with modern equipment', 
 '{"type":"Polygon","coordinates":[[[13.43,46.03],[13.46,46.03],[13.46,46.06],[13.43,46.06],[13.43,46.03]]]}', 
 62.3, 'Corn'),
('East Soybean Plot', 'Experimental soybean cultivation area', 
 '{"type":"Polygon","coordinates":[[[13.47,46.04],[13.49,46.04],[13.49,46.06],[13.47,46.06],[13.47,46.04]]]}', 
 28.5, 'Soybean');
