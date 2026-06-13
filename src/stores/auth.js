import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      console.log('user profile data', data)
      if (error) throw error
      profile.value = data
      return data
    } catch (e) {
      console.error('Error fetching user profile:', e)
      profile.value = null
      return null
    }
  }

  // Flags to temporarily skip session validation during registration or login
  const isRegistering = ref(false)
  const isLoggingIn = ref(false)

  const initialize = async () => {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        user.value = session.user
        const p = await fetchProfile(session.user.id)

        // Session ID validation check
        const localToken = localStorage.getItem('issb_session_token')
        if (p && p.active_session_id && p.active_session_id !== localToken) {
          console.warn('Session mismatch on init. Logging out.')
          await logout()
        }
      } else {
        user.value = null
        profile.value = null
      }
    } catch (e) {
      console.error('Auth initialization error:', e)
    } finally {
      loading.value = false
    }

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip during registration or login — these functions handle their own flow
      if (isRegistering.value || isLoggingIn.value) return

      loading.value = true
      if (session) {
        user.value = session.user
        const p = await fetchProfile(session.user.id)

        // Session ID validation check
        const localToken = localStorage.getItem('issb_session_token')
        if (p && p.active_session_id && p.active_session_id !== localToken) {
          console.warn('Session mismatch on state change. Logging out.')
          await logout()
        }
      } else {
        user.value = null
        profile.value = null
      }
      loading.value = false
    })
  }

  const login = async (email, password) => {
    isLoggingIn.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      user.value = data.user

      // Generate active session token
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('issb_session_token', sessionToken)

      // Update active_session_id in database
      await supabase
        .from('profiles')
        .update({ active_session_id: sessionToken })
        .eq('id', data.user.id)

      await fetchProfile(data.user.id)
      return data
    } finally {
      isLoggingIn.value = false
    }
  }

  const register = async (email, password, metadata) => {
    isRegistering.value = true
    // metadata includes full_name, whatsapp, target_branch, referred_by_code, ip_address
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name,
          whatsapp: metadata.whatsapp,
          target_branch: metadata.target_branch,
          referred_by_code: metadata.referred_by_code,
          ip_address: metadata.ip_address,
        },
      },
    })
    if (error) throw error
    user.value = data.user
    if (data.user) {
      // Wait a moment for the DB trigger to create the profile
      let profileData = null
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        profileData = await fetchProfile(data.user.id)
        if (profileData) break
      }

      // Generate active session token
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('issb_session_token', sessionToken)

      // Update active_session_id in database
      await supabase
        .from('profiles')
        .update({ active_session_id: sessionToken })
        .eq('id', data.user.id)

      // Re-fetch to get the updated session token in the profile
      await fetchProfile(data.user.id)
    }
    isRegistering.value = false
    return data
  }

  const logout = async () => {
    // Clear local session token
    localStorage.removeItem('issb_session_token')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
    profile.value = null
  }

  return {
    user,
    profile,
    loading,
    initialize,
    login,
    register,
    logout,
    fetchProfile,
  }
})
