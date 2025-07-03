"use client"

import { useState, useEffect } from "react"
import { FieldCreationForm } from "@/components/field-creation-form"
import { FieldList } from "@/components/field-list"
import { SatelliteAnalysisPanel } from "@/components/satellite-analysis-panel"
import type { Field, VegetationAnalysis } from "@/lib/database"
import { Satellite, Leaf } from "lucide-react"

export default function HomePage() {
  const [fields, setFields] = useState<Field[]>([])
  const [selectedField, setSelectedField] = useState<Field | undefined>()
  const [analyses, setAnalyses] = useState<VegetationAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFields = async () => {
    try {
      const response = await fetch("/api/fields")
      const data = await response.json()
      if (data.success) {
        setFields(data.fields)
        // Auto-select first field if none selected
        if (!selectedField && data.fields.length > 0) {
          setSelectedField(data.fields[0])
        }
      }
    } catch (error) {
      console.error("Error fetching fields:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalyses = async (fieldId: number) => {
    try {
      const response = await fetch(`/api/analyses/${fieldId}`)
      const data = await response.json()
      if (data.success) {
        setAnalyses(data.analyses)
      }
    } catch (error) {
      console.error("Error fetching analyses:", error)
    }
  }

  useEffect(() => {
    fetchFields()
  }, [])

  useEffect(() => {
    if (selectedField) {
      fetchAnalyses(selectedField.id)
    }
  }, [selectedField])

  const handleFieldCreated = () => {
    fetchFields()
  }

  const handleFieldDeleted = () => {
    fetchFields()
    setSelectedField(undefined)
    setAnalyses([])
  }

  const handleFieldSelected = (field: Field) => {
    setSelectedField(field)
  }

  const handleAnalysisComplete = () => {
    if (selectedField) {
      fetchAnalyses(selectedField.id)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Satellite className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Loading satellite monitoring system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Satellite className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                AgriSat Pro
              </h1>
              <p className="text-sm text-muted-foreground">
                Advanced satellite vegetation monitoring and analysis platform
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar - Field Management */}
          <div className="xl:col-span-1 space-y-6">
            <FieldCreationForm onFieldCreated={handleFieldCreated} />
            <FieldList
              fields={fields}
              onSelectField={handleFieldSelected}
              onFieldDeleted={handleFieldDeleted}
              selectedField={selectedField}
            />
          </div>

          {/* Main Panel - Satellite Analysis */}
          <div className="xl:col-span-3">
            {selectedField ? (
              <SatelliteAnalysisPanel
                field={selectedField}
                analyses={analyses}
                onAnalysisComplete={handleAnalysisComplete}
              />
            ) : (
              <div className="flex items-center justify-center h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Welcome to AgriSat Pro</h3>
                  <p className="mb-4 max-w-md">
                    Create your first field or select an existing one to start monitoring vegetation with advanced
                    satellite imagery analysis.
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Calculate vegetation indices (NDVI, EVI, NDWI, SAVI)</p>
                    <p>• Retrieve true color satellite images</p>
                    <p>• Monitor field health over time</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Satellite className="w-4 h-4" />
              <span>Powered by Sentinel-2 satellite data</span>
            </div>
            <div className="text-sm text-muted-foreground">© 2024 AgriSat Pro - Advanced Agricultural Monitoring</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
