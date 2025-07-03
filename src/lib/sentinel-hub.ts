export interface SentinelHubConfig {
  instanceId: string
  clientId: string
  clientSecret: string
}

export interface NDVIData {
  ndvi: number
  evi: number
  stressLevel: "Low" | "Medium" | "High"
  imageUrl: string
}

export class SentinelHubService {
  private config: SentinelHubConfig
  private accessToken: string | null = null

  constructor(config: SentinelHubConfig) {
    this.config = config
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken

    const response = await fetch("https://services.sentinel-hub.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })

    const data = await response.json()
    this.accessToken = data.access_token
    return this.accessToken!
  }

  async getSentinel2Image(bbox: number[], date: string): Promise<string> {
    const token = await this.getAccessToken()

    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B02", "B03", "B04", "B08"],
          output: { bands: 3 }
        };
      }
      
      function evaluatePixel(sample) {
        return [sample.B04 * 2.5, sample.B03 * 2.5, sample.B02 * 2.5];
      }
    `

    const requestBody = {
      input: {
        bounds: {
          bbox: bbox,
          properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: date + "T00:00:00Z",
                to: date + "T23:59:59Z",
              },
            },
          },
        ],
      },
      output: {
        width: 512,
        height: 512,
        responses: [
          {
            identifier: "default",
            format: { type: "image/png" },
          },
        ],
      },
      evalscript: evalscript,
    }

    const response = await fetch("https://services.sentinel-hub.com/api/v1/process", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch Sentinel-2 image")
    }

    const blob = await response.blob()
    return URL.createObjectURL(blob)
  }

  async calculateNDVI(bbox: number[], date: string): Promise<NDVIData> {
    const token = await this.getAccessToken()

    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: ["B04", "B08"],
          output: { bands: 1, sampleType: "FLOAT32" }
        };
      }
      
      function evaluatePixel(sample) {
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        return [ndvi];
      }
    `

    const requestBody = {
      input: {
        bounds: {
          bbox: bbox,
          properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: date + "T00:00:00Z",
                to: date + "T23:59:59Z",
              },
            },
          },
        ],
      },
      output: {
        width: 256,
        height: 256,
        responses: [
          {
            identifier: "default",
            format: { type: "application/json" },
          },
        ],
      },
      evalscript: evalscript,
    }

    const response = await fetch("https://services.sentinel-hub.com/api/v1/process", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error("Failed to calculate NDVI")
    }

    // Simulate NDVI calculation for demo
    const ndvi = Math.random() * 0.8 + 0.1 // Random NDVI between 0.1 and 0.9
    const evi = ndvi * 0.8 // Simplified EVI calculation

    let stressLevel: "Low" | "Medium" | "High" = "Low"
    if (ndvi < 0.3) stressLevel = "High"
    else if (ndvi < 0.6) stressLevel = "Medium"

    const imageUrl = await this.getSentinel2Image(bbox, date)

    return {
      ndvi: Math.round(ndvi * 1000) / 1000,
      evi: Math.round(evi * 1000) / 1000,
      stressLevel,
      imageUrl,
    }
  }
}
