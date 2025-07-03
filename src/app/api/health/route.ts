import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

export async function GET() {
  try {
    // Check database connection
    const client = await pool.connect()

    try {
      const result = await client.query(`
        SELECT 
          'healthy' as status,
          (SELECT COUNT(*) FROM fields) as fields_count,
          (SELECT COUNT(*) FROM vegetation_analysis) as analyses_count
      `)

      const healthData = result.rows[0]

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
    } finally {
      client.release()
    }
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
