<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'
import { useAiAnalysis } from '../composables/useAiAnalysis.js'
import AiAnalysisReport from '../components/AiAnalysisReport.vue'
import { watSheets, getRandomWatWords, watUrduMeanings } from '../data/issbTestData.js'

import { useAuthStore } from '../stores/auth'

const store = usePreparationStore()
const router = useRouter()
const authStore = useAuthStore()

// AI Analysis
const { isAnalyzing, analysisResult, analysisError, currentProvider, analyzeWAT, resetAnalysis } = useAiAnalysis()
const showAiReport = ref(false)
const showUpgradeModal = ref(false)

const isApproved = computed(() => {
  const p = authStore.profile
  const isTrialActive = p?.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now()
  return p?.status === 'approved' || p?.role === 'admin' || isTrialActive
})

const currentSessionDate = ref(null)

const triggerAiAnalysis = async () => {
  if (!isApproved.value) {
    showUpgradeModal.value = true
    return
  }
  showAiReport.value = true
  await analyzeWAT(responses.value)
  if (analysisResult.value) {
    store.updateWatSessionAi(currentSessionDate.value, analysisResult.value)
  }
}

const viewPastSession = (session) => {
  currentSessionDate.value = session.date
  wordList.value = session.wordList || session.responses.map((r) => r.word)
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

const testState = ref('setup') // 'setup', 'active', 'results'
const timerDuration = ref(10) // default 10 seconds
const selectedSetId = ref('repeated_1')
const customWordCount = ref(50)
const showVocab = ref(false)
const vocabSearchQuery = ref('')

const selectedSetDescription = computed(() => {
  if (selectedSetId.value === 'random_mix') {
    return 'Generates a random selection of words from the entire database, ensuring no two runs are identical.'
  }
  const sheet = watSheets.find((s) => s.id === selectedSetId.value)
  return sheet ? sheet.description : ''
})

const previewWordCount = computed(() => {
  if (selectedSetId.value === 'random_mix') {
    return customWordCount.value
  }
  const sheet = watSheets.find((s) => s.id === selectedSetId.value)
  return sheet ? sheet.words.length : 0
})

const filteredVocab = computed(() => {
  const query = vocabSearchQuery.value.trim().toLowerCase()
  const allWords = Object.keys(watUrduMeanings)
  if (!query) return allWords
  return allWords.filter((w) => {
    const wordMatches = w.toLowerCase().includes(query)
    const meaningMatches = (watUrduMeanings[w] || '').includes(query)
    return wordMatches || meaningMatches
  })
})

const wordList = ref([...watSheets[0].words])
const currentIndex = ref(0)
const currentInput = ref('')
const responses = ref([]) // Array of { word, text, timeOut }

const timeLeft = ref(10)
let timerInterval = null

const startTest = () => {
  if (selectedSetId.value === 'random_mix') {
    wordList.value = getRandomWatWords(customWordCount.value)
  } else {
    const sheet = watSheets.find((s) => s.id === selectedSetId.value)
    wordList.value = sheet ? [...sheet.words] : [...watSheets[0].words]
  }

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
  showAiReport.value = false
  resetAnalysis()

  const dateStr = new Date().toLocaleString()
  currentSessionDate.value = dateStr

  // Save to Pinia store
  store.saveWatSession({
    date: dateStr,
    responses: responses.value,
    selectedSetId: selectedSetId.value,
    wordList: wordList.value,
  })
}

const resetTest = () => {
  testState.value = 'setup'
  showAiReport.value = false
  resetAnalysis()
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
          <label class="form-label">Select Practice Set</label>
          <select class="form-select" v-model="selectedSetId">
            <option v-for="sheet in watSheets" :key="sheet.id" :value="sheet.id">
              {{ sheet.name }}
            </option>
            <option value="random_mix">Randomized Custom Mix</option>
          </select>
        </div>

        <div class="form-group" v-if="selectedSetId === 'random_mix'">
          <label class="form-label">Word Count</label>
          <select class="form-select" v-model.number="customWordCount">
            <option :value="25">25 Words (Short Practice)</option>
            <option :value="50">50 Words (Standard Run)</option>
            <option :value="100">100 Words (Full Mock Exam)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Total Words</label>
          <div class="badge-row">
            <span class="badge badge-cyan">{{ previewWordCount }} Words loaded</span>
          </div>
        </div>
      </div>

      <div class="set-desc-panel" v-if="selectedSetDescription">
        <span class="desc-title">Focus:</span>
        <span class="desc-content">{{ selectedSetDescription }}</span>
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

      <div class="flex-center setup-actions" style="gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-secondary btn-large" @click="showVocab = !showVocab">
          <span>📖 {{ showVocab ? 'HIDE VOCABULARY' : 'STUDY VOCABULARY' }}</span>
        </button>
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

      <!-- Vocabulary Study Panel -->
      <div class="vocab-panel" v-if="showVocab">
        <div class="vocab-header">
          <h3>WAT Vocabulary Study Guide</h3>
          <input
            type="text"
            class="form-input vocab-search"
            v-model="vocabSearchQuery"
            placeholder="Search words or meanings..."
          />
        </div>
        <div class="vocab-list-wrapper">
          <div class="vocab-grid">
            <div
              v-for="word in filteredVocab"
              :key="word"
              class="vocab-card"
            >
              <span class="vocab-en">{{ word }}</span>
              <span class="vocab-ur">{{ watUrduMeanings[word] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Past Sessions Panel -->
      <div class="history-panel" v-if="store.watSessions.length > 0">
        <h3 class="history-title">📜 Your Past Practice Sessions</h3>
        <div class="history-list">
          <div v-for="session in store.watSessions" :key="session.date" class="history-item">
            <div class="history-meta">
              <span class="history-date">{{ session.date }}</span>
              <span class="history-details">
                {{ session.responses ? session.responses.length : 0 }} Words | 
                Set: {{ session.selectedSetId === 'random_mix' ? 'Random Mix' : (watSheets.find(s => s.id === session.selectedSetId)?.name || 'Custom') }}
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
          WORD {{ currentIndex + 1 }} OF {{ wordList.length }}
          <span class="remaining-count">({{ wordList.length - currentIndex - 1 }} left)</span>
        </span>

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
        <span class="urdu-meaning">{{ watUrduMeanings[wordList[currentIndex]] || '' }}</span>
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

      <!-- ── AI Analysis Section ── -->
      <div v-if="showAiReport" class="ai-analysis-section">
        <div class="ai-section-divider">
          <span class="ai-section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            </svg>
            AI Psychological Analysis — WAT
          </span>
        </div>

        <!-- Loading state -->
        <div v-if="isAnalyzing" class="ai-loading-panel glass-card">
          <div class="ai-spinner"></div>
          <div class="ai-loading-text">
            <strong>Analyzing your WAT responses...</strong>
            <span>Evaluating {{ responses.length }} sentences against ISSB psychological standards</span>
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
          test-type="WAT"
          :provider-name="currentProvider"
        />
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
.wat-wrapper {
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

.remaining-count {
  font-size: 0.85rem;
  color: var(--accent-cyan);
  opacity: 0.8;
  margin-inline-start: 0.5rem;
  font-weight: 500;
}

.urdu-meaning {
  display: block;
  font-size: 2.2rem;
  color: var(--text-secondary);
  margin-block-start: 1rem;
  font-family: 'Noto Nastaliq Urdu', 'Urdu Typesetting', serif;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.setup-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.vocab-panel {
  margin-top: 1.5rem;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  text-align: left;
}

.vocab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.vocab-header h3 {
  font-size: 1.2rem;
  color: var(--accent-cyan);
  margin: 0;
}

.vocab-search {
  max-width: 300px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

.vocab-list-wrapper {
  max-height: 250px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.vocab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.vocab-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  text-align: center;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.vocab-card:hover {
  border-color: var(--accent-cyan);
  transform: translateY(-2px);
}

.vocab-en {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.vocab-ur {
  font-size: 1.15rem;
  color: var(--text-secondary);
  font-family: 'Noto Nastaliq Urdu', 'Urdu Typesetting', serif;
  margin-top: 0.25rem;
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
