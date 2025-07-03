import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    // Check database connection
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`SELECT health_check()`

    const healthData = result[0]

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
        fields_count: healthData.fields_count,
        analyses_count: healthData.analyses_count,
      },
      services: {
        sentinel_hub: {
          status: process.env.SENTINEL_HUB_CLIENT_ID ? "configured" : "not_configured",
          client_id: process.env.SENTINEL_HUB_CLIENT_ID ? "set" : "missing",
        },
      },
      environment: {
        node_env: process.env.NODE_ENV,
        app_url: process.env.APP_URL,
      },
    })
  } catch (error) {
    console.error("Health check failed:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}
