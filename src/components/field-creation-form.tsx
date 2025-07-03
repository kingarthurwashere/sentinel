"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FieldCreationFormProps {
  onFieldCreated: () => void
}

export function FieldCreationForm({ onFieldCreated }: FieldCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/fields", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Field created successfully",
          description: `${result.field.name} has been added to your monitoring system.`,
        })
        onFieldCreated()
        // Reset form
        event.currentTarget.reset()
      } else {
        toast({
          title: "Error creating field",
          description: result.error || "Failed to create field",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error creating field",
        description: "An unexpected error occurred while creating the field.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Field
        </CardTitle>
        <CardDescription>Add a new agricultural field for satellite monitoring and analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Field Name *</Label>
              <Input id="name" name="name" placeholder="e.g., North Wheat Field" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crop_type">Crop Type</Label>
              <Select name="crop_type">
                <SelectTrigger>
                  <SelectValue placeholder="Select crop type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wheat">Wheat</SelectItem>
                  <SelectItem value="corn">Corn</SelectItem>
                  <SelectItem value="soybean">Soybean</SelectItem>
                  <SelectItem value="rice">Rice</SelectItem>
                  <SelectItem value="barley">Barley</SelectItem>
                  <SelectItem value="cotton">Cotton</SelectItem>
                  <SelectItem value="canola">Canola</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description of the field (irrigation, soil type, etc.)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_hectares">Area (Hectares)</Label>
            <Input id="area_hectares" name="area_hectares" type="number" step="0.1" min="0" placeholder="e.g., 25.5" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <Label className="text-base font-medium">Field Coordinates (Bounding Box)</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_lng">Southwest Longitude *</Label>
                <Input
                  id="min_lng"
                  name="min_lng"
                  type="number"
                  step="any"
                  placeholder="e.g., 13.4000"
                  defaultValue="13.4"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_lat">Southwest Latitude *</Label>
                <Input
                  id="min_lat"
                  name="min_lat"
                  type="number"
                  step="any"
                  placeholder="e.g., 46.0500"
                  defaultValue="46.05"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_lng">Northeast Longitude *</Label>
                <Input
                  id="max_lng"
                  name="max_lng"
                  type="number"
                  step="any"
                  placeholder="e.g., 13.4200"
                  defaultValue="13.42"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_lat">Northeast Latitude *</Label>
                <Input
                  id="max_lat"
                  name="max_lat"
                  type="number"
                  step="any"
                  placeholder="e.g., 46.0700"
                  defaultValue="46.07"
                  required
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Define the rectangular boundary of your field using latitude and longitude coordinates.
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating Field..." : "Create Field"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
