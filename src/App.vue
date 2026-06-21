<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { usePreparationStore } from './stores/preparation'
import { useAuthStore } from './stores/auth'

const store = usePreparationStore()
const authStore = useAuthStore()
const router = useRouter()
const streak = ref(1)
const route = useRoute()

const isFullScreenPage = computed(() => {
  return ['/', '/login', '/register', '/status'].includes(route.path)
})

const rankTitle = computed(() => {
  if (store.xp >= 1000) {
    return 'Captain (Recommended)'
  } else if (store.xp >= 600) {
    return 'Lieutenant'
  } else if (store.xp >= 300) {
    return 'Second Lieutenant'
  } else {
    return 'Cadet'
  }
})

const experience = computed(() => store.xp)

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Mobile navigation menu toggle state
const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Watch for route changes to close the menu
watch(() => route.path, () => {
  closeMobileMenu()
})

// 30-Minute Free Trial Countdown Timer
const trialTimeRemaining = ref(0)
let countdownInterval = null

const isTrialCountdownActive = computed(() => {
  if (!authStore.user || !authStore.profile) return false
  if (authStore.profile.status === 'approved' || authStore.profile.role === 'admin') return false
  if (!authStore.profile.trial_ends_at) return false
  return new Date(authStore.profile.trial_ends_at).getTime() > Date.now()
})

const hasPremiumOrTrial = computed(() => {
  const p = authStore.profile
  if (!p) return false
  const isTrialActive = p.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now()
  return p.status === 'approved' || p.role === 'admin' || isTrialActive
})

