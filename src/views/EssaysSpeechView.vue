<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import { essays, lecturettes } from '../data/essayLecturetteData'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.profile?.role === 'admin')

// Tabs: 'essays' or 'speech'
const activeTab = ref('essays')
const searchQuery = ref('')

// Selected details state
const selectedEssay = ref(null)
const selectedSpeech = ref(null)
const showDetailMobile = ref(false)

// Timer state
const timerSeconds = ref(120) // 2 minutes
const isTimerRunning = ref(false)
let timerInterval = null

// Web Audio API for beep sound
const playBeep = (frequency = 800, duration = 0.25) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.frequency.value = frequency
    osc.type = 'sine'
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration)
    
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + duration)
  } catch (err) {
    console.warn('Audio Context not allowed or supported by browser:', err)
  }
}

// Timer controls
const startTimer = () => {
  if (isTimerRunning.value) return
  isTimerRunning.value = true
  playBeep(600, 0.15) // Start signal
  timerInterval = setInterval(() => {
    if (timerSeconds.value > 0) {
      timerSeconds.value--
      
      // Warning sound at 30 seconds left (90 seconds elapsed)
      if (timerSeconds.value === 30) {
        playBeep(900, 0.4)
      }
      
      // Stop signal at 0 seconds left
      if (timerSeconds.value === 0) {
        stopTimer()
        playBeep(1200, 0.7) // End signal
      }
    } else {
      stopTimer()
    }
  }, 1000)
}

const pauseTimer = () => {
  isTimerRunning.value = false
  clearInterval(timerInterval)
  playBeep(400, 0.1)
}

const resetTimer = () => {
  stopTimer()
  timerSeconds.value = 120
  playBeep(500, 0.15)
}

const stopTimer = () => {
  isTimerRunning.value = false
  clearInterval(timerInterval)
}

onUnmounted(() => {
  clearInterval(timerInterval)
})

