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

      if (error) throw error
      profile.value = data
      return data
    } catch (e) {
      console.error('Error fetching user profile:', e)
      profile.value = null
      return null
    }
  }

  const initialize = async () => {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        user.value = session.user
        await fetchProfile(session.user.id)
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
      loading.value = true
      if (session) {
        user.value = session.user
        await fetchProfile(session.user.id)
      } else {
        user.value = null
        profile.value = null
      }
      loading.value = false
    })
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    user.value = data.user
    await fetchProfile(data.user.id)
    return data
  }

  const register = async (email, password, metadata) => {
    // metadata includes full_name, whatsapp, target_branch, referred_by_code
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name,
          whatsapp: metadata.whatsapp,
          target_branch: metadata.target_branch,
          referred_by_code: metadata.referred_by_code,
        },
      },
    })
    if (error) throw error
    user.value = data.user
    if (data.user) {
      await fetchProfile(data.user.id)
    }
    return data
  }

  const logout = async () => {
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
