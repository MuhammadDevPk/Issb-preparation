import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePreparationStore = defineStore('preparation', () => {
  // Checklist tracking of roadmap modules
  const completedModules = ref([])

  // User experience points
  const xp = ref(120)

  // Simulation run logs
  const watSessions = ref([])
  const sctSessions = ref([])
  const srtSessions = ref([])
  const opiSessions = ref([])
  const obstacleRoute = ref([])

  // Initialize store from localStorage on mount
  const initializeStore = () => {
    const storedModules = localStorage.getItem('issb_completed_modules')
    if (storedModules) {
      completedModules.value = JSON.parse(storedModules)
    }

    const storedXp = localStorage.getItem('issb_xp')
    if (storedXp) {
      xp.value = parseInt(storedXp)
    }

    const storedWat = localStorage.getItem('issb_wat_sessions')
    if (storedWat) {
      watSessions.value = JSON.parse(storedWat)
    }

    const storedSct = localStorage.getItem('issb_sct_sessions')
    if (storedSct) {
      sctSessions.value = JSON.parse(storedSct)
    }

    const storedSrt = localStorage.getItem('issb_srt_sessions')
    if (storedSrt) {
      srtSessions.value = JSON.parse(storedSrt)
    }

    const storedRoute = localStorage.getItem('issb_obstacle_route')
    if (storedRoute) {
      obstacleRoute.value = JSON.parse(storedRoute)
    }

    const storedOpi = localStorage.getItem('issb_opi_sessions')
    if (storedOpi) {
      opiSessions.value = JSON.parse(storedOpi)
    }
  }

  // Auto initialize
  initializeStore()

  // Actions
  const toggleModuleCompleted = (moduleId) => {
    const index = completedModules.value.indexOf(moduleId)
    if (index > -1) {
      completedModules.value.splice(index, 1)
    } else {
      completedModules.value.push(moduleId)
      addXP(50) // Award 50 XP for completing a module guide
    }
    localStorage.setItem('issb_completed_modules', JSON.stringify(completedModules.value))
  }

  const isModuleCompleted = (moduleId) => {
    return completedModules.value.includes(moduleId)
  }

  const addXP = (amount) => {
    xp.value += amount
    localStorage.setItem('issb_xp', xp.value.toString())

    // Dispatch custom event to notify App.vue rank update
    window.dispatchEvent(new CustomEvent('issb-xp-updated', { detail: xp.value }))
  }

  const saveWatSession = (sessionData) => {
    // sessionData: { date: string, responses: Array<{ word, text, timeOut }> }
    watSessions.value.unshift(sessionData)
    localStorage.setItem('issb_wat_sessions', JSON.stringify(watSessions.value))
    addXP(100) // 100 XP for completing a simulator session
  }

  const saveSctSession = (sessionData) => {
    // sessionData: { date: string, responses: Array<{ index, prompt, text }> }
    sctSessions.value.unshift(sessionData)
    localStorage.setItem('issb_sct_sessions', JSON.stringify(sctSessions.value))
    addXP(100)
  }

  const saveSrtSession = (sessionData) => {
    // sessionData: { date: string, responses: Array<{ situationId, responseText }> }
    srtSessions.value.unshift(sessionData)
    localStorage.setItem('issb_srt_sessions', JSON.stringify(srtSessions.value))
    addXP(100)
  }

  const saveObstacleRoute = (routeData) => {
    // routeData: Array<obstacleId>
    obstacleRoute.value = routeData
    localStorage.setItem('issb_obstacle_route', JSON.stringify(obstacleRoute.value))
    addXP(30) // 30 XP for designing a route
  }

  const saveOpiSession = (sessionData) => {
    opiSessions.value.unshift(sessionData)
    localStorage.setItem('issb_opi_sessions', JSON.stringify(opiSessions.value))
    addXP(100)
  }

  const updateWatSessionAi = (date, aiAnalysis) => {
    const session = watSessions.value.find((s) => s.date === date)
    if (session) {
      session.aiAnalysis = aiAnalysis
      localStorage.setItem('issb_wat_sessions', JSON.stringify(watSessions.value))
    }
  }

  const updateSctSessionAi = (date, aiAnalysis) => {
    const session = sctSessions.value.find((s) => s.date === date)
    if (session) {
      session.aiAnalysis = aiAnalysis
      localStorage.setItem('issb_sct_sessions', JSON.stringify(sctSessions.value))
    }
  }

  const updateSrtSessionAi = (date, aiAnalysis) => {
    const session = srtSessions.value.find((s) => s.date === date)
    if (session) {
      session.aiAnalysis = aiAnalysis
      localStorage.setItem('issb_srt_sessions', JSON.stringify(srtSessions.value))
    }
  }

  const updateOpiSessionAi = (date, aiAnalysis) => {
    const session = opiSessions.value.find((s) => s.date === date)
    if (session) {
      session.aiAnalysis = aiAnalysis
      localStorage.setItem('issb_opi_sessions', JSON.stringify(opiSessions.value))
    }
  }

  const clearHistory = () => {
    completedModules.value = []
    watSessions.value = []
    sctSessions.value = []
    srtSessions.value = []
    opiSessions.value = []
    obstacleRoute.value = []
    xp.value = 120
    localStorage.removeItem('issb_completed_modules')
    localStorage.removeItem('issb_xp')
    localStorage.removeItem('issb_wat_sessions')
    localStorage.removeItem('issb_sct_sessions')
    localStorage.removeItem('issb_srt_sessions')
    localStorage.removeItem('issb_opi_sessions')
    localStorage.removeItem('issb_obstacle_route')
    window.dispatchEvent(new CustomEvent('issb-xp-updated', { detail: 120 }))
  }

  return {
    completedModules,
    xp,
    watSessions,
    sctSessions,
    srtSessions,
    opiSessions,
    obstacleRoute,
    toggleModuleCompleted,
    isModuleCompleted,
    addXP,
    saveWatSession,
    saveSctSession,
    saveSrtSession,
    saveOpiSession,
    saveObstacleRoute,
    updateWatSessionAi,
    updateSctSessionAi,
    updateSrtSessionAi,
    updateOpiSessionAi,
    clearHistory,
  }
})
