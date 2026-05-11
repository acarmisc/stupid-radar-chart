module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'enterprise-bg': '#fdfdff',
        'enterprise-fg': '#0d0d12',
        'enterprise-primary': '#0F62FE',
        'enterprise-pfg': '#F3F4F6',
        'enterprise-secondary': '#edebff',
        'enterprise-sfg': '#483d8b',
        'enterprise-accent': '#f0f2ff',
        'enterprise-afg': '#6b46ff',
        'enterprise-card': '#ffffff',
        'enterprise-cfg': '#0d0d12',
        'enterprise-popover': '#ffffff',
        'enterprise-popcfg': '#0d0d12',
        'enterprise-muted': '#f1f1f8',
        'enterprise-mfg': '#62627a',
        'enterprise-border': '#e2e2ee',
        'enterprise-input': '#e2e2ee',
        'enterprise-ring': '#0F62FE',
        'enterprise-destructive': '#ef4444',
        'enterprise-dfg': '#f8fafc',
        'chart-1': '#6b46ff',
        'chart-2': '#4a72ff',
        'chart-3': '#528cff',
      },
    },
  },
  plugins: [],
}
