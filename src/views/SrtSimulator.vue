<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'
import { useAiAnalysis } from '../composables/useAiAnalysis.js'
import AiAnalysisReport from '../components/AiAnalysisReport.vue'

const store = usePreparationStore()
const router = useRouter()

// AI Analysis
const { isAnalyzing, analysisResult, analysisError, currentProvider, analyzeSRT, resetAnalysis } = useAiAnalysis()
const showAiReport = ref(false)

const triggerAiAnalysis = async () => {
  showAiReport.value = true
  await analyzeSRT(responses.value)
}

const testState = ref('setup') // 'setup', 'active', 'results'
const timerDuration = ref(30) // 30 seconds per situation
const currentIndex = ref(0)
const currentInput = ref('')
const responses = ref([]) // Array of { situation, text, timeOut }

const timeLeft = ref(30)
let timerInterval = null

const situations = [
  {
    id: 1,
    desc: 'He was returning home late at night on a lonely road when he heard cries of help coming from a dark lane... He',
  },
  {
    id: 2,
    desc: 'He was appointing a helper for his GTO command task, but his team members rejected his choice and selected his rival... He',
  },
  {
    id: 3,
    desc: 'He got separated from his trekking team in a thick forest with no mobile network coverage, and night was falling fast... He',
  },
  {
    id: 4,
    desc: 'He was falsely accused by his college teacher of cheating in the final exam, which could lead to suspension... He',
  },
  {
    id: 5,
    desc: 'His mother fell seriously ill on the night before his final PMA entry test, and there was no one else at home... He',
  },
]

const startTest = () => {
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
  const currentSit = situations[currentIndex.value]

  responses.value.push({
    id: currentSit.id,
    situation: currentSit.desc,
    text: isTimeOut ? '' : currentInput.value.trim(),
    timeOut: isTimeOut,
  })

  currentInput.value = ''

  if (currentIndex.value < situations.length - 1) {
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

  // Save in store
  store.saveSrtSession({
    date: new Date().toLocaleString(),
    responses: responses.value,
  })
}

const goToRoadmap = () => {
  router.push('/roadmap')
}

onUnmounted(() => {
  clearInterval(timerInterval)
})

const totalAnswered = computed(() => {
  return responses.value.filter((r) => !r.timeOut && r.text.length > 0).length
})
</script>

<template>
  <div class="srt-wrapper">
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
          <label class="form-label">Total Situations</label>
          <span class="badge badge-cyan">{{ situations.length }} Scenarios loaded</span>
        </div>
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

      <div class="flex-center">
        <button class="btn btn-primary btn-large" @click="startTest">
          <span>START SRT SESSION</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="btn-icon"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ACTIVE SIMULATOR VIEW -->
    <div class="active-container glass-card" v-if="testState === 'active'">
      <div class="simulator-header">
        <span class="progress-indicator"
          >SITUATION {{ currentIndex + 1 }} OF {{ situations.length }}</span
        >

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

        <!-- Loading state -->
        <div v-if="isAnalyzing" class="ai-loading-panel glass-card">
          <div class="ai-spinner"></div>
          <div class="ai-loading-text">
            <strong>Analyzing your SRT reactions...</strong>
            <span>Evaluating situations for leadership, realism, and social intelligence</span>
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
  </div>
</template>

<style scoped>
.srt-wrapper {
  inline-size: 100%;
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

.ai-error-panel p {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