const formattedTrialTime = computed(() => {
  const minutes = Math.floor(trialTimeRemaining.value / 60)
  const seconds = trialTimeRemaining.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const updateTrialTimer = () => {
  if (!authStore.profile || !authStore.profile.trial_ends_at) {
    trialTimeRemaining.value = 0
    return
  }
  const trialEndsAt = new Date(authStore.profile.trial_ends_at).getTime()
  const remainingMs = trialEndsAt - Date.now()
  
  if (remainingMs <= 0) {
    trialTimeRemaining.value = 0
    clearInterval(countdownInterval)
    // If on a restricted route, redirect immediately
    if (['/roadmap'].includes(route.path)) {
      router.push('/status')
    }
  } else {
    trialTimeRemaining.value = Math.floor(remainingMs / 1000)
  }
}

const startTrialCountdown = () => {
  clearInterval(countdownInterval)
  updateTrialTimer()
  countdownInterval = setInterval(() => {
    updateTrialTimer()
  }, 1000)
}

const goToStatusUnlock = () => {
  router.push('/status')
}

watch(() => authStore.profile, (newProfile) => {
  if (newProfile && newProfile.status !== 'approved' && newProfile.role !== 'admin') {
    startTrialCountdown()
  } else {
    clearInterval(countdownInterval)
  }
}, { immediate: true })

onBeforeUnmount(() => {
  clearInterval(countdownInterval)
})

onMounted(() => {
  // Initialize Auth session
  authStore.initialize()

  // Load streak from localStorage
  const storedStreak = localStorage.getItem('issb_streak')
  if (storedStreak) {
    streak.value = parseInt(storedStreak)
  } else {
    localStorage.setItem('issb_streak', '1')
  }
})
</script>

<template>
  <!-- Full Screen Guest / Status Page Layout -->
  <div v-if="isFullScreenPage" class="landing-layout">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>

  <!-- Normal Interactive App Layout -->
  <div v-else class="app-container">
    <!-- Free Trial Banner -->
    <div v-if="isTrialCountdownActive" class="trial-countdown-banner">
      <span class="pulse-icon">⏳</span>
      <span class="banner-text">
        <strong>Free Trial Session Active:</strong> You have <span class="time-countdown">{{ formattedTrialTime }}</span> remaining to practice simulators and check study roadmaps.
      </span>
      <button @click="goToStatusUnlock" class="btn-unlock-mini">Unlock Lifetime Access</button>
    </div>

    <!-- Main Top Header -->
    <header class="app-header glass-card">
      <!-- Hamburger Menu Button -->
      <button 
        class="hamburger-btn" 
        @click="toggleMobileMenu" 
        :class="{ 'is-active': isMobileMenuOpen }"
        aria-label="Toggle Navigation Menu"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <RouterLink to="/" class="header-logo">
        <svg class="icon-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L2 22H22L12 2Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path d="M12 6L5 20H19L12 6Z" fill="currentColor" opacity="0.3" />
          <circle cx="12" cy="14" r="2" fill="currentColor" />
        </svg>
        <div class="logo-text">
          <span class="logo-title">ISSB COMMAND</span>
          <span class="sub-text">PREPARATION PORTAL</span>
        </div>
      </RouterLink>

      <div v-if="authStore.user" class="header-status">
        <!-- Streak Widget -->
        <div class="status-widget streak-widget">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"
            />
          </svg>
          <div class="widget-details">
            <span class="label">Daily Streak</span>
            <span class="value">{{ streak }} Days</span>
          </div>
        </div>

        <!-- Cadet Rank Widget -->
        <div class="status-widget rank-widget">
          <div class="widget-details text-right">
            <span class="label">Current Rank</span>
            <span class="value text-glow">{{ rankTitle }}</span>
          </div>
          <div class="rank-progress-container">
            <div
              class="rank-progress-bar"
              :style="{ width: Math.min((experience / 1000) * 100, 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </header>

    <div class="main-layout">
      <!-- Backdrop Overlay for Mobile Drawer -->
      <div 
        v-if="isMobileMenuOpen" 
        class="mobile-backdrop" 
        @click="closeMobileMenu"
      ></div>

      <!-- Side Navigation Panel -->
      <aside class="navigation-panel glass-card" :class="{ 'mobile-open': isMobileMenuOpen }">
        <!-- Mobile Status Panel (Visible only on mobile inside drawer) -->
        <div v-if="authStore.user" class="mobile-status-panel">
          <div class="status-widget streak-widget">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
            </svg>
            <div class="widget-details">
              <span class="label">Daily Streak</span>
              <span class="value">{{ streak }} Days</span>
            </div>
          </div>

          <div class="status-widget rank-widget">
            <div class="widget-details">
              <span class="label">Current Rank</span>
              <span class="value text-glow">{{ rankTitle }}</span>
            </div>
            <div class="rank-progress-container">
              <div
                class="rank-progress-bar"
                :style="{ width: Math.min((experience / 1000) * 100, 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <nav class="nav-menu">
          <RouterLink to="/dashboard" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span>Dashboard</span>
          </RouterLink>

          <RouterLink v-if="hasPremiumOrTrial" to="/roadmap" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 18l6-6-6-6" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>5-Day Roadmap</span>
          </RouterLink>

          <div class="nav-section-title">TEST SIMULATORS</div>

          <RouterLink to="/simulator/wat" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 20h9M3 20v-8c0-2.2 1.8-4 4-4h10c2.2 0 4 1.8 4 4v8M3 12h18M9 8V4m6 4V4" />
            </svg>
            <span>WAT Simulator</span>
          </RouterLink>

          <RouterLink to="/simulator/sct" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
              />
            </svg>
            <span>SCT Simulator</span>
          </RouterLink>

          <RouterLink to="/simulator/srt" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>SRT Trainer</span>
          </RouterLink>

          <RouterLink to="/simulator/opi" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>OPI Simulator</span>
          </RouterLink>

          <RouterLink to="/simulator/obstacles" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M20 9.586V19a2 2 0 01-2 2H6a2 2 0 01-2-2V9.586a2 2 0 01.586-1.414l7-7a2 2 0 012.828 0l7 7A2 2 0 0120 9.586z"
              />
              <path d="M12 12v6M9 15h6" />
            </svg>
            <span>GTO Obstacles</span>
          </RouterLink>

          <div class="nav-section-title">OFFICIAL UTILITIES</div>

          <RouterLink to="/call-letter" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>ISSB Call Letter</span>
          </RouterLink>

          <RouterLink to="/support" class="nav-item" active-class="active">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Complaints & Ideas</span>
          </RouterLink>

          <!-- Admin Section -->
          <template v-if="authStore.profile?.role === 'admin'">
            <div class="nav-section-title">ADMIN CONTROL</div>
            <RouterLink to="/admin/users" class="nav-item" active-class="active">
              <svg
                class="nav-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Candidate Pool</span>
            </RouterLink>
          </template>
        </nav>

        <div class="nav-footer">
          <!-- Profile Badge -->
          <div v-if="authStore.profile" class="user-profile-badge">
            <div class="user-avatar">
              {{ authStore.profile.full_name?.charAt(0).toUpperCase() || 'C' }}
            </div>
            <div class="user-meta">
              <span class="user-name">{{ authStore.profile.full_name }}</span>
              <span class="user-branch text-capitalize">{{ authStore.profile.target_branch }}</span>
            </div>
          </div>
          <!-- Guest Badge -->
          <div v-else class="user-profile-badge guest-badge">
            <div class="user-avatar guest-avatar">
              G
            </div>
            <div class="user-meta">
              <span class="user-name">Guest Candidate</span>
              <span class="user-branch text-capitalize">Anonymous</span>
            </div>
          </div>

          <button v-if="authStore.user" @click="handleLogout" class="btn-logout-sidebar">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
          <RouterLink v-else to="/login" class="btn-logout-sidebar btn-login-sidebar">
            <svg
              class="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <span>Sign In</span>
          </RouterLink>
        </div>
      </aside>

      <!-- Central View Router Screen -->
      <main class="content-screen">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-block-size: 100dvb;
  padding: 1.25rem;
  gap: 1.25rem;
  max-inline-size: 1600px;
  margin-inline: auto;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: var(--bg-panel);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.icon-logo {
  inline-size: 42px;
  block-size: 42px;
  color: var(--accent-cyan);
}

.logo-text .logo-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  display: block;
}

.logo-text .sub-text {
  font-family: var(--font-heading);
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  color: var(--accent-cyan);
  display: block;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.status-widget {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.streak-widget {
  border-inline-end: 1px solid rgba(255, 255, 255, 0.08);
  padding-inline-end: 2rem;
  color: var(--accent-gold);
}

.status-widget .icon {
  inline-size: 24px;
  block-size: 24px;
}

.widget-details {
  display: flex;
  flex-direction: column;
}

.widget-details .label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.widget-details .value {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.text-right {
  align-items: flex-end;
}

.rank-widget {
  min-inline-size: 200px;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
}

.rank-progress-container {
  block-size: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(0, 242, 254, 0.08);
}

.rank-progress-bar {
  block-size: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));
  border-radius: 999px;
  box-shadow: 0 0 8px var(--accent-cyan-glow);
  transition: width 0.5s ease-out;
}

/* Main Layout Grid */
.main-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.25rem;
  flex: 1;
}

.navigation-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem 1rem;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-section-title {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-block-start: 1.5rem;
  margin-block-end: 0.5rem;
  padding-inline-start: 0.75rem;
  letter-spacing: 0.15em;
  font-weight: 600;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  color: var(--text-secondary);
  border-radius: var(--border-radius-md);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all var(--transition-smooth);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.03);
}

