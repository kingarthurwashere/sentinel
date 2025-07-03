import { type NextRequest, NextResponse } from "next/server"
import { getVegetationAnalysisByField } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { fieldId: string } }) {
  try {
    const fieldId = Number.parseInt(params.fieldId)

    if (isNaN(fieldId)) {
      return NextResponse.json({ success: false, error: "Invalid field ID" }, { status: 400 })
    }

    const analyses = await getVegetationAnalysisByField(fieldId)
    return NextResponse.json({ success: true, analyses })
  } catch (error) {
    console.error("Error fetching analyses:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch analyses" }, { status: 500 })
  }
}
