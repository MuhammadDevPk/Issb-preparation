<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'
import { useAuthStore } from '../stores/auth'
import { useAiAnalysis } from '../composables/useAiAnalysis.js'
import { OPI_QUESTIONS } from '../data/opiData.js'

const store = usePreparationStore()
const router = useRouter()
const authStore = useAuthStore()

// AI Analysis Setup
const { isAnalyzing, analysisResult, analysisError, currentProvider, analysisProgress, analysisProgressText, analyzeOPI, resetAnalysis } = useAiAnalysis()
const showAiReport = ref(false)
const showUpgradeModal = ref(false)

const isApproved = computed(() => {
  const p = authStore.profile
  const isTrialActive = p?.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now()
  return p?.status === 'approved' || p?.role === 'admin' || isTrialActive
})

// Configuration & State
const testState = ref('setup') // 'setup', 'active', 'results'
const testSize = ref(50) // 50, 100, or 150
const currentPage = ref(0)
const itemsPerPage = 10

// Test Data State
const activeQuestions = ref([])
const userAnswers = ref({}) // qid -> numeric value (1 to 7)

// Likert Scale Definition
const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree', shortLabel: 'SD', color: '#b91c1c', class: 'opt-sd' },
  { value: 2, label: 'Mostly Disagree', shortLabel: 'MD', color: '#dc2626', class: 'opt-md' },
  { value: 3, label: 'Slightly Disagree', shortLabel: 'D', color: '#f87171', class: 'opt-d' },
  { value: 4, label: 'Neutral', shortLabel: 'N', color: '#64748b', class: 'opt-n' },
  { value: 5, label: 'Slightly Agree', shortLabel: 'A', color: '#4ade80', class: 'opt-a' },
  { value: 6, label: 'Mostly Agree', shortLabel: 'MA', color: '#16a34a', class: 'opt-ma' },
  { value: 7, label: 'Strongly Agree', shortLabel: 'SA', color: '#15803d', class: 'opt-sa' }
]

const CHOICE_TO_VALUE = {
  'Strongly Disagree': 1,
  'Mostly Disagree': 2,
  'Slightly Disagree': 3,
  'Neutral': 4,
  'Slightly Agree': 5,
  'Mostly Agree': 6,
  'Strongly Agree': 7
}

const getChoiceText = (value) => {
  const option = LIKERT_OPTIONS.find((o) => o.value === value)
  return option ? option.label : 'Not Answered'
}

// Balance questions across OCEAN dimensions to ensure psychometric validity
const getBalancedQuestions = (size) => {
  const dimensions = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism']
  const perDimension = Math.floor(size / 5)

  const poolByDim = {
    Openness: OPI_QUESTIONS.filter((q) => q.dimension === 'Openness'),
    Conscientiousness: OPI_QUESTIONS.filter((q) => q.dimension === 'Conscientiousness'),
    Extraversion: OPI_QUESTIONS.filter((q) => q.dimension === 'Extraversion'),
    Agreeableness: OPI_QUESTIONS.filter((q) => q.dimension === 'Agreeableness'),
    Neuroticism: OPI_QUESTIONS.filter((q) => q.dimension === 'Neuroticism'),
  }

  const selected = []
  dimensions.forEach((dim) => {
    const items = poolByDim[dim].slice(0, perDimension)
    selected.push(...items)
  })

  // Mix questions up so traits are interleaved
  return selected.sort(() => Math.random() - 0.5)
}

const currentSessionDate = ref(null)

// Actions
const startTest = () => {
  activeQuestions.value = getBalancedQuestions(testSize.value)
  userAnswers.value = {}
  currentPage.value = 0
  testState.value = 'active'
  resetAnalysis()
  showAiReport.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const totalPages = computed(() => {
  return Math.ceil(activeQuestions.value.length / itemsPerPage)
})

const currentPageQuestions = computed(() => {
  const start = currentPage.value * itemsPerPage
  return activeQuestions.value.slice(start, start + itemsPerPage)
})

const answeredCount = computed(() => {
  return activeQuestions.value.filter((q) => userAnswers.value[q.id] !== undefined).length
})

const isPageFullyAnswered = computed(() => {
  return currentPageQuestions.value.every((q) => userAnswers.value[q.id] !== undefined)
})

const selectAnswer = (qid, value) => {
  userAnswers.value[qid] = value
}

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Dynamic Contradiction Evaluation Algorithm
const consistencyAnalysis = computed(() => {
  const groups = {}
  activeQuestions.value.forEach((q) => {
    if (!groups[q.trait]) groups[q.trait] = []
    groups[q.trait].push(q)
  })

  let totalPairs = 0
  let totalDeviation = 0
  const contradictions = []

  Object.entries(groups).forEach(([trait, items]) => {
    if (items.length < 2) return

    // Find pairs with opposite recommended answers
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i]
        const item2 = items[j]

        const val1 = CHOICE_TO_VALUE[item1.recommendedChoice]
        const val2 = CHOICE_TO_VALUE[item2.recommendedChoice]

        const isOpposite = (val1 >= 5 && val2 <= 3) || (val1 <= 3 && val2 >= 5)
        if (isOpposite) {
          const userVal1 = userAnswers.value[item1.id]
          const userVal2 = userAnswers.value[item2.id]

          if (userVal1 !== undefined && userVal2 !== undefined) {
            totalPairs++
            // Sum of opposite values should ideally equal 8 (e.g. 7 + 1 = 8)
            const sum = userVal1 + userVal2
            const deviation = Math.abs(sum - 8)
            totalDeviation += deviation

            if (deviation > 2) {
              contradictions.push({
                trait,
                q1: item1.statement,
                ans1: getChoiceText(userVal1),
                rec1: item1.recommendedChoice,
                q2: item2.statement,
                ans2: getChoiceText(userVal2),
                rec2: item2.recommendedChoice,
                deviation,
              })
            }
          }
        }
      }
    }
  })

  const averageDeviation = totalPairs > 0 ? totalDeviation / totalPairs : 0
  // Standard compatibility conversion: 100% means no contradictions, decreasing as deviations grow
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (averageDeviation * 22))))

  return {
    consistencyScore,
    contradictions: contradictions.slice(0, 5), // Keep top 5 for visual clarity
    fakingDetected: consistencyScore < 70,
  }
})

