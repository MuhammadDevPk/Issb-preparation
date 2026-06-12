<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'

const store = usePreparationStore()
const router = useRouter()

// Standard word list for WAT practice
const defaultWords = [
  'Country',
  'Defeat',
  'Love',
  'Atom',
  'Fear',
  'Duty',
  'Trust',
  'Aggressive',
  'Fail',
  'Work',
  'Soldier',
  'Injustice',
  'Brave',
  'Death',
  'Team',
  'Success',
  'Cheat',
  'Lead',
  'Goal',
  'Pride',
  'Sad',
  'Bribe',
  'Force',
  'Peace',
  'Enemy',
]

const testState = ref('setup') // 'setup', 'active', 'results'
const timerDuration = ref(10) // default 10 seconds
const wordList = ref([...defaultWords])
const currentIndex = ref(0)
const currentInput = ref('')
const responses = ref([]) // Array of { word, text, timeOut }

const timeLeft = ref(10)
let timerInterval = null

const startTest = () => {
  currentIndex.value = 0
  responses.value = []
  currentInput.value = ''
  testState.value = 'active'
  startWordTimer()
}

const startWordTimer = () => {
  timeLeft.value = timerDuration.value
  clearInterval(timerInterval)

  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      submitSentence(true)
    }
  }, 1000)
}

const submitSentence = (isTimeOut = false) => {
  const currentWord = wordList.value[currentIndex.value]

  responses.value.push({
    word: currentWord,
    text: isTimeOut ? '' : currentInput.value.trim(),
    timeOut: isTimeOut,
  })

  currentInput.value = ''

  if (currentIndex.value < wordList.value.length - 1) {
    currentIndex.value++
    startWordTimer()
  } else {
    endTest()
  }
}

const handleKeyPress = (e) => {
  if (e.key === 'Enter') {
    submitSentence(false)
  }
}

const endTest = () => {
  clearInterval(timerInterval)
  testState.value = 'results'

  // Save to Pinia store
  store.saveWatSession({
    date: new Date().toLocaleString(),
    responses: responses.value,
  })
}

const resetTest = () => {
  testState.value = 'setup'
}

const goToRoadmap = () => {
  router.push('/roadmap')
}

onUnmounted(() => {
  clearInterval(timerInterval)
})

// Analytics calculations
const totalBlank = computed(() => {
  return responses.value.filter((r) => r.timeOut || !r.text).length
})

const avgLength = computed(() => {
  const typed = responses.value.filter((r) => !r.timeOut && r.text)
  if (typed.length === 0) return 0
  const sum = typed.reduce((acc, curr) => acc + curr.text.split(' ').length, 0)
  return Math.round((sum / typed.length) * 10) / 10
})
</script>

