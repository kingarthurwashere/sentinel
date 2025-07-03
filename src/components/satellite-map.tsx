"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Satellite, Activity, TrendingUp, AlertTriangle } from "lucide-react"
import type { Field, SatelliteData } from "@/lib/db"

interface SatelliteMapProps {
  field: Field
  satelliteData: SatelliteData[]
  onAnalyze?: (fieldId: number) => void
}

export function SatelliteMap({ field, satelliteData, onAnalyze }: SatelliteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize Leaflet map
    const L = require("leaflet")

    const mapInstance = L.map(mapRef.current).setView([46.055, 13.405], 13)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstance)

    // Add satellite layer toggle
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles © Esri",
      },
    )

    const baseMaps = {
      OpenStreetMap: mapInstance._layers[Object.keys(mapInstance._layers)[0]],
      Satellite: satelliteLayer,
    }

    L.control.layers(baseMaps).addTo(mapInstance)

    // Add field polygon
    if (field.coordinates && field.coordinates.coordinates) {
      const coordinates = field.coordinates.coordinates[0].map((coord: number[]) => [coord[1], coord[0]])

      L.polygon(coordinates, {
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.2,
        weight: 2,
      })
        .addTo(mapInstance)
        .bindPopup(`
        <div>
          <h3>${field.name}</h3>
          <p>${field.description || "No description"}</p>
          <p><strong>Crop:</strong> ${field.crop_type || "Unknown"}</p>
          <p><strong>Area:</strong> ${field.area_hectares || "Unknown"} ha</p>
        </div>
      `)
    }

    setMap(mapInstance)

    return () => {
      mapInstance.remove()
    }
  }, [field])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      await onAnalyze?.(field.id)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const latestData = satelliteData[0]

  const getStressColor = (level: string | null) => {
    switch (level) {
      case "Low":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "High":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStressIcon = (level: string | null) => {
    switch (level) {
      case "Low":
        return <TrendingUp className="w-4 h-4" />
      case "Medium":
        return <Activity className="w-4 h-4" />
      case "High":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Satellite className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Satellite className="w-5 h-5" />
                {field.name}
              </CardTitle>
              <CardDescription>Satellite imagery and vegetation analysis</CardDescription>
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing..." : "Analyze Field"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full rounded-lg overflow-hidden border">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        </CardContent>
      </Card>

      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">NDVI Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{latestData.ndvi_value?.toFixed(3) || "N/A"}</div>
              <p className="text-xs text-muted-foreground">Normalized Difference Vegetation Index</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">EVI Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{latestData.evi_value?.toFixed(3) || "N/A"}</div>
              <p className="text-xs text-muted-foreground">Enhanced Vegetation Index</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={getStressColor(latestData.stress_level)}>
                <div className="flex items-center gap-1">
                  {getStressIcon(latestData.stress_level)}
                  {latestData.stress_level || "Unknown"}
                </div>
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(latestData.acquisition_date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {satelliteData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Data</CardTitle>
            <CardDescription>Vegetation index trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {satelliteData.slice(0, 5).map((data) => (
                <div key={data.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">{new Date(data.acquisition_date).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">NDVI: {data.ndvi_value?.toFixed(3) || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">EVI: {data.evi_value?.toFixed(3) || "N/A"}</div>
                  </div>
                  <Badge className={getStressColor(data.stress_level)}>{data.stress_level || "Unknown"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
