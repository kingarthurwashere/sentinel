import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatVegetationIndex(value: number | null): string {
  if (value === null || value === undefined) return "N/A"
  return value.toFixed(3)
}

export function getHealthScoreColor(score: number | null): string {
  if (!score) return "text-gray-500"
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-blue-600"
  if (score >= 40) return "text-yellow-600"
  if (score >= 20) return "text-orange-600"
  return "text-red-600"
}

export function getStressLevelColor(level: string | null): string {
  switch (level) {
    case "Excellent":
      return "bg-green-100 text-green-800"
    case "Good":
      return "bg-blue-100 text-blue-800"
    case "Fair":
      return "bg-yellow-100 text-yellow-800"
    case "Poor":
      return "bg-orange-100 text-orange-800"
    case "Critical":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function calculateBoundingBox(coordinates: any): number[] {
  if (!coordinates || !coordinates.coordinates || !coordinates.coordinates[0]) {
    return [0, 0, 0, 0]
  }

  const coords = coordinates.coordinates[0]
  const lngs = coords.map((c: number[]) => c[0])
  const lats = coords.map((c: number[]) => c[1])

  return [
    Math.min(...lngs), // min longitude
    Math.min(...lats), // min latitude
    Math.max(...lngs), // max longitude
    Math.max(...lats), // max latitude
  ]
}

export function generateFieldId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function validateCoordinates(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
): { valid: boolean; error?: string } {
  if (minLng >= maxLng) {
    return { valid: false, error: "Minimum longitude must be less than maximum longitude" }
  }

  if (minLat >= maxLat) {
    return { valid: false, error: "Minimum latitude must be less than maximum latitude" }
  }

  if (minLng < -180 || maxLng > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180" }
  }

  if (minLat < -90 || maxLat > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90" }
  }

  return { valid: true }
}

export function calculateFieldArea(coordinates: any): number {
  // Simplified area calculation for rectangular fields
  // In a real application, you would use a proper geospatial library
  if (!coordinates || !coordinates.coordinates || !coordinates.coordinates[0]) {
    return 0
  }

  const coords = coordinates.coordinates[0]
  if (coords.length < 4) return 0

  const [lng1, lat1] = coords[0]
  const [lng2, lat2] = coords[2] // Assuming rectangular field

  // Convert to approximate meters (very rough calculation)
  const lngDiff = Math.abs(lng2 - lng1) * 111320 * Math.cos((lat1 * Math.PI) / 180)
  const latDiff = Math.abs(lat2 - lat1) * 110540

  // Convert square meters to hectares
  return (lngDiff * latDiff) / 10000
}
