import { notFound } from 'next/navigation'
import { pool } from '@/lib/db'
import Link from 'next/link'
import { Metadata } from 'next'

interface ChartRow {
  slug: string
  title: string
  author: string
  deliverable_type: string
  show_author: boolean
  locked_values: Record<string, number>
  extra_kpi: { name: string; value: number } | null
  created_at: string
}

async function getChart(slug: string): Promise<ChartRow | null> {
  try {
    const result = await pool.query(
      `SELECT slug, title, author, deliverable_type, show_author, locked_values, extra_kpi, created_at
       FROM charts WHERE slug = $1`,
      [slug]
    )
    if (result.rowCount === 0) return null
    return result.rows[0]
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const chart = await getChart(slug)
  if (!chart) return { title: 'Chart Not Found' }
  return { title: `${chart.title} — Radar Chart` }
}

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const chart = await getChart(slug)

  if (!chart) {
    notFound()
  }

  const kpiNames = ['author', 'ai', 'team', 'research', 'unspecified']
  const labels = [
    ...kpiNames.map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    ...(chart.extra_kpi ? [chart.extra_kpi.name.charAt(0).toUpperCase() + chart.extra_kpi.name.slice(1)] : []),
  ]

  const values = [
    ...kpiNames.map(name => chart.locked_values[name] ?? 50),
    ...(chart.extra_kpi ? [chart.extra_kpi.value] : []),
  ]

  const count = labels.length
  const size = 500
  const cx = size / 2
  const cy = size / 2
  const radius = 200
  const levels = 5

  const bg = '#ffffff'
  const fg = '#0d0d12'
  const mutedFg = '#52525e'
  const grid = '#e3e3ea'
  const primary = '#0F62FE'
  const primaryAlpha = 'rgba(15, 98, 254, 0.2)'
  const pointColor = '#6b46ff'

  // Build SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
  svg += `<rect width="100%" height="100%" fill="${bg}"/>`
  svg += `<text x="${cx}" y="30" text-anchor="middle" font-family="Inter, sans-serif" font-size="20" font-weight="700" fill="${fg}">${escapeXml(chart.title)}</text>`
  if (chart.show_author) {
    svg += `<text x="${cx}" y="55" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="400" fill="${mutedFg}">by ${escapeXml(chart.author)}</text>`
  }

  for (let i = 1; i <= levels; i++) {
    const r = (radius / levels) * i
    const points = []
    for (let j = 0; j < count; j++) {
      const angle = (2 * Math.PI / count) * j - Math.PI / 2
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      points.push(`${x},${y}`)
    }
    svg += `<polygon points="${points.join(' ')}" fill="none" stroke="${grid}" stroke-width="2"/>`
  }

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI / count) * i - Math.PI / 2
    const x1 = cx + radius * Math.cos(angle)
    const y1 = cy + radius * Math.sin(angle)
    svg += `<line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="rgba(0,0,0,0.05)" stroke-width="2"/>`
    const lx = cx + (radius + 25) * Math.cos(angle)
    const ly = cy + (radius + 25) * Math.sin(angle)
    const textAnchor = Math.abs(angle + Math.PI / 2) < 0.01 ? 'middle' : (lx > cx ? 'start' : 'end')
    svg += `<text x="${lx}" y="${ly + 7}" text-anchor="${textAnchor}" font-family="Inter, sans-serif" font-size="16" font-weight="500" fill="${fg}">${escapeXml(labels[i])}</text>`
  }

  const dataPoints = values.map((v, i) => {
    const angle = (2 * Math.PI / count) * i - Math.PI / 2
    const r = (v / 100) * radius
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  const pointStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ')
  svg += `<polygon points="${pointStr}" fill="${primaryAlpha}" stroke="${primary}" stroke-width="3" stroke-linejoin="round"/>`
  for (const p of dataPoints) {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${pointColor}" stroke="${primary}" stroke-width="2"/>`
  }

  svg += `<text x="${cx}" y="${size - 12}" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="${mutedFg}">${escapeXml(chart.deliverable_type)}</text>`
  svg += `</svg>`

  const svgBase64 = Buffer.from(svg).toString('base64')
  const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`

  return (
    <div className="min-h-screen px-5 py-10" style={{ background: '#fdfdff', fontFamily: "'Inter', sans-serif" }}>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-enterprise-fg mb-2">📊 Radar Chart</h1>
        <p className="text-base text-enterprise-mfg">Shared chart from the cloud</p>
      </div>

      <div className="max-w-[600px] mx-auto bg-enterprise-card border border-enterprise-border rounded-xl shadow-sm p-8">
        <div className="mb-6">
          <img src={svgDataUrl} alt={`${chart.title} radar chart`} className="w-full" />
        </div>

        <div className="bg-enterprise-muted border border-enterprise-border rounded-lg p-4">
          <div className="text-base font-semibold text-enterprise-fg mb-3">Metadata</div>
          <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>Title:</strong> {chart.title}</div>
          <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>Author:</strong> {chart.author}</div>
          <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>Deliverable:</strong> {chart.deliverable_type}</div>
          <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>KPIs:</strong> {labels.join(', ')}</div>
          <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>Created:</strong> {new Date(chart.created_at).toLocaleString()}</div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="flex-1 text-center bg-enterprise-primary text-enterprise-pfg hover:bg-[#1a70ff] border-none rounded-lg px-6 py-3 text-sm font-semibold cursor-pointer transition-all"
          >
            Create New Chart
          </Link>
        </div>
      </div>

      <div className="text-center mt-10 text-sm text-enterprise-mfg p-4 bg-enterprise-muted rounded-lg max-w-[600px] mx-auto">
        Enterprise Mod 2 Theme — Corporate, Professional, Elegant
      </div>
    </div>
  )
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
