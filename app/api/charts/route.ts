import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)]
  }
  return slug
}

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({ slug: result.rows[0].slug, created_at: result.rows[0].created_at }, { status: 201 })
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
