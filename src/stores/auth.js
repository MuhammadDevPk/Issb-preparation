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
      if (error) {
        // If profile is missing (PGRST116 or 406 Not Acceptable), try to self-heal by calling create_profile_if_missing RPC
        if (error.code === 'PGRST116' || error.message?.includes('PGRST116') || error.status === 406) {
          console.warn('Profile missing for user. Attempting to self-heal via RPC...')
          const { data: healedData, error: healError } = await supabase.rpc('create_profile_if_missing')
          if (healError) {
            console.error('Failed to self-heal profile:', healError)
            throw error // Throw original error if self-heal fails
          }
          if (healedData) {
            console.log('Profile healed successfully:', healedData)
            profile.value = healedData
            return healedData
          }
        }
        throw error
      }
      if (data && data.deleted_at) {
        profile.value = null
        return null
      }
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
  let authSubscription = null

  const initialize = async () => {
    // Avoid double initialization if user/profile is already populated
    if (user.value || profile.value) {
      loading.value = false
      return
    }

    loading.value = true
    return new Promise((resolve) => {
      let isInitialCallResolved = false

      const resolveInit = () => {
        if (!isInitialCallResolved) {
          isInitialCallResolved = true
          loading.value = false
          resolve()
        }
      }

      // Safety fallback timeout to prevent blocking routing guards
      const timeoutId = setTimeout(resolveInit, 2500)

      if (authSubscription) {
        authSubscription.unsubscribe()
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (isRegistering.value || isLoggingIn.value) return

        if (session) {
          user.value = session.user
          const p = await fetchProfile(session.user.id)
          if (!p && event !== 'SIGNED_OUT') {
            console.warn('Profile not found or soft-deleted on auth change. Logging out.')
            await logout()
          } else if (p) {
            // Session ID validation check
            const localToken = localStorage.getItem('issb_session_token')
            if (p.active_session_id && p.active_session_id !== localToken) {
              console.warn('Session mismatch on auth change. Logging out.')
              await logout()
            }
          }
        } else {
          user.value = null
          profile.value = null
        }

        clearTimeout(timeoutId)
        resolveInit()
      })

      authSubscription = subscription
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

      // Fetch profile first to ensure it exists (and self-heals if missing)
      const p = await fetchProfile(data.user.id)
      if (!p) {
        await logout()
        throw new Error('This account has been deleted or disabled.')
      }

      // Generate active session token
      const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem('issb_session_token', sessionToken)

      // Update active_session_id in database now that profile is guaranteed to exist
      await supabase
        .from('profiles')
        .update({ active_session_id: sessionToken })
        .eq('id', data.user.id)

      // Sync the local active session token in state to prevent session mismatch logouts on navigation
      p.active_session_id = sessionToken
      profile.value = p

      return data
    } finally {
      isLoggingIn.value = false
    }
  }

  const register = async (email, password, metadata) => {
    isRegistering.value = true
    // metadata includes full_name, whatsapp, target_branch, referral_code/referred_by_code, ip_address
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name,
          whatsapp: metadata.whatsapp,
          target_branch: metadata.target_branch,
          referral_code: metadata.referral_code || metadata.referred_by_code,
          ip_address: metadata.ip_address,
        },
      },
    })
    if (error) throw error
    user.value = data.user
    if (data.user) {
      // Wait a moment for the DB trigger to create the profile
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 600))
        const p = await fetchProfile(data.user.id)
        if (p) break
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
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.warn('Supabase signOut returned error:', error)
      }
    } catch (e) {
      console.error('Failed to sign out from Supabase:', e)
    }
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
