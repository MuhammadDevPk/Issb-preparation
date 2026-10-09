import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { routes, setupRouterGuards } from './router'
import './assets/main.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition
      return { top: 0 }
    },
  },
  ({ app, router, isClient }) => {
    app.use(createPinia())

    if (router) {
      setupRouterGuards(router)
    }

    if (isClient) {
      import('@vercel/analytics')
        .then(({ inject }) => {
          try {
            inject()
          } catch (e) {
            console.warn('Vercel Analytics blocked or failed to inject:', e)
          }
        })
        .catch(() => {})
    }
  }
)
