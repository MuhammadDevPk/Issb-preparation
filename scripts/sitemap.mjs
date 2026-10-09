import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'https://issb-preparation.vercel.app'

// Public routes that search engines should index
const publicRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/simulator/wat', priority: '0.9', changefreq: 'weekly' },
  { path: '/simulator/sct', priority: '0.9', changefreq: 'weekly' },
  { path: '/simulator/srt', priority: '0.9', changefreq: 'weekly' },
  { path: '/simulator/opi', priority: '0.9', changefreq: 'weekly' },
  { path: '/simulator/obstacles', priority: '0.8', changefreq: 'weekly' },
  { path: '/call-letter', priority: '0.8', changefreq: 'weekly' },
  { path: '/deputy-interview', priority: '0.8', changefreq: 'weekly' },
  { path: '/login', priority: '0.6', changefreq: 'monthly' },
  { path: '/register', priority: '0.7', changefreq: 'monthly' },
]

const today = new Date().toISOString().split('T')[0]

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
  .map(
    (r) => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

const publicDir = path.resolve('public')
const distDir = path.resolve('dist')

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8')
console.log(`[sitemap.mjs] Generated public/sitemap.xml with ${publicRoutes.length} URLs (lastmod: ${today})`)

if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8')
  console.log(`[sitemap.mjs] Synchronized dist/sitemap.xml`)
}
