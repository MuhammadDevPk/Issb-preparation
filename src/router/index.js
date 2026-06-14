import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const DashboardView = () => import('../views/DashboardView.vue')
const RoadmapView = () => import('../views/RoadmapView.vue')
const WatSimulator = () => import('../views/WatSimulator.vue')
const SctSimulator = () => import('../views/SctSimulator.vue')
const SrtSimulator = () => import('../views/SrtSimulator.vue')
const OpiSimulator = () => import('../views/OpiSimulator.vue')
const ObstaclesSimulator = () => import('../views/ObstaclesSimulator.vue')
const LoginView = () => import('../views/LoginView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const StatusView = () => import('../views/StatusView.vue')
const AdminUsersView = () => import('../views/AdminUsersView.vue')
const SupportView = () => import('../views/SupportView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/r/:code',
      name: 'referral',
      beforeEnter: async (to, from, next) => {
        const code = to.params.code
        if (code) {
          try {
            const { supabase } = await import('../supabase')
            await supabase.rpc('increment_referral_clicks', { ref_code: code })
            localStorage.setItem('issb_referred_by_code', code)
          } catch (e) {
            console.error('Failed to increment referral clicks:', e)
          }
        }
        next({ name: 'register' })
      },
    },
    {
      path: '/status',
      name: 'status',
      component: StatusView,
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/roadmap',
      name: 'roadmap',
      component: RoadmapView,
      meta: { requiresAuth: true, requiresApproval: true },
    },
    {
      path: '/simulator/wat',
      name: 'wat-simulator',
      component: WatSimulator,
    },
    {
      path: '/simulator/sct',
      name: 'sct-simulator',
      component: SctSimulator,
    },
    {
      path: '/simulator/srt',
      name: 'srt-simulator',
      component: SrtSimulator,
    },
    {
      path: '/simulator/opi',
      name: 'opi-simulator',
      component: OpiSimulator,
    },
    {
      path: '/simulator/obstacles',
      name: 'obstacles-simulator',
      component: ObstaclesSimulator,
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/support',
      name: 'support',
      component: SupportView,
      meta: { requiresAuth: true },
    },
  ],
})

const isTrialActive = (profile) => {
  if (!profile || !profile.trial_ends_at) return false
  return new Date(profile.trial_ends_at).getTime() > Date.now()
}

router.beforeEach(async (to, from, next) => {
  // Capture referral code if present in the URL query parameters
  if (to.query.ref) {
    sessionStorage.setItem('issb_referral_code', to.query.ref)
  }

  const authStore = useAuthStore()

  // Wait for auth initialization if it hasn't run yet
  if (authStore.loading && !authStore.user) {
    await authStore.initialize()
  }

  const isAuthenticated = !!authStore.user

  // Fetch profile if authenticated but profile isn't loaded (handles refresh/deep-link race)
  if (isAuthenticated && !authStore.profile) {
    let profileLoaded = false
    for (let attempt = 0; attempt < 3; attempt++) {
      const p = await authStore.fetchProfile(authStore.user.id)
      if (p) {
        profileLoaded = true
        break
      }
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
    if (!profileLoaded) {
      console.warn('Profile could not be loaded after retries. Redirecting to login.')
      await authStore.logout()
      return next({ name: 'login' })
    }
  }

  const profile = authStore.profile
  const isApproved = profile?.status === 'approved' || profile?.role === 'admin' || isTrialActive(profile)
  const isAdmin = profile?.role === 'admin'

  // 1. Guard for Authenticated Only routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login' })
  }

  // 2. Guard for Guest Only routes (Login, Register)
  if (to.meta.guestOnly && isAuthenticated) {
    if (isApproved) {
      return next({ name: 'dashboard' })
    } else {
      return next({ name: 'status' })
    }
  }

  // 3. Guard for Approved Users
  if (to.meta.requiresApproval && isAuthenticated && !isApproved) {
    return next({ name: 'status' })
  }

  // 4. Guard for Admin Only routes
  if (to.meta.requiresAdmin && isAuthenticated && !isAdmin) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