// Timer Display helpers
const formattedTime = computed(() => {
  const mins = Math.floor(timerSeconds.value / 60)
  const secs = timerSeconds.value % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

const timerProgress = computed(() => {
  return ((120 - timerSeconds.value) / 120) * 100
})

const timerStatusClass = computed(() => {
  const elapsed = 120 - timerSeconds.value
  if (elapsed >= 120) return 'status-ended'
  if (elapsed >= 90) return 'status-warning' // Last 30 seconds
  return 'status-active'
})

const timerStatusText = computed(() => {
  const elapsed = 120 - timerSeconds.value
  if (elapsed === 0) return 'Ready to Speak'
  if (elapsed < 30) return 'Introduction & Hook 🚀'
  if (elapsed < 90) return 'Deep Dive & Main Points 🎯'
  if (elapsed < 120) return 'Concluding Remarks ⚠️'
  return 'Time up! Stand Down 🛑'
})

// Search Filtering
const filteredEssays = computed(() => {
  let list = essays
  if (!isAdmin.value) {
    list = list.filter(item => !item.adminOnly)
  }
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return list
  return list.filter(item => 
    item.title.toLowerCase().includes(query) ||
    item.intro.toLowerCase().includes(query) ||
    item.conclusion.toLowerCase().includes(query)
  )
})

const filteredSpeech = computed(() => {
  let list = lecturettes
  if (!isAdmin.value) {
    list = list.filter(item => !item.adminOnly)
  }
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return list
  return list.filter(item => 
    item.title.toLowerCase().includes(query) ||
    item.intro.toLowerCase().includes(query) ||
    item.points.toLowerCase().includes(query)
  )
})

// Selection Actions
const selectEssayItem = (item) => {
  selectedEssay.value = item
  showDetailMobile.value = true
}

const selectSpeechItem = (item) => {
  selectedSpeech.value = item
  resetTimer()
  showDetailMobile.value = true
}

const goBackToList = () => {
  showDetailMobile.value = false
}

// Reset mobile state on tab switch
watch(activeTab, () => {
  showDetailMobile.value = false
})
</script>

<template>
  <div class="essays-speech-wrapper">
    <!-- Header -->
    <div class="view-header glass-card">
      <div class="header-details">
        <span class="badge badge-gold">Premium Study Vault</span>
        <h2>ISSB Essays & Public Speaking</h2>
        <p>
          Master the art of clear, concise expression. High-yield, topic-wise material structured specifically for ISSB Gujranwala guidelines. Essays are designed for a 1.5-page handwritten limit; speeches are calibrated for a strict 2-minute delivery.
        </p>
      </div>
    </div>

    <!-- Tabs & Search Row -->
    <div class="controls-row glass-card">
      <div class="tabs-container">
        <button 
          class="tab-btn" 
          :class="{ 'active': activeTab === 'essays' }"
          @click="activeTab = 'essays'"
        >
          ✍️ Written Essays
        </button>
        <button 
          class="tab-btn" 
          :class="{ 'active': activeTab === 'speech' }"
          @click="activeTab = 'speech'"
        >
          🎤 2-Min Lecturette
        </button>
      </div>

      <div class="search-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-input search-field" 
          placeholder="🔍 Search topics..." 
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
      </div>
    </div>

    <!-- MAIN GRID LAYOUT -->
    <div class="content-grid-split" :class="{ 'mobile-show-detail': showDetailMobile }">
      
      <!-- LEFT COLUMN: Topic Lists -->
      <div class="list-column">
        <!-- Essays List -->
        <div v-if="activeTab === 'essays'">
          <div class="topics-list-container">
            <div 
              v-for="item in filteredEssays" 
              :key="item.id"
              class="topic-card glass-card"
              :class="{ 'selected': selectedEssay?.id === item.id }"
              @click="selectEssayItem(item)"
            >
              <div class="topic-meta">
                <div class="meta-top-row">
                  <span class="topic-number">Topic #{{ item.id }}</span>
                  <span v-if="item.zeeshanRecommended && isAdmin" class="badge-recommended">
                    🏆 Zeeshan Recommended
                  </span>
                </div>
                <h3>{{ item.title }}</h3>
              </div>
              <div class="topic-preview">{{ item.intro.substring(0, 80) }}...</div>
            </div>
            <div v-if="filteredEssays.length === 0" class="no-topics">
              <p>🔍 No essay topics match your search query.</p>
            </div>
          </div>
        </div>

        <!-- Speech List -->
        <div v-if="activeTab === 'speech'">
          <div class="topics-list-container">
            <div 
              v-for="item in filteredSpeech" 
              :key="item.id"
              class="topic-card glass-card"
              :class="{ 'selected': selectedSpeech?.id === item.id }"
              @click="selectSpeechItem(item)"
            >
              <div class="topic-meta">
                <div class="meta-top-row">
                  <span class="topic-number">Topic #{{ item.id }}</span>
                  <span v-if="item.zeeshanRecommended && isAdmin" class="badge-recommended">
                    🏆 Zeeshan Recommended
                  </span>
                </div>
                <h3>{{ item.title }}</h3>
              </div>
              <div class="topic-preview">{{ item.intro.substring(0, 80) }}...</div>
            </div>
            <div v-if="filteredSpeech.length === 0" class="no-topics">
              <p>🔍 No speech topics match your search query.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Detailed Panel & Tools -->
      <div class="details-column">
        
        <!-- ESSAY PANEL -->
        <div v-if="activeTab === 'essays'" class="panel-card glass-card">
          <div v-if="selectedEssay" class="essay-viewer">
            <div class="viewer-header">
              <button class="back-list-btn" @click="goBackToList">⬅ Back to Topics List</button>
              <div v-if="selectedEssay.zeeshanRecommended && isAdmin" class="badge-recommended-large">
                🏆 Zeeshan Recommended (Group Discussion + Public Speaking)
              </div>
              <span class="badge badge-cyan">Structured Outline (1.5 Page Calibration)</span>
              <h2>{{ selectedEssay.title }}</h2>
            </div>
            
            <div class="essay-sections">
              <!-- Section 1: Intro -->
              <div class="essay-part-box border-blue">
                <div class="part-header">
                  <span class="part-badge bg-blue">1. Introduction</span>
                </div>
                <p class="part-text">{{ selectedEssay.intro }}</p>
              </div>

              <!-- Section 2: Causes -->
              <div class="essay-part-box border-red">
                <div class="part-header">
                  <span class="part-badge bg-red">2. Causes / Underpinnings</span>
                </div>
                <p class="part-text">{{ selectedEssay.reasons }}</p>
              </div>

              <!-- Section 3: Effects -->
              <div class="essay-part-box border-orange">
                <div class="part-header">
                  <span class="part-badge bg-orange">3. Impacts / Effects</span>
                </div>
                <p class="part-text">{{ selectedEssay.effects }}</p>
              </div>

              <!-- Section 4: Solutions -->
              <div class="essay-part-box border-green">
                <div class="part-header">
                  <span class="part-badge bg-green">4. Recommended Solutions</span>
                </div>
                <p class="part-text">{{ selectedEssay.solutions }}</p>
              </div>

              <!-- Section 5: Conclusion -->
              <div class="essay-part-box border-gold">
                <div class="part-header">
                  <span class="part-badge bg-gold">5. Conclusion</span>
                </div>
                <p class="part-text">{{ selectedEssay.conclusion }}</p>
              </div>
            </div>
          </div>
          <div v-else class="viewer-placeholder">
            <div class="placeholder-content">
              <span class="placeholder-icon">✍️</span>
              <h3>Select a Written Essay Topic</h3>
              <p>Select any essay from the left column to view its proper structural breakdown and recommended wording.</p>
            </div>
          </div>
        </div>

        <!-- SPEECH PANEL -->
        <div v-if="activeTab === 'speech'" class="panel-card glass-card">
          <div v-if="selectedSpeech" class="speech-viewer">
            <div class="viewer-header flex-header">
              <div class="header-left">
                <button class="back-list-btn" @click="goBackToList">⬅ Back to Topics List</button>
                <div v-if="selectedSpeech.zeeshanRecommended && isAdmin" class="badge-recommended-large">
                  🏆 Zeeshan Recommended (Group Discussion + Public Speaking)
                </div>
                <span class="badge badge-cyan">2-Minute Lecturette Outline</span>
                <h2>{{ selectedSpeech.title }}</h2>
              </div>
              
              <!-- Speech Practice Timer widget -->
              <div class="timer-widget glass-card" :class="timerStatusClass">
                <div class="timer-top">
                  <span class="timer-label">Speech Trainer</span>
                  <span class="timer-digits">{{ formattedTime }}</span>
                </div>
                <div class="timer-progress-track">
                  <div class="timer-progress-fill" :style="{ width: timerProgress + '%' }"></div>
                </div>
                <div class="timer-status">{{ timerStatusText }}</div>
                <div class="timer-buttons">
                  <button v-if="!isTimerRunning" @click="startTimer" class="timer-control-btn btn-play">▶ Start</button>
                  <button v-else @click="pauseTimer" class="timer-control-btn btn-pause">⏸ Pause</button>
                  <button @click="resetTimer" class="timer-control-btn btn-reset">🔄 Reset</button>
                </div>
              </div>
            </div>

            <div class="speech-sections">
              <!-- Section 1: Intro -->
              <div class="essay-part-box border-blue">
                <div class="part-header">
                  <span class="part-badge bg-blue">Introduction & Hook (0 - 30 seconds)</span>
                </div>
                <p class="part-text">{{ selectedSpeech.intro }}</p>
              </div>

              <!-- Section 2: Points -->
              <div class="essay-part-box border-cyan">
                <div class="part-header">
                  <span class="part-badge bg-cyan">Main Discussion & Facts (30 - 90 seconds)</span>
                </div>
                <p class="part-text">{{ selectedSpeech.points }}</p>
              </div>

              <!-- Section 3: Conclusion -->
              <div class="essay-part-box border-gold">
                <div class="part-header">
                  <span class="part-badge bg-gold">Concluding Message (90 - 120 seconds)</span>
                </div>
                <p class="part-text">{{ selectedSpeech.conclusion }}</p>
              </div>
            </div>
          </div>
          <div v-else class="viewer-placeholder">
            <div class="placeholder-content">
              <span class="placeholder-icon">🎤</span>
              <h3>Select a Lecturette Topic</h3>
              <p>Select any public speaking topic from the left column to read its recommended 2-minute content and access the interactive Speech Trainer.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.essays-speech-wrapper {
  padding: 1.5rem;
  max-width: 1300px;
  margin: 0 auto;
}

.view-header {
  padding: 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.header-details h2 {
  font-size: 1.8rem;
  color: var(--text-primary);
  margin-top: 0.5rem;
}

.header-details p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-top: 0.5rem;
}

/* Controls */
.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tabs-container {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.tab-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(3, 194, 252, 0.1);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  font-weight: 600;
}

.search-container {
  position: relative;
  width: 100%;
  max-width: 380px;
}

.search-field {
  width: 100%;
  padding-right: 2rem;
}

.clear-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1.2rem;
}

/* Grid Layout */
.content-grid-split {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* List Column */
.topics-list-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.topic-card {
  padding: 1rem;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.topic-card:hover {
  border-color: rgba(3, 194, 252, 0.3);
  background: rgba(255, 255, 255, 0.02);
  transform: translateY(-2px);
}

.topic-card.selected {
  border-color: var(--accent-cyan);
  background: rgba(3, 194, 252, 0.02);
}

.topic-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.topic-number {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-gold);
  text-transform: uppercase;
}

.topic-card h3 {
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.3;
}

.topic-preview {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.no-topics {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Details Column */
.panel-card {
  border: 1px solid var(--border-color);
  min-height: calc(100vh - 280px);
  padding: 2rem;
}

.viewer-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 1rem;
}

.viewer-header h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-top: 0.5rem;
}

.flex-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.header-left {
  flex: 1;
}

/* Timer Widget */
.timer-widget {
  width: 260px;
  padding: 1rem;
  border: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--border-radius-md);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.timer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.timer-digits {
  font-family: monospace;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent-cyan);
  text-shadow: 0 0 10px rgba(3, 194, 252, 0.2);
}

.timer-progress-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  overflow: hidden;
}

