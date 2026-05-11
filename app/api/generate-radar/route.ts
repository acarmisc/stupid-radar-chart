import { NextRequest, NextResponse } from 'next/server'
import { generateRadarPng } from '@/lib/radar-png'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, deliverable_type, kpis, show_author } = body as {
      title?: string
      author?: string
      deliverable_type?: string
      kpis?: Record<string, number>
      show_author?: boolean
    }

    if (!kpis || typeof kpis !== 'object' || Object.keys(kpis).length === 0) {
      return NextResponse.json({ error: 'At least one KPI is required.' }, { status: 400 })
    }

    for (const [name, val] of Object.entries(kpis)) {
      if (typeof val !== 'number' || val < 1 || val > 100) {
        return NextResponse.json(
          { error: `KPI '${name}' has invalid value ${val}. Must be 1-100.` },
          { status: 400 }
        )
      }
    }

    const pngBuffer = await generateRadarPng({ title, author, deliverable_type, kpis, show_author })

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(pngBuffer.length),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: `Error generating radar chart: ${e.message}` }, { status: 500 })
  }
}
