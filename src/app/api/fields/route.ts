import { type NextRequest, NextResponse } from "next/server"
import { createField, getAllFields } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const cropType = formData.get("crop_type") as string
    const areaHectares = formData.get("area_hectares") as string
    const minLng = Number.parseFloat(formData.get("min_lng") as string)
    const minLat = Number.parseFloat(formData.get("min_lat") as string)
    const maxLng = Number.parseFloat(formData.get("max_lng") as string)
    const maxLat = Number.parseFloat(formData.get("max_lat") as string)

    if (!name || isNaN(minLng) || isNaN(minLat) || isNaN(maxLng) || isNaN(maxLat)) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
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

    return NextResponse.json({ success: true, field })
  } catch (error) {
    console.error("Error creating field:", error)
    return NextResponse.json({ success: false, error: "Failed to create field" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const fields = await getAllFields()
    return NextResponse.json({ success: true, fields })
  } catch (error) {
    console.error("Error fetching fields:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch fields" }, { status: 500 })
  }
}
