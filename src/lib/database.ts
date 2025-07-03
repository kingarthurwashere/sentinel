import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

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

export interface VegetationAnalysis {
  id: number
  field_id: number
  analysis_date: string
  ndvi_value: number | null
  evi_value: number | null
  ndwi_value: number | null
  savi_value: number | null
  stress_level: string | null
  health_score: number | null
  true_color_image_url: string | null
  ndvi_image_url: string | null
  analysis_metadata: any
  created_at: string
}

export interface AnalysisHistory {
  id: number
  field_id: number
  processing_status: string
  processing_started_at: string
  processing_completed_at: string | null
  error_message: string | null
  bbox: any
  acquisition_date: string
}

// Field operations
export async function getAllFields(): Promise<Field[]> {
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

export async function deleteField(id: number): Promise<void> {
  await sql`DELETE FROM fields WHERE id = ${id}`
}

// Vegetation analysis operations
export async function getVegetationAnalysisByField(fieldId: number): Promise<VegetationAnalysis[]> {
  const result = await sql`
    SELECT * FROM vegetation_analysis 
    WHERE field_id = ${fieldId} 
    ORDER BY analysis_date DESC
  `
  return result as VegetationAnalysis[]
}

export async function saveVegetationAnalysis(data: {
  field_id: number
  analysis_date: string
  ndvi_value?: number
  evi_value?: number
  ndwi_value?: number
  savi_value?: number
  stress_level?: string
  health_score?: number
  true_color_image_url?: string
  ndvi_image_url?: string
  analysis_metadata?: any
}): Promise<VegetationAnalysis> {
  const result = await sql`
    INSERT INTO vegetation_analysis (
      field_id, analysis_date, ndvi_value, evi_value, ndwi_value, savi_value,
      stress_level, health_score, true_color_image_url, ndvi_image_url, analysis_metadata
    )
    VALUES (
      ${data.field_id}, ${data.analysis_date}, ${data.ndvi_value || null}, ${data.evi_value || null},
      ${data.ndwi_value || null}, ${data.savi_value || null}, ${data.stress_level || null},
      ${data.health_score || null}, ${data.true_color_image_url || null}, ${data.ndvi_image_url || null},
      ${JSON.stringify(data.analysis_metadata || {})}
    )
    RETURNING *
  `
  return result[0] as VegetationAnalysis
}

// Analysis history operations
export async function createAnalysisHistory(data: {
  field_id: number
  bbox: any
  acquisition_date: string
}): Promise<AnalysisHistory> {
  const result = await sql`
    INSERT INTO analysis_history (field_id, bbox, acquisition_date)
    VALUES (${data.field_id}, ${JSON.stringify(data.bbox)}, ${data.acquisition_date})
    RETURNING *
  `
  return result[0] as AnalysisHistory
}

export async function updateAnalysisHistory(
  id: number,
  data: {
    processing_status?: string
    processing_completed_at?: string
    error_message?: string
  },
): Promise<void> {
  await sql`
    UPDATE analysis_history 
    SET 
      processing_status = ${data.processing_status || "pending"},
      processing_completed_at = ${data.processing_completed_at || null},
      error_message = ${data.error_message || null}
    WHERE id = ${id}
  `
}

export async function getRecentAnalysisHistory(fieldId: number): Promise<AnalysisHistory[]> {
  const result = await sql`
    SELECT * FROM analysis_history 
    WHERE field_id = ${fieldId} 
    ORDER BY processing_started_at DESC 
    LIMIT 10
  `
  return result as AnalysisHistory[]
}
