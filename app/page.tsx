'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

const STORAGE_KEY = 'stupid-radar-chart-v1'

interface KpiItem {
  id: string
  name: string
  value: number
}

interface ChartConfig {
  title: string
  author: string
  deliverableType: string
  kpis: KpiItem[]
  showAuthor: boolean
}

const DEFAULT_CONFIG: ChartConfig = {
  title: 'FinOps MVP Dashboard',
  author: 'Andrea',
  deliverableType: 'code',
  showAuthor: true,
  kpis: [
    { id: 'k1', name: 'author', value: 75 },
    { id: 'k2', name: 'ai', value: 85 },
    { id: 'k3', name: 'team', value: 70 },
    { id: 'k4', name: 'research', value: 65 },
    { id: 'k5', name: 'unspecified', value: 60 },
  ],
}

function encodeConfig(config: ChartConfig): string {
  const payload = {
    t: config.title,
    a: config.author,
    d: config.deliverableType,
    s: config.showAuthor,
    k: config.kpis.map(k => [k.name, k.value]),
  }
  return btoa(JSON.stringify(payload))
}

function decodeConfig(hash: string): ChartConfig | null {
  try {
    const payload = JSON.parse(atob(hash))
    return {
      title: payload.t || DEFAULT_CONFIG.title,
      author: payload.a || DEFAULT_CONFIG.author,
      deliverableType: payload.d || DEFAULT_CONFIG.deliverableType,
      showAuthor: payload.s !== false,
      kpis: Array.isArray(payload.k)
        ? payload.k.map(([name, value]: [string, number], i: number) => ({
            id: `k${i + 1}`,
            name: String(name),
            value: Number(value) || 0,
          }))
        : [...DEFAULT_CONFIG.kpis],
    }
  } catch {
    return null
  }
}

function loadFromStorage(): ChartConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(config: ChartConfig) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // ignore quota errors
  }
}

