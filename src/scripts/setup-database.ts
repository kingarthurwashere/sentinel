// TypeScript script to set up the database programmatically
// Run with: npx tsx src/scripts/setup-database.ts

import { Pool } from "pg"
import * as fs from "fs"
import * as path from "path"

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set")
    console.log("Please set your PostgreSQL database URL in the .env file")
    process.exit(1)
  }

  if (databaseUrl === "placeholder") {
    console.error("❌ DATABASE_URL is set to placeholder")
    console.log("Please update your .env file with the actual PostgreSQL database URL")
    process.exit(1)
  }

  console.log("🛰️  Setting up AgriSat database...")

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })

  try {
    // Read and execute the SQL setup script
    const sqlScript = fs.readFileSync(path.join(__dirname, "setup-database.sql"), "utf8")

    // Split the script into individual statements
    const statements = sqlScript
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

    console.log(`📝 Executing ${statements.length} SQL statements...`)

    const client = await pool.connect()

    try {
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await client.query(statement)
            console.log("✅ Executed:", statement.substring(0, 50) + "...")
          } catch (error) {
            console.warn("⚠️  Warning:", error.message)
          }
        }
      }
    } finally {
      client.release()
    }

    // Verify the setup
    console.log("\n🔍 Verifying database setup...")

    const client2 = await pool.connect()
    try {
      const tables = await client2.query(`
        SELECT table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('fields', 'vegetation_analysis', 'analysis_history')
        ORDER BY table_name
      `)

      console.log("📊 Tables created:")
      tables.rows.forEach((table) => {
        console.log(`  - ${table.table_name} (${table.table_type})`)
      })

      const fieldCount = await client2.query("SELECT COUNT(*) as count FROM fields")
      const analysisCount = await client2.query("SELECT COUNT(*) as count FROM vegetation_analysis")

      console.log("\n📈 Sample data:")
      console.log(`  - Fields: ${fieldCount.rows[0].count}`)
      console.log(`  - Analyses: ${analysisCount.rows[0].count}`)
    } finally {
      client2.release()
    }

    console.log("\n✅ Database setup completed successfully!")
    console.log("🌐 You can now start the application")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the setup
setupDatabase()
