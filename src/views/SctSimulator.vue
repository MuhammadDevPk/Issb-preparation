<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'
import { useAiAnalysis } from '../composables/useAiAnalysis.js'
import AiAnalysisReport from '../components/AiAnalysisReport.vue'
import { sctSheets, getRandomSctStarters } from '../data/issbTestData.js'

import { useAuthStore } from '../stores/auth'

const store = usePreparationStore()
const router = useRouter()
const authStore = useAuthStore()

// AI Analysis
const { isAnalyzing, analysisResult, analysisError, currentProvider, analyzeSCT, resetAnalysis } = useAiAnalysis()
const showAiReport = ref(false)
const showUpgradeModal = ref(false)

const isApproved = computed(() => {
  const p = authStore.profile
  const isTrialActive = p?.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now()
  return p?.status === 'approved' || p?.role === 'admin' || isTrialActive
})

const triggerAiAnalysis = async () => {
  if (!isApproved.value) {
    showUpgradeModal.value = true
    return
  }
  showAiReport.value = true
  // Build responses from currentStarters + completions at time of call
  const responses = currentStarters.value.map((starter, idx) => ({
    index: idx + 1,
    prompt: starter,
    text: completions.value[idx]?.trim() ?? '',
  }))
  await analyzeSCT(responses, selectedLanguage.value)
}

const testState = ref('setup') // 'setup', 'active', 'results'
const selectedLanguage = ref('english') // 'english', 'urdu'
const selectedSheetId = ref('eng_sheet_a')
const timerLeft = ref(360) // 6 minutes (360s) for 26 sentences
let testTimer = null

// Watch language change to set default sheet
watch(selectedLanguage, (newLang) => {
  if (newLang === 'english') {
    selectedSheetId.value = 'eng_sheet_a'
  } else {
    selectedSheetId.value = 'urdu_sheet_a'
  }
})

const availableSheets = computed(() => {
  return sctSheets[selectedLanguage.value] || []
})

const selectedSheetDescription = computed(() => {
  if (selectedSheetId.value === 'random_mix') {
    return 'Generates a random selection of 26 sentence starters from the pool, ensuring unique runs.'
  }
  const sheet = availableSheets.value.find((s) => s.id === selectedSheetId.value)
  return sheet ? sheet.description : ''
})

const activeStarters = ref([])

const currentStarters = computed(() => {
  return activeStarters.value
})

const completions = ref(Array(26).fill(''))

const startTest = () => {
  if (selectedSheetId.value === 'random_mix') {
    activeStarters.value = getRandomSctStarters(selectedLanguage.value, 26)
  } else {
    const sheet = availableSheets.value.find((s) => s.id === selectedSheetId.value)
    activeStarters.value = sheet ? [...sheet.starters] : []
  }

  completions.value = Array(activeStarters.value.length).fill('')
  testState.value = 'active'
  timerLeft.value = 360

  clearInterval(testTimer)
  testTimer = setInterval(() => {
    timerLeft.value--
    if (timerLeft.value <= 0) {
      submitSheet()
    }
  }, 1000)
}