.nav-item.active {
  background: rgba(0, 242, 254, 0.06);
  color: var(--accent-cyan);
  border-color: rgba(0, 242, 254, 0.2);
  box-shadow: inset 0 0 12px rgba(0, 242, 254, 0.04);
}

.nav-icon {
  inline-size: 20px;
  block-size: 20px;
}

.nav-footer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
}

.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-cyan-glow);
  color: var(--accent-cyan);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
}

.user-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-meta .user-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta .user-branch {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.btn-logout-sidebar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  color: var(--accent-red);
  border-radius: var(--border-radius-md);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 500;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.btn-logout-sidebar:hover {
  background: var(--accent-red-glow);
  border-color: rgba(185, 28, 28, 0.15);
}

.content-screen {
  overflow-y: auto;
  block-size: calc(100dvb - 120px);
  padding-inline-end: 4px;
}

/* Page Transition animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Hamburger Menu Button */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 38px;
  height: 38px;
  padding: 10px;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  z-index: 1100;
  transition: all var(--transition-smooth);
}

.hamburger-btn:hover {
  background: var(--accent-cyan-glow);
  border-color: var(--accent-cyan);
}

.hamburger-line {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--text-primary);
  border-radius: 999px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hamburger animations when active (opens menu) */
.hamburger-btn.is-active .hamburger-line:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.hamburger-btn.is-active .hamburger-line:nth-child(2) {
  opacity: 0;
  transform: translateX(-10px);
}

.hamburger-btn.is-active .hamburger-line:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* Mobile Backdrop Overlay */
.mobile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 15, 30, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 999;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.mobile-status-panel {
  display: none;
}

