<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'
import { useAiAnalysis } from '../composables/useAiAnalysis.js'
import AiAnalysisReport from '../components/AiAnalysisReport.vue'
import ImageUploadPanel from '../components/ImageUploadPanel.vue'
import { srtSheets, getRandomSrtSituations } from '../data/issbTestData.js'

import { useAuthStore } from '../stores/auth'

const store = usePreparationStore()
const router = useRouter()
const authStore = useAuthStore()

// AI Analysis
const { isAnalyzing, analysisResult, analysisError, currentProvider, analysisProgress, analysisPhase, analysisProgressText, analyzeSRT, ocrResult, ocrError, extractFromImages, resetAnalysis } = useAiAnalysis()
const showAiReport = ref(false)
const showUpgradeModal = ref(false)

const isApproved = computed(() => {
  const p = authStore.profile
  const isTrialActive = p?.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now()
  return p?.status === 'approved' || p?.role === 'admin' || isTrialActive
})

const currentSessionDate = ref(null)

const checkAiLimit = (isImageEvaluation = false) => {
  const p = authStore.profile
  const isAiApproved = p?.ai_status === 'approved' && p?.ai_approved_until && new Date(p.ai_approved_until).getTime() > Date.now()
  const isBypassed = isImageEvaluation
    ? (p?.role === 'admin' || isAiApproved)
    : isApproved.value

  if (!isBypassed) {
    const today = new Date().toLocaleDateString()
    const lastUse = localStorage.getItem('issb_last_ai_use_date')
    if (lastUse === today) {
      showUpgradeModal.value = true
      return false
    }
  }
  return true
}

const recordAiUsage = (isImageEvaluation = false) => {
  const p = authStore.profile
  const isAiApproved = p?.ai_status === 'approved' && p?.ai_approved_until && new Date(p.ai_approved_until).getTime() > Date.now()
  const isBypassed = isImageEvaluation
    ? (p?.role === 'admin' || isAiApproved)
    : isApproved.value

  if (!isBypassed) {
    const today = new Date().toLocaleDateString()
    localStorage.setItem('issb_last_ai_use_date', today)
  }
}

const triggerAiAnalysis = async () => {
  if (!checkAiLimit(false)) return
  showAiReport.value = true
  await analyzeSRT(responses.value)
  if (analysisResult.value) {
    store.updateSrtSessionAi(currentSessionDate.value, analysisResult.value)
    recordAiUsage(false)
  }
}

const viewPastSession = (session) => {
  currentSessionDate.value = session.date
  situations.value = session.responses.map((r) => ({ id: r.id, desc: r.situation }))
  responses.value = session.responses
  testState.value = 'results'
  
  if (session.aiAnalysis) {
    analysisResult.value = session.aiAnalysis
    showAiReport.value = true
  } else {
    analysisResult.value = null
    showAiReport.value = false
  }
}

const testState = ref('setup') // 'setup', 'active', 'results', 'paper-display', 'paper-upload', 'paper-review'
const timerDuration = ref(30) // 30 seconds per situation
const selectedSetId = ref('srt_crisis')
const customSituationCount = ref(10)

const selectedSetDescription = computed(() => {
  if (selectedSetId.value === 'random_mix') {
    return 'Generates a random selection of situations from the pool, ensuring unique runs.'
  }
  const sheet = srtSheets.find((s) => s.id === selectedSetId.value)
  return sheet ? sheet.description : ''
})

const previewSituationCount = computed(() => {
  if (selectedSetId.value === 'random_mix') {
    return customSituationCount.value
  }
  const sheet = srtSheets.find((s) => s.id === selectedSetId.value)
  return sheet ? sheet.situations.length : 0
})

const situations = ref([...srtSheets[0].situations])
const currentIndex = ref(0)
const currentInput = ref('')
const responses = ref([]) // Array of { situation, text, timeOut }

const timeLeft = ref(30)
let timerInterval = null

const startTest = () => {
  if (selectedSetId.value === 'random_mix') {
    situations.value = getRandomSrtSituations(customSituationCount.value)
  } else {
    const sheet = srtSheets.find((s) => s.id === selectedSetId.value)
    situations.value = sheet ? [...sheet.situations] : [...srtSheets[0].situations]
  }

  currentIndex.value = 0
  responses.value = []
  currentInput.value = ''
  testState.value = 'active'
  startSituationTimer()
}

const startSituationTimer = () => {
  timeLeft.value = timerDuration.value
  clearInterval(timerInterval)

  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      submitReaction(true)
    }
  }, 1000)
}

