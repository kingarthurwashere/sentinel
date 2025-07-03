"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createFieldAction } from "@/app/actions"
import { useToast } from "@/hooks/use-toast"

interface FieldFormProps {
  onFieldCreated?: () => void
}

export function FieldForm({ onFieldCreated }: FieldFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      const result = await createFieldAction(formData)
      if (result.success) {
        toast({
          title: "Field created successfully",
          description: `${result.field?.name} has been added to your fields.`,
        })
        onFieldCreated?.()
      } else {
        toast({
          title: "Error creating field",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error creating field",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Field</CardTitle>
        <CardDescription>Add a new field to monitor with satellite imagery</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Field Name</Label>
              <Input id="name" name="name" placeholder="e.g., North Field" required />
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
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Optional description of the field" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area_hectares">Area (Hectares)</Label>
              <Input id="area_hectares" name="area_hectares" type="number" step="0.1" placeholder="e.g., 25.5" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Coordinates (Bounding Box)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input name="min_lng" placeholder="Min Longitude" type="number" step="any" defaultValue="13.4" required />
              <Input name="min_lat" placeholder="Min Latitude" type="number" step="any" defaultValue="46.05" required />
              <Input
                name="max_lng"
                placeholder="Max Longitude"
                type="number"
                step="any"
                defaultValue="13.41"
                required
              />
              <Input name="max_lat" placeholder="Max Latitude" type="number" step="any" defaultValue="46.06" required />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Field"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
