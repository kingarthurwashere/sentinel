import { Pool } from "pg"

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test connection on startup
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database")
})

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
})

// Mock data for when database is not available
const mockFields = [
  {
    id: 1,
    name: "North Agricultural Field",
    description: "Primary wheat cultivation area with modern irrigation system",
    coordinates: {
      type: "Polygon",
      coordinates: [
        [
          [13.4, 46.05],
          [13.42, 46.05],
          [13.42, 46.07],
          [13.4, 46.07],
          [13.4, 46.05],
        ],
      ],
    },
    area_hectares: 45.8,
    crop_type: "Wheat",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "South Corn Production Field",
    description: "Large-scale corn production field with precision agriculture equipment",
    coordinates: {
      type: "Polygon",
      coordinates: [
        [
          [13.43, 46.03],
          [13.46, 46.03],
          [13.46, 46.06],
          [13.43, 46.06],
          [13.43, 46.03],
        ],
      ],
    },
    area_hectares: 62.3,
    crop_type: "Corn",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockAnalyses = [
  {
    id: 1,
    field_id: 1,
    analysis_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ndvi_value: 0.75,
    evi_value: 0.68,
    ndwi_value: 0.15,
    savi_value: 0.72,
    stress_level: "Good",
    health_score: 78,
    true_color_image_url: "/placeholder.svg?height=400&width=400",
    ndvi_image_url: "/placeholder.svg?height=400&width=400",
    analysis_metadata: { data_source: "Sentinel-2", processing_level: "L2A" },
    created_at: new Date().toISOString(),
  },
]

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

// Database helper function
async function query(text: string, params?: any[]): Promise<any> {
  try {
    const client = await pool.connect()
    try {
      const result = await client.query(text, params)
      return result.rows
    } finally {
      client.release()
    }
  } catch (error) {
    console.warn("Database query failed:", error)
    throw error
  }
}

// Field operations
export async function getAllFields(): Promise<Field[]> {
  try {
    const result = await query("SELECT * FROM fields ORDER BY created_at DESC")
    return result as Field[]
  } catch (error) {
    console.warn("Database query failed, using mock data:", error)
    return mockFields as Field[]
  }
}

export async function getFieldById(id: number): Promise<Field | null> {
  try {
    const result = await query("SELECT * FROM fields WHERE id = $1", [id])
    return result[0] || null
  } catch (error) {
    console.warn("Database query failed, using mock data:", error)
    const field = mockFields.find((f) => f.id === id)
    return (field as Field) || null
  }
}

export async function createField(data: {
  name: string
  description?: string
  coordinates: any
  area_hectares?: number
  crop_type?: string
}): Promise<Field> {
  try {
    const result = await query(
      `INSERT INTO fields (name, description, coordinates, area_hectares, crop_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.description || null,
        JSON.stringify(data.coordinates),
        data.area_hectares || null,
        data.crop_type || null,
      ],
    )
    return result[0] as Field
  } catch (error) {
    console.warn("Database insert failed, using mock data:", error)
    const newField = {
      id: Math.max(...mockFields.map((f) => f.id)) + 1,
      name: data.name,
      description: data.description || null,
      coordinates: data.coordinates,
      area_hectares: data.area_hectares || null,
      crop_type: data.crop_type || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockFields.push(newField)
    return newField as Field
  }
}

export async function updateField(id: number, data: Partial<Field>): Promise<Field | null> {
  try {
    const setClause = Object.keys(data)
      .filter((key) => key !== "id" && data[key as keyof Field] !== undefined)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")

    const values = Object.values(data).filter((value) => value !== undefined)

    const result = await query(
      `UPDATE fields SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values],
    )
    return result[0] || null
  } catch (error) {
    console.warn("Database update failed:", error)
    return null
  }
}

export async function deleteField(id: number): Promise<void> {
  try {
    await query("DELETE FROM fields WHERE id = $1", [id])
  } catch (error) {
    console.warn("Database delete failed:", error)
    const index = mockFields.findIndex((f) => f.id === id)
    if (index > -1) {
      mockFields.splice(index, 1)
    }
  }
}

// Vegetation analysis operations
export async function getVegetationAnalysisByField(fieldId: number): Promise<VegetationAnalysis[]> {
  try {
    const result = await query("SELECT * FROM vegetation_analysis WHERE field_id = $1 ORDER BY analysis_date DESC", [
      fieldId,
    ])
    return result as VegetationAnalysis[]
  } catch (error) {
    console.warn("Database query failed, using mock data:", error)
    return mockAnalyses.filter((a) => a.field_id === fieldId) as VegetationAnalysis[]
  }
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
  try {
    const result = await query(
      `INSERT INTO vegetation_analysis (
        field_id, analysis_date, ndvi_value, evi_value, ndwi_value, savi_value,
        stress_level, health_score, true_color_image_url, ndvi_image_url, analysis_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        data.field_id,
        data.analysis_date,
        data.ndvi_value || null,
        data.evi_value || null,
        data.ndwi_value || null,
        data.savi_value || null,
        data.stress_level || null,
        data.health_score || null,
        data.true_color_image_url || null,
        data.ndvi_image_url || null,
        JSON.stringify(data.analysis_metadata || {}),
      ],
    )
    return result[0] as VegetationAnalysis
  } catch (error) {
    console.warn("Database insert failed, using mock data:", error)
    const newAnalysis = {
      id: Math.max(...mockAnalyses.map((a) => a.id)) + 1,
      field_id: data.field_id,
      analysis_date: data.analysis_date,
      ndvi_value: data.ndvi_value || null,
      evi_value: data.evi_value || null,
      ndwi_value: data.ndwi_value || null,
      savi_value: data.savi_value || null,
      stress_level: data.stress_level || null,
      health_score: data.health_score || null,
      true_color_image_url: data.true_color_image_url || null,
      ndvi_image_url: data.ndvi_image_url || null,
      analysis_metadata: data.analysis_metadata || {},
      created_at: new Date().toISOString(),
    }
    mockAnalyses.push(newAnalysis)
    return newAnalysis as VegetationAnalysis
  }
}

// Analysis history operations
export async function createAnalysisHistory(data: {
  field_id: number
  bbox: any
  acquisition_date: string
}): Promise<AnalysisHistory> {
  const mockHistory = {
    id: Date.now(),
    field_id: data.field_id,
    processing_status: "pending",
    processing_started_at: new Date().toISOString(),
    processing_completed_at: null,
    error_message: null,
    bbox: data.bbox,
    acquisition_date: data.acquisition_date,
  }

  try {
    const result = await query(
      "INSERT INTO analysis_history (field_id, bbox, acquisition_date) VALUES ($1, $2, $3) RETURNING *",
      [data.field_id, JSON.stringify(data.bbox), data.acquisition_date],
    )
    return result[0] as AnalysisHistory
  } catch (error) {
    console.warn("Database insert failed, using mock data:", error)
    return mockHistory as AnalysisHistory
  }
}

export async function updateAnalysisHistory(
  id: number,
  data: {
    processing_status?: string
    processing_completed_at?: string
    error_message?: string
  },
): Promise<void> {
  try {
    await query(
      `UPDATE analysis_history 
       SET processing_status = $2, processing_completed_at = $3, error_message = $4
       WHERE id = $1`,
      [id, data.processing_status || "pending", data.processing_completed_at || null, data.error_message || null],
    )
  } catch (error) {
    console.warn("Database update failed:", error)
  }
}

// Dashboard and statistics
export async function getDashboardStats(): Promise<{
  total_fields: number
  total_analyses: number
  recent_analyses: number
  avg_health_score: number
  active_fields: number
}> {
  try {
    const result = await query(`
      SELECT 
        (SELECT COUNT(*) FROM fields) as total_fields,
        (SELECT COUNT(*) FROM vegetation_analysis) as total_analyses,
        (SELECT COUNT(*) FROM vegetation_analysis WHERE analysis_date >= CURRENT_DATE - INTERVAL '30 days') as recent_analyses,
        (SELECT AVG(health_score) FROM vegetation_analysis WHERE analysis_date >= CURRENT_DATE - INTERVAL '30 days') as avg_health_score,
        (SELECT COUNT(DISTINCT field_id) FROM vegetation_analysis WHERE analysis_date >= CURRENT_DATE - INTERVAL '7 days') as active_fields
    `)
    return result[0]
  } catch (error) {
    console.warn("Database query failed, using mock stats:", error)
    return {
      total_fields: mockFields.length,
      total_analyses: mockAnalyses.length,
      recent_analyses: mockAnalyses.length,
      avg_health_score: 75,
      active_fields: mockFields.length,
    }
  }
}

export async function getFieldsWithAnalytics(): Promise<any[]> {
  try {
    const result = await query(`
      SELECT 
        f.*,
        COUNT(va.id) as analysis_count,
        MAX(va.analysis_date) as last_analysis_date,
        AVG(va.health_score) as avg_health_score,
        AVG(va.ndvi_value) as avg_ndvi
      FROM fields f
      LEFT JOIN vegetation_analysis va ON f.id = va.field_id
      GROUP BY f.id, f.name, f.description, f.coordinates, f.area_hectares, f.crop_type, f.created_at, f.updated_at
      ORDER BY f.created_at DESC
    `)
    return result
  } catch (error) {
    console.warn("Database query failed, using mock data:", error)
    return mockFields.map((field) => ({
      ...field,
      analysis_count: mockAnalyses.filter((a) => a.field_id === field.id).length,
      last_analysis_date: mockAnalyses.find((a) => a.field_id === field.id)?.analysis_date || null,
      avg_health_score: 75,
      avg_ndvi: 0.7,
    }))
  }
}

export async function searchFields(searchTerm: string): Promise<Field[]> {
  try {
    const result = await query(
      `SELECT * FROM fields 
       WHERE name ILIKE $1 OR description ILIKE $1 OR crop_type ILIKE $1
       ORDER BY created_at DESC`,
      [`%${searchTerm}%`],
    )
    return result as Field[]
  } catch (error) {
    console.warn("Database search failed, using mock data:", error)
    return mockFields.filter(
      (field) =>
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.crop_type?.toLowerCase().includes(searchTerm.toLowerCase()),
    ) as Field[]
  }
}

// Health check
export async function healthCheck(): Promise<{ status: string; fields_count: number; analyses_count: number }> {
  try {
    const result = await query(`
      SELECT 
        'healthy' as status,
        (SELECT COUNT(*) FROM fields) as fields_count,
        (SELECT COUNT(*) FROM vegetation_analysis) as analyses_count
    `)
    return result[0]
  } catch (error) {
    console.warn("Database health check failed:", error)
    return {
      status: "unhealthy",
      fields_count: mockFields.length,
      analyses_count: mockAnalyses.length,
    }
  }
}

// Close pool on app termination
process.on("SIGINT", () => {
  pool.end()
})

process.on("SIGTERM", () => {
  pool.end()
})