.timer-progress-fill {
  height: 100%;
  background: var(--accent-cyan);
  transition: width 1s linear;
}

.timer-status {
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  color: var(--accent-green);
}

.timer-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.timer-control-btn {
  flex: 1;
  border: 1px solid var(--border-color);
  padding: 0.4rem;
  font-size: 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-primary);
  transition: all var(--transition-smooth);
}

.timer-control-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.btn-play {
  border-color: rgba(34, 197, 94, 0.3);
  color: var(--accent-green);
}

.btn-play:hover {
  background: rgba(34, 197, 94, 0.1);
}

.btn-pause {
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--accent-gold);
}

.btn-pause:hover {
  background: rgba(245, 158, 11, 0.1);
}

/* Timer State overrides */
.status-warning .timer-digits {
  color: var(--accent-gold);
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
}
.status-warning .timer-progress-fill {
  background: var(--accent-gold);
}
.status-warning .timer-status {
  color: var(--accent-gold);
}

.status-ended .timer-digits {
  color: var(--accent-red);
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
}
.status-ended .timer-progress-fill {
  background: var(--accent-red);
}
.status-ended .timer-status {
  color: var(--accent-red);
}

/* Essay / Speech parts styling */
.essay-sections, .speech-sections {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.essay-part-box {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.01);
  border-radius: var(--border-radius-md);
}

