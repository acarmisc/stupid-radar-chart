import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const result = await pool.query(
      `SELECT slug, title, author, deliverable_type, show_author, locked_values, extra_kpi, created_at
       FROM charts WHERE slug = $1`,
      [slug]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Chart not found.' }, { status: 404 })
    }

    const row = result.rows[0]
    return NextResponse.json({
      slug: row.slug,
      title: row.title,
      author: row.author,
      deliverableType: row.deliverable_type,
      showAuthor: row.show_author,
      lockedValues: row.locked_values,
      extraKpi: row.extra_kpi,
      createdAt: row.created_at,
    })
  } catch (e: any) {
    console.error(`GET /api/charts/[slug] error:`, e)
    return NextResponse.json({ error: `Database error: ${e.message}` }, { status: 500 })
  }
}
