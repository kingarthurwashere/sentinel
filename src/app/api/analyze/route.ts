import { type NextRequest, NextResponse } from "next/server"
import { getFieldById, saveVegetationAnalysis, createAnalysisHistory, updateAnalysisHistory } from "@/lib/database"
import { SentinelHubService } from "@/lib/sentinel-hub-service"

export async function POST(request: NextRequest) {
  try {
    const { fieldId, analysisDate } = await request.json()

    if (!fieldId || !analysisDate) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const field = await getFieldById(fieldId)
    if (!field) {
      return NextResponse.json({ success: false, error: "Field not found" }, { status: 404 })
    }

    // Extract bounding box from field coordinates
    const coords = field.coordinates.coordinates[0]
    const lngs = coords.map((c: number[]) => c[0])
    const lats = coords.map((c: number[]) => c[1])
    const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]

    // Create analysis history record
    const historyRecord = await createAnalysisHistory({
      field_id: fieldId,
      bbox,
      acquisition_date: analysisDate,
    })

    try {
      // Initialize Sentinel Hub service
      const sentinelService = new SentinelHubService({
        clientId: process.env.SENTINEL_HUB_CLIENT_ID || "demo",
        clientSecret: process.env.SENTINEL_HUB_CLIENT_SECRET || "demo",
        instanceId: process.env.SENTINEL_HUB_INSTANCE_ID || "demo",
      })

      // Process field analysis (vegetation indices first, then images)
      const analysisResult = await sentinelService.processFieldAnalysis(bbox, analysisDate)

      // Save vegetation analysis to database
      await saveVegetationAnalysis({
        field_id: fieldId,
        analysis_date: analysisDate,
        ndvi_value: analysisResult.vegetationIndices.ndvi,
        evi_value: analysisResult.vegetationIndices.evi,
        ndwi_value: analysisResult.vegetationIndices.ndwi,
        savi_value: analysisResult.vegetationIndices.savi,
        stress_level: analysisResult.vegetationIndices.stressLevel,
        health_score: analysisResult.vegetationIndices.healthScore,
        true_color_image_url: analysisResult.trueColorImageUrl,
        ndvi_image_url: analysisResult.ndviImageUrl,
        analysis_metadata: analysisResult.metadata,
      })

      // Update analysis history as completed
      await updateAnalysisHistory(historyRecord.id, {
        processing_status: "completed",
        processing_completed_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        analysis: analysisResult,
      })
    } catch (error) {
      console.error("Error during satellite analysis:", error)

      // Update analysis history with error
      await updateAnalysisHistory(historyRecord.id, {
        processing_status: "failed",
        processing_completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      })

      return NextResponse.json(
        {
          success: false,
          error: "Failed to complete satellite analysis",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in analysis endpoint:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