.part-header {
  margin-bottom: 0.75rem;
}

.part-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ffffff;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.part-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Colors for sections */
.bg-blue { background: #2563eb; }
.bg-red { background: #dc2626; }
.bg-orange { background: #ea580c; }
.bg-green { background: #16a34a; }
.bg-gold { background: #ca8a04; }
.bg-cyan { background: #0891b2; }

/* Placeholder */
.viewer-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 350px);
  text-align: center;
  padding: 2rem;
}

.placeholder-icon {
  font-size: 3.5rem;
  display: block;
  margin-bottom: 1.5rem;
  opacity: 0.8;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.placeholder-content h3 {
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.placeholder-content p {
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 320px;
  margin: 0 auto;
  line-height: 1.5;
}

/* Back Button */
.back-list-btn {
  display: none;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--accent-cyan);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
  transition: all var(--transition-smooth);
}

.back-list-btn:hover {
  background: rgba(3, 194, 252, 0.1);
}

.meta-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.badge-recommended {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--accent-gold);
  background: rgba(245, 158, 11, 0.1);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  text-transform: uppercase;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.badge-recommended-large {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--accent-gold);
  background: rgba(245, 158, 11, 0.08);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  text-transform: uppercase;
  border: 1px solid rgba(245, 158, 11, 0.2);
  margin-bottom: 0.75rem;
}

/* Responsiveness */
@media (max-width: 992px) {
  .content-grid-split {
    grid-template-columns: 1fr;
  }
  
  .list-column {
    display: block;
  }
  
  .details-column {
    display: block;
  }
  
  /* Toggle visibility on mobile based on selected state */
  .mobile-show-detail .list-column {
    display: none;
  }
  
  .content-grid-split:not(.mobile-show-detail) .details-column {
    display: none;
  }

  .back-list-btn {
    display: inline-flex;
  }

  .topics-list-container {
    max-height: none;
  }
  
  .panel-card {
    min-height: auto;
    padding: 1.25rem;
  }
}

@media (max-width: 768px) {
  .flex-header {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  .timer-widget {
    width: 100%;
    margin-bottom: 1rem;
  }
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }
  .search-container {
    max-width: 100%;
  }
  
  /* Segmented control layout for mobile tab-btns */
  .tabs-container {
    width: 100%;
    display: flex;
    gap: 0.25rem;
  }
  
  .tab-btn {
    flex: 1;
    text-align: center;
    padding: 0.6rem 0.25rem;
    font-size: 0.8rem;
  }
}
</style>