// Traits & Overall Score Calculations
const testResults = computed(() => {
  const dimensions = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism']
  const scoresByDim = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 }
  const countsByDim = { Openness: 0, Conscientiousness: 0, Extraversion: 0, Agreeableness: 0, Neuroticism: 0 }

  activeQuestions.value.forEach((q) => {
    const userVal = userAnswers.value[q.id]
    if (userVal !== undefined) {
      const recVal = CHOICE_TO_VALUE[q.recommendedChoice]
      // Compute proximity score: max 7 points (perfect alignment), min 1 point (total disagreement)
      const proximity = 7 - Math.abs(userVal - recVal)
      // Convert to percentage: 0 to 100% suitability
      const percentScore = ((proximity - 1) / 6) * 100

      scoresByDim[q.dimension] += percentScore
      countsByDim[q.dimension]++
    }
  })

  const traitPercentages = {}
  dimensions.forEach((dim) => {
    traitPercentages[dim] = countsByDim[dim] > 0 ? scoresByDim[dim] / countsByDim[dim] : 50
  })

  // General Suitability Index: average of 5 trait dimensions adjusted by consistency
  const averageTraits = dimensions.reduce((acc, dim) => acc + traitPercentages[dim], 0) / 5
  const consistencyFactor = consistencyAnalysis.value.consistencyScore / 100
  // Final score weighted 80% on traits, 20% on consistency, penalized if neutral answers are high
  const neutralPercentage = (neutralCount.value / activeQuestions.value.length) * 100
  const neutralPenalty = neutralPercentage > 10 ? (neutralPercentage - 10) * 0.5 : 0

  const overallScore = Math.max(
    0,
    Math.round((averageTraits * 0.8 + averageTraits * 0.2 * consistencyFactor) - neutralPenalty)
  )

  let overallGrade
  if (overallScore >= 90) overallGrade = 'A+'
  else if (overallScore >= 80) overallGrade = 'A'
  else if (overallScore >= 70) overallGrade = 'B+'
  else if (overallScore >= 60) overallGrade = 'B'
  else if (overallScore >= 50) overallGrade = 'C+'
  else if (overallScore >= 40) overallGrade = 'C'
  else overallGrade = 'D'

  return {
    traitPercentages,
    overallScore,
    overallGrade,
  }
})

const neutralCount = computed(() => {
  return activeQuestions.value.filter((q) => userAnswers.value[q.id] === 4).length
})

const neutralPercentage = computed(() => {
  if (activeQuestions.value.length === 0) return 0
  return (neutralCount.value / activeQuestions.value.length) * 100
})

const isNeutralTrapActive = computed(() => {
  return neutralPercentage.value > 10
})

