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
  const badResponses = ref([])

  // Initialize store from localStorage on mount
  const initializeStore = () => {
    const storedModules = localStorage.getItem('issb_completed_modules')
    if (storedModules) {
      try {
        completedModules.value = JSON.parse(storedModules)
      } catch (e) {
        console.error('Failed to parse completed modules:', e)
        localStorage.removeItem('issb_completed_modules')
      }
    }

    const storedXp = localStorage.getItem('issb_xp')
    if (storedXp) {
      xp.value = parseInt(storedXp) || 120
    }

    const storedWat = localStorage.getItem('issb_wat_sessions')
    if (storedWat) {
      try {
        watSessions.value = JSON.parse(storedWat)
      } catch (e) {
        console.error('Failed to parse WAT sessions:', e)
        localStorage.removeItem('issb_wat_sessions')
      }
    }

    const storedSct = localStorage.getItem('issb_sct_sessions')
    if (storedSct) {
      try {
        sctSessions.value = JSON.parse(storedSct)
      } catch (e) {
        console.error('Failed to parse SCT sessions:', e)
        localStorage.removeItem('issb_sct_sessions')
      }
    }

    const storedSrt = localStorage.getItem('issb_srt_sessions')
    if (storedSrt) {
      try {
        srtSessions.value = JSON.parse(storedSrt)
      } catch (e) {
        console.error('Failed to parse SRT sessions:', e)
        localStorage.removeItem('issb_srt_sessions')
      }
    }

    const storedRoute = localStorage.getItem('issb_obstacle_route')
    if (storedRoute) {
      try {
        obstacleRoute.value = JSON.parse(storedRoute)
      } catch (e) {
        console.error('Failed to parse obstacle route:', e)
        localStorage.removeItem('issb_obstacle_route')
      }
    }

    const storedOpi = localStorage.getItem('issb_opi_sessions')
    if (storedOpi) {
      try {
        opiSessions.value = JSON.parse(storedOpi)
      } catch (e) {
        console.error('Failed to parse OPI sessions:', e)
        localStorage.removeItem('issb_opi_sessions')
      }
    }

    const storedBad = localStorage.getItem('issb_bad_responses')
    if (storedBad) {
      try {
        badResponses.value = JSON.parse(storedBad)
      } catch (e) {
        console.error('Failed to parse bad responses:', e)
        localStorage.removeItem('issb_bad_responses')
      }
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
      extractAndSaveBadResponses('WAT', date, aiAnalysis)
    }
  }

  const updateSctSessionAi = (date, aiAnalysis) => {
    const session = sctSessions.value.find((s) => s.date === date)
    if (session) {
      session.aiAnalysis = aiAnalysis
      localStorage.setItem('issb_sct_sessions', JSON.stringify(sctSessions.value))
      extractAndSaveBadResponses('SCT', date, aiAnalysis)
    }
  }

  const updateSrtSessionAi = (date, aiAnalysis) => {
    const session = srtSessions.value.find((s) => s.date === date)
    if (session) {
      session.aiAnalysis = aiAnalysis
      localStorage.setItem('issb_srt_sessions', JSON.stringify(srtSessions.value))
      extractAndSaveBadResponses('SRT', date, aiAnalysis)
    }
  }

  const updateOpiSessionAi = (date, aiAnalysis) => {
    const session = opiSessions.value.find((s) => s.date === date)
    if (session) {
      session.aiAnalysis = aiAnalysis
      localStorage.setItem('issb_opi_sessions', JSON.stringify(opiSessions.value))
    }
  }

  const extractAndSaveBadResponses = (testType, date, aiAnalysis) => {
    if (!aiAnalysis || !aiAnalysis.items || !Array.isArray(aiAnalysis.items)) return

    const badItems = aiAnalysis.items.filter((item) => {
      const score = item.score ?? 100
      const rating = (item.rating ?? '').toLowerCase()
      return score < 50 || rating === 'poor' || rating === 'blank' || rating.includes('avoidance')
    })

    const newBad = badItems.map((item) => ({
      id: `${testType}-${date}-${item.index}-${Math.random().toString(36).substr(2, 9)}`,
      testType,
      date,
      prompt: item.prompt || '',
      answer: item.answer || '',
      score: item.score ?? 0,
      rating: item.rating || 'Poor',
      issues: item.issues || [],
      improvements: item.improvements || '',
      issueTags: item.issueTags || [],
      isImproved: false,
      improvedAnswer: '',
    }))

    // Avoid duplicate additions of same prompts in the same session
    const existingKeys = new Set(badResponses.value.map((r) => `${r.testType}-${r.prompt}`))
    const filteredNew = newBad.filter((r) => !existingKeys.has(`${r.testType}-${r.prompt}`))

    if (filteredNew.length > 0) {
      badResponses.value.push(...filteredNew)
      localStorage.setItem('issb_bad_responses', JSON.stringify(badResponses.value))
    }
  }

  const removeBadResponse = (id) => {
    badResponses.value = badResponses.value.filter((r) => r.id !== id)
    localStorage.setItem('issb_bad_responses', JSON.stringify(badResponses.value))
  }

  const updateBadResponse = (id, updatedFields) => {
    const idx = badResponses.value.findIndex((r) => r.id === id)
    if (idx > -1) {
      badResponses.value[idx] = { ...badResponses.value[idx], ...updatedFields }
      localStorage.setItem('issb_bad_responses', JSON.stringify(badResponses.value))
    }
  }

  const clearHistory = () => {
    completedModules.value = []
    watSessions.value = []
    sctSessions.value = []
    srtSessions.value = []
    opiSessions.value = []
    obstacleRoute.value = []
    badResponses.value = []
    xp.value = 120
    localStorage.removeItem('issb_completed_modules')
    localStorage.removeItem('issb_xp')
    localStorage.removeItem('issb_wat_sessions')
    localStorage.removeItem('issb_sct_sessions')
    localStorage.removeItem('issb_srt_sessions')
    localStorage.removeItem('issb_opi_sessions')
    localStorage.removeItem('issb_obstacle_route')
    localStorage.removeItem('issb_bad_responses')
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
    badResponses,
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
    removeBadResponse,
    updateBadResponse,
    clearHistory,
  }
})
