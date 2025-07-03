"use server"

import { Pool } from "pg"
import type { Field } from "@/lib/database"
import { revalidatePath } from "next/cache"

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Database helper function
async function query(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows
  } finally {
    client.release()
  }
}

export async function getData() {
  try {
    const data = await query("SELECT * FROM fields ORDER BY created_at DESC")
    return data
  } catch (error) {
    console.error("Error fetching data:", error)
    return []
  }
}

export async function getFieldsData() {
  try {
    const fields = await query(`
      SELECT 
        f.*,
        COUNT(va.id) as analysis_count,
        MAX(va.analysis_date) as last_analysis_date,
        AVG(va.health_score) as avg_health_score
      FROM fields f
      LEFT JOIN vegetation_analysis va ON f.id = va.field_id
      GROUP BY f.id, f.name, f.description, f.coordinates, f.area_hectares, f.crop_type, f.created_at, f.updated_at
      ORDER BY f.created_at DESC
    `)
    return { success: true, fields }
  } catch (error) {
    console.error("Error fetching fields data:", error)
    return { success: false, error: "Failed to fetch fields data" }
  }
}

export async function getVegetationAnalysisData(fieldId: number) {
  try {
    const analyses = await query(
      "SELECT * FROM vegetation_analysis WHERE field_id = $1 ORDER BY analysis_date DESC LIMIT 50",
      [fieldId],
    )
    return { success: true, analyses }
  } catch (error) {
    console.error("Error fetching vegetation analysis data:", error)
    return { success: false, error: "Failed to fetch analysis data" }
  }
}

export async function getDashboardStats() {
  try {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM fields) as total_fields,
        (SELECT COUNT(*) FROM vegetation_analysis) as total_analyses,
        (SELECT COUNT(*) FROM vegetation_analysis WHERE analysis_date >= CURRENT_DATE - INTERVAL '30 days') as recent_analyses,
        (SELECT AVG(health_score) FROM vegetation_analysis WHERE analysis_date >= CURRENT_DATE - INTERVAL '30 days') as avg_health_score,
        (SELECT COUNT(DISTINCT field_id) FROM vegetation_analysis WHERE analysis_date >= CURRENT_DATE - INTERVAL '7 days') as active_fields
    `)
    return { success: true, stats: stats[0] }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return { success: false, error: "Failed to fetch dashboard statistics" }
  }
}

export async function getFieldHealthTrends(fieldId: number, days = 30) {
  try {
    const trends = await query(
      `SELECT 
        analysis_date,
        ndvi_value,
        evi_value,
        health_score,
        stress_level
      FROM vegetation_analysis 
      WHERE field_id = $1 
        AND analysis_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY analysis_date ASC`,
      [fieldId],
    )
    return { success: true, trends }
  } catch (error) {
    console.error("Error fetching field health trends:", error)
    return { success: false, error: "Failed to fetch health trends" }
  }
}

export async function createFieldAction(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const cropType = formData.get("crop_type") as string
    const areaHectares = formData.get("area_hectares") as string
    const minLng = Number.parseFloat(formData.get("min_lng") as string)
    const minLat = Number.parseFloat(formData.get("min_lat") as string)
    const maxLng = Number.parseFloat(formData.get("max_lng") as string)
    const maxLat = Number.parseFloat(formData.get("max_lat") as string)

    if (!name || isNaN(minLng) || isNaN(minLat) || isNaN(maxLng) || isNaN(maxLat)) {
      return { success: false, error: "Missing required fields" }
    }

    // Create polygon coordinates
    const coordinates = {
      type: "Polygon",
      coordinates: [
        [
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ],
      ],
    }

    // Insert using parameterized query
    const result = await query(
      `INSERT INTO fields (name, description, coordinates, area_hectares, crop_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name,
        description || null,
        JSON.stringify(coordinates),
        areaHectares ? Number.parseFloat(areaHectares) : null,
        cropType || null,
      ],
    )

    const field = result[0]

    revalidatePath("/")
    return { success: true, field }
  } catch (error) {
    console.error("Error creating field:", error)
    return { success: false, error: "Failed to create field" }
  }
}

export async function deleteFieldAction(fieldId: number) {
  try {
    await query("DELETE FROM fields WHERE id = $1", [fieldId])
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting field:", error)
    return { success: false, error: "Failed to delete field" }
  }
}

