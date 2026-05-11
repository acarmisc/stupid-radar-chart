import sharp from 'sharp'

export interface RadarParams {
  title?: string
  author?: string
  deliverable_type?: string
  show_author?: boolean
  kpis: Record<string, number>
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Build an SVG radar chart from KPI values.
 */
export function buildRadarSvg(params: RadarParams): string {
  const { title, author, deliverable_type, show_author, kpis } = params

  const kpiNames = Object.keys(kpis)
  const values = Object.values(kpis)
  const count = kpiNames.length

  const size = 800
  const cx = size / 2
  const cy = size / 2
  const radius = 320
  const fontSize = 22
  const labelOffset = 30

  const bg = '#ffffff'
  const fg = '#0d0d12'
  const mutedFg = '#52525e'
  const grid = '#e3e3ea'
  const primary = '#0F62FE'
  const primaryAlpha = 'rgba(15, 98, 254, 0.2)'
  const pointColor = '#6b46ff'

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`
  svg += `<defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#111827" flood-opacity="0.08"/></filter></defs>`
  svg += `<rect width="100%" height="100%" fill="${bg}"/>`
  svg += `<text x="${cx}" y="40" text-anchor="middle" font-family="var(--font-sans), sans-serif" font-size="28" font-weight="700" fill="${fg}">${escapeXml(title || '')}</text>`
  if (show_author !== false) {
    svg += `<text x="${cx}" y="75" text-anchor="middle" font-family="var(--font-sans), sans-serif" font-size="18" font-weight="400" fill="${mutedFg}">by ${escapeXml(author || '')}</text>`
  }

  const levels = 5
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

    const lx = cx + (radius + labelOffset) * Math.cos(angle)
    const ly = cy + (radius + labelOffset) * Math.sin(angle)
    const textAnchor = Math.abs(angle + Math.PI / 2) < 0.01 ? 'middle' : (lx > cx ? 'start' : 'end')
    svg += `<text x="${lx}" y="${ly + fontSize / 3}" text-anchor="${textAnchor}" font-family="var(--font-sans), sans-serif" font-size="${fontSize}" font-weight="500" fill="${fg}">${escapeXml(kpiNames[i])}</text>`
  }

  const dataPoints = values.map((v, i) => {
    const angle = (2 * Math.PI / count) * i - Math.PI / 2
    const r = (v / 100) * radius
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  const pointStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ')
  svg += `<polygon points="${pointStr}" fill="${primaryAlpha}" stroke="${primary}" stroke-width="3" stroke-linejoin="round"/>`

  for (const p of dataPoints) {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="6" fill="${pointColor}" stroke="${primary}" stroke-width="2"/>`
  }

  svg += `<text x="${cx}" y="${size - 20}" text-anchor="middle" font-family="var(--font-sans), sans-serif" font-size="14" fill="${mutedFg}">${escapeXml(deliverable_type || '')}</text>`
  svg += `</svg>`

  return svg
}

/**
 * Generate a PNG buffer from radar params.
 */
export async function generateRadarPng(params: RadarParams): Promise<Buffer> {
  const svg = buildRadarSvg(params)
  return sharp(Buffer.from(svg))
    .resize(800, 800)
    .png()
    .toBuffer()
}
