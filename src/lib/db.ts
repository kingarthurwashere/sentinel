import { Pool } from "pg"

const sql = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

export interface Field {
  id: number
  name: string
  description: string | null
  coordinates: any
  area_hectares: number | null
  crop_type: string | null
  created_at: string
  updated_at: string
}

export interface SatelliteData {
  id: number
  field_id: number
  acquisition_date: string
  ndvi_value: number | null
  evi_value: number | null
  stress_level: string | null
  image_url: string | null
  created_at: string
}

export async function getFields(): Promise<Field[]> {
  const result = await sql`SELECT * FROM fields ORDER BY created_at DESC`
  return result as Field[]
}

export async function getFieldById(id: number): Promise<Field | null> {
  const result = await sql`SELECT * FROM fields WHERE id = ${id}`
  return (result[0] as Field) || null
}

export async function createField(data: {
  name: string
  description?: string
  coordinates: any
  area_hectares?: number
  crop_type?: string
}): Promise<Field> {
  const result = await sql`
    INSERT INTO fields (name, description, coordinates, area_hectares, crop_type)
    VALUES (${data.name}, ${data.description || null}, ${JSON.stringify(data.coordinates)}, ${data.area_hectares || null}, ${data.crop_type || null})
    RETURNING *
  `
  return result[0] as Field
}

export async function getSatelliteDataByField(fieldId: number): Promise<SatelliteData[]> {
  const result = await sql`
    SELECT * FROM satellite_data 
    WHERE field_id = ${fieldId} 
    ORDER BY acquisition_date DESC
  `
  return result as SatelliteData[]
}

export async function saveSatelliteData(data: {
  field_id: number
  acquisition_date: string
  ndvi_value?: number
  evi_value?: number
  stress_level?: string
  image_url?: string
}): Promise<SatelliteData> {
  const result = await sql`
    INSERT INTO satellite_data (field_id, acquisition_date, ndvi_value, evi_value, stress_level, image_url)
    VALUES (${data.field_id}, ${data.acquisition_date}, ${data.ndvi_value || null}, ${data.evi_value || null}, ${data.stress_level || null}, ${data.image_url || null})
    RETURNING *
  `
  return result[0] as SatelliteData
}
