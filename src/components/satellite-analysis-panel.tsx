"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Satellite,
  Activity,
  TrendingUp,
  AlertTriangle,
  Droplets,
  Leaf,
  ImageIcon,
  Calendar,
  MapPin,
  RefreshCw,
} from "lucide-react"
import type { Field, VegetationAnalysis } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface SatelliteAnalysisPanelProps {
  field: Field
  analyses: VegetationAnalysis[]
  onAnalysisComplete: () => void
}

export function SatelliteAnalysisPanel({ field, analyses, onAnalysisComplete }: SatelliteAnalysisPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const { toast } = useToast()

  const latestAnalysis = analyses[0]

  const handleAnalyzeField = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldId: field.id,
          analysisDate: new Date().toISOString().split("T")[0],
        }),
      })

      const result = await response.json()

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      if (result.success) {
        toast({
          title: "Analysis Complete",
          description: "Vegetation indices calculated and satellite images retrieved successfully.",
        })
        onAnalysisComplete()
      } else {
        toast({
          title: "Analysis Failed",
          description: result.error || "Failed to complete satellite analysis",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "An unexpected error occurred during analysis.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  const getHealthColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800"
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-blue-100 text-blue-800"
    if (score >= 40) return "bg-yellow-100 text-yellow-800"
    if (score >= 20) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  const getStressIcon = (level: string | null) => {
    switch (level) {
      case "Excellent":
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case "Good":
        return <Activity className="w-4 h-4 text-blue-600" />
      case "Fair":
        return <Activity className="w-4 h-4 text-yellow-600" />
      case "Poor":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case "Critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Satellite className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Field Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Satellite className="w-5 h-5" />
                {field.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {field.area_hectares ? `${field.area_hectares} ha` : "Area unknown"}
                </span>
                {field.crop_type && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    {field.crop_type}
                  </Badge>
                )}
              </CardDescription>
            </div>
            <Button onClick={handleAnalyzeField} disabled={isAnalyzing} size="lg">
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Satellite className="w-4 h-4 mr-2" />
                  Analyze Field
                </>
              )}
            </Button>
          </div>
          {isAnalyzing && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Processing satellite data...</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      {latestAnalysis ? (
        <Tabs defaultValue="indices" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="indices">Vegetation Indices</TabsTrigger>
            <TabsTrigger value="images">Satellite Images</TabsTrigger>
            <TabsTrigger value="history">Analysis History</TabsTrigger>
          </TabsList>

          <TabsContent value="indices" className="space-y-4">
            {/* Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Field Health Overview
                </CardTitle>
                <CardDescription>
                  Last analyzed: {new Date(latestAnalysis.analysis_date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{latestAnalysis.health_score || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">Health Score</div>
                    {latestAnalysis.health_score && <Progress value={latestAnalysis.health_score} className="mt-2" />}
                  </div>
                  <div className="text-center">
                    <Badge className={getHealthColor(latestAnalysis.health_score)}>
                      <div className="flex items-center gap-2">
                        {getStressIcon(latestAnalysis.stress_level)}
                        {latestAnalysis.stress_level || "Unknown"}
                      </div>
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-2">Stress Level</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vegetation Indices */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    NDVI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {latestAnalysis.ndvi_value?.toFixed(3) || "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Vegetation Density</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    EVI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {latestAnalysis.evi_value?.toFixed(3) || "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Enhanced Vegetation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    NDWI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600">
                    {latestAnalysis.ndwi_value?.toFixed(3) || "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Water Content</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    SAVI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {latestAnalysis.savi_value?.toFixed(3) || "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Soil Adjusted</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* True Color Image */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    True Color Image
                  </CardTitle>
                  <CardDescription>Natural color satellite imagery</CardDescription>
                </CardHeader>
                <CardContent>
                  {latestAnalysis.true_color_image_url ? (
                    <div className="aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={latestAnalysis.true_color_image_url || "/placeholder.svg"}
                        alt="True color satellite image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No image available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* NDVI Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    NDVI Visualization
                  </CardTitle>
                  <CardDescription>Vegetation index color mapping</CardDescription>
                </CardHeader>
                <CardContent>
                  {latestAnalysis.ndvi_image_url ? (
                    <div className="aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={latestAnalysis.ndvi_image_url || "/placeholder.svg"}
                        alt="NDVI visualization"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Leaf className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No visualization available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Analysis History
                </CardTitle>
                <CardDescription>Historical vegetation analysis data</CardDescription>
              </CardHeader>
              <CardContent>
                {analyses.length > 0 ? (
                  <div className="space-y-3">
                    {analyses.slice(0, 10).map((analysis) => (
                      <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-medium">
                            {new Date(analysis.analysis_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>NDVI: {analysis.ndvi_value?.toFixed(3) || "N/A"}</span>
                            <span>EVI: {analysis.evi_value?.toFixed(3) || "N/A"}</span>
                            <span>Health: {analysis.health_score || "N/A"}</span>
                          </div>
                        </div>
                        <Badge className={getHealthColor(analysis.health_score)}>
                          {analysis.stress_level || "Unknown"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No analysis history available</p>
                    <p className="text-sm">Run your first analysis to see historical data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-12">
              <Satellite className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">No Analysis Data</h3>
              <p className="mb-4">Click "Analyze Field" to start monitoring this field with satellite imagery.</p>
              <p className="text-sm">
                The system will calculate vegetation indices (NDVI, EVI, NDWI, SAVI) and retrieve true color images.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
