"use client"

import { useState } from "react"
import { FieldForm } from "@/components/field-form"
import { FieldsList } from "@/components/fields-list"
import { SatelliteMap } from "@/components/satellite-map"
import { analyzeSatelliteDataAction } from "./actions"
import { useToast } from "@/hooks/use-toast"
import type { Field, SatelliteData } from "@/lib/db"

interface DashboardProps {
  fieldsWithData: Array<{
    field: Field
    satelliteData: SatelliteData[]
  }>
}

export function Dashboard({ fieldsWithData }: DashboardProps) {
  const [selectedField, setSelectedField] = useState<Field | undefined>(fieldsWithData[0]?.field)
  const { toast } = useToast()

  const selectedFieldData = fieldsWithData.find((item) => item.field.id === selectedField?.id)

  const handleAnalyzeField = async (fieldId: number) => {
    const field = fieldsWithData.find((item) => item.field.id === fieldId)?.field
    if (!field) return

    try {
      const result = await analyzeSatelliteDataAction(fieldId, field)
      if (result.success) {
        toast({
          title: "Analysis complete",
          description: "Satellite data has been updated for this field.",
        })
        // Refresh the page to show new data
        window.location.reload()
      } else {
        toast({
          title: "Analysis failed",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <FieldForm onFieldCreated={() => window.location.reload()} />
        <FieldsList
          fields={fieldsWithData.map((item) => item.field)}
          onSelectField={setSelectedField}
          selectedField={selectedField}
        />
      </div>

      <div className="lg:col-span-2">
        {selectedField && selectedFieldData ? (
          <SatelliteMap
            field={selectedField}
            satelliteData={selectedFieldData.satelliteData}
            onAnalyze={handleAnalyzeField}
          />
        ) : (
          <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-4">🛰️</div>
              <h3 className="text-lg font-semibold mb-2">No Field Selected</h3>
              <p>Create a field or select an existing one to view satellite data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