<template>
  <div class="wat-wrapper">
    <!-- SETUP VIEW -->
    <div class="setup-container glass-card" v-if="testState === 'setup'">
      <span class="badge badge-cyan">Psychology Simulators</span>
      <h2>Word Association Test (WAT) Simulator</h2>
      <p>
        The Word Association Test flashes words for exactly **10 seconds** each. You must write a
        complete, positive, and spontaneous sentence. Leaving blank sentences or writing faked
        positive sentences reflects negative psychology.
      </p>

      <div class="config-panel">
        <div class="form-group">
          <label class="form-label">Time Per Word</label>
          <select class="form-select" v-model.number="timerDuration">
            <option :value="10">10 Seconds (Standard ISSB)</option>
            <option :value="15">15 Seconds (Beginner Mode)</option>
            <option :value="8">8 Seconds (Hard Mode)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Total Words</label>
          <div class="badge-row">
            <span class="badge badge-cyan">{{ wordList.length }} Words loaded</span>
          </div>
        </div>
      </div>

      <div class="tactical-tips border-gold">
        <h5>GTO & Psychologist Tips:</h5>
        <ul>
          <li>
            Avoid copying sentences from guides (e.g. for "Atom" -> "Atom is a small particle" is a
            textbook definition, show action instead).
          </li>
          <li>
            Never write double negatives (e.g. for "Fail" -> "He did not fail" shows defensive
            avoidance).
          </li>
          <li>Spontaneity indicates truth. Type the first positive thought that comes to mind.</li>
        </ul>
      </div>

      <div class="flex-center">
        <button class="btn btn-primary btn-large" @click="startTest">
          <span>START SIMULATION</span>
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
        <span class="progress-indicator">WORD {{ currentIndex + 1 }} OF {{ wordList.length }}</span>

        <!-- Timer ring -->
        <div class="mini-timer">
          <svg viewBox="0 0 36 36" class="timer-svg">
            <circle
              class="timer-bg"
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#e2e8f0"
              stroke-width="3"
            />
            <circle
              class="timer-progress"
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="var(--accent-cyan)"
              stroke-width="3"
              :stroke-dasharray="2 * Math.PI * 16"
              :stroke-dashoffset="2 * Math.PI * 16 * (1 - timeLeft / timerDuration)"
            />
          </svg>
          <span class="timer-text text-glow">{{ timeLeft }}s</span>
        </div>
      </div>

      <div class="word-display-area">
        <h1 class="flash-word text-glow">{{ wordList[currentIndex] }}</h1>
      </div>

      <div class="input-area">
        <input
          type="text"
          class="form-input text-field"
          v-model="currentInput"
          @keypress="handleKeyPress"
          placeholder="Write sentence here and press ENTER..."
          ref="inputRef"
          autofocus
        />
        <span class="hint-label">Press ENTER to skip / submit instantly.</span>
      </div>
    </div>

    <!-- RESULTS REVIEW VIEW -->
    <div class="results-container glass-card" v-if="testState === 'results'">
      <div class="results-header">
        <div>
          <h2>Simulation Completed!</h2>
          <span class="badge badge-green">Saved to Logs (+100 XP)</span>
        </div>
        <div class="actions">
          <button class="btn btn-secondary mr-2" @click="resetTest">Retake Test</button>
          <button class="btn btn-primary" @click="goToRoadmap">Back to Roadmap</button>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="results-metrics grid-3">
        <div class="glass-card metric-item border-blue">
          <span class="lbl">Blank Sentences</span>
          <span class="val" :class="totalBlank > 3 ? 'text-red' : 'text-green'">{{
            totalBlank
          }}</span>
          <span class="desc">Aim for 0 to 2 blank sheets max.</span>
        </div>
        <div class="glass-card metric-item border-green">
          <span class="lbl">Avg Word Count</span>
          <span class="val text-glow">{{ avgLength }} words</span>
          <span class="desc">Aim for 4 to 7 words per sentence.</span>
        </div>
        <div class="glass-card metric-item border-gold">
          <span class="lbl">Words Answered</span>
          <span class="val">{{ wordList.length - totalBlank }} / {{ wordList.length }}</span>
          <span class="desc">High completion indicates quick mind.</span>
        </div>
      </div>

      <!-- Self-Evaluation Grid -->
      <div class="evaluation-grid grid-2">
        <div class="glass-card table-panel">
          <h3>Your Responses</h3>
          <div class="table-container">
            <table class="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Word</th>
                  <th>Your Sentence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(res, index) in responses" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td class="word-col">{{ res.word }}</td>
                  <td class="text-col">
                    <span v-if="res.timeOut" class="text-red italic">No response (Timed Out)</span>
                    <span v-else>{{ res.text }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="res.timeOut ? 'badge-red' : 'badge-green'">
                      {{ res.timeOut ? 'TIMEOUT' : 'DONE' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="glass-card psychology-tips-panel">
          <h3>Psychologist's Audit Guide</h3>
          <p class="desc">
            Self-audit your sentences against these core ISSB rules. A recommended candidate adapts
            healthy psychology:
          </p>

          <div class="checklist">
            <div class="check-item border-red">
              <strong class="text-red">Avoid Denial / Escape:</strong>
              <p>
                For words like "Sorrow" or "Fail", writing "I am never sad" or "He did not fail"
                displays a defensive attitude. Accept the negative word but resolve it dynamically:
                <em>"Accepting sorrow makes us stronger."</em>
              </p>
            </div>

            <div class="check-item border-gold">
              <strong class="text-gold">Avoid Textbook/Universal Definitions:</strong>
              <p>
                Writing "Love is a great feeling" or "Country is Pakistan" shows superficial
                intelligence. Write action-centered personal traits:
                <em>"Hard work builds a prosperous country."</em>
              </p>
            </div>

            <div class="check-item border-green">
              <strong class="text-green">Opt for Positive Duty:</strong>
              <p>
                Look for Officer Like Qualities in your statements. Write active, positive outcomes:
                <em>"Soldiers defend the borders with pride."</em>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wat-wrapper {
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

.badge-row {
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

/* Simulator Active Screen */
.active-container {
  min-block-size: 400px;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  padding-block: 3rem;
}

.simulator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.progress-indicator {
  font-family: var(--font-heading);
  font-size: 1rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}

.mini-timer {
  position: relative;
  inline-size: 50px;
  block-size: 50px;
}

.timer-svg {
  transform: rotate(-90deg);
  inline-size: 100%;
  block-size: 100%;
}

.timer-progress {
  stroke-linecap: round;
  transition: stroke-dashoffset 0.1s linear;
}

.timer-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent-cyan);
}

.word-display-area {
  margin-block: 3rem;
}

.flash-word {
  font-size: 4rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.input-area {
  width: 100%;
  max-width: 600px;
}

.text-field {
  text-align: center;
  font-size: 1.25rem;
  padding: 1rem;
}

.hint-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-block-start: 0.5rem;
  display: block;
}

/* Results panel styles */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
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
  max-block-size: 400px;
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
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
}

.results-table th {
  background: var(--bg-panel-solid);
  font-family: var(--font-heading);
  font-weight: 500;
  color: var(--text-secondary);
}

.word-col {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--accent-cyan);
}

.text-col {
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
</style>