/* Responsive Overrides */
@media (max-width: 992px) {
  .hamburger-btn {
    display: flex;
  }

  .main-layout {
    grid-template-columns: 1fr;
  }

  .navigation-panel {
    display: flex !important;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 290px;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.08);
    border-radius: 0 var(--border-radius-lg) var(--border-radius-lg) 0;
    border-right: 1px solid var(--border-color);
    background: var(--bg-secondary);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 6rem 1.25rem 1.5rem 1.25rem;
    overflow-y: auto;
  }

  .navigation-panel.mobile-open {
    transform: translateX(0);
  }

  .content-screen {
    block-size: auto;
  }

  .header-status {
    display: none;
  }

  .mobile-status-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    background: var(--bg-panel-solid);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    margin-bottom: 1.5rem;
  }

  .mobile-status-panel .status-widget {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .mobile-status-panel .streak-widget {
    color: var(--accent-gold);
  }

  .mobile-status-panel .rank-widget {
    flex-direction: column;
    align-items: stretch;
    gap: 0.35rem;
  }

  .mobile-status-panel .widget-details {
    display: flex;
    flex-direction: column;
  }

  .mobile-status-panel .widget-details .label {
    font-size: 0.72rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mobile-status-panel .widget-details .value {
    font-family: var(--font-heading);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .mobile-status-panel .rank-progress-container {
    width: 100%;
    height: 6px;
    background: var(--bg-primary);
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    margin-top: 0.25rem;
  }

  .mobile-status-panel .rank-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));
    border-radius: 999px;
    box-shadow: 0 0 8px var(--accent-cyan-glow);
  }
  
  .mobile-status-panel .icon {
    width: 20px;
    height: 20px;
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .app-header {
    padding: 0.75rem 1.25rem;
    gap: 0.75rem;
  }

  .logo-text .logo-title {
    font-size: 1.15rem;
  }

  .logo-text .sub-text {
    font-size: 0.65rem;
  }

  .icon-logo {
    width: 32px;
    height: 32px;
  }

  .header-status {
    gap: 0.75rem;
  }

  .streak-widget {
    border-inline-end: none;
    padding-inline-end: 0;
  }

  .status-widget .icon {
    width: 20px;
    height: 20px;
  }

  .widget-details .label {
    display: none;
  }

  .widget-details .value {
    font-size: 0.85rem;
  }

  .rank-widget {
    min-width: auto;
    align-items: flex-end;
  }

  .rank-progress-container {
    display: none;
  }
}

@media (max-width: 480px) {
  .app-container {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .app-header {
    padding: 0.65rem 0.75rem;
  }

  .logo-text .logo-title {
    font-size: 1rem;
  }

  .logo-text .sub-text {
    display: none;
  }

  .header-status {
    gap: 0.5rem;
  }

  .widget-details .value {
    font-size: 0.8rem;
  }
}

/* Free Trial Countdown Banner */
.trial-countdown-banner {
  background: linear-gradient(90deg, #b91c1c 0%, #dc2626 100%);
  color: #ffffff;
  padding: 0.75rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  gap: 1.5rem;
  box-shadow: 0 4px 10px rgba(220, 38, 38, 0.15);
  z-index: 1000;
  border-bottom: 2px solid #991b1b;
}

.banner-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-countdown {
  font-family: var(--font-heading);
  font-weight: 800;
  color: var(--accent-cyan);
  background: rgba(0, 0, 0, 0.25);
  padding: 0.15rem 0.5rem;
  border-radius: var(--border-radius-sm);
  letter-spacing: 0.05em;
  font-size: 0.95rem;
  display: inline-block;
  min-width: 55px;
  text-align: center;
}

.btn-unlock-mini {
  background: #ffffff;
  color: #b91c1c;
  border: none;
  border-radius: var(--border-radius-sm);
  padding: 0.35rem 0.85rem;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all var(--transition-smooth);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-family: var(--font-heading);
}

.btn-unlock-mini:hover {
  background: var(--bg-primary);
  transform: translateY(-1px);
}

.pulse-icon {
  animation: timer-pulse 1s infinite alternate;
  display: inline-block;
}

@keyframes timer-pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.15); }
}

@media (max-width: 768px) {
  .trial-countdown-banner {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }
}

.guest-avatar {
  background: #cbd5e1 !important;
  color: var(--text-muted) !important;
}

.btn-login-sidebar {
  color: var(--accent-cyan);
}

.btn-login-sidebar:hover {
  background: var(--accent-cyan-glow);
  border-color: rgba(3, 194, 252, 0.15);
}
</style>
