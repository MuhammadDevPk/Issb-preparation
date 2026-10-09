import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
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
const CallLetterView = () => import('../views/CallLetterView.vue')
const DeputyInterviewView = () => import('../views/DeputyInterviewView.vue')
const EssaysSpeechView = () => import('../views/EssaysSpeechView.vue')
const JoinArmyView = () => import('../views/JoinArmyView.vue')
const JoinNavyView = () => import('../views/JoinNavyView.vue')
const JoinAirforceView = () => import('../views/JoinAirforceView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'ISSB Command - Interactive Timed Simulators & 5-Day Roadmap',
      description:
        'Master the ISSB Selection Board tests. Practice real-time timed psychologist simulators (WAT, SCT, SRT), explore the 5-day curriculum, and plan GTO obstacle routes.',
    },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      guestOnly: true,
      title: 'Candidate Sign In | ISSB Command',
      description: 'Sign in to your ISSB Command cadet portal to continue your timed psychological preparation.',
    },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      guestOnly: true,
      title: 'Candidate Registration - Start Free Trial | ISSB Command',
      description: 'Register for ISSB Command to get full access to timed simulators, AI psychologist evaluation, and comprehensive 5-day roadmap.',
    },
  },
  {
    path: '/r/:code',
    name: 'referral',
    beforeEnter: async (to, from, next) => {
      const code = to.params.code
      if (code && typeof window !== 'undefined') {
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
    meta: {
      requiresAuth: true,
      title: 'Account Verification Status | ISSB Command',
    },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      title: 'Cadet Dashboard & OLQ Profiler | ISSB Command',
      description:
        'Personalized candidate preparation dashboard, 14 Officer-Like Qualities assessment, and practice progress tracker.',
    },
  },
  {
    path: '/roadmap',
    name: 'roadmap',
    component: RoadmapView,
    meta: {
      title: '5-Day Complete ISSB Curriculum Roadmap | ISSB Command',
      description:
        'Comprehensive day-by-day ISSB test curriculum covering screening, psychological tests, GTO tasks, and interview schedule.',
    },
  },
  {
    path: '/simulator/wat',
    name: 'wat-simulator',
    component: WatSimulator,
    meta: {
      title: 'WAT Simulator - Word Association Test Practice | ISSB Command',
      description:
        'Practice real-time 10-second Word Association Test (WAT) with projector-style flash words, Urdu meanings, and instant AI evaluation for ISSB Pakistan.',
    },
  },
  {
    path: '/simulator/sct',
    name: 'sct-simulator',
    component: SctSimulator,
    meta: {
      title: 'SCT Simulator - Sentence Completion Test Practice | ISSB Command',
      description:
        'Timed Sentence Completion Test (SCT) simulator for ISSB candidates with English and Roman Urdu practice sets, official sheets, and AI analysis.',
    },
  },
  {
    path: '/simulator/srt',
    name: 'srt-simulator',
    component: SrtSimulator,
    meta: {
      title: 'SRT Trainer - Situation Reaction Test Crisis Scenarios | ISSB Command',
      description:
        'Prepare for Situation Reaction Tests (SRT) under real 30-second timers. Master military crisis scenarios with tactical response models.',
    },
  },
  {
    path: '/simulator/opi',
    name: 'opi-simulator',
    component: OpiSimulator,
    meta: {
      title: 'OPI Simulator - Officer Personality Inventory Test | ISSB Command',
      description:
        'Practice 150-question Officer Personality Inventory (OPI) test with detailed psychological explanations and OLQ suitability profiling.',
    },
  },
  {
    path: '/simulator/obstacles',
    name: 'obstacles-simulator',
    component: ObstaclesSimulator,
    meta: {
      title: 'GTO Obstacles Planner - Individual Obstacles Strategy | ISSB Command',
      description:
        'Interactive 3D GTO obstacle route planner. Sequence Tarzan Swing, Monkey Bridge, Rope Climb, and calculate target scores to exceed 30 points.',
    },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: AdminUsersView,
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Candidate Pool Management | Admin Control',
    },
  },
  {
    path: '/support',
    name: 'support',
    component: SupportView,
    meta: {
      requiresAuth: true,
      title: 'Feedback, Ideas & Complaints Board | ISSB Command',
    },
  },
  {
    path: '/call-letter',
    name: 'call-letter',
    component: CallLetterView,
    meta: {
      title: 'ISSB Call Letter Tracker & Selection Center Status | ISSB Command',
      description:
        'Track your ISSB Call Letter status, center reporting dates (Kohat, Gujranwala, Malir, Quetta), and essential joining instructions checklist.',
    },
  },
  {
    path: '/deputy-interview',
    name: 'deputy-interview',
    component: DeputyInterviewView,
    meta: {
      title: 'Deputy President Interview Preparation & Common Questions | ISSB Command',
      description:
        'Master the ISSB Deputy President (DP) interview with proven answers to rapid-fire questions, personality probes, and military current affairs.',
    },
  },
  {
    path: '/essays-speech',
    name: 'essays-speech',
    component: EssaysSpeechView,
    meta: {
      title: 'ISSB Essays & Public Speaking Topics | ISSB Command',
      description:
        'High-scoring English and Urdu essay samples, group discussion ideas, and 2-minute lecturette speech outlines for ISSB candidates.',
    },
  },
  {
    path: '/join-pak-army',
    name: 'join-pak-army',
    component: JoinArmyView,
    meta: {
      title: 'Join Pak Army Online Apply 2026 | Initial Test & ISSB Guide',
      description:
        'Complete guide to joining the Pakistan Army. Get online apply details, initial test syllabus, and practice with our free ISSB WAT and SRT simulators.',
    },
  },
  {
    path: '/join-pak-navy',
    name: 'join-pak-navy',
    component: JoinNavyView,
    meta: {
      title: 'Join Pak Navy Online Apply 2026 | Registration & ISSB Prep',
      description:
        'Step-by-step guide to Pak Navy online registration. Prepare for your ISSB with our interactive 5-day roadmap and psychological test simulators.',
    },
  },
  {
    path: '/join-pak-airforce',
    name: 'join-pak-airforce',
    component: JoinAirforceView,
    meta: {
      title: 'Join PAF Online Apply 2026 | Pakistan Air Force ISSB Guide',
      description:
        'How to join the Pakistan Air Force. Find online apply dates, initial test guidelines, and complete ISSB simulator practice.',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: '404 - Page Not Found | ISSB Command',
      description: 'The requested mission coordinates could not be located. Return to ISSB Command headquarters.',
    },
  },
]

