import { neon } from "@neondatabase/serverless"

// Initialize database connection with safety check
let sql: any = null

function initializeDatabase() {
  if (!sql && process.env.DATABASE_URL && process.env.DATABASE_URL !== "placeholder") {
    try {
      sql = neon(process.env.DATABASE_URL)
    } catch (error) {
      console.warn("Database connection failed:", error)
      sql = null
    }
  }
}

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
  {
    id: 3,
    name: "East Soybean Research Plot",
    description: "Experimental soybean cultivation area for testing new varieties",
    coordinates: {
      type: "Polygon",
      coordinates: [
        [
          [13.47, 46.04],
          [13.49, 46.04],
          [13.49, 46.06],
          [13.47, 46.06],
          [13.47, 46.04],
        ],
      ],
    },
    area_hectares: 28.5,
    crop_type: "Soybean",
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
  {
    id: 2,
    field_id: 2,
    analysis_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ndvi_value: 0.68,
    evi_value: 0.61,
    ndwi_value: 0.12,
    savi_value: 0.65,
    stress_level: "Fair",
    health_score: 68,
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

// Field operations
export async function getAllFields(): Promise<Field[]> {
  initializeDatabase()

  if (!sql) {
    console.log("Using mock data for fields")
    return mockFields as Field[]
  }

  try {
    const result = await sql`SELECT * FROM fields ORDER BY created_at DESC`
    return result as Field[]
  } catch (error) {
    console.warn("Database query failed, using mock data:", error)
    return mockFields as Field[]
  }
}

export async function getFieldById(id: number): Promise<Field | null> {
  initializeDatabase()

  if (!sql) {
    const field = mockFields.find((f) => f.id === id)
    return (field as Field) || null
  }

  try {
    const result = await sql`SELECT * FROM fields WHERE id = ${id}`
    return (result[0] as Field) || null
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
  initializeDatabase()

  if (!sql) {
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

  try {
    const result = await sql`
      INSERT INTO fields (name, description, coordinates, area_hectares, crop_type)
      VALUES (${data.name}, ${data.description || null}, ${JSON.stringify(data.coordinates)}, ${data.area_hectares || null}, ${data.crop_type || null})
      RETURNING *
    `
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

export async function deleteField(id: number): Promise<void> {
  initializeDatabase()

  if (!sql) {
    const index = mockFields.findIndex((f) => f.id === id)
    if (index > -1) {
      mockFields.splice(index, 1)
    }
    return
  }

  try {
    await sql`DELETE FROM fields WHERE id = ${id}`
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
  initializeDatabase()

  if (!sql) {
    return mockAnalyses.filter((a) => a.field_id === fieldId) as VegetationAnalysis[]
  }

  try {
    const result = await sql`
      SELECT * FROM vegetation_analysis 
      WHERE field_id = ${fieldId} 
      ORDER BY analysis_date DESC
    `
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
  initializeDatabase()

  if (!sql) {
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

  try {
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
  initializeDatabase()

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

  if (!sql) {
    return mockHistory as AnalysisHistory
  }

  try {
    const result = await sql`
      INSERT INTO analysis_history (field_id, bbox, acquisition_date)
      VALUES (${data.field_id}, ${JSON.stringify(data.bbox)}, ${data.acquisition_date})
      RETURNING *
    `
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
  initializeDatabase()

  if (!sql) {
    console.log("Mock: Updated analysis history", id, data)
    return
  }

  try {
    await sql`
      UPDATE analysis_history 
      SET 
        processing_status = ${data.processing_status || "pending"},
        processing_completed_at = ${data.processing_completed_at || null},
        error_message = ${data.error_message || null}
      WHERE id = ${id}
    `
  } catch (error) {
    console.warn("Database update failed:", error)
  }
}

export async function getRecentAnalysisHistory(fieldId: number): Promise<AnalysisHistory[]> {
  initializeDatabase()

  if (!sql) {
    return []
  }

  try {
    const result = await sql`
      SELECT * FROM analysis_history 
      WHERE field_id = ${fieldId} 
      ORDER BY processing_started_at DESC 
      LIMIT 10
    `
    return result as AnalysisHistory[]
  } catch (error) {
    console.warn("Database query failed:", error)
    return []
  }
}
