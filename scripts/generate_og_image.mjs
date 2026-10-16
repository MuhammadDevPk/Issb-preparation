import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'

const htmlPath = path.resolve('scratch/render_og_image.html')
const publicOut = path.resolve('public/og-image.png')
const distOut = path.resolve('dist/og-image.png')

const chromeBin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

if (!fs.existsSync(chromeBin)) {
  console.error(`Chrome binary not found at ${chromeBin}`)
  process.exit(1)
}

console.log('[generate_og_image.mjs] Rendering high-definition 1200x630 OG image...')

const cmd = `"${chromeBin}" --headless=new --disable-gpu --screenshot="${publicOut}" --window-size=1200,630 --hide-scrollbars --virtual-time-budget=3000 "file://${htmlPath}"`
execSync(cmd, { stdio: 'inherit' })

if (fs.existsSync(path.resolve('dist'))) {
  fs.copyFileSync(publicOut, distOut)
  console.log('[generate_og_image.mjs] Synchronized dist/og-image.png')
}

console.log('[generate_og_image.mjs] Successfully generated public/og-image.png (1200x630)!')