const submitReaction = (isTimeOut = false) => {
  if (responses.value.length > currentIndex.value) return

  const currentSit = situations.value[currentIndex.value]

  responses.value.push({
    id: currentSit.id,
    situation: currentSit.desc,
    text: currentInput.value.trim(),
    timeOut: isTimeOut,
  })

  currentInput.value = ''

  if (currentIndex.value < situations.value.length - 1) {
    currentIndex.value++
    startSituationTimer()
  } else {
    endTest()
  }
}

const handleKeyPress = (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    submitReaction(false)
  }
}

const endTest = () => {
  clearInterval(timerInterval)
  testState.value = 'results'
  showAiReport.value = false
  resetAnalysis()

  const dateStr = new Date().toLocaleString()
  currentSessionDate.value = dateStr

  // Save in store
  store.saveSrtSession({
    date: dateStr,
    responses: responses.value,
    selectedSetId: selectedSetId.value,
  })
}

const goToRoadmap = () => {
  router.push('/roadmap')
}

// ---------------------------------------------------------------------------
// Paper Test Mode (ISSB-style: display situations one-by-one → write on paper → upload → OCR)
// ---------------------------------------------------------------------------
const paperSitIndex = ref(0)
const paperTimeLeft = ref(30)
let paperTimer = null

const startPaperTest = () => {
  if (selectedSetId.value === 'random_mix') {
    situations.value = getRandomSrtSituations(customSituationCount.value)
  } else {
    const sheet = srtSheets.find((s) => s.id === selectedSetId.value)
    situations.value = sheet ? [...sheet.situations] : [...srtSheets[0].situations]
  }

  paperSitIndex.value = 0
  responses.value = []
  testState.value = 'paper-display'
  startPaperSitTimer()
}

const startPaperSitTimer = () => {
  paperTimeLeft.value = timerDuration.value
  clearInterval(paperTimer)

  paperTimer = setInterval(() => {
    paperTimeLeft.value--
    if (paperTimeLeft.value <= 0) {
      paperNextSituation()
    }
  }, 1000)
}

const paperNextSituation = () => {
  if (paperSitIndex.value < situations.value.length - 1) {
    paperSitIndex.value++
    startPaperSitTimer()
  } else {
    clearInterval(paperTimer)
    testState.value = 'paper-upload'
  }
}

const skipPaperDisplay = () => {
  clearInterval(paperTimer)
  testState.value = 'paper-upload'
}

const handlePaperImagesReady = async ({ images }) => {
  const situationTexts = situations.value.map((s) => s.desc)
  await extractFromImages(images, 'srt', situationTexts)
  if (ocrResult.value) {
    testState.value = 'paper-review'
  }
}

const submitReviewedResponses = async () => {
  if (!ocrResult.value) return
  if (!checkAiLimit(true)) return

  responses.value = ocrResult.value.responses.map((r, idx) => ({
    id: situations.value[idx]?.id || idx + 1,
    situation: r.situation || situations.value[idx]?.desc || '',
    text: r.text === '[BLANK]' ? '' : r.text,
    timeOut: false,
  }))

  const dateStr = new Date().toLocaleString()
  currentSessionDate.value = dateStr
  store.saveSrtSession({
    date: dateStr,
    responses: responses.value,
    selectedSetId: selectedSetId.value,
    mode: 'paper',
  })

  testState.value = 'results'
  showAiReport.value = true
  await analyzeSRT(responses.value)
  if (analysisResult.value) {
    store.updateSrtSessionAi(currentSessionDate.value, analysisResult.value)
    recordAiUsage(true)
  }
}

onUnmounted(() => {
  clearInterval(timerInterval)
  clearInterval(paperTimer)
})

const totalAnswered = computed(() => {
  return responses.value.filter((r) => r.text && r.text.trim().length > 0).length
})
</script>

