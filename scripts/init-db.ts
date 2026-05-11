import { Pool } from 'pg'

async function initDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  })

  await pool.query(`
    CREATE TABLE IF NOT EXISTS charts (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(12) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      deliverable_type VARCHAR(50) NOT NULL,
      show_author BOOLEAN NOT NULL DEFAULT true,
      locked_values JSONB NOT NULL,
      extra_kpi JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  // Index for fast slug lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_charts_slug ON charts(slug)
  `)

  console.log('Database initialized successfully.')
  await pool.end()
}

initDb().catch(e => {
  console.error('Database initialization failed:', e)
  process.exit(1)
})
