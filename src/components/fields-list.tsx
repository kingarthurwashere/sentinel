"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Wheat, Calendar } from "lucide-react"
import type { Field } from "@/lib/db"

interface FieldsListProps {
  fields: Field[]
  onSelectField: (field: Field) => void
  selectedField?: Field
}

export function FieldsList({ fields, onSelectField, selectedField }: FieldsListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Fields</h2>
      {fields.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No fields created yet.</p>
              <p className="text-sm">Create your first field to start monitoring.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {fields.map((field) => (
            <Card
              key={field.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedField?.id === field.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectField(field)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{field.name}</CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Wheat className="w-3 h-3" />
                    {field.crop_type || "Unknown"}
                  </Badge>
                </div>
                {field.description && <CardDescription>{field.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {field.area_hectares ? `${field.area_hectares} ha` : "Area unknown"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(field.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectField(field)
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
