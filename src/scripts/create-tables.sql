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

-- Create satellite_data table
CREATE TABLE IF NOT EXISTS satellite_data (
    id SERIAL PRIMARY KEY,
    field_id INTEGER REFERENCES fields(id) ON DELETE CASCADE,
    acquisition_date DATE NOT NULL,
    ndvi_value DECIMAL(5, 3),
    evi_value DECIMAL(5, 3),
    stress_level VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO fields (name, description, coordinates, area_hectares, crop_type) VALUES
('North Field', 'Primary wheat cultivation area', '{"type":"Polygon","coordinates":[[[13.4,46.05],[13.41,46.05],[13.41,46.06],[13.4,46.06],[13.4,46.05]]]}', 25.5, 'Wheat'),
('South Field', 'Corn production field', '{"type":"Polygon","coordinates":[[[13.42,46.04],[13.43,46.04],[13.43,46.05],[13.42,46.05],[13.42,46.04]]]}', 18.2, 'Corn');
