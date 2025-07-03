import { type NextRequest, NextResponse } from "next/server"
import { deleteField } from "@/lib/database"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const fieldId = Number.parseInt(params.id)

    if (isNaN(fieldId)) {
      return NextResponse.json({ success: false, error: "Invalid field ID" }, { status: 400 })
    }

    await deleteField(fieldId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting field:", error)
    return NextResponse.json({ success: false, error: "Failed to delete field" }, { status: 500 })
  }
}
