import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Buffer } from 'node:buffer'

const distDir = path.resolve('dist')
const pagesToCheck = [
  'index.html',
  'join-pak-army.html',
  'join-pak-navy.html',
  'join-pak-airforce.html',
  'simulator/wat.html',
  'simulator/sct.html',
  'simulator/srt.html',
  'simulator/opi.html',
  'simulator/obstacles.html',
  'call-letter.html',
  'deputy-interview.html'
]

console.log('=== SENIOR ENGINEER & QA AUTOMATED AUDIT ===\n')

let totalErrors = 0
let totalWarnings = 0

// 1. Audit Dist Pre-rendered HTML Pages
console.log('--- 1. Auditing Pre-rendered HTML Artifacts ---')
for (const pageRel of pagesToCheck) {
  const filePath = path.join(distDir, pageRel)
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [FAIL] Missing file: ${pageRel}`)
    totalErrors++
    continue
  }

  const html = fs.readFileSync(filePath, 'utf-8')
  const fileSizeKb = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(2)

  // A. Check H1
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || []
  if (h1Matches.length === 0) {
    console.error(`❌ [FAIL] ${pageRel}: No <h1> tag found!`)
    totalErrors++
  } else if (h1Matches.length > 1) {
    console.error(`❌ [FAIL] ${pageRel}: Multiple <h1> tags found (${h1Matches.length})!`)
    totalErrors++
  } else {
    const h1Content = h1Matches[0].replace(/<[^>]+>/g, '').trim()
    console.log(`✅ [PASS] ${pageRel} (${fileSizeKb} KB) -> <h1>: "${h1Content}"`)
  }

  // B. Check Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (!titleMatch || !titleMatch[1].trim()) {
    console.error(`❌ [FAIL] ${pageRel}: Missing or empty <title> tag!`)
    totalErrors++
  }

  // C. Check Meta Description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
  if (!descMatch || !descMatch[1].trim()) {
    console.error(`❌ [FAIL] ${pageRel}: Missing meta description!`)
    totalErrors++
  }

  // D. Check Canonical
  const canonMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
  if (!canonMatch || !canonMatch[1].trim()) {
    console.error(`❌ [FAIL] ${pageRel}: Missing canonical link!`)
    totalErrors++
  }

  // E. Check JSON-LD
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  if (jsonLdMatches.length === 0) {
    console.warn(`⚠️ [WARN] ${pageRel}: No JSON-LD schema found!`)
    totalWarnings++
  } else {
    for (const match of jsonLdMatches) {
      const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim()
      try {
        const parsed = JSON.parse(jsonContent)
        if (!parsed['@context']) {
          console.error(`❌ [FAIL] ${pageRel}: JSON-LD missing @context!`)
          totalErrors++
        }
      } catch (e) {
        console.error(`❌ [FAIL] ${pageRel}: Invalid JSON in JSON-LD script (${e.message})`)
        totalErrors++
      }
    }
  }
}

// 2. Audit Sitemap.xml
console.log('\n--- 2. Auditing Sitemap.xml ---')
const sitemapPath = path.join(distDir, 'sitemap.xml')
if (!fs.existsSync(sitemapPath)) {
  console.error(`❌ [FAIL] Missing dist/sitemap.xml`)
  totalErrors++
} else {
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf-8')
  const locMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/g) || []
  console.log(`✅ [PASS] dist/sitemap.xml exists and contains ${locMatches.length} URLs.`)

  const expectedUrls = [
    'https://issb-preparation.vercel.app/',
    'https://issb-preparation.vercel.app/join-pak-army',
    'https://issb-preparation.vercel.app/join-pak-navy',
    'https://issb-preparation.vercel.app/join-pak-airforce',
    'https://issb-preparation.vercel.app/roadmap',
    'https://issb-preparation.vercel.app/essays-speech',
    'https://issb-preparation.vercel.app/simulator/wat'
  ]

  for (const url of expectedUrls) {
    if (!sitemapXml.includes(url)) {
      console.error(`❌ [FAIL] Expected URL missing in sitemap: ${url}`)
      totalErrors++
    }
  }
}

// 3. Audit Open Access in router/index.js
console.log('\n--- 3. Auditing Router Security & Open Access ---')
const routerContent = fs.readFileSync(path.resolve('src/router/index.js'), 'utf-8')

const openAccessRoutes = ['/dashboard', '/roadmap', '/essays-speech', '/simulator/wat']
for (const routePath of openAccessRoutes) {
  // Find route block
  const routeIdx = routerContent.indexOf(`path: '${routePath}'`)
  if (routeIdx !== -1) {
    const routeBlock = routerContent.substring(routeIdx, routeIdx + 300)
    if (routeBlock.includes('requiresAuth: true')) {
      console.error(`❌ [FAIL] ${routePath} still has requiresAuth: true!`)
      totalErrors++
    } else {
      console.log(`✅ [PASS] ${routePath} is open access (no requiresAuth).`)
    }
  }
}

// Check admin-users still requires admin & auth
const adminIdx = routerContent.indexOf("path: '/admin/users'")
if (adminIdx !== -1) {
  const adminBlock = routerContent.substring(adminIdx, adminIdx + 200)
  if (adminBlock.includes('requiresAdmin: true') && adminBlock.includes('requiresAuth: true')) {
    console.log(`✅ [PASS] /admin/users remains strictly protected (requiresAuth & requiresAdmin).`)
  } else {
    console.error(`❌ [FAIL] /admin/users protection compromised!`)
    totalErrors++
  }
}

console.log(`\n=== QA AUDIT COMPLETE: ${totalErrors} Errors, ${totalWarnings} Warnings ===`)
if (totalErrors > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