const submitSheet = () => {
  clearInterval(testTimer)
  testState.value = 'results'
  showAiReport.value = false
  resetAnalysis()

  // Format responses
  const formattedResponses = currentStarters.value.map((starter, idx) => {
    return {
      index: idx + 1,
      prompt: starter,
      text: completions.value[idx].trim(),
    }
  })

  // Save in Pinia
  store.saveSctSession({
    date: new Date().toLocaleString(),
    language: selectedLanguage.value,
    responses: formattedResponses,
  })
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

const goToRoadmap = () => {
  router.push('/roadmap')
}

onUnmounted(() => {
  clearInterval(testTimer)
})

// Analytics calculations
const completedCount = computed(() => {
  return completions.value.filter((c) => c.trim().length > 0).length
})

const timeTaken = computed(() => {
  return 360 - timerLeft.value
})
</script>

<template>
  <div class="sct-wrapper">
    <!-- SETUP SCREEN -->
    <div class="setup-container glass-card" v-if="testState === 'setup'">
      <span class="badge badge-cyan">Psychology Simulators</span>
      <h2>Sentence Completion Test (SCT) Simulator</h2>
      <p>
        The Sentence Completion Test evaluates emotional conflicts, maturity, family relationships,
        and social adjustment. In ISSB, you get **26 incomplete sentences** and exactly **6
        minutes** to finish them. Complete them fast and naturally.
      </p>

      <div class="config-panel">
        <div class="form-group">
          <label class="form-label">Select Language</label>
          <div class="lang-selector">
            <button class="btn" :class="selectedLanguage === 'english' ? 'btn-primary' : 'btn-secondary'"
              @click="selectedLanguage = 'english'">
              English Sheet
            </button>
            <button class="btn ml-2" :class="selectedLanguage === 'urdu' ? 'btn-primary' : 'btn-secondary'"
              @click="selectedLanguage = 'urdu'">
              Roman Urdu
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Select Completion Sheet</label>
          <select class="form-select" v-model="selectedSheetId">
            <option v-for="sheet in availableSheets" :key="sheet.id" :value="sheet.id">
              {{ sheet.name }}
            </option>
            <option value="random_mix">Randomized Custom Mix</option>
          </select>
        </div>
      </div>

      <div class="set-desc-panel" v-if="selectedSheetDescription">
        <span class="desc-title">Focus:</span>
        <span class="desc-content">{{ selectedSheetDescription }}</span>
      </div>

      <div class="tactical-tips border-gold">
        <h5>SCT Strategic Guidance:</h5>
        <ul>
          <li>
            <strong>Complete Every Sentence:</strong> Leaving blank sheets displays hesitation or
            emotional blockages. Work at a speed of ~14s per sentence.
          </li>
          <li>
            <strong>Show Active Agency:</strong> Write completions showing resolution, work, or
            duty. (e.g. for "He failed because" -> write
            <em>"his efforts were insufficient but he resolved to try harder"</em>).
          </li>
          <li>
            <strong>Family Harmony:</strong> For "My father", write highly positive/respectful
            sentences showing good upbringing.
          </li>
        </ul>
      </div>

      <div class="flex-center">
        <button class="btn btn-primary btn-large" @click="startTest">
          <span>START 6-MINUTE TIMED RUN</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ACTIVE WORKSPACE SCREEN -->
    <div class="active-container glass-card" v-if="testState === 'active'">
      <div class="simulator-header">
        <div>
          <h2>SCT Practice Run ({{ selectedLanguage.toUpperCase() }})</h2>
          <span class="progress-indicator">
            COMPLETED: {{ completedCount }} / {{ currentStarters.length }}
            <span class="remaining-count" style="font-size: 0.85rem; color: var(--accent-cyan); opacity: 0.8; margin-inline-start: 0.5rem;">
              ({{ currentStarters.length - completedCount }} left)
            </span>
          </span>
        </div>
        <div class="timer-display glass-card" :class="{ 'warning-timer': timerLeft < 60 }">
          <span class="lbl">TIME LEFT</span>
          <span class="val text-glow">{{ formatTime(timerLeft) }}</span>
        </div>
      </div>

      <!-- Scrollable sheets -->
      <div class="sheets-board">
        <div v-for="(starter, index) in currentStarters" :key="index" class="sentence-row">
          <span class="row-num">{{ index + 1 }}.</span>
          <span class="starter-label">{{ starter }}...</span>
          <input type="text" class="form-input sentence-input" v-model="completions[index]"
            placeholder="Type completion..." :tabindex="index + 1" />
        </div>
      </div>

      <div class="footer-actions flex-center">
        <button class="btn btn-success btn-large" @click="submitSheet">
          <span>SUBMIT WORKSPACE SHEET</span>
        </button>
      </div>
    </div>

    <!-- RESULTS ANALYTICS SCREEN -->
    <div class="results-container glass-card" v-if="testState === 'results'">
      <div class="results-header">
        <div>
          <h2>Workspace Analysis Completed!</h2>
          <span class="badge badge-green">Added to Practice Records (+100 XP)</span>
        </div>
        <div class="actions">
          <button class="btn btn-secondary mr-2" @click="testState = 'setup'; showAiReport = false; resetAnalysis()">
            Select Another Sheet
          </button>
          <button class="btn btn-ai" :disabled="isAnalyzing" @click="triggerAiAnalysis"
            title="Get AI-powered ISSB psychological analysis">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
              <circle cx="9" cy="13" r="1" fill="currentColor" />
              <circle cx="15" cy="13" r="1" fill="currentColor" />
            </svg>
            {{ isAnalyzing ? 'Analyzing...' : 'Analyze with AI' }}
          </button>
          <button class="btn btn-primary" @click="goToRoadmap">Return to Roadmap</button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="results-metrics grid-3">
        <div class="glass-card metric-item border-blue">
          <span class="lbl">Unfinished Sentences</span>
          <span class="val" :class="26 - completedCount > 2 ? 'text-red' : 'text-green'">{{
            26 - completedCount
            }}</span>
          <span class="desc">Aim for 0 to 2 blank sheets max.</span>
        </div>
        <div class="glass-card metric-item border-green">
          <span class="lbl">Time Elapsed</span>
          <span class="val text-glow">{{ formatTime(timeTaken) }}</span>
          <span class="desc">Completed sheet in safe time.</span>
        </div>
        <div class="glass-card metric-item border-gold">
          <span class="lbl">Accuracy Rate</span>
          <span class="val">{{ Math.round((completedCount / 26) * 100) }}%</span>
          <span class="desc">Reflects fast decision-making logic.</span>
        </div>
      </div>

      <!-- Self Evaluation Split -->
      <div class="evaluation-grid grid-2">
        <!-- List of responses -->
        <div class="glass-card table-panel">
          <h3>Completed Sheet Review</h3>
          <div class="table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Incomplete Sentence</th>
                  <th>Your Completion</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(starter, idx) in currentStarters" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td class="starter-col">{{ starter }}...</td>
                  <td class="completion-col">
                    <span v-if="!completions[idx].trim()" class="text-red italic">Left Empty (Timed Out)</span>
                    <span v-else class="text-highlight"><strong>{{ completions[idx] }}</strong></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Audit Guide -->
        <div class="glass-card psychology-tips-panel">
          <h3>SCT Psychological Evaluation Checklist</h3>
          <p class="desc">
            Examine your completed sentences. A selection officer checks for the following emotional
            traits:
          </p>

          <div class="checklist">
            <div class="check-item border-red">
              <strong class="text-red">Avoid Dependency & Passivity:</strong>
              <p>
                For sentences like "He wanted to", writing "he wanted to go home to sleep" shows
                lazy mindset. Opt for constructive ambition:
                <em>"He wanted to complete his studies with distinction."</em>
              </p>
            </div>

            <div class="check-item border-gold">
              <strong class="text-gold">Keep Social Relationships Healthy:</strong>
              <p>
                For "My mother always", writing "scolds me" shows resentment or family distress.
                Write warm, cooperative relations:
                <em>"My mother always advises me to speak the truth."</em>
              </p>
            </div>

            <div class="check-item border-green">
              <strong class="text-green">Dynamic Decision Under Stress:</strong>
              <p>
                For "During crisis", writing "he got afraid" shows weakness. Opt for proactive grit:
                <em>"During crisis, he stayed calm and helped others."</em>
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
              <path
                d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            </svg>
            AI Psychological Analysis — SCT
          </span>
        </div>

        <!-- Loading state -->
        <div v-if="isAnalyzing" class="ai-loading-panel glass-card">
          <div class="ai-spinner"></div>
          <div class="ai-loading-text">
            <strong>Analyzing your SCT responses...</strong>
            <span>Evaluating 26 sentence completions for emotional patterns &amp; social adjustment</span>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="analysisError" class="ai-error-panel glass-card">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <div>
            <strong>Analysis Failed</strong>
            <p>{{ analysisError }}</p>
            <button class="btn btn-secondary" @click="triggerAiAnalysis"
              style="margin-top: 0.75rem; font-size: 0.85rem;">Retry</button>
          </div>
        </div>

        <!-- Results -->
        <AiAnalysisReport v-else-if="analysisResult" :result="analysisResult" test-type="SCT"
          :provider-name="currentProvider" />
      </div>
    </div>

    <!-- Premium Upgrade Modal -->
    <div class="modal-overlay" v-if="showUpgradeModal" @click.self="showUpgradeModal = false">
      <div class="modal-card glass-card fade-in">
        <div class="modal-header-ai">
          <div class="flex items-center gap-2">
            <span class="lock-icon">🔒</span>
            <h3>Unlock AI Psychologist Assessor</h3>
          </div>
          <button class="btn-close" @click="showUpgradeModal = false">&times;</button>
        </div>
        <div class="modal-body-ai">
          <p>
            Your simulator test answers have been logged, but the <strong>AI Psychological Analysis Report</strong> is a Premium Feature.
          </p>
          <div class="warning-callout">
            <strong>⚠️ Psychologist Warning:</strong> Faking answers or copying guidebook textbook replies gets you rejected immediately by selection board psychologists. Our AI Psychologist scans your responses to locate escape, passivity, or conflict patterns and provides rephrasing suggestions.
          </div>
          <div class="modal-features">
            <div class="feat-row"><span class="check">✓</span> <span>Finds hidden psychology flaws & red flags.</span></div>
            <div class="feat-row"><span class="check">✓</span> <span>Detailed Officer-Like Qualities (OLQ) grade score.</span></div>
            <div class="feat-row"><span class="check">✓</span> <span>Provides exact corrected sentence completions and rephrasings.</span></div>
          </div>
        </div>
        <div class="modal-footer-ai">
          <button class="btn btn-ai shadow-glow-purple w-full" @click="router.push('/status')">
            Get Premium Pass (or Rs. 100 via referrals)
          </button>
          <button class="btn btn-secondary w-full" @click="showUpgradeModal = false">
            Close & Review Sheet Manually
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sct-wrapper {
  width: 100%;
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
  background: var(--bg-panel-solid);
  padding: 1.25rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.lang-selector {
  display: flex;
  gap: 1rem;
  margin-block-start: 0.5rem;
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

.ml-2 {
  margin-inline-start: 0.75rem;
}

/* Active Workspace Sheet */
.active-container {
  min-block-size: 500px;
}

.simulator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-block-end: 1px solid rgba(255, 255, 255, 0.05);
  padding-block-end: 1rem;
}

.progress-indicator {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  color: var(--text-muted);
}

.timer-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 0.5rem 1.5rem;
  border: 1px solid var(--border-color);
  min-inline-size: 120px;
}

.timer-display .lbl {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.timer-display .val {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--accent-cyan);
}

.timer-display.warning-timer {
  border-color: var(--accent-red);
}

.timer-display.warning-timer .val {
  color: var(--accent-red);
}

.sheets-board {
  max-block-size: 450px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sentence-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: var(--bg-panel);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
}

.sentence-row:focus-within {
  border-color: var(--accent-cyan);
  background: var(--bg-panel-solid);
}

.row-num {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--text-muted);
  width: 25px;
}

.starter-label {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  color: var(--accent-cyan);
  min-inline-size: 180px;
  text-align: right;
  padding-inline-end: 0.5rem;
}

.sentence-input {
  flex: 1;
}

.footer-actions {
  margin-block-start: 1rem;
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

.starter-col {
  font-family: var(--font-heading);
  font-weight: 500;
  color: var(--text-secondary);
}

.completion-col {
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

.ai-loading-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ai-loading-text strong {
  color: var(--text-primary);
  font-size: 0.95rem;
}

.ai-loading-text span {
  color: var(--text-muted);
  font-size: 0.82rem;
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
</style>
