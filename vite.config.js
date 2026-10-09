import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

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
    includedRoutes: (paths) => paths.filter(p => 
      ['/', '/simulator/wat', '/simulator/sct', '/simulator/srt', 
       '/simulator/opi', '/simulator/obstacles', 
       '/call-letter', '/deputy-interview',
       '/join-pak-army', '/join-pak-navy', '/join-pak-airforce'].includes(p)
    ),
  },
})
