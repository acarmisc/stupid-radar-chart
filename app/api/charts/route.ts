import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { generateRadarPng } from '@/lib/radar-png'

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)]
  }
  return slug
}

function getRequestOrigin(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const out = searchParams.get('out') // 'picture' | 'url' | 'picture_url'

    const body = await request.json()
    const { title, author, deliverable_type, show_author, locked_values, extra_kpi } = body

    if (!title || !author || !locked_values || typeof locked_values !== 'object') {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Retry slug generation in case of collision
    let attempts = 0
    let slug = ''
    while (attempts < 5) {
      slug = generateSlug()
      const check = await pool.query('SELECT 1 FROM charts WHERE slug = $1', [slug])
      if (check.rowCount === 0) break
      attempts++
    }

    const result = await pool.query(
      `INSERT INTO charts (slug, title, author, deliverable_type, show_author, locked_values, extra_kpi)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING slug, created_at`,
      [slug, title, author, deliverable_type, show_author !== false, JSON.stringify(locked_values), extra_kpi ? JSON.stringify(extra_kpi) : null]
    )

    const savedSlug = result.rows[0].slug
    const origin = getRequestOrigin(request)

    if (out === 'picture') {
      const kpis: Record<string, number> = { ...locked_values }
      if (extra_kpi) {
        kpis[extra_kpi.name] = extra_kpi.value
      }
      const pngBuffer = await generateRadarPng({
        title,
        author,
        deliverable_type,
        show_author,
        kpis,
      })
      return new NextResponse(new Uint8Array(pngBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': String(pngBuffer.length),
          'X-Chart-Slug': savedSlug,
        },
      })
    }

    if (out === 'url') {
      return NextResponse.json({
        slug: savedSlug,
        url: `${origin}/s/${savedSlug}`,
        created_at: result.rows[0].created_at,
      }, { status: 201 })
    }

    if (out === 'picture_url') {
      return NextResponse.json({
        slug: savedSlug,
        picture_url: `${origin}/api/charts/${savedSlug}/picture`,
        created_at: result.rows[0].created_at,
      }, { status: 201 })
    }

    // Default
    return NextResponse.json({
      slug: savedSlug,
      created_at: result.rows[0].created_at,
    }, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/charts error:', e)
    return NextResponse.json({ error: `Database error: ${e.message}` }, { status: 500 })
  }
}

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT slug, title, author, deliverable_type, show_author, locked_values, extra_kpi, created_at
       FROM charts ORDER BY created_at DESC LIMIT 100`
    )
    return NextResponse.json(result.rows)
  } catch (e: any) {
    console.error('GET /api/charts error:', e)
    return NextResponse.json({ error: `Database error: ${e.message}` }, { status: 500 })
  }
}
