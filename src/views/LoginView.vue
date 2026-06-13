<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const fetchIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    return data.ip || 'unknown'
  } catch (e) {
    console.error('Failed to get IP address:', e)
    return 'unknown'
  }
}

onMounted(() => {
  if (route.query.session_expired === 'true') {
    errorMessage.value = 'You have been logged out because this account was logged in on another device.'
  }
})

const handleLogin = async () => {
  if (!email.value || !password.value) return
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await authStore.login(email.value, password.value)

    const profile = authStore.profile

    // Update IP address in profile on each login for tracking
    const ip = await fetchIP()
    if (ip && ip !== 'unknown' && profile) {
      await supabase.from('profiles').update({ ip_address: ip }).eq('id', profile.id)
    }

    // Redirect logic: check approval or free trial eligibility
    if (profile?.status === 'approved') {
      router.push('/dashboard')
    } else if (profile?.trial_ends_at && new Date(profile.trial_ends_at).getTime() > Date.now()) {
      router.push('/dashboard')
    } else {
      router.push('/status')
    }
  } catch (error) {
    console.error('Login error:', error)
    if (error.message === 'Invalid login credentials') {
      errorMessage.value = 'Incorrect email or password. Please try again.'
    } else {
      errorMessage.value = error.message || 'An error occurred during login.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="auth-page flex-center">
    <div class="auth-container glass-card">
      <!-- Logo Header -->
      <div class="auth-header" @click="goHome">
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
        <h2>ISSB COMMAND</h2>
        <span class="sub-text">PREPARATION PORTAL</span>
      </div>

      <div class="auth-title">
        <h3>Welcome Back, Candidate</h3>
        <p>Log in to access your dashboard and prep simulators.</p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-alert">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="alert-icon"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email" class="form-label">Email Address</label>
          <input
            v-model="email"
            type="email"
            id="email"
            class="form-input"
            placeholder="e.g. candidate@example.com"
            required
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            class="form-input"
            placeholder="••••••••"
            required
            :disabled="isSubmitting"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-submit" :disabled="isSubmitting">
          <span v-if="isSubmitting" class="spinner"></span>
          <span v-else>Verify Identity & Enter</span>
        </button>
      </form>

      <!-- Navigation links -->
      <div class="auth-footer">
        <p>
          New Candidate?
          <button @click="goToRegister" class="link-btn">Register & Upload Receipt</button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding: 2rem;
  background: radial-gradient(
    circle at 10% 20%,
    rgba(2, 132, 199, 0.05) 0%,
    rgba(241, 245, 249, 1) 90%
  );
}

.auth-container {
  max-width: 450px;
  width: 100%;
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  border-top: 4px solid var(--accent-cyan);
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
  cursor: pointer;
}

.icon-logo {
  width: 48px;
  height: 48px;
  color: var(--accent-cyan);
  margin-bottom: 0.5rem;
}

.auth-header h2 {
  font-size: 1.4rem;
  letter-spacing: 0.05em;
  margin: 0;
}

.auth-header .sub-text {
  font-family: var(--font-heading);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--accent-cyan);
}

.auth-title {
  text-align: center;
}

.auth-title h3 {
  font-size: 1.25rem;
  margin-bottom: 0.35rem;
}

.auth-title p {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.btn-submit {
  width: 100%;
  padding: 0.85rem;
  font-size: 1rem;
}

.error-alert {
  background: var(--accent-red-glow);
  color: var(--accent-red);
  border: 1px solid rgba(185, 28, 28, 0.25);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.auth-footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.link-btn {
  background: transparent;
  border: none;
  color: var(--accent-cyan);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  margin-left: 0.25rem;
}

.link-btn:hover {
  color: #0270a5;
}

/* Spinner animation */
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
