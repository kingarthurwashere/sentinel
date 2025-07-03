"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Wheat, Calendar, Trash2 } from "lucide-react"
import type { Field } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface FieldListProps {
  fields: Field[]
  onSelectField: (field: Field) => void
  onFieldDeleted: () => void
  selectedField?: Field
}

export function FieldList({ fields, onSelectField, onFieldDeleted, selectedField }: FieldListProps) {
  const { toast } = useToast()

  const handleDeleteField = async (fieldId: number, fieldName: string) => {
    if (!confirm(`Are you sure you want to delete "${fieldName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/fields/${fieldId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Field deleted",
          description: `${fieldName} has been removed from your monitoring system.`,
        })
        onFieldDeleted()
      } else {
        toast({
          title: "Error deleting field",
          description: result.error || "Failed to delete field",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error deleting field",
        description: "An unexpected error occurred while deleting the field.",
        variant: "destructive",
      })
    }
  }

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No Fields Yet</h3>
            <p className="mb-4">Create your first field to start monitoring vegetation with satellite imagery.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Fields ({fields.length})</h2>
      <div className="grid gap-4">
        {fields.map((field) => (
          <Card
            key={field.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedField?.id === field.id ? "ring-2 ring-primary shadow-md" : ""
            }`}
            onClick={() => onSelectField(field)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {field.name}
                  </CardTitle>
                  {field.description && (
                    <CardDescription className="mt-1 line-clamp-2">{field.description}</CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteField(field.id, field.name)
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {field.crop_type && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Wheat className="w-3 h-3" />
                      {field.crop_type}
                    </Badge>
                  )}
                  {field.area_hectares && <span>{field.area_hectares} hectares</span>}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(field.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectField(field)
                  }}
                >
                  Analyze
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