export default function HomePage() {
  // Initialize from URL hash > localStorage > defaults
  const [config, setConfig] = useState<ChartConfig>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (hash) {
        const decoded = decodeConfig(hash)
        if (decoded) return decoded
      }
      const stored = loadFromStorage()
      if (stored) return stored
    }
    return { ...DEFAULT_CONFIG }
  })

  const [newKpiName, setNewKpiName] = useState('')
  const [copied, setCopied] = useState(false)
  const chartRef = useRef<ChartJS<'radar'> | null>(null)

  const { title, author, deliverableType, kpis, showAuthor } = config

  // Persist to localStorage whenever config changes
  useEffect(() => {
    saveToStorage(config)
  }, [config])

  // Update URL hash whenever config changes (shareable link)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = encodeConfig(config)
    window.history.replaceState(null, '', `#${hash}`)
  }, [config])

  const setField = useCallback(<K extends keyof ChartConfig>(key: K, value: ChartConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleKpiChange = useCallback((id: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      kpis: prev.kpis.map(k => (k.id === id ? { ...k, value: parseInt(value, 10) || 0 } : k)),
    }))
  }, [])

  const handleKpiNameChange = useCallback((id: string, name: string) => {
    setConfig(prev => ({
      ...prev,
      kpis: prev.kpis.map(k => (k.id === id ? { ...k, name } : k)),
    }))
  }, [])

  const addKpi = useCallback(() => {
    const name = newKpiName.trim()
    if (!name) return
    const id = `k${Date.now()}`
    setConfig(prev => ({ ...prev, kpis: [...prev.kpis, { id, name, value: 50 }] }))
    setNewKpiName('')
  }, [newKpiName])

  const removeKpi = useCallback((id: string) => {
    setConfig(prev => {
      if (prev.kpis.length <= 1) return prev // keep at least 1
      return { ...prev, kpis: prev.kpis.filter(k => k.id !== id) }
    })
  }, [])

  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_CONFIG })
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '#')
    }
  }, [])

  const copyShareLink = useCallback(() => {
    if (typeof window === 'undefined') return
    const baseUrl = window.location.origin + window.location.pathname
    const hash = encodeConfig(config)
    const url = `${baseUrl}#${hash}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [config])

  const labels = kpis.map(k => k.name.charAt(0).toUpperCase() + k.name.slice(1))
  const values = kpis.map(k => k.value)

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
    const kpisRecord: Record<string, number> = {}
    for (const k of kpis) {
      kpisRecord[k.name] = k.value
    }
    const res = await fetch('/api/generate-radar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, deliverable_type: deliverableType, kpis: kpisRecord, show_author: showAuthor }),
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
  }, [title, author, deliverableType, kpis, showAuthor])

  return (
    <div className="min-h-screen px-5 py-10" style={{ background: '#fdfdff', fontFamily: "'Inter', sans-serif" }}>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-enterprise-fg mb-2">📊 Radar Chart</h1>
        <p className="text-base text-enterprise-mfg">Generate transparent radar charts from your KPIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[1000px] mx-auto">
        {/* Form Panel */}
        <div className="bg-enterprise-card border border-enterprise-border rounded-xl shadow-sm p-8">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-enterprise-border">
            <h2 className="text-2xl font-semibold text-enterprise-fg">Configuration</h2>
            <button
              onClick={resetConfig}
              className="text-xs text-enterprise-mfg hover:text-enterprise-fg underline cursor-pointer"
              title="Reset to defaults"
            >
              Reset
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-enterprise-fg mb-2">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setField('title', e.target.value)}
                className="w-full bg-enterprise-card border border-enterprise-border rounded-lg px-4 py-2.5 text-sm text-enterprise-fg focus:outline-none focus:border-enterprise-ring focus:ring-1 focus:ring-enterprise-ring transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-enterprise-fg mb-2">Author</label>
              <input
                type="text"
                value={author}
                onChange={e => setField('author', e.target.value)}
                className="w-full bg-enterprise-card border border-enterprise-border rounded-lg px-4 py-2.5 text-sm text-enterprise-fg focus:outline-none focus:border-enterprise-ring focus:ring-1 focus:ring-enterprise-ring transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-enterprise-fg mb-2">Deliverable Type</label>
              <select
                value={deliverableType}
                onChange={e => setField('deliverableType', e.target.value)}
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
                onChange={e => setField('showAuthor', e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-enterprise-primary"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mt-8 mb-5">
                <h3 className="text-xl font-semibold text-enterprise-fg">KPIs ({kpis.length})</h3>
                <button
                  onClick={copyShareLink}
                  className="text-xs bg-enterprise-muted text-enterprise-mfg hover:text-enterprise-fg border border-enterprise-border rounded-md px-3 py-1.5 cursor-pointer transition-all"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {kpis.map(kpi => (
                <div key={kpi.id} className="mb-6">
                  <div className="flex justify-between items-center py-3 gap-2">
                    <input
                      type="text"
                      value={kpi.name}
                      onChange={e => handleKpiNameChange(kpi.id, e.target.value)}
                      className="flex-1 bg-enterprise-card border border-enterprise-border rounded-md px-3 py-1.5 text-sm text-enterprise-fg focus:outline-none focus:border-enterprise-ring transition-all capitalize"
                    />
                    <span className="bg-enterprise-secondary text-enterprise-sfg px-2.5 py-1 rounded-md text-sm font-semibold">{kpi.value}</span>
                    <button
                      onClick={() => removeKpi(kpi.id)}
                      disabled={kpis.length <= 1}
                      className="text-enterprise-mfg hover:text-red-500 text-sm px-2 py-1 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title="Remove KPI"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={kpi.value}
                    onChange={e => handleKpiChange(kpi.id, e.target.value)}
                    className="slider"
                  />
                </div>
              ))}

              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  placeholder="New KPI name..."
                  value={newKpiName}
                  onChange={e => setNewKpiName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addKpi() }}
                  className="flex-1 bg-enterprise-card border border-enterprise-border rounded-lg px-4 py-2.5 text-sm text-enterprise-fg focus:outline-none focus:border-enterprise-ring focus:ring-1 focus:ring-enterprise-ring transition-all"
                />
                <button
                  onClick={addKpi}
                  disabled={!newKpiName.trim()}
                  className="bg-enterprise-primary text-enterprise-pfg hover:bg-[#1a70ff] border-none rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add
                </button>
              </div>
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
            <div className="bg-enterprise-card border border-enterprise-border rounded-md px-3 py-2 my-2 text-sm text-enterprise-fg"><strong>KPIs:</strong> {kpis.map(k => k.name).join(', ')}</div>
          </div>
        </div>
      </div>

      <div className="text-center mt-10 text-sm text-enterprise-mfg p-4 bg-enterprise-muted rounded-lg max-w-[600px] mx-auto">
        Enterprise Mod 2 Theme - Corporate, Professional, Elegant
      </div>
    </div>
  )
}
