import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function getProgrammaticRoutes() {
  const programmaticDir = fileURLToPath(new URL('./src/data/programmatic', import.meta.url))
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
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
          const niche = content.niche || path.basename(path.dirname(fullPath))
          const slug = content.slug || path.basename(entry.name, '.json')
          if (niche && slug) {
            routes.push(`/explore/${niche}/${slug}`)
          }
        } catch (e) {
          console.warn(`[vite.config.js] Failed to parse JSON file for SSG route: ${fullPath}`, e.message)
        }
      }
    }
  }

  traverse(programmaticDir)
  return routes
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  ssgOptions: {
    includedRoutes: () => {
      const staticRoutes = [
        '/',
        '/simulator/wat',
        '/simulator/sct',
        '/simulator/srt',
        '/simulator/opi',
        '/simulator/obstacles',
        '/call-letter',
        '/deputy-interview',
        '/join-pak-army',
        '/join-pak-navy',
        '/join-pak-airforce',
      ]
      const programmaticRoutes = getProgrammaticRoutes()
      return [...new Set([...staticRoutes, ...programmaticRoutes])]
    },
  },
})