<template>
  <div class="srt-wrapper">
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

    <!-- SETUP VIEW -->
    <div class="setup-container glass-card" v-if="testState === 'setup'">
      <span class="badge badge-cyan">Psychology Simulators</span>
      <h2>Situation Reaction Test (SRT) Trainer</h2>
      <p>
        The Situation Reaction Test measures practical intelligence, courage, resourcefulness, and
        social cooperation. You are given **30 seconds** to write a brief, realistic, and
        constructive action plan for each crisis.
      </p>

      <div class="config-panel">
        <div class="form-group">
          <label class="form-label">Time Per Situation</label>
          <select class="form-select" v-model.number="timerDuration">
            <option :value="30">30 Seconds (Standard ISSB)</option>
            <option :value="45">45 Seconds (Beginner Mode)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Select Situation Set</label>
          <select class="form-select" v-model="selectedSetId">
            <option v-for="sheet in srtSheets" :key="sheet.id" :value="sheet.id">
              {{ sheet.name }}
            </option>
            <option value="random_mix">Randomized Custom Mix</option>
          </select>
        </div>

        <div class="form-group" v-if="selectedSetId === 'random_mix'">
          <label class="form-label">Situation Count</label>
          <select class="form-select" v-model.number="customSituationCount">
            <option :value="5">5 Situations</option>
            <option :value="10">10 Situations (Standard)</option>
            <option :value="15">15 Situations (Long Run)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Total Situations</label>
          <div class="badge-row">
            <span class="badge badge-cyan">{{ previewSituationCount }} Scenarios loaded</span>
          </div>
        </div>
      </div>

      <div class="set-desc-panel" v-if="selectedSetDescription">
        <span class="desc-title">Focus:</span>
        <span class="desc-content">{{ selectedSetDescription }}</span>
      </div>

      <div class="tactical-tips border-gold">
        <h5>SRT Evaluation Tips:</h5>
        <ul>
          <li>
            <strong>Avoid Superman Responses:</strong> Do not write unrealistic actions (e.g.
            fighting 5 armed thieves with bare hands). Use logical safety and resources.
          </li>
          <li>
            <strong>Avoid Passive Running:</strong> Never write "He ran away" or "He just called
            police and waited". Show immediate active participation.
          </li>
          <li>
            <strong>Keep it Brief & Structured:</strong> Write the sequence of actions:
            <em
              >"Informed police, gathered neighbors, chased and caught the culprit, handed
              over."</em
            >
          </li>
        </ul>
      </div>

      <div class="flex-center" style="gap: 1rem; flex-wrap: wrap;">
        <button class="btn btn-primary btn-large" @click="startTest">
          <span>⌨️ START SRT SESSION</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
        <button class="btn btn-paper-test btn-large" @click="startPaperTest">
          <span>📝 PAPER TEST (ISSB MODE)</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </div>
      <p style="text-align: center; margin-top: 0.5rem; font-size: 0.82rem; color: var(--text-muted);">
        📝 <strong>Paper Test</strong>: Situations flash on screen → You write reactions on paper → Upload photos → AI reads &amp; evaluates
      </p>

      <!-- Past Sessions Panel -->
      <div class="history-panel" v-if="store.srtSessions.length > 0">
        <h3 class="history-title">📜 Your Past Practice Sessions</h3>
        <div class="history-list">
          <div v-for="session in store.srtSessions" :key="session.date" class="history-item">
            <div class="history-meta">
              <span class="history-date">{{ session.date }}</span>
              <span class="history-details">
                {{ session.responses ? session.responses.filter(r => r.text).length : 0 }} / {{ session.responses ? session.responses.length : 0 }} Responded | 
                Set: {{ session.selectedSetId === 'random_mix' ? 'Random Mix' : (srtSheets.find(s => s.id === session.selectedSetId)?.name || 'Custom') }}
              </span>
            </div>
            <div class="history-actions">
              <span class="badge-ai-small" v-if="session.aiAnalysis">🤖 AI Report Ready</span>
              <button class="btn btn-secondary btn-sm" @click="viewPastSession(session)">
                View Results
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ACTIVE SIMULATOR VIEW -->
    <div class="active-container glass-card" v-if="testState === 'active'">
      <div class="simulator-header">
        <span class="progress-indicator">
          SITUATION {{ currentIndex + 1 }} OF {{ situations.length }}
          <span class="remaining-count" style="font-size: 0.85rem; color: var(--accent-cyan); opacity: 0.8; margin-inline-start: 0.5rem;">
            ({{ situations.length - currentIndex - 1 }} left)
          </span>
        </span>

        <!-- Timer bar -->
        <div class="timer-bar-container">
          <div class="timer-bar" :style="{ width: (timeLeft / timerDuration) * 100 + '%' }"></div>
        </div>
        <span class="timer-text text-glow">{{ timeLeft }}s</span>
      </div>

      <div class="situation-display-area border-blue">
        <p class="situation-desc">"... {{ situations[currentIndex].desc }} ..."</p>
      </div>

      <div class="input-area">
        <textarea
          class="form-textarea text-field"
          v-model="currentInput"
          @keypress="handleKeyPress"
          placeholder="Write your reaction here..."
          autofocus
        ></textarea>
        <div class="action-footer">
          <span class="hint-label"
            >Tip: Press <strong>CTRL + ENTER</strong> to submit instantly.</span
          >
          <button class="btn btn-primary" @click="submitReaction(false)">Submit Reaction</button>
        </div>
      </div>
    </div>

    <!-- PAPER TEST: DISPLAY-ONLY VIEW -->
    <div class="active-container glass-card paper-display-view" v-if="testState === 'paper-display'">
      <div class="paper-mode-banner">
        <span class="badge badge-gold">📝 Paper Test Mode</span>
        <span class="paper-mode-hint">Write your reactions on paper as each situation appears</span>
      </div>

      <div class="simulator-header">
        <span class="progress-indicator">
          SITUATION {{ paperSitIndex + 1 }} OF {{ situations.length }}
          <span class="remaining-count" style="font-size: 0.85rem; color: var(--accent-cyan); opacity: 0.8; margin-inline-start: 0.5rem;">
            ({{ situations.length - paperSitIndex - 1 }} left)
          </span>
        </span>
        <div class="timer-bar-container">
          <div class="timer-bar" :style="{ width: (paperTimeLeft / timerDuration) * 100 + '%' }"></div>
        </div>
        <span class="timer-text text-glow">{{ paperTimeLeft }}s</span>
      </div>

      <div class="situation-display-area border-blue">
        <p class="situation-desc" style="font-size: 1.2rem;">"... {{ situations[paperSitIndex].desc }} ..."</p>
      </div>

      <div class="paper-instruction-box">
        <p>✍️ Write your reaction on paper. The next situation will appear automatically.</p>
        <button class="btn btn-secondary btn-sm" @click="skipPaperDisplay" style="margin-top: 0.75rem;">
          ⏭️ Skip to Upload
        </button>
      </div>
    </div>

    <!-- PAPER TEST: UPLOAD VIEW -->
    <div class="upload-container glass-card" v-if="testState === 'paper-upload'">
      <div class="paper-mode-banner">
        <span class="badge badge-gold">📝 Paper Test Mode</span>
        <span class="badge badge-green">✅ All {{ situations.length }} situations displayed</span>
      </div>

      <h2>Upload Your Answer Sheets</h2>
      <p class="upload-instruction">
        Take clear photos of your handwritten SRT reactions and upload them below.
        AI will extract your responses and evaluate them.
      </p>

      <div v-if="isAnalyzing" class="ai-loading-panel glass-card" style="margin-bottom: 1.5rem;">
        <div class="ai-progress-container">
          <div class="ai-progress-header">
            <div class="ai-spinner-mini"></div>
            <strong>Extracting handwriting from your photos...</strong>
          </div>
          <div class="ai-progress-bar-track">
            <div class="ai-progress-bar-fill" :style="{ width: analysisProgress + '%' }"></div>
          </div>
          <div class="ai-progress-meta">
            <span class="ai-progress-text">{{ analysisProgressText }}</span>
            <span class="ai-progress-pct">{{ analysisProgress }}%</span>
          </div>
        </div>
      </div>

      <div v-if="ocrError" class="ai-error-panel glass-card" style="margin-bottom: 1rem;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <div><strong>Extraction Failed</strong><p>{{ ocrError }}</p></div>
      </div>

      <ImageUploadPanel :max-images="10" test-type="SRT" :disabled="isAnalyzing" @images-ready="handlePaperImagesReady" />

      <div style="margin-top: 1rem;">
        <button class="btn btn-secondary" @click="testState = 'setup'; resetAnalysis()">← Back to Setup</button>
      </div>
    </div>

    <!-- PAPER TEST: REVIEW / EDIT OCR RESULTS -->
    <div class="review-container glass-card" v-if="testState === 'paper-review'">
      <div class="paper-mode-banner">
        <span class="badge badge-gold">📝 Paper Test Mode</span>
        <span class="badge badge-cyan">🔍 OCR Extraction Complete</span>
      </div>

      <h2>Review Extracted Reactions</h2>
      <p class="review-desc">
        AI extracted <strong>{{ ocrResult?.totalExtracted || 0 }}</strong> reactions.
        Fix any OCR spelling mistakes below before evaluation.
      </p>

      <div class="review-table-wrapper">
        <table class="results-table review-table">
          <thead>
            <tr><th>#</th><th>Situation</th><th>Extracted Reaction (editable)</th></tr>
          </thead>
          <tbody>
            <tr v-for="(resp, idx) in ocrResult?.responses" :key="idx" :class="{ 'blank-row': resp.text === '[BLANK]' }">
              <td>{{ idx + 1 }}</td>
              <td class="situation-col">{{ situations[idx]?.desc || resp.situation }}</td>
              <td class="text-col">
                <textarea class="form-textarea review-textarea" v-model="resp.text" rows="2"
                  :placeholder="resp.text === '[BLANK]' ? 'Left blank — type to fill' : ''"></textarea>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="review-actions">
        <button class="btn btn-secondary" @click="testState = 'paper-upload'">← Re-upload Images</button>
        <button class="btn btn-ai btn-large" @click="submitReviewedResponses" :disabled="isAnalyzing">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            <circle cx="9" cy="13" r="1" fill="currentColor" /><circle cx="15" cy="13" r="1" fill="currentColor" />
          </svg>
          ✅ Confirm & Evaluate with AI
        </button>
      </div>
    </div>

    <!-- RESULTS REVIEW VIEW -->
    <div class="results-container glass-card" v-if="testState === 'results'">
      <div class="results-header">
        <div>
          <h2>SRT Session Completed!</h2>
          <span class="badge badge-green">Saved to Logs (+100 XP)</span>
        </div>
        <div class="actions">
          <button class="btn btn-secondary mr-2" @click="testState = 'setup'; showAiReport = false; resetAnalysis()">Retake Test</button>
          <button
            class="btn btn-ai"
            :disabled="isAnalyzing"
            @click="triggerAiAnalysis"
            title="Get AI-powered ISSB psychological analysis"
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

      <!-- Quick Metrics -->
      <div class="results-metrics grid-3">
        <div class="glass-card metric-item border-blue">
          <span class="lbl">Situations Attempted</span>
          <span class="val">{{ totalAnswered }} / {{ situations.length }}</span>
          <span class="desc">High attempt indicates good speed.</span>
        </div>
        <div class="glass-card metric-item border-green">
          <span class="lbl">Timeout Count</span>
          <span
            class="val"
            :class="situations.length - totalAnswered > 1 ? 'text-red' : 'text-green'"
            >{{ situations.length - totalAnswered }}</span
          >
          <span class="desc">Aim for 0 timeouts.</span>
        </div>
        <div class="glass-card metric-item border-gold">
          <span class="lbl">Average Reaction Type</span>
          <span class="val text-glow">Active Solution</span>
          <span class="desc">Determined by practical action.</span>
        </div>
      </div>

      <!-- Self Evaluation Grid -->
      <div class="evaluation-grid grid-2">
        <div class="glass-card table-panel">
          <h3>Your Reaction Logs</h3>
          <div class="table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Situation Scenario</th>
                  <th>Your Reaction</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(res, index) in responses" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td class="situation-col">... {{ res.situation }} ...</td>
                  <td class="reaction-col">
                    <span v-if="res.timeOut" class="text-red italic">No reaction (Timed Out)</span>
                    <span v-else class="text-highlight"
                      ><strong>{{ res.text }}</strong></span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="glass-card psychology-tips-panel">
          <h3>Psychologist's Audit Guide</h3>
          <p class="desc">
            Analyze your reactions. Check if your answers demonstrate these core qualities:
          </p>

          <div class="checklist">
            <div class="check-item border-red">
              <strong class="text-red">Avoid Panic / Inaction:</strong>
              <p>
                Reactions like "He got worried and went home" or "He did not know what to do" are
                instant disqualifiers. Always show emotional stability.
              </p>
            </div>

            <div class="check-item border-gold">
              <strong class="text-gold">Cooperation & Social Skill:</strong>
              <p>
                For helper selection issues, writing "He argued with them" or "He quit the task"
                shows poor social adjustment. Opt for consensus:
                <em>"Accepted the group's choice and worked together to succeed."</em>
              </p>
            </div>

            <div class="check-item border-green">
              <strong class="text-green">Realistic Leadership:</strong>
              <p>
                Use active, practical solutions. If someone is ill, get medical help; if there is a
                threat, defend using team resources. Show responsibility and grit.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── AI Analysis Section ── -->
      <div v-if="showAiReport" class="ai-analysis-section">
        <div class="ai-section-divider">
          <span class="ai-section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            </svg>
            AI Psychological Analysis — SRT
          </span>
        </div>

        <!-- Loading state with progress -->
        <div v-if="isAnalyzing" class="ai-loading-panel glass-card">
          <div class="ai-progress-container">
            <div class="ai-progress-header">
              <div class="ai-spinner-mini"></div>
              <strong>Analyzing your SRT reactions...</strong>
            </div>
            <div class="ai-progress-bar-track">
              <div class="ai-progress-bar-fill" :style="{ width: analysisProgress + '%' }"></div>
            </div>
            <div class="ai-progress-meta">
              <span class="ai-progress-text">{{ analysisProgressText || 'Evaluating situations for leadership, realism, and social intelligence' }}</span>
              <span class="ai-progress-pct">{{ analysisProgress }}%</span>
            </div>
            <div v-if="analysisPhase" class="ai-progress-phase">
              <span :class="['phase-badge', analysisPhase === 'summary' ? 'phase-summary' : 'phase-batch']">
                {{ analysisPhase === 'summary' ? '📊 Generating Profile' : '🔍 Batch Evaluation' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="analysisError" class="ai-error-panel glass-card">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <div>
            <strong>Analysis Failed</strong>
            <p>{{ analysisError }}</p>
            <button class="btn btn-secondary" @click="triggerAiAnalysis" style="margin-top: 0.75rem; font-size: 0.85rem;">Retry</button>
          </div>
        </div>

        <!-- Results -->
        <AiAnalysisReport
          v-else-if="analysisResult"
          :result="analysisResult"
          test-type="SRT"
          :provider-name="currentProvider"
        />
      </div>
    </div>

    <!-- Premium Upgrade Modal -->
    <div class="modal-overlay" v-if="showUpgradeModal" @click.self="showUpgradeModal = false">
      <div class="modal-card glass-card fade-in">
        <div class="modal-header-ai">
          <div class="flex items-center gap-2">
            <span class="lock-icon">🚫</span>
            <h3>Daily AI Limit Reached</h3>
          </div>
          <button class="btn-close" @click="showUpgradeModal = false">&times;</button>
        </div>
        <template v-if="authStore.user">
          <div class="modal-body-ai">
            <p>
              You have used your <strong>1 daily AI evaluation</strong>.
            </p>
            
            <div class="warning-callout" style="border-left: 4px solid #7c3aed; background: rgba(124, 58, 237, 0.05); color: var(--text-primary);">
              <strong style="color: #7c3aed; display: block; margin-bottom: 0.5rem; font-size: 0.95rem;">💡 How to Unlock 30 Days Unlimited AI Access:</strong>
              <ol style="margin: 0; padding-left: 1.25rem; font-size: 0.88rem; line-height: 1.5; display: flex; flex-direction: column; gap: 0.4rem; text-align: left;">
                <li>Transfer <strong>Rs. 999</strong> to EasyPaisa:
                  <div style="margin: 0.25rem 0; padding: 0.5rem; background: var(--bg-surface); border-radius: 4px; border: 1px dashed rgba(124, 58, 237, 0.25);">
                    <div><strong>Account Number:</strong> <span class="text-cyan" style="font-family: monospace; font-size: 0.95rem; font-weight: bold;">03458643910</span></div>
                    <div><strong>Account Name:</strong> <span class="text-cyan" style="font-weight: bold;">umar farooq</span></div>
                  </div>
                </li>
                <li>Take a <strong>screenshot</strong> of the payment transaction receipt.</li>
                <li>Click <strong>"Upload Screenshot on Status Page"</strong> below and upload your receipt.</li>
                <li>Our admin will verify it within 1-2 hours to activate your unlimited access!</li>
              </ol>
            </div>

            <div class="modal-features">
              <div class="feat-row"><span class="check">✓</span> <span>Finds hidden psychology flaws & red flags in your responses.</span></div>
              <div class="feat-row"><span class="check">✓</span> <span>Detailed Officer-Like Qualities (OLQ) grade score & assessment.</span></div>
              <div class="feat-row"><span class="check">✓</span> <span>Provides exact corrected sentences and rephrasings.</span></div>
            </div>
          </div>
          <div class="modal-footer-ai" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button @click="router.push('/status')" class="btn btn-ai shadow-glow-purple w-full text-center" style="background: #7c3aed; color: white; border: none; font-weight: 600; padding: 0.75rem 1rem; border-radius: var(--border-radius-md); cursor: pointer;">
              📤 Upload Screenshot on Status Page
            </button>
            <a href="https://wa.me/923456047058?text=Hi%20Umar,%20I%20want%20to%20purchase%20unlimited%20AI%20evaluations%20for%20Rs.%20999%20for%201%20month.%20My%20email%20is%20" target="_blank" class="btn btn-secondary w-full text-center block" style="display: block; text-decoration: none; padding: 0.75rem 1rem; border-radius: var(--border-radius-md); text-align: center; font-weight: 500;">
              💬 Purchase / Questions via WhatsApp
            </a>
            <button class="btn btn-secondary w-full" @click="showUpgradeModal = false">
              Wait 24 Hours / Review Manually
            </button>
          </div>
        </template>

        <template v-else>
          <div class="modal-body-ai">
            <p>
              You have used your <strong>1 daily AI evaluation</strong>.
            </p>

            <div class="warning-callout" style="border-left: 4px solid var(--accent-cyan); background: rgba(6, 182, 212, 0.05); color: var(--text-primary);">
              <strong style="color: var(--accent-cyan); display: block; margin-bottom: 0.5rem; font-size: 0.95rem;">⚠️ Account Registration Required:</strong>
              <p style="margin: 0 0 0.5rem 0; font-size: 0.88rem; line-height: 1.4; text-align: left;">
                To unlock unlimited AI evaluations for 30 days (Rs. 999), you must first create a candidate account. Guests cannot purchase or activate subscription packages.
              </p>
              <p style="margin: 0; font-size: 0.88rem; line-height: 1.4; font-weight: 500; text-align: left;">
                After registering and logging in, you will transfer payment and upload your screenshot on the Status page to unlock unlimited access.
              </p>
            </div>

            <div class="modal-features">
              <div class="feat-row"><span class="check">✓</span> <span>Finds hidden psychology flaws & red flags in your responses.</span></div>
              <div class="feat-row"><span class="check">✓</span> <span>Detailed Officer-Like Qualities (OLQ) grade score & assessment.</span></div>
              <div class="feat-row"><span class="check">✓</span> <span>Provides exact corrected sentences and rephrasings.</span></div>
            </div>
          </div>
          <div class="modal-footer-ai" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button @click="router.push('/register')" class="btn btn-ai shadow-glow-purple w-full text-center" style="background: var(--accent-cyan); color: white; border: none; font-weight: 600; padding: 0.75rem 1rem; border-radius: var(--border-radius-md); cursor: pointer;">
              👤 Create Candidate Account (Register)
            </button>
            <button @click="router.push('/login')" class="btn btn-secondary w-full" style="font-weight: 500; cursor: pointer;">
              🔑 Log In to Existing Account
            </button>
            <a href="https://wa.me/923456047058?text=Hi%20Umar,%20I%20want%20to%20register%20and%20purchase%20unlimited%20AI%20evaluations%20for%20Rs.%20999.%20My%20email%20is%20" target="_blank" class="btn btn-secondary w-full text-center block" style="display: block; text-decoration: none; padding: 0.75rem 1rem; border-radius: var(--border-radius-md); text-align: center; font-weight: 500;">
              💬 Registration / Purchase Help on WhatsApp
            </a>
            <button class="btn btn-secondary w-full" @click="showUpgradeModal = false">
              Wait 24 Hours / Review Manually
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.srt-wrapper {
  inline-size: 100%;
}

.history-panel {
  margin-top: 1.5rem;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  text-align: left;
}

.history-title {
  font-size: 1.2rem;
  color: var(--accent-cyan);
  margin-top: 0;
  margin-bottom: 1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  gap: 1rem;
  flex-wrap: wrap;
}

.history-item:hover {
  border-color: rgba(3, 194, 252, 0.3);
}

.history-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.history-date {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.history-details {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge-ai-small {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(79, 70, 229, 0.15));
  color: #a78bfa;
  border: 1px solid rgba(124, 58, 237, 0.3);
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.setup-container,
.active-container,
.results-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
}

.setup-container p {
  color: var(--text-secondary);
  font-size: 1.05rem;
}

.set-desc-panel {
  padding: 0.75rem 1rem;
  background: var(--bg-panel-solid);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: flex;
  gap: 0.5rem;
}

.desc-title {
  font-weight: 700;
  color: var(--accent-cyan);
}

.config-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  background: var(--bg-panel-solid);
  padding: 1.25rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.tactical-tips {
  padding: 1.25rem;
  border-radius: var(--border-radius-md);
  background: rgba(255, 190, 59, 0.02);
  border-inline-start: 3px solid var(--accent-gold);
}

.tactical-tips h5 {
  font-size: 1.05rem;
  color: var(--accent-gold);
  margin-block-end: 0.5rem;
}

.tactical-tips ul {
  list-style: square;
  padding-inline-start: 1.25rem;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.95rem;
}

.btn-large {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

/* Active Simulator View */
.active-container {
  min-block-size: 400px;
  justify-content: space-between;
}

.simulator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1.5rem;
}

.progress-indicator {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.timer-bar-container {
  flex: 1;
  block-size: 8px;
  background: #cbd5e1;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.timer-bar {
  block-size: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-red));
  border-radius: 999px;
  transition: width 1s linear;
}

.timer-text {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent-cyan);
}

.situation-display-area {
  margin-block: 2rem;
  padding: 2rem;
  background: var(--bg-panel-solid);
  border-radius: var(--border-radius-lg);
  border-inline-start: 4px solid var(--accent-cyan);
  border: 1px solid var(--border-color);
  border-inline-start-width: 4px;
}

.situation-desc {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  line-height: 1.5;
  color: var(--text-primary);
  font-weight: 500;
}

.input-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.text-field {
  font-size: 1.1rem;
  min-block-size: 120px;
}

.action-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Results panel */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-block-end: 1px solid rgba(255, 255, 255, 0.05);
  padding-block-end: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.mr-2 {
  margin-inline-end: 0.75rem;
}

.results-metrics .metric-item {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.results-metrics .metric-item .lbl {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.results-metrics .metric-item .val {
  font-family: var(--font-heading);
  font-size: 1.55rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-block: 0.25rem;
}

.results-metrics .metric-item .desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.evaluation-grid {
  align-items: start;
}

.table-panel {
  padding: 1.5rem;
}

.table-panel h3,
.psychology-tips-panel h3 {
  font-size: 1.15rem;
  color: var(--accent-cyan);
  margin-block-end: 0.85rem;
}

.table-container {
  max-block-size: 450px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.results-table th,
.results-table td {
  padding: 0.75rem 1rem;
  border-block-end: 1px solid rgba(255, 255, 255, 0.03);
}

.results-table th {
  background: var(--bg-panel-solid);
  font-family: var(--font-heading);
  font-weight: 500;
  color: var(--text-secondary);
}

.situation-col {
  font-family: var(--font-heading);
  color: var(--text-secondary);
  inline-size: 40%;
}

.reaction-col {
  color: var(--accent-cyan);
}

.text-highlight {
  color: var(--text-primary);
}

.italic {
  font-style: italic;
}

.psychology-tips-panel {
  padding: 1.5rem;
}

.psychology-tips-panel .desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-block-end: 1rem;
}

.checklist {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.check-item {
  padding: 1rem;
  background: var(--bg-panel-solid);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.check-item strong {
  font-size: 0.95rem;
  margin-block-end: 0.25rem;
  display: block;
}

.check-item p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.check-item p em {
  color: var(--accent-cyan);
}

/* ── AI Analysis Styles ── */
.btn-ai {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  border-color: #7c3aed;
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(124, 58, 237, 0.25);
}

.btn-ai:hover:not(:disabled) {
  background: linear-gradient(135deg, #6d28d9, #4338ca);
  box-shadow: 0 4px 18px rgba(124, 58, 237, 0.35);
  transform: translateY(-2px);
}

.ai-analysis-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-block-start: 0.5rem;
}

.ai-section-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ai-section-divider::before,
.ai-section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(124, 58, 237, 0.2);
}

.ai-section-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7c3aed;
  white-space: nowrap;
  background: rgba(124, 58, 237, 0.06);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 9999px;
  padding: 0.2rem 0.75rem;
}

.ai-loading-panel {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.04), rgba(3, 194, 252, 0.04));
  border-color: rgba(124, 58, 237, 0.2);
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

.ai-progress-phase {
  display: flex;
  align-items: center;
}

.phase-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
}

.phase-batch {
  background: rgba(124, 58, 237, 0.08);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.phase-summary {
  background: rgba(6, 182, 212, 0.08);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.ai-error-panel {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-color: rgba(185, 28, 28, 0.3);
  background: rgba(185, 28, 28, 0.04);
  color: var(--accent-red);
}

.ai-error-panel strong {
  display: block;
  margin-block-end: 0.25rem;
  color: var(--accent-red);
}

/* Premium Gating Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 15, 30, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  max-width: 500px;
  width: 100%;
  background: #ffffff;
  border-radius: var(--border-radius-lg);
  border-top: 4px solid #7c3aed;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header-ai {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 0.75rem;
}

.modal-header-ai h3 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

.lock-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.btn-close {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.modal-body-ai {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-body-ai p {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.warning-callout {
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.15);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.modal-features {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.feat-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.88rem;
  color: var(--text-primary);
  font-weight: 500;
}

.feat-row .check {
  color: #7c3aed;
  font-weight: bold;
}

.modal-footer-ai {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 1.25rem;
}

.w-full {
  width: 100%;
}

/* ── Paper Test Mode Styles ── */
.btn-paper-test {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  color: white !important;
  border: none !important;
  font-weight: 700;
}
.btn-paper-test:hover {
  background: linear-gradient(135deg, #d97706, #b45309) !important;
  transform: translateY(-1px);
}
.paper-mode-banner {
  display: flex; align-items: center; gap: 0.75rem; margin-block-end: 1rem; flex-wrap: wrap;
}
.paper-mode-hint {
  font-size: 0.85rem; color: var(--text-secondary); font-style: italic;
}
.paper-display-view, .upload-container, .review-container {
  border-block-start: 4px solid var(--accent-gold, #f59e0b);
}
.paper-instruction-box {
  margin-block-start: 1.5rem; padding: 1rem 1.25rem;
  background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--border-radius-sm); text-align: center; font-size: 0.95rem; color: var(--text-secondary);
}
.upload-instruction { color: var(--text-secondary); margin-block-end: 1.5rem; }
.review-desc { color: var(--text-secondary); margin-block-end: 1rem; }
.review-table-wrapper {
  max-height: 500px; overflow-y: auto; border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm); margin-block-end: 1rem;
}
.review-textarea {
  width: 100%; font-size: 0.9rem; padding: 0.35rem 0.5rem;
  background: var(--bg-panel-solid, #fff); border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm); resize: vertical;
}
.review-textarea:focus { outline: 2px solid var(--accent-cyan); border-color: transparent; }
.blank-row { background: rgba(239, 68, 68, 0.04); }
.blank-row .review-textarea { border-color: rgba(239, 68, 68, 0.3); }
.review-actions {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;
}
.situation-col { font-size: 0.85rem; max-width: 300px; }
</style>