export const isTrialActive = (profile) => {
  if (!profile || !profile.trial_ends_at) return false
  return new Date(profile.trial_ends_at).getTime() > Date.now()
}

export const setupRouterGuards = (routerInstance) => {
  routerInstance.beforeEach(async (to, from, next) => {
    // Skip all auth checks during SSR prerendering
    if (import.meta.env.SSR) {
      return next()
    }

    // Capture referral code if present in the URL query parameters
    if (typeof window !== 'undefined' && to.query.ref) {
      try {
        sessionStorage.setItem('issb_referral_code', to.query.ref)
      } catch {
        // ignore
      }
    }

    const authStore = useAuthStore()

    // 1. Only await authStore.initialize() for routes requiring authentication or guest-only redirects
    if (to.meta.requiresAuth || to.meta.requiresApproval || to.meta.requiresAdmin || to.meta.guestOnly) {
      if (authStore.loading && !authStore.user) {
        await authStore.initialize()
      }
    } else {
      // Background silent initialization for open-access routes without blocking guest navigation
      if (authStore.loading && !authStore.user && typeof window !== 'undefined') {
        authStore.initialize().catch(() => {})
      }
    }

    const isAuthenticated = !!authStore.user

    // Fetch profile if authenticated but profile isn't loaded (handles refresh/deep-link race)
    if (isAuthenticated && !authStore.profile && (to.meta.requiresAuth || to.meta.requiresApproval || to.meta.requiresAdmin)) {
      let profileLoaded = false
      for (let attempt = 0; attempt < 3; attempt++) {
        const p = await authStore.fetchProfile(authStore.user.id)
        if (p) {
          profileLoaded = true
          break
        }
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
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
}

const router = createRouter({
  history: import.meta.env.SSR
    ? createMemoryHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

setupRouterGuards(router)

export default router