export async function analyzeSatelliteDataAction(fieldId: number, field: Field) {
  try {
    // Extract bounding box from field coordinates
    const coords = field.coordinates.coordinates[0]
    const lngs = coords.map((c: number[]) => c[0])
    const lats = coords.map((c: number[]) => c[1])
    const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]

    const today = new Date().toISOString().split("T")[0]

    // Simulate realistic vegetation indices
    const ndvi = Math.random() * 0.8 + 0.1
    const evi = ndvi * 0.8 + Math.random() * 0.1
    const ndwi = Math.random() * 0.4 - 0.2
    const savi = ndvi * 0.9 + Math.random() * 0.05

    // Calculate health score
    const healthScore = Math.round((ndvi * 40 + evi * 30 + Math.max(0, ndwi + 0.2) * 20 + savi * 10) * 100)

    let stressLevel = "Good"
    if (healthScore >= 80) stressLevel = "Excellent"
    else if (healthScore >= 60) stressLevel = "Good"
    else if (healthScore >= 40) stressLevel = "Fair"
    else if (healthScore >= 20) stressLevel = "Poor"
    else stressLevel = "Critical"

    // Save analysis using parameterized query
    await query(
      `INSERT INTO vegetation_analysis (
        field_id, analysis_date, ndvi_value, evi_value, ndwi_value, savi_value,
        stress_level, health_score, true_color_image_url, ndvi_image_url, analysis_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        fieldId,
        today,
        Math.round(ndvi * 1000) / 1000,
        Math.round(evi * 1000) / 1000,
        Math.round(ndwi * 1000) / 1000,
        Math.round(savi * 1000) / 1000,
        stressLevel,
        healthScore,
        `/placeholder.svg?height=400&width=400&query=satellite+imagery+${field.name}`,
        `/placeholder.svg?height=400&width=400&query=NDVI+visualization+${field.name}`,
        JSON.stringify({ data_source: "Sentinel-2", processing_level: "L2A", bbox }),
      ],
    )

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error analyzing satellite data:", error)
    return { success: false, error: "Failed to analyze satellite data" }
  }
}

export async function searchFields(searchQuery: string) {
  try {
    const fields = await query(
      `SELECT * FROM fields 
       WHERE name ILIKE $1 OR description ILIKE $1 OR crop_type ILIKE $1
       ORDER BY created_at DESC`,
      [`%${searchQuery}%`],
    )
    return { success: true, fields }
  } catch (error) {
    console.error("Error searching fields:", error)
    return { success: false, error: "Failed to search fields" }
  }
}

export async function updateFieldAction(fieldId: number, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const cropType = formData.get("crop_type") as string
    const areaHectares = formData.get("area_hectares") as string

    if (!name) {
      return { success: false, error: "Field name is required" }
    }

    const result = await query(
      `UPDATE fields 
       SET name = $2, description = $3, crop_type = $4, area_hectares = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [fieldId, name, description || null, cropType || null, areaHectares ? Number.parseFloat(areaHectares) : null],
    )

    if (result.length === 0) {
      return { success: false, error: "Field not found" }
    }

    revalidatePath("/")
    return { success: true, field: result[0] }
  } catch (error) {
    console.error("Error updating field:", error)
    return { success: false, error: "Failed to update field" }
  }
}

export async function getFieldAnalysisSummary(fieldId: number) {
  try {
    const summary = await query(
      `SELECT 
        COUNT(*) as total_analyses,
        AVG(ndvi_value) as avg_ndvi,
        AVG(evi_value) as avg_evi,
        AVG(health_score) as avg_health_score,
        MAX(analysis_date) as last_analysis_date,
        MIN(analysis_date) as first_analysis_date,
        COUNT(CASE WHEN stress_level = 'Excellent' THEN 1 END) as excellent_count,
        COUNT(CASE WHEN stress_level = 'Good' THEN 1 END) as good_count,
        COUNT(CASE WHEN stress_level = 'Fair' THEN 1 END) as fair_count,
        COUNT(CASE WHEN stress_level = 'Poor' THEN 1 END) as poor_count,
        COUNT(CASE WHEN stress_level = 'Critical' THEN 1 END) as critical_count
      FROM vegetation_analysis 
      WHERE field_id = $1`,
      [fieldId],
    )
    return { success: true, summary: summary[0] }
  } catch (error) {
    console.error("Error fetching field analysis summary:", error)
    return { success: false, error: "Failed to fetch analysis summary" }
  }
}

export async function getRecentAnalysisHistory(limit = 10) {
  try {
    const history = await query(
      `SELECT 
        ah.*,
        f.name as field_name
      FROM analysis_history ah
      JOIN fields f ON ah.field_id = f.id
      ORDER BY ah.processing_started_at DESC
      LIMIT $1`,
      [limit],
    )
    return { success: true, history }
  } catch (error) {
    console.error("Error fetching analysis history:", error)
    return { success: false, error: "Failed to fetch analysis history" }
  }
}

export async function bulkDeleteAnalyses(analysisIds: number[]) {
  try {
    if (analysisIds.length === 0) {
      return { success: false, error: "No analyses selected for deletion" }
    }

    const placeholders = analysisIds.map((_, index) => `$${index + 1}`).join(",")
    await query(`DELETE FROM vegetation_analysis WHERE id IN (${placeholders})`, analysisIds)

    revalidatePath("/")
    return { success: true, deletedCount: analysisIds.length }
  } catch (error) {
    console.error("Error deleting analyses:", error)
    return { success: false, error: "Failed to delete analyses" }
  }
}

export async function exportFieldData(fieldId: number, format: "json" | "csv" = "json") {
  try {
    const fieldData = await query(
      `SELECT 
        f.*,
        json_agg(
          json_build_object(
            'id', va.id,
            'analysis_date', va.analysis_date,
            'ndvi_value', va.ndvi_value,
            'evi_value', va.evi_value,
            'ndwi_value', va.ndwi_value,
            'savi_value', va.savi_value,
            'stress_level', va.stress_level,
            'health_score', va.health_score,
            'created_at', va.created_at
          ) ORDER BY va.analysis_date DESC
        ) as analyses
      FROM fields f
      LEFT JOIN vegetation_analysis va ON f.id = va.field_id
      WHERE f.id = $1
      GROUP BY f.id`,
      [fieldId],
    )

    if (fieldData.length === 0) {
      return { success: false, error: "Field not found" }
    }

    return { success: true, data: fieldData[0], format }
  } catch (error) {
    console.error("Error exporting field data:", error)
    return { success: false, error: "Failed to export field data" }
  }
}
