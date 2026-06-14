import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { inject } from '@vercel/analytics'

import App from './App.vue'
import router from './router'
import './assets/main.css'

// Initialize Vercel Analytics
try {
  inject()
} catch (e) {
  console.warn('Vercel Analytics blocked or failed to inject:', e)
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
