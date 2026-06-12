import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DashboardView from '../views/DashboardView.vue'
import RoadmapView from '../views/RoadmapView.vue'
import WatSimulator from '../views/WatSimulator.vue'
import SctSimulator from '../views/SctSimulator.vue'
import SrtSimulator from '../views/SrtSimulator.vue'
import ObstaclesSimulator from '../views/ObstaclesSimulator.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import StatusView from '../views/StatusView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import SupportView from '../views/SupportView.vue'
import { useAuthStore } from '../stores/auth'

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
      path: '/status',
      name: 'status',
      component: StatusView,
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, requiresApproval: true },
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
      meta: { requiresAuth: true, requiresApproval: true },
    },
    {
      path: '/simulator/sct',
      name: 'sct-simulator',
      component: SctSimulator,
      meta: { requiresAuth: true, requiresApproval: true },
    },
    {
      path: '/simulator/srt',
      name: 'srt-simulator',
      component: SrtSimulator,
      meta: { requiresAuth: true, requiresApproval: true },
    },
    {
      path: '/simulator/obstacles',
      name: 'obstacles-simulator',
      component: ObstaclesSimulator,
      meta: { requiresAuth: true, requiresApproval: true },
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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth initialization if it hasn't run yet
  if (authStore.loading && !authStore.user) {
    await authStore.initialize()
  }

  const isAuthenticated = !!authStore.user
  const profile = authStore.profile
  const isApproved = profile?.status === 'approved'
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
