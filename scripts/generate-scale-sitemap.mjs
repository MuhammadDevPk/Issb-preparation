import fs from 'node:fs'
import path from 'node:path'

const BASE_URL = 'https://issb-preparation.vercel.app'
const SITEMAP_MAX_URLS = 5000
const today = new Date().toISOString().split('T')[0]

// 1. Static Core Platform Routes
const coreRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/join-pak-army', priority: '0.9', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/join-pak-navy', priority: '0.9', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/join-pak-airforce', priority: '0.9', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/simulator/wat', priority: '0.9', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/simulator/sct', priority: '0.9', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/simulator/srt', priority: '0.9', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/simulator/opi', priority: '0.9', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/simulator/obstacles', priority: '0.8', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/roadmap', priority: '0.8', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/essays-speech', priority: '0.8', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/call-letter', priority: '0.8', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/deputy-interview', priority: '0.8', changefreq: 'weekly', category: 'core', lastmod: today },
  { path: '/login', priority: '0.6', changefreq: 'monthly', category: 'core', lastmod: today },
  { path: '/register', priority: '0.7', changefreq: 'monthly', category: 'core', lastmod: today },
]

// 2. Discover Programmatic Routes from Flat-File Filesystem
function getProgrammaticRoutes() {
  const programmaticDir = path.resolve('src/data/programmatic')
  if (!fs.existsSync(programmaticDir)) {
    return []
  }

  const routes = []

  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        traverse(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const stats = fs.statSync(fullPath)
          const fileDate = stats.mtime.toISOString().split('T')[0]
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
          const niche = content.niche || path.basename(path.dirname(fullPath))
          const slug = content.slug || path.basename(entry.name, '.json')

          if (niche && slug) {
            routes.push({
              path: `/explore/${niche}/${slug}`,
              priority: '0.85',
              changefreq: 'weekly',
              category: niche,
              lastmod: fileDate || today,
              country: content.country || 'GLOBAL',
              hreflang: content.hreflang || null,
              translationGroupId: content.translationGroupId || null,
            })
          }
        } catch (err) {
          console.warn(`[generate-scale-sitemap.mjs] Warning: Failed parsing ${fullPath}:`, err.message)
        }
      }
    }
  }

  traverse(programmaticDir)
  return routes
}

// 3. Build Translation Groups for Hreflang Alternates
function buildTranslationGroups(routes) {
  const groups = {}
  for (const r of routes) {
    if (r.translationGroupId && r.hreflang) {
      if (!groups[r.translationGroupId]) {
        groups[r.translationGroupId] = []
      }
      groups[r.translationGroupId].push(r)
    }
  }
  return groups
}

// 4. XML Builders
function buildUrlsetXml(routes, translationGroups = {}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes
  .map((r) => {
    let xhtmlLinks = ''
    if (r.translationGroupId && translationGroups[r.translationGroupId]) {
      const group = translationGroups[r.translationGroupId]
      // Identify English (en-*) route for x-default fallback
      const englishRoute = group.find((m) => m.hreflang && m.hreflang.toLowerCase().startsWith('en'))
      const xDefaultHref = englishRoute ? `${BASE_URL}${englishRoute.path}` : `${BASE_URL}${group[0].path}`

      // Append alternate link for every localized URL in group (including self-reference)
      const links = group.map(
        (m) => `    <xhtml:link rel="alternate" hreflang="${m.hreflang}" href="${BASE_URL}${m.path}" />`
      )
      // Inject x-default global fallback link
      links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultHref}" />`)
      xhtmlLinks = '\n' + links.join('\n')
    }

    return `  <url>
    <loc>${BASE_URL}${r.path}</loc>${xhtmlLinks}
    <lastmod>${r.lastmod || today}</lastmod>
    <changefreq>${r.changefreq || 'weekly'}</changefreq>
    <priority>${r.priority || '0.8'}</priority>
  </url>`
  })
  .join('\n')}
</urlset>
`
}

function buildSitemapIndexXml(childSitemaps) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${childSitemaps
  .map(
    (s) => `  <sitemap>
    <loc>${BASE_URL}/${s.filename}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>
`
}

// 5. File Output Helper & Stale Child Cleanup
function writeOutputFiles(filename, content) {
  const publicDir = path.resolve('public')
  const distDir = path.resolve('dist')

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  fs.writeFileSync(path.join(publicDir, filename), content, 'utf-8')

  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, filename), content, 'utf-8')
  }
}

function cleanupStaleChildSitemaps() {
  for (const dir of [path.resolve('public'), path.resolve('dist')]) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
      for (const file of files) {
        if (file.startsWith('sitemap-') && file.endsWith('.xml')) {
          fs.unlinkSync(path.join(dir, file))
        }
      }
    }
  }
}

// 6. Execution Pipeline
const programmaticRoutes = getProgrammaticRoutes()
const allRoutes = [...coreRoutes, ...programmaticRoutes]
const translationGroups = buildTranslationGroups(programmaticRoutes)
const totalUrls = allRoutes.length

console.log(
  `[generate-scale-sitemap.mjs] Discovered ${coreRoutes.length} core routes and ${programmaticRoutes.length} programmatic routes (${Object.keys(translationGroups).length} translation groups).`
)

if (totalUrls <= SITEMAP_MAX_URLS) {
  // Purge any old child sitemaps in single-sitemap mode
  cleanupStaleChildSitemaps()

  // Single Unified Master Sitemap with W3C xhtml:link hreflang annotations
  const singleXml = buildUrlsetXml(allRoutes, translationGroups)
  writeOutputFiles('sitemap.xml', singleXml)
  console.log(`[generate-scale-sitemap.mjs] Successfully generated unified sitemap.xml with ${totalUrls} URLs and hreflang annotations.`)
} else {
  // Scalable Multi-Sitemap Architecture with Root Sitemap Index (> 5,000 URLs)
  console.log(`[generate-scale-sitemap.mjs] Total URLs (${totalUrls}) exceeds threshold (${SITEMAP_MAX_URLS}). Partitioning into category child sitemaps...`)

  const categories = {}
  for (const r of allRoutes) {
    const cat = r.category || 'general'
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(r)
  }

  const childSitemaps = []

  for (const [catName, catRoutes] of Object.entries(categories)) {
    // Chunk within category if a single niche exceeds 5,000
    for (let i = 0; i < catRoutes.length; i += SITEMAP_MAX_URLS) {
      const chunk = catRoutes.slice(i, i + SITEMAP_MAX_URLS)
      const partSuffix = catRoutes.length > SITEMAP_MAX_URLS ? `-${Math.floor(i / SITEMAP_MAX_URLS) + 1}` : ''
      const filename = `sitemap-${catName}${partSuffix}.xml`

      const chunkXml = buildUrlsetXml(chunk, translationGroups)
      writeOutputFiles(filename, chunkXml)
      childSitemaps.push({ filename, count: chunk.length })
      console.log(`[generate-scale-sitemap.mjs] Generated child sitemap ${filename} with ${chunk.length} URLs.`)
    }
  }

  // Generate Master Sitemap Index pointing to all child sitemaps
  const indexXml = buildSitemapIndexXml(childSitemaps)
  writeOutputFiles('sitemap.xml', indexXml)
  console.log(`[generate-scale-sitemap.mjs] Successfully generated root <sitemapindex> at sitemap.xml with ${childSitemaps.length} child sitemaps.`)
}
