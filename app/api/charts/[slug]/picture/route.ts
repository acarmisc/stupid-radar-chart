import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { generateRadarPng } from '@/lib/radar-png'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const result = await pool.query(
      `SELECT title, author, deliverable_type, show_author, locked_values, extra_kpi
       FROM charts WHERE slug = $1`,
      [slug]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Chart not found.' }, { status: 404 })
    }

    const row = result.rows[0]
    const lockedValues = typeof row.locked_values === 'string' ? JSON.parse(row.locked_values) : row.locked_values
    const extraKpi = row.extra_kpi ? (typeof row.extra_kpi === 'string' ? JSON.parse(row.extra_kpi) : row.extra_kpi) : null

    const kpis: Record<string, number> = { ...lockedValues }
    if (extraKpi) {
      kpis[extraKpi.name] = extraKpi.value
    }

    const pngBuffer = await generateRadarPng({
      title: row.title,
      author: row.author,
      deliverable_type: row.deliverable_type,
      show_author: row.show_author,
      kpis,
    })

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(pngBuffer.length),
      },
    })
  } catch (e: any) {
    console.error(`GET /api/charts/[slug]/picture error:`, e)
    return NextResponse.json({ error: `Error generating chart image: ${e.message}` }, { status: 500 })
  }
}
