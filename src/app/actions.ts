"use server"

import { createField, saveSatelliteData, type Field } from "@/lib/db"
import { SentinelHubService } from "@/lib/sentinel-hub"
import { revalidatePath } from "next/cache"

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

    const field = await createField({
      name,
      description: description || undefined,
      coordinates,
      area_hectares: areaHectares ? Number.parseFloat(areaHectares) : undefined,
      crop_type: cropType || undefined,
    })

    revalidatePath("/")
    return { success: true, field }
  } catch (error) {
    console.error("Error creating field:", error)
    return { success: false, error: "Failed to create field" }
  }
}

export async function analyzeSatelliteDataAction(fieldId: number, field: Field) {
  try {
    // Extract bounding box from field coordinates
    const coords = field.coordinates.coordinates[0]
    const lngs = coords.map((c: number[]) => c[0])
    const lats = coords.map((c: number[]) => c[1])
    const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]

    // For demo purposes, we'll simulate the Sentinel Hub API call
    // In production, you would use actual API credentials
    const sentinelService = new SentinelHubService({
      instanceId: process.env.SENTINEL_HUB_INSTANCE_ID || "demo",
      clientId: process.env.SENTINEL_HUB_CLIENT_ID || "demo",
      clientSecret: process.env.SENTINEL_HUB_CLIENT_SECRET || "demo",
    })

    const today = new Date().toISOString().split("T")[0]

    // Simulate NDVI calculation
    const ndvi = Math.random() * 0.8 + 0.1
    const evi = ndvi * 0.8
    let stressLevel = "Low"

    if (ndvi < 0.3) stressLevel = "High"
    else if (ndvi < 0.6) stressLevel = "Medium"

    await saveSatelliteData({
      field_id: fieldId,
      acquisition_date: today,
      ndvi_value: Math.round(ndvi * 1000) / 1000,
      evi_value: Math.round(evi * 1000) / 1000,
      stress_level: stressLevel,
      image_url: `/placeholder.svg?height=400&width=400&query=satellite+imagery+${field.name}`,
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error analyzing satellite data:", error)
    return { success: false, error: "Failed to analyze satellite data" }
  }
}
