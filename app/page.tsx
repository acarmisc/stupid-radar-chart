'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
  Title,
  ChartDataset,
  ChartOptions,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import './styles.css'

ChartJS.register(RadialLinearScale, LineElement, PointElement, Filler, Tooltip, Legend, Title)

const KPI_KEYS = ['author', 'ai', 'team', 'research', 'unspecified'] as const
type KpiKey = typeof KPI_KEYS[number]

const DEFAULT_KPIS: Record<KpiKey, number> = {
  author: 75,
  ai: 85,
  team: 70,
  research: 65,
  unspecified: 60,
}

export default function HomePage() {
  const [title, setTitle] = useState('FinOps MVP Dashboard')
  const [author, setAuthor] = useState('Andrea')
  const [deliverableType, setDeliverableType] = useState('code')
  const [kpis, setKpis] = useState<Record<KpiKey, number>>({ ...DEFAULT_KPIS })
  const [showAuthor, setShowAuthor] = useState(true)
  const chartRef = useRef<ChartJS<'radar'> | null>(null)

  const handleKpiChange = useCallback((key: KpiKey, value: string) => {
    setKpis(prev => ({ ...prev, [key]: parseInt(value, 10) || 0 }))
  }, [])

  const labels = KPI_KEYS.map(k => k.charAt(0).toUpperCase() + k.slice(1))
  const values = KPI_KEYS.map(k => kpis[k])

  const data = {
    labels,
    datasets: [
      {
        label: 'KPI Values',
        data: values,
        backgroundColor: 'rgba(15, 98, 254, 0.2)',
        borderColor: '#0F62FE',
        borderWidth: 2,
        pointBackgroundColor: '#6b46ff',
        pointBorderColor: '#0F62FE',
        pointBorderWidth: 2,
        pointRadius: 5,
      } as ChartDataset<'radar', number[]>,
    ],
  }

  const options: ChartOptions<'radar'> = {
    maintainAspectRatio: false,
    elements: { line: { tension: 0.4 } },
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        angleLines: { color: 'rgba(0, 0, 0, 0.05)' },
        pointLabels: {
          color: '#0d0d12',
          font: { size: 13, weight: 500 },
        },
        ticks: { display: false, backdropColor: 'transparent' },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#0d0d12', font: { family: 'Inter', weight: 500 } },
      },
      title: {
        display: true,
        text: showAuthor ? `${title}\nby ${author}` : title,
        color: '#0d0d12',
        font: { family: 'Inter', size: 16, weight: 700 },
      },
    },
  }

  const exportPNG = useCallback(() => {
    const chart = chartRef.current
    if (!chart) return
    const link = document.createElement('a')
    link.download = `radar-${author.replace(/\s+/g, '_')}-${Date.now()}.png`
    link.href = chart.toBase64Image()
    link.click()
  }, [author])

  const exportServerPNG = useCallback(async () => {
    const res = await fetch('/api/generate-radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, deliverable_type: deliverableType, kpis, show_author: showAuthor }),
    })
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `radar-${author.replace(/\s+/g, '_')}-${Date.now()}.png`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [title, author, deliverableType, kpis])

  return (
    <div className="min-h-screen px-5 py-10" style={{ background: '#fdfdff', fontFamily: "'Inter', sans-serif" }}>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-enterprise-fg mb-2">📊 Radar Chart</h1>
        <p className="text-base text-enterprise-mfg">Generate transparent radar charts from your KPIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1000px] mx-auto">
        {/* Form Panel */}
        <div className="bg-enterprise-card border border-enterprise-border rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-enterprise-fg mb-4 pb-3 border-b border-enterprise-border">Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-enterprise-fg mb-2">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-enterprise-card border border-enterprise-border rounded-lg px-4 py-2.5 text-sm text-enterprise-fg focus:outline-none focus:border-enterprise-ring focus:ring-1 focus:ring-enterprise-ring transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-enterprise-fg mb-2">Author</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="w-full bg-enterprise-card border border-enterprise-border rounded-lg px-4 py-2.5 text-sm text-enterprise-fg focus:outline-none focus:border-enterprise-ring focus:ring-1 focus:ring-enterprise-ring transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-enterprise-fg mb-2">Deliverable Type</label>
              <select
                value={deliverableType}
                onChange={e => setDeliverableType(e.target.value)}
                className="w-full bg-enterprise-card border border-enterprise-border rounded-lg px-4 py-2.5 text-sm text-enterprise-fg focus:outline-none focus:border-enterprise-ring focus:ring-1 focus:ring-enterprise-ring transition-all cursor-pointer"
              >
                <option value="slideshow">Slide Deck</option>
                <option value="code">Code</option>
                <option value="workbook">Workbook</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-enterprise-fg">Show author name</label>
              <input
                type="checkbox"
                checked={showAuthor}
                onChange={e => setShowAuthor(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-enterprise-primary"
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold text-enterprise-fg mt-8 mb-5">KPIs (1-100)</h3>
              {KPI_KEYS.map(key => (
                <div key={key} className="mb-6">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium text-enterprise-fg capitalize">{key}</span>
                    <span className="bg-enterprise-secondary text-enterprise-sfg px-2.5 py-1 rounded-md text-sm font-semibold">{kpis[key]}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={kpis[key]}
                    onChange={e => handleKpiChange(key, e.target.value)}
                    className="slider"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="bg-enterprise-card border border-enterprise-border rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-enterprise-fg mb-4 pb-3 border-b border-enterprise-border">Preview</h2>

          <div className="bg-enterprise-card border border-enterprise-border rounded-xl p-6 relative min-h-[400px]">
            <Radar ref={chartRef} data={data} options={options} style={{ maxHeight: 350 }} />
            <div className="absolute bottom-4 right-4 space-x-2">
              <button
                onClick={exportPNG}
                className="bg-enterprise-muted text-enterprise-mfg hover:bg-[#e8e8f0] border-none rounded-lg px-6 py-3 text-sm font-semibold cursor-pointer transition-all active:translate-y-[1px]"
              >
                Export PNG (Client)
              </button>
              <button
                onClick={exportServerPNG}
                className="bg-enterprise-primary text-enterprise-pfg hover:bg-[#1a70ff] border-none rounded-lg px-6 py-3 text-sm font-semibold cursor-pointer transition-all active:translate-y-[1px]"
              >
                Export PNG (Server)
              </button>
            </div>
          </div>

          <div className="bg-enterprise-muted border border-enterprise-border rounded-lg p-4 mt-5">
            <div className="text-base font-semibold text-enterprise-fg mb-3">Metadata</div>
            <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>Title:</strong> {title}</div>
            <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>Author:</strong> {author}</div>
            <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>Deliverable:</strong> {deliverableType}</div>
          </div>
        </div>
      </div>

      <div className="text-center mt-10 text-sm text-enterprise-mfg p-4 bg-enterprise-muted rounded-lg max-w-[600px] mx-auto">
        Enterprise Mod 2 Theme - Corporate, Professional, Elegant
      </div>
    </div>
  )
}