const finishTest = () => {
  currentSessionDate.value = new Date().toLocaleString()

  // Format responses array
  const responses = activeQuestions.value.map((q) => ({
    id: q.id,
    statement: q.statement,
    value: userAnswers.value[q.id],
    userChoiceText: getChoiceText(userAnswers.value[q.id]),
    recommendedChoice: q.recommendedChoice,
    recommendedValue: CHOICE_TO_VALUE[q.recommendedChoice],
    trait: q.trait,
    rationale: q.rationale,
    dimension: q.dimension,
  }))

  const sessionData = {
    date: currentSessionDate.value,
    size: testSize.value,
    responses,
    scores: testResults.value.traitPercentages,
    overallScore: testResults.value.overallScore,
    overallGrade: testResults.value.overallGrade,
    consistencyScore: consistencyAnalysis.value.consistencyScore,
    neutralPercentage: neutralPercentage.value,
    fakingDetected: consistencyAnalysis.value.fakingDetected,
    neutralTrapActive: isNeutralTrapActive.value,
  }

  // Save in local storage via pinia store
  store.saveOpiSession(sessionData)
  testState.value = 'results'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const checkAiLimit = () => {
  if (!isApproved.value) {
    const today = new Date().toLocaleDateString()
    const lastUse = localStorage.getItem('issb_last_ai_use_date')
    if (lastUse === today) {
      showUpgradeModal.value = true
      return false
    }
  }
  return true
}

const recordAiUsage = () => {
  if (!isApproved.value) {
    const today = new Date().toLocaleDateString()
    localStorage.setItem('issb_last_ai_use_date', today)
  }
}

const triggerAiAnalysis = async () => {
  if (!checkAiLimit()) return

  const responses = activeQuestions.value.map((q) => ({
    statement: q.statement,
    value: userAnswers.value[q.id],
    userChoiceText: getChoiceText(userAnswers.value[q.id]),
    recommendedChoice: q.recommendedChoice,
    recommendedValue: CHOICE_TO_VALUE[q.recommendedChoice],
    trait: q.trait,
    rationale: q.rationale,
    dimension: q.dimension,
  }))

  showAiReport.value = true
  await analyzeOPI(
    responses,
    testResults.value.traitPercentages,
    consistencyAnalysis.value.consistencyScore,
    neutralPercentage.value
  )

  if (analysisResult.value) {
    store.updateOpiSessionAi(currentSessionDate.value, analysisResult.value)
    recordAiUsage()
  }
}

const viewPastSession = (session) => {
  currentSessionDate.value = session.date
  testSize.value = session.size
  activeQuestions.value = session.responses.map((r) => ({
    id: r.id,
    statement: r.statement,
    recommendedChoice: r.recommendedChoice,
    trait: r.trait,
    rationale: r.rationale,
    dimension: r.dimension,
  }))

  userAnswers.value = {}
  session.responses.forEach((r) => {
    userAnswers.value[r.id] = r.value
  })

  testState.value = 'results'

  if (session.aiAnalysis) {
    analysisResult.value = session.aiAnalysis
    showAiReport.value = true
  } else {
    analysisResult.value = null
    showAiReport.value = false
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const resetTest = () => {
  testState.value = 'setup'
  activeQuestions.value = []
  userAnswers.value = {}
  currentPage.value = 0
  resetAnalysis()
  showAiReport.value = false
}

const goToRoadmap = () => {
  router.push({ name: 'roadmap' })
}

const scoreClass = (score) => {
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  return 'score-poor'
}
</script>

<template>
  <div class="opi-wrapper">
    <!-- Simulators Quick Navigation Hub -->
    <div class="simulators-hub-nav no-print" v-if="testState !== 'active'">
      <div class="hub-nav-label">Practice Other Simulators:</div>
      <div class="hub-nav-items">
        <RouterLink to="/simulator/wat" class="hub-nav-btn" active-class="active">
          <span>Word Association (WAT)</span>
        </RouterLink>
        <RouterLink to="/simulator/sct" class="hub-nav-btn" active-class="active">
          <span>Sentence Completion (SCT)</span>
        </RouterLink>
        <RouterLink to="/simulator/srt" class="hub-nav-btn" active-class="active">
          <span>Situation Reaction (SRT)</span>
        </RouterLink>
        <RouterLink to="/simulator/opi" class="hub-nav-btn" active-class="active">
          <span>Personality Test (OPI)</span>
        </RouterLink>
        <RouterLink to="/simulator/obstacles" class="hub-nav-btn" active-class="active">
          <span>GTO Obstacles</span>
        </RouterLink>
      </div>
    </div>

    <!-- SETUP PANEL -->
    <div class="setup-container glass-card" v-if="testState === 'setup'">
      <span class="badge badge-cyan">Psychological screening</span>
      <h2>Occupational Personality Inventory (OPI) Simulator</h2>
      <p class="intro-text">
        The OPI is a confirmatory psychometric test administered on the first day of the Inter Services Selection Board (ISSB) program. Structured around the Big Five OCEAN framework, it profiles your suitability for a military commission, cross-examining your consistency and alerting psychologists to any attempts to project an idealized persona.
      </p>

      <div class="config-panel">
        <div class="form-group">
          <label class="form-label">Test Size Selection</label>
          <select class="form-select" v-model.number="testSize">
            <option :value="50">50 Questions (Quick Review)</option>
            <option :value="100">100 Questions (Standard Mock)</option>
            <option :value="150">150 Questions (Full ISSB Mock)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Calculated Questions</label>
          <div class="badge-row">
            <span class="badge badge-cyan">{{ testSize }} balanced statements loaded</span>
            <span class="badge badge-green">{{ testSize / 5 }} items per OCEAN dimension</span>
          </div>
        </div>
      </div>

      <div class="tactical-tips border-gold">
        <h5>Key Tactical Rules for OPI Success:</h5>
        <ul>
          <li>
            <strong>Bypass the Neutral Trap:</strong> Muted responses (Neutral) suggest indecisiveness, fear of self-disclosure, or lack of conviction under pressure. Avoid choosing Neutral for core officer qualities.
          </li>
          <li>
            <strong>Beware the Lie Scale (Social Desirability):</strong> Agreeing with unrealistic claims of moral perfection (e.g. "I have never lied") flags your profile for faking. Slightly or Mostly Disagree with these traps to show healthy, honest self-awareness.
          </li>
          <li>
            <strong>Maintain Strict Consistency:</strong> Similar traits tested in opposite directions (e.g. leadership confidence vs. submissive traits) are cross-checked. Answer honestly to prevent triggering faking flags.
          </li>
        </ul>
      </div>

      <div class="flex-center setup-actions" style="margin-top: 1.5rem;">
        <button class="btn btn-primary btn-large" @click="startTest">
          <span>START OPI EXAMINATION</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>

      <!-- History log panel -->
      <div class="history-panel" v-if="store.opiSessions.length > 0">
        <h3 class="history-title">📜 Past OPI Session Logs</h3>
        <div class="history-list">
          <div v-for="session in store.opiSessions" :key="session.date" class="history-item">
            <div class="history-meta">
              <span class="history-date">{{ session.date }}</span>
              <span class="history-details">
                {{ session.size }} Items | Score: {{ session.overallScore }}% ({{ session.overallGrade }}) | Consistency: {{ session.consistencyScore }}%
              </span>
            </div>
            <div class="history-actions">
              <span class="badge-ai-small" v-if="session.aiAnalysis">🤖 AI Report Ready</span>
              <button class="btn btn-secondary btn-sm" @click="viewPastSession(session)">
                View Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ACTIVE TEST PANEL -->
    <div class="active-container glass-card" v-if="testState === 'active'">
      <div class="simulator-header">
        <div class="header-details">
          <h2>Officer's Personality Inventory (OPI)</h2>
          <p class="sub-label">Read each statement carefully and rate your agreement using the 7-point dial.</p>
        </div>
        <div class="progress-box">
          <span class="progress-text">
            PAGE {{ currentPage + 1 }} OF {{ totalPages }} 
            <span class="remaining-count">({{ activeQuestions.length - answeredCount }} unanswered)</span>
          </span>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: (answeredCount / activeQuestions.length) * 100 + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Paginated Questions List -->
      <div class="questions-list">
        <div v-for="(q, idx) in currentPageQuestions" :key="q.id" class="question-row border-blue">
          <div class="question-meta">
            <span class="q-number">#{{ currentPage * itemsPerPage + idx + 1 }}</span>
            <span class="q-dimension badge-dim">{{ q.dimension }}</span>
          </div>
          <div class="question-text-block">
            <h4 class="opi-statement">{{ q.statement }}</h4>
          </div>

          <!-- Likert dial selection row -->
          <div class="likert-row">
            <span class="scale-label disagree-label">Disagree</span>
            <div class="dial-container">
              <button 
                v-for="opt in LIKERT_OPTIONS" 
                :key="opt.value"
                class="dial-btn"
                :class="[opt.class, { checked: userAnswers[q.id] === opt.value }]"
                @click="selectAnswer(q.id, opt.value)"
                :title="opt.label"
              >
                <span class="dial-dot"></span>
                <span class="dial-text-hover">{{ opt.shortLabel }}</span>
              </button>
            </div>
            <span class="scale-label agree-label">Agree</span>
          </div>
          <!-- Selected choice indicator -->
          <div class="selection-feedback-text" v-if="userAnswers[q.id]">
            Rated: <span class="chosen-bold">{{ getChoiceText(userAnswers[q.id]) }}</span>
          </div>
        </div>
      </div>

      <!-- Navigation actions -->
      <div class="simulator-actions">
        <button class="btn btn-secondary" :disabled="currentPage === 0" @click="prevPage">
          <span>BACK PAGE</span>
        </button>

        <span class="page-indicator-mobile">Page {{ currentPage + 1 }} / {{ totalPages }}</span>

        <button 
          v-if="currentPage < totalPages - 1"
          class="btn btn-primary" 
          :disabled="!isPageFullyAnswered"
          @click="nextPage"
        >
          <span>NEXT PAGE</span>
        </button>

        <button 
          v-else
          class="btn btn-green"
          :disabled="answeredCount < activeQuestions.length"
          @click="finishTest"
        >
          <span>SUBMIT TEST</span>
        </button>
      </div>
    </div>

    <!-- RESULTS REPORT PANEL -->
    <div class="results-container glass-card" v-if="testState === 'results'">
      <div class="results-header">
        <div>
          <h2>OPI Suitability Report</h2>
          <span class="badge badge-green">Saved to Logs (+100 XP)</span>
        </div>
        <div class="actions">
          <button class="btn btn-secondary mr-2" @click="resetTest">Retake Test</button>
          <button
            class="btn btn-ai mr-2"
            :disabled="isAnalyzing"
            @click="triggerAiAnalysis"
            title="Get AI-powered ISSB psychological personality analysis"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
              <circle cx="9" cy="13" r="1" fill="currentColor" />
              <circle cx="15" cy="13" r="1" fill="currentColor" />
            </svg>
            {{ isAnalyzing ? 'Analyzing...' : 'Analyze with AI' }}
          </button>
          <button class="btn btn-primary" @click="goToRoadmap">Back to Roadmap</button>
        </div>
      </div>

      <!-- Overall score & warnings -->
      <div class="results-metrics grid-3" style="margin-bottom: 1.5rem;">
        <div class="glass-card metric-item border-blue text-center">
          <span class="lbl">Suitability Index</span>
          <span class="val text-glow" :style="{ color: testResults.overallScore >= 70 ? 'var(--accent-green)' : 'var(--accent-gold)' }">
            {{ testResults.overallScore }}%
          </span>
          <span class="desc">Military suitability compatibility index. Aim for 70%+</span>
        </div>

        <div class="glass-card metric-item text-center" :class="consistencyAnalysis.fakingDetected ? 'border-red' : 'border-green'">
          <span class="lbl">Consistency Score</span>
          <span class="val" :class="consistencyAnalysis.fakingDetected ? 'text-red' : 'text-green'">
            {{ consistencyAnalysis.consistencyScore }}%
          </span>
          <span class="desc">Measures response truthfulness. Discrepancies flag faking.</span>
        </div>

        <div class="glass-card metric-item text-center" :class="isNeutralTrapActive ? 'border-gold' : 'border-green'">
          <span class="lbl">Neutral Answers</span>
          <span class="val" :class="isNeutralTrapActive ? 'text-gold' : 'text-green'">
            {{ neutralPercentage.toFixed(1) }}%
          </span>
          <span class="desc">Avoid selecting Neutral. Excessive Neutral marks indecision.</span>
        </div>
      </div>

      <!-- Warnings notifications -->
      <div class="warnings-block" v-if="consistencyAnalysis.fakingDetected || isNeutralTrapActive">
        <div class="warning-alert border-red" v-if="consistencyAnalysis.fakingDetected">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>Consistency Warning (Faking Flags Detected):</strong>
            <p>Your responses show contradictions in similar traits. Psychologists use these consistency checks to verify if a candidate is faking. Answer truthfully according to your actual personality.</p>
          </div>
        </div>
        <div class="warning-alert border-gold" v-if="isNeutralTrapActive">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>Neutral Trap Warning:</strong>
            <p>You selected "Neutral" for {{ neutralCount }} questions ({{ neutralPercentage.toFixed(1) }}%). Selecting neutral suggests an avoidance of self-disclosure or indecisiveness under stress. Commit to a clear choice.</p>
          </div>
        </div>
      </div>

      <!-- OCEAN breakdown -->
      <div class="evaluation-grid grid-2">
        <div class="glass-card chart-panel">
          <h3>Big Five OCEAN Trait Profile</h3>
          <p class="desc">Your compatibility scores across the 5 core psychometric dimensions:</p>
          
          <div class="trait-bars">
            <!-- Openness -->
            <div class="trait-progress-group">
              <div class="trait-label-row">
                <span class="trait-name">Openness (Aesthetics & Intellect)</span>
                <span class="trait-score">{{ Math.round(testResults.traitPercentages.Openness) }}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: testResults.traitPercentages.Openness + '%' }"></div>
              </div>
              <span class="trait-desc-text">Reflects cognitive drive, strategic vision, and imagination.</span>
            </div>

            <!-- Conscientiousness -->
            <div class="trait-progress-group">
              <div class="trait-label-row">
                <span class="trait-name">Conscientiousness (Grit & Order)</span>
                <span class="trait-score">{{ Math.round(testResults.traitPercentages.Conscientiousness) }}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: testResults.traitPercentages.Conscientiousness + '%' }"></div>
              </div>
              <span class="trait-desc-text">Reflects duty, punctuality, responsibility, and planning details.</span>
            </div>

            <!-- Extraversion -->
            <div class="trait-progress-group">
              <div class="trait-label-row">
                <span class="trait-name">Extraversion (Leadership & Drive)</span>
                <span class="trait-score">{{ Math.round(testResults.traitPercentages.Extraversion) }}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: testResults.traitPercentages.Extraversion + '%' }"></div>
              </div>
              <span class="trait-desc-text">Reflects dominance, assertiveness, initiative, and verbal clarity.</span>
            </div>

            <!-- Agreeableness -->
            <div class="trait-progress-group">
              <div class="trait-label-row">
                <span class="trait-name">Agreeableness (Team Cooperation)</span>
                <span class="trait-score">{{ Math.round(testResults.traitPercentages.Agreeableness) }}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: testResults.traitPercentages.Agreeableness + '%' }"></div>
              </div>
              <span class="trait-desc-text">Reflects trust, altruism, empathy, and team alignment.</span>
            </div>

            <!-- Emotional Stability -->
            <div class="trait-progress-group">
              <div class="trait-label-row">
                <span class="trait-name">Emotional Stability (Low Neuroticism)</span>
                <span class="trait-score">{{ Math.round(testResults.traitPercentages.Neuroticism) }}%</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: testResults.traitPercentages.Neuroticism + '%' }"></div>
              </div>
              <span class="trait-desc-text">Reflects stress tolerance, calmness under pressure, and composure.</span>
            </div>
          </div>
        </div>

        <div class="glass-card advice-panel">
          <h3>Psychologist Recommendations</h3>
          <div class="advice-checklist">
            <div class="advice-item" v-if="testResults.traitPercentages.Neuroticism < 70">
              <strong class="text-red">Enhance Emotional Stability:</strong>
              <p>Work on stress management techniques and breathing models. Practice making logical choices under strict timers without getting irritated.</p>
            </div>
            <div class="advice-item" v-if="testResults.traitPercentages.Conscientiousness < 70">
              <strong class="text-gold">Structure Your Discipline:</strong>
              <p>Develop rigid schedules, track tasks, double-check details, and establish regular workout regimens to cultivate Conscientiousness.</p>
            </div>
            <div class="advice-item" v-if="testResults.traitPercentages.Extraversion < 70">
              <strong class="text-gold">Develop Command Initiative:</strong>
              <p>Proactively step up in group tasks. Practice speaking in front of mirrors, briefing friends, and representing viewpoints with moral courage.</p>
            </div>
            <div class="advice-item" v-if="testResults.traitPercentages.Agreeableness < 70">
              <strong class="text-blue">Foster Peer Compatibility:</strong>
              <p>Build team empathy. Focus on active listening, collaborative consensus, and supporting weaker group members without showing arrogance.</p>
            </div>
            <div class="advice-item" v-if="testResults.traitPercentages.Openness < 70">
              <strong class="text-blue">Engage Spatial Curiosity:</strong>
              <p>Read strategy/history books, solve model puzzles, and analyze tactical scenarios to build cognitive agility.</p>
            </div>
            <div class="advice-item" v-if="testResults.overallScore >= 70 && !consistencyAnalysis.fakingDetected && !isNeutralTrapActive">
              <strong class="text-green">Recommended Profile:</strong>
              <p>Your current response profile suggests strong alignment with military suitability profiles, showcasing balanced leadership drive and consistency.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Consistency discrepancies sub-panel -->
      <div class="glass-card contradiction-panel" style="margin-top: 1.5rem;" v-if="consistencyAnalysis.contradictions.length > 0">
        <h3>Flagged Contradictory Answers</h3>
        <p class="desc">The test flagged these statements because your answers for similar traits contradicted each other:</p>
        <div class="contradiction-list">
          <div v-for="(contra, i) in consistencyAnalysis.contradictions" :key="i" class="contra-item">
            <div class="contra-trait badge-dim">{{ contra.trait }}</div>
            <div class="contra-row">
              <div class="contra-q">
                <span class="bullet">A</span>
                <div>
                  <p class="stmt-txt">"{{ contra.q1 }}"</p>
                  <p class="ans-txt">You answered: <span class="lbl-red">{{ contra.ans1 }}</span> (Recommended: {{ contra.rec1 }})</p>
                </div>
              </div>
              <div class="contra-q">
                <span class="bullet">B</span>
                <div>
                  <p class="stmt-txt">"{{ contra.q2 }}"</p>
                  <p class="ans-txt">You answered: <span class="lbl-red">{{ contra.ans2 }}</span> (Recommended: {{ contra.rec2 }})</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Report Display -->
      <div class="ai-report-container" style="margin-top: 2rem;" v-if="showAiReport">
        <div class="ai-loading" v-if="isAnalyzing">
          <div class="ai-progress-container">
            <div class="ai-progress-header">
              <div class="ai-spinner-mini"></div>
              <strong>AI Psychologist is analyzing your personality profile...</strong>
            </div>
            <div class="ai-progress-bar-track">
              <div class="ai-progress-bar-fill" :style="{ width: (analysisProgress || 50) + '%' }"></div>
            </div>
            <div class="ai-progress-meta">
              <span class="ai-progress-text">{{ analysisProgressText || 'Evaluating Big Five personality dimensions against ISSB standards' }}</span>
              <span class="ai-progress-pct" v-if="analysisProgress">{{ analysisProgress }}%</span>
            </div>
          </div>
        </div>
        <div class="ai-error" v-else-if="analysisError">
          <p class="text-red">Analysis failed: {{ analysisError }}</p>
          <button class="btn btn-secondary mt-2" @click="triggerAiAnalysis">Retry Analysis</button>
        </div>
        
        <!-- Custom AI OPI Report Layout -->
        <div class="glass-card ai-opi-card" v-else-if="analysisResult">
          <div class="ai-report-heading">
            <span class="ai-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                <circle cx="9" cy="13" r="1" fill="currentColor" />
                <circle cx="15" cy="13" r="1" fill="currentColor" />
              </svg>
              AI psychologist audit report
            </span>
            <div class="header-badges">
              <span class="score-badge" v-if="analysisResult.overallScore !== undefined">
                Score: {{ analysisResult.overallScore }}/100
              </span>
              <span class="grade-badge" :style="{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }">
                Grade: {{ analysisResult.overallGrade }}
              </span>
              <span class="provider-badge" v-if="currentProvider">via {{ currentProvider }}</span>
            </div>
          </div>

          <div class="ai-profile-section">
            <h4>Psychological Suitability Profile:</h4>
            <p>{{ analysisResult.psychologicalProfile }}</p>
            <div class="summary-box">
              <span>{{ analysisResult.summary }}</span>
            </div>
          </div>

          <!-- OPI Dimensions Breakdown & Detailed Evaluation -->
          <div class="ai-profile-section" style="margin-top: 1.5rem;" v-if="analysisResult.dimensionEvaluations">
            <h4>OPI Dimensions Breakdown & Evaluation:</h4>
            <div class="ai-dimensions-list">
              <div v-for="(evalData, traitName) in analysisResult.dimensionEvaluations" :key="traitName" class="ai-dimension-detail-card">
                <div class="dim-card-header">
                  <div class="dim-title-group">
                    <span class="dim-name">{{ traitName.replace(/([A-Z])/g, ' $1').trim() }}</span>
                    <span class="dim-status-badge" :class="'status-' + (evalData.status || 'moderate').toLowerCase().replace(' ', '-')">
                      {{ evalData.status }}
                    </span>
                  </div>
                  <span class="dim-score-badge">{{ evalData.score }}/100</span>
                </div>
                
                <div class="dim-card-body">
                  <p class="dim-eval-text">{{ evalData.evaluation }}</p>
                  
                  <div class="dim-mistakes-box" v-if="evalData.mistakes && evalData.mistakes.length > 0 && evalData.mistakes[0] !== 'None' && evalData.mistakes[0] !== 'none'">
                    <span class="box-title text-red">⚠️ Mistakes & Traps to Avoid:</span>
                    <ul class="dim-bullets">
                      <li v-for="mistake in evalData.mistakes" :key="mistake" class="text-red">{{ mistake }}</li>
                    </ul>
                  </div>

                  <div class="dim-tips-box" v-if="evalData.tips && evalData.tips.length > 0 && evalData.tips[0] !== 'None' && evalData.tips[0] !== 'none'">
                    <span class="box-title text-green">💡 Recommended Adjustments:</span>
                    <ul class="dim-bullets">
                      <li v-for="tip in evalData.tips" :key="tip" class="text-green">{{ tip }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fallback Old Strengths Grid for backwards compatibility -->
          <div class="ai-profile-section" style="margin-top: 1.5rem;" v-else-if="analysisResult.traitStrengths">
            <h4>Dimensional Strengths & Improvement Areas:</h4>
            <div class="ai-strengths-grid">
              <div v-for="(val, key) in analysisResult.traitStrengths" :key="key" class="ai-strength-card">
                <span class="strength-title">{{ key.replace(/([A-Z])/g, ' $1').trim() }}</span>
                <p class="strength-txt">{{ val }}</p>
              </div>
            </div>
          </div>

          <div class="ai-profile-section" style="margin-top: 1.5rem;" v-if="analysisResult.warnings && analysisResult.warnings.length > 0">
            <h4 class="text-red">Consistency / Lie Scale Flags:</h4>
            <ul class="ai-warnings-list">
              <li v-for="warning in analysisResult.warnings" :key="warning" class="text-red">{{ warning }}</li>
            </ul>
          </div>

          <div class="ai-profile-section" style="margin-top: 1.5rem;" v-if="analysisResult.recommendations && analysisResult.recommendations.length > 0">
            <h4>Actionable Personality Training:</h4>
            <div class="ai-recs-grid">
              <div v-for="(rec, i) in analysisResult.recommendations" :key="i" class="ai-rec-card">
                <span class="rec-num">{{ i + 1 }}</span>
                <p>{{ rec }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upgrade Gating Modal -->
      <div class="upgrade-modal-backdrop" v-if="showUpgradeModal" @click.self="showUpgradeModal = false">
        <div class="upgrade-modal glass-card">
          <h3>🔐 Daily AI Limit Reached</h3>
          <p>
            You have used your <strong>1 daily AI evaluation</strong>.
          </p>
          <div class="warning-callout" style="background: rgba(168, 85, 247, 0.1); border-left: 4px solid #a855f7; padding: 0.75rem; border-radius: 4px; margin: 1rem 0; font-size: 0.88rem; line-height: 1.4; color: var(--text-primary); text-align: left;">
            <strong>💡 Purchase Unlimited AI Access for Rs. 999:</strong>
            For using it unlimited times a day, please purchase access for <strong>Rs. 999 for 1 month</strong>. Because this AI evaluation feature is very expensive and we have to pay Google, Groq, Open Router, and other AI providers (which costs us thousands of rupees per month), we cannot provide this for free. But for Rs. 999, you will get 1 month of unlimited access.
          </div>
          <div class="modal-actions" style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
            <a href="https://wa.me/923456047058?text=Hi%20Umar,%20I%20want%20to%20purchase%20unlimited%20AI%20evaluations%20for%20Rs.%20999%20for%201%20month.%20My%20email%20is%20" target="_blank" class="btn btn-primary text-center block" style="display: block; text-decoration: none; padding: 0.75rem 1rem; border-radius: var(--border-radius-md); background: #a855f7; border: none; color: white;">
              💬 Purchase Unlimited via WhatsApp (Rs. 999/month)
            </a>
            <button class="btn btn-secondary" @click="showUpgradeModal = false">Close</button>
          </div>
        </div>
      </div>

      <!-- Statement Audit Log Table -->
      <div class="glass-card audit-panel" style="margin-top: 1.5rem;">
        <h3>Detailed Statement Audit Log</h3>
        <p class="desc">Inspect how each of your answers compares to recommended military guidelines:</p>
        <div class="table-container">
          <table class="audit-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Statement</th>
                <th>Dimension</th>
                <th>Your Rating</th>
                <th>Guideline Rating</th>
                <th>Target Trait & Rationale</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in activeQuestions" :key="q.id" :class="scoreClass(7 - Math.abs(userAnswers[q.id] - CHOICE_TO_VALUE[q.recommendedChoice]))">
                <td>{{ q.id }}</td>
                <td class="stmt-cell">{{ q.statement }}</td>
                <td><span class="badge-dim">{{ q.dimension }}</span></td>
                <td><span class="rating-cell">{{ getChoiceText(userAnswers[q.id]) }}</span></td>
                <td><span class="rating-cell font-semibold">{{ q.recommendedChoice }}</span></td>
                <td class="trait-cell">
                  <strong>{{ q.trait }}:</strong> {{ q.rationale }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* New OPI Dimension Detail styles */
.header-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.score-badge {
  background: rgba(0, 242, 254, 0.08);
  border: 1px solid rgba(0, 242, 254, 0.25);
  color: var(--accent-cyan);
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.ai-dimensions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.75rem;
}

.ai-dimension-detail-card {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dim-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.dim-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dim-name {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.dim-status-badge {
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 999px;
  text-transform: uppercase;
}

.status-strong {
  background: rgba(22, 163, 74, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(22, 163, 74, 0.25);
}

.status-moderate {
  background: rgba(234, 179, 8, 0.1);
  color: var(--accent-gold);
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.status-needs-improvement {
  background: rgba(220, 38, 38, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(220, 38, 38, 0.25);
}

.dim-score-badge {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.dim-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.dim-eval-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.dim-mistakes-box {
  background: rgba(220, 38, 38, 0.03);
  border: 1px solid rgba(220, 38, 38, 0.12);
  border-left: 3px solid var(--accent-red);
  padding: 0.85rem;
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
}

.dim-tips-box {
  background: rgba(22, 163, 74, 0.03);
  border: 1px solid rgba(22, 163, 74, 0.12);
  border-left: 3px solid var(--accent-green);
  padding: 0.85rem;
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
}

.box-title {
  display: block;
  font-weight: 700;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.dim-bullets {
  list-style: none;
  padding-left: 0.25rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.dim-bullets li {
  font-size: 0.85rem;
  line-height: 1.4;
  position: relative;
  padding-left: 1rem;
  text-align: left;
}

.dim-bullets li::before {
  content: "•";
  position: absolute;
  left: 0;
}

.opi-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.intro-text {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.config-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  background: var(--bg-panel-solid);
  padding: 1.25rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.form-select {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: 0.65rem 0.85rem;
  color: var(--text-primary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color var(--transition-smooth);
}

.form-select:focus {
  border-color: var(--accent-cyan);
  outline: none;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tactical-tips {
  background: var(--bg-panel-solid);
  border-left: 4px solid var(--accent-gold);
  border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.tactical-tips h5 {
  color: var(--accent-gold);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tactical-tips ul {
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.tactical-tips li {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.setup-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.active-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.simulator-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.header-details h2 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.sub-label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.progress-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
  min-width: 200px;
}

.progress-text {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.remaining-count {
  font-size: 0.75rem;
  color: var(--accent-cyan);
}

.progress-bar-track {
  width: 100%;
  height: 8px;
  background: rgba(3, 194, 252, 0.08);
  border-radius: 99px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent-cyan);
  border-radius: 99px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-row {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color var(--transition-smooth), transform var(--transition-smooth);
}

.question-row:hover {
  border-color: var(--border-color-hover);
}

.question-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.q-number {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 0.15rem 0.5rem;
  border-radius: var(--border-radius-sm);
}

.badge-dim {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(3, 194, 252, 0.1);
  color: var(--accent-cyan);
  padding: 0.15rem 0.5rem;
  border-radius: var(--border-radius-sm);
}

.opi-statement {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.likert-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
}

.scale-label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.disagree-label {
  color: #b91c1c;
}

.agree-label {
  color: #15803d;
}

.dial-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  max-width: 480px;
}

.dial-btn {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-smooth);
}

.dial-btn:hover {
  transform: scale(1.15);
}

.dial-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: all var(--transition-smooth);
}

.dial-text-hover {
  position: absolute;
  font-size: 0.65rem;
  font-weight: 800;
  opacity: 0;
  transition: opacity var(--transition-smooth);
}

.dial-btn:hover .dial-text-hover {
  opacity: 1;
}

.dial-btn:hover .dial-dot {
  opacity: 0;
}

/* Checked states and color schemes for premium touch */
.dial-btn.opt-sd.checked { border-color: #b91c1c; background: #b91c1c; }
.dial-btn.opt-md.checked { border-color: #dc2626; background: #dc2626; }
.dial-btn.opt-d.checked { border-color: #f87171; background: #f87171; }
.dial-btn.opt-n.checked { border-color: #64748b; background: #64748b; }
.dial-btn.opt-a.checked { border-color: #4ade80; background: #4ade80; }
.dial-btn.opt-ma.checked { border-color: #16a34a; background: #16a34a; }
.dial-btn.opt-sa.checked { border-color: #15803d; background: #15803d; }

.dial-btn.checked .dial-dot {
  background: #ffffff;
  width: 10px;
  height: 10px;
}

.selection-feedback-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  padding-left: 0.25rem;
}

.chosen-bold {
  font-weight: 700;
  color: var(--text-primary);
}

.simulator-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
  margin-top: 1rem;
}

.page-indicator-mobile {
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.results-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  align-items: center;
}

.metric-item .lbl {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.metric-item .val {
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.metric-item .desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.warnings-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.warning-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--bg-panel-solid);
  border-left: 4px solid;
  padding: 1rem;
  border-radius: var(--border-radius-sm);
}

.alert-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.warning-alert p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}

.trait-bars {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1rem;
}

.trait-progress-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.trait-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trait-name {
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.trait-score {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--accent-cyan);
}

.bar-track {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.07);
  border-radius: 99px;
}

.bar-fill {
  height: 100%;
  background: var(--accent-cyan);
  border-radius: 99px;
}

.trait-desc-text {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.advice-checklist {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.advice-item {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
}

.advice-item:last-child {
  border: none;
  padding: 0;
}

.advice-item strong {
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.15rem;
}

.advice-item p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.contradiction-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contradiction-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.contra-item {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contra-trait {
  align-self: flex-start;
}

.contra-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.contra-q {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.65rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
}

.contra-q .bullet {
  width: 20px;
  height: 20px;
  background: var(--border-color-hover);
  color: var(--accent-cyan);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.contra-q .stmt-txt {
  font-weight: 600;
  font-size: 0.85rem;
}

.contra-q .ans-txt {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.lbl-red {
  color: #b91c1c;
  font-weight: 700;
}

/* History logs list */
.history-panel {
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}

.history-title {
  font-size: 1.15rem;
  margin-bottom: 0.85rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  gap: 1rem;
}

.history-meta {
  display: flex;
  flex-direction: column;
}

.history-date {
  font-weight: 600;
  font-size: 0.9rem;
}

.history-details {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.badge-ai-small {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  border: 1.5px solid rgba(124, 58, 237, 0.3);
  border-radius: var(--border-radius-sm);
  font-size: 0.65rem;
  font-weight: 750;
  padding: 0.1rem 0.4rem;
  text-transform: uppercase;
  margin-right: 0.5rem;
  display: inline-block;
}

/* AI OPI Report Styling */
.ai-opi-card {
  border-color: rgba(124, 58, 237, 0.25);
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(3, 194, 252, 0.04) 100%);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.ai-report-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 9999px;
  padding: 0.2rem 0.65rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.grade-badge {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.85rem;
  border: 1.5px solid;
  border-radius: var(--border-radius-sm);
  padding: 0.15rem 0.6rem;
}

.provider-badge {
  font-size: 0.7rem;
  color: var(--text-muted);
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  padding: 0.15rem 0.6rem;
}

.ai-profile-section h4 {
  font-size: 0.95rem;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.ai-profile-section p {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.summary-box {
  display: flex;
  align-items: center;
  background: var(--bg-panel-solid);
  border-left: 3px solid var(--accent-cyan);
  padding: 0.65rem;
  border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-top: 0.5rem;
}

.ai-strengths-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.ai-strength-card {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  padding: 0.75rem;
  border-radius: var(--border-radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.strength-title {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.strength-txt {
  font-size: 0.82rem !important;
  color: var(--text-secondary);
}

.ai-warnings-list {
  padding-left: 1.25rem;
}

.ai-warnings-list li {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.ai-recs-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.ai-rec-card {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: var(--bg-panel-solid);
  border: 1px solid rgba(21, 128, 61, 0.15);
  padding: 0.65rem 0.75rem;
  border-radius: var(--border-radius-sm);
}

.ai-rec-card .rec-num {
  width: 20px;
  height: 20px;
  background: var(--accent-green);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ai-rec-card p {
  font-size: 0.85rem;
  line-height: 1.4;
}

/* AI Loading & Spinner */
.ai-report-container {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.04), rgba(3, 194, 252, 0.04));
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.ai-progress-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ai-progress-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.ai-progress-header strong {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.ai-spinner-mini {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(124, 58, 237, 0.15);
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.ai-progress-bar-track {
  width: 100%;
  height: 8px;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.ai-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #06b6d4);
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.ai-progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.ai-progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.ai-progress-text {
  color: var(--text-muted);
  font-size: 0.8rem;
  line-height: 1.3;
}

.ai-progress-pct {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 700;
  color: #7c3aed;
  white-space: nowrap;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Upgrade Premium Gate Modal */
.upgrade-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 1000;
}

.upgrade-modal {
  max-width: 500px;
  width: 100%;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border-color: var(--accent-gold);
}

.upgrade-modal h3 {
  color: var(--accent-gold);
}

.referral-box {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: var(--border-radius-sm);
  border-left: 3.5px solid var(--accent-cyan);
}

.referral-box strong {
  font-size: 0.92rem;
  display: block;
}

.referral-box p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Statement Audit Log Table Styles */
.audit-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-secondary);
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  text-align: left;
}

.audit-table th {
  background: var(--bg-panel-solid);
  border-bottom: 1.5px solid var(--border-color);
  padding: 0.75rem;
  font-family: var(--font-heading);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.audit-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: top;
}

.audit-table tr:last-child td {
  border-bottom: none;
}

.stmt-cell {
  font-weight: 550;
  min-width: 220px;
}

.rating-cell {
  font-size: 0.82rem;
  padding: 0.1rem 0.4rem;
  background: var(--bg-panel-solid);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  white-space: nowrap;
  display: inline-block;
}

.trait-cell {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
  min-width: 280px;
}

.audit-table tr.score-excellent td {
  border-left: 3.5px solid var(--accent-green);
}

.audit-table tr.score-good td {
  border-left: 3.5px solid var(--accent-gold);
}

.audit-table tr.score-poor td {
  border-left: 3.5px solid var(--accent-red);
}

/* Margin utilities */
.mr-2 { margin-right: 0.5rem; }
.mt-2 { margin-top: 0.5rem; }
.font-semibold { font-weight: 600; }
</style>
