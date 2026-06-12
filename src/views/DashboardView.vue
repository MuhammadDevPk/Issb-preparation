<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'

const store = usePreparationStore()
const router = useRouter()

// 14 Officer Like Qualities (OLQs) divided into 4 Dimensions
const olqs = ref([
  // Dimension 1: Planning & Intelligence
  { id: 'intel', name: 'Effective Intelligence', dimension: 'Planning', score: 5, description: 'Ability to understand, analyze, and solve practical, day-to-day problems.' },
  { id: 'reason', name: 'Reasoning Ability', dimension: 'Planning', score: 5, description: 'Logical thinking, grasping the core of a problem, and drawing correct conclusions.' },
  { id: 'organize', name: 'Organizing Ability', dimension: 'Planning', score: 5, description: 'Arranging resources, planning systematically, and executing structural ideas.' },
  { id: 'expression', name: 'Power of Expression', dimension: 'Planning', score: 5, description: 'Clarity of speech and written expression, conveying ideas directly and persuasively.' },
  
  // Dimension 2: Social & Adaptability
  { id: 'coop', name: 'Cooperation', dimension: 'Social', score: 5, description: 'Working harmoniously in a team, putting collective goals above individual pride.' },
  { id: 'adapt', name: 'Social Adaptability', dimension: 'Social', score: 5, description: 'Adjusting well to new environments, people, and unexpected social pressures.' },
  { id: 'responsibility', name: 'Sense of Responsibility', dimension: 'Social', score: 5, description: 'Owning up to duties, acknowledging failures, and showing high integrity.' },

  // Dimension 3: Leadership & Influence
  { id: 'initiative', name: 'Initiative', dimension: 'Leadership', score: 5, description: 'Taking the first step in difficult circumstances without waiting for orders.' },
  { id: 'influence', name: 'Group Influencing Ability', dimension: 'Leadership', score: 5, description: 'Convincing or directing the group towards a solution without being aggressive.' },
  { id: 'decision', name: 'Speed of Decision', dimension: 'Leadership', score: 5, description: 'Making quick, logical choices under time pressure and high stress.' },
  { id: 'confidence', name: 'Self-Confidence', dimension: 'Leadership', score: 5, description: 'Belief in one\'s own capabilities during crisis situations.' },

  // Dimension 4: Dynamic & Physical
  { id: 'liveliness', name: 'Liveliness', dimension: 'Dynamic', score: 5, description: 'Staying cheerful and energetic under severe mental and physical pressure.' },
  { id: 'determination', name: 'Determination', dimension: 'Dynamic', score: 5, description: 'Sticking to a task until it is completed, despite hurdles or fatigue.' },
  { id: 'courage', name: 'Courage & Stamina', dimension: 'Dynamic', score: 5, description: 'Facing danger or risk boldly, and enduring prolonged physical hardships.' }
])

// Total modules count (we will have around 12 modules in Roadmap)
const totalModules = 12
const progressPercent = computed(() => {
  return Math.round((store.completedModules.length / totalModules) * 100)
})

const avgOlqScore = computed(() => {
  const sum = olqs.value.reduce((acc, curr) => acc + curr.score, 0)
  return Math.round((sum / olqs.value.length) * 10) / 10
})

const lowestTraits = computed(() => {
  return [...olqs.value].sort((a, b) => a.score - b.score).slice(0, 3)
})

onMounted(() => {
  // Load saved self-assessment if exists
  const savedOlqs = localStorage.getItem('issb_olq_self_assessment')
  if (savedOlqs) {
    try {
      const parsed = JSON.parse(savedOlqs)
      olqs.value.forEach(o => {
        if (parsed[o.id] !== undefined) {
          o.score = parsed[o.id]
        }
      })
    } catch (e) {
      console.error(e)
    }
  }
})

const saveAssessment = () => {
  const exportData = {}
  olqs.value.forEach(o => {
    exportData[o.id] = o.score
  })
  localStorage.setItem('issb_olq_self_assessment', JSON.stringify(exportData))
  store.addXP(30)
  alert('Self-Assessment profiling saved! XP Awarded.')
}

const goToRoadmap = () => {
  router.push('/roadmap')
}
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- Top Hero Section -->
    <section class="dashboard-hero glass-card animate-pulse-cyan">
      <div class="hero-left">
        <span class="badge badge-cyan">Tactical Command Center</span>
        <h2>Master the ISSB Selection Parameters</h2>
        <p>
          ISSB does not test your knowledge; it tests your **personality, psychological stability, and leadership potential**. Stop generic memorization. Understand what officers look for and align your mindset.
        </p>
        <button class="btn btn-primary" @click="goToRoadmap">
          <span>Start 5-Day Roadmap Training</span>
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      <div class="hero-right flex-center">
        <div class="progress-circle-container">
          <svg class="circle-svg" viewBox="0 0 100 100">
            <circle class="circle-bg" cx="50" cy="50" r="40" stroke="#cbd5e1" stroke-width="8" fill="none" />
            <circle class="circle-progress" cx="50" cy="50" r="40" stroke="var(--accent-cyan)" stroke-width="8" fill="none"
                    :stroke-dasharray="2 * Math.PI * 40"
                    :stroke-dashoffset="2 * Math.PI * 40 * (1 - progressPercent / 100)" />
          </svg>
          <div class="progress-label flex-center">
            <span class="percent text-glow">{{ progressPercent }}%</span>
            <span class="lbl">Completed</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Strategic Grid: Failures vs Successes -->
    <section class="strategic-grid grid-2">
      <!-- Why Candidates Fail -->
      <div class="glass-card fail-card">
        <div class="card-header border-red">
          <svg class="card-icon text-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h3>Why Candidates Fail</h3>
        </div>
        <ul class="strategic-list">
          <li>
            <strong class="text-glow-red">Artificial & Memorized Responses:</strong> 
            Writing standard WAT sentences or copying TAT stories from guidebooks shows a fake personality that gets exposed during interview checks.
          </li>
          <li>
            <strong class="text-glow-red">Negative / Depressive Thoughts:</strong>
            Expressing despair, violence, fear, or insecurity in psychology tests indicates emotional instability.
          </li>
          <li>
            <strong class="text-glow-red">Form Contradictions:</strong>
            Lying on Bio-Data forms (day 1) about hobbies, achievements, or family background leads to instant detection in interviews.
          </li>
          <li>
            <strong class="text-glow-red">Dominating or Passive GTO Behavior:</strong>
            Shouting and arguing with team members during group tasks, or staying completely silent, shows lack of cooperative social skills.
          </li>
          <li>
            <strong class="text-glow-red">Lack of Confidence & General Knowledge:</strong>
            Stuttering, lying, or failing to answer basic military, political, or academic questions under pressure.
          </li>
        </ul>
        <div class="action-recommendation badge badge-red">
          CRITICAL AVOIDANCE: Do not write pre-memorized sentences/stories!
        </div>
      </div>

      <!-- Why Candidates Succeed -->
      <div class="glass-card success-card">
        <div class="card-header border-green">
          <svg class="card-icon text-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-linecap="round"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round"/>
          </svg>
          <h3>Why Candidates Succeed</h3>
        </div>
        <ul class="strategic-list">
          <li>
            <strong class="text-glow-green">Authenticity & Natural Expression:</strong>
            Writing simple, honest, and spontaneous answers. Showing your true thoughts rather than a copied "ideal" image.
          </li>
          <li>
            <strong class="text-glow-green">Emotional Resilience & Positive Mindset:</strong>
            Approaching stressful situation tasks with constructive, active solutions. Focus on duty and action.
          </li>
          <li>
            <strong class="text-glow-green">Complete Honesty on Day 1 Bio-Data:</strong>
            Ensuring absolute truth about hobbies, sports, and life details, allowing a smooth, confident interview presentation.
          </li>
          <li>
            <strong class="text-glow-green">Group-First Cooperation:</strong>
            Acting as a supportive group member during GTO tasks: facilitating the team, listening, and offering solutions.
          </li>
          <li>
            <strong class="text-glow-green">Bold Initiative & Decision Speed:</strong>
            Taking lead quickly when a group task gets stuck, showing clear reasoning, and making fast adjustments.
          </li>
        </ul>
        <div class="action-recommendation badge badge-green">
          RECOMMENDED PATH: Be genuine, cooperative, and physically alert!
        </div>
      </div>
    </section>

    <!-- Officer-Like Qualities Self-Assessment Profiler -->
    <section class="olq-profiler glass-card">
      <div class="profiler-header">
        <div>
          <h3>OLQ Self-Assessment Profiler</h3>
          <p class="desc">Rate yourself on the 14 traits evaluated at ISSB to analyze your profile and identify development areas.</p>
        </div>
        <div class="score-display">
          <span class="val text-glow">{{ avgOlqScore }} / 10</span>
          <span class="lbl">Average Profile Score</span>
        </div>
      </div>

      <!-- Dimensions layout -->
      <div class="dimensions-container">
        <!-- Planning Dimension -->
        <div class="dimension-section">
          <h4 class="dim-title">Planning & Intelligence</h4>
          <div class="traits-list">
            <div v-for="olq in olqs.filter(o => o.dimension === 'Planning')" :key="olq.id" class="trait-row">
              <div class="trait-info">
                <strong>{{ olq.name }}</strong>
                <span class="trait-desc">{{ olq.description }}</span>
              </div>
              <div class="trait-slider">
                <input type="range" min="1" max="10" v-model.number="olq.score" class="form-range" />
                <span class="score-num text-glow" :class="olq.score >= 7 ? 'text-green' : olq.score >= 4 ? 'text-gold' : 'text-red'">{{ olq.score }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Social Dimension -->
        <div class="dimension-section">
          <h4 class="dim-title">Social & Adaptability</h4>
          <div class="traits-list">
            <div v-for="olq in olqs.filter(o => o.dimension === 'Social')" :key="olq.id" class="trait-row">
              <div class="trait-info">
                <strong>{{ olq.name }}</strong>
                <span class="trait-desc">{{ olq.description }}</span>
              </div>
              <div class="trait-slider">
                <input type="range" min="1" max="10" v-model.number="olq.score" class="form-range" />
                <span class="score-num text-glow" :class="olq.score >= 7 ? 'text-green' : olq.score >= 4 ? 'text-gold' : 'text-red'">{{ olq.score }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Leadership Dimension -->
        <div class="dimension-section">
          <h4 class="dim-title">Leadership & Influence</h4>
          <div class="traits-list">
            <div v-for="olq in olqs.filter(o => o.dimension === 'Leadership')" :key="olq.id" class="trait-row">
              <div class="trait-info">
                <strong>{{ olq.name }}</strong>
                <span class="trait-desc">{{ olq.description }}</span>
              </div>
              <div class="trait-slider">
                <input type="range" min="1" max="10" v-model.number="olq.score" class="form-range" />
                <span class="score-num text-glow" :class="olq.score >= 7 ? 'text-green' : olq.score >= 4 ? 'text-gold' : 'text-red'">{{ olq.score }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Dimension -->
        <div class="dimension-section">
          <h4 class="dim-title">Dynamic & Physical</h4>
          <div class="traits-list">
            <div v-for="olq in olqs.filter(o => o.dimension === 'Dynamic')" :key="olq.id" class="trait-row">
              <div class="trait-info">
                <strong>{{ olq.name }}</strong>
                <span class="trait-desc">{{ olq.description }}</span>
              </div>
              <div class="trait-slider">
                <input type="range" min="1" max="10" v-model.number="olq.score" class="form-range" />
                <span class="score-num text-glow" :class="olq.score >= 7 ? 'text-green' : olq.score >= 4 ? 'text-gold' : 'text-red'">{{ olq.score }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="profiler-footer flex-center">
        <div class="profile-recommendation" v-if="lowestTraits.length > 0">
          <strong>Key Improvement Goals:</strong>
          <span class="trait-tag" v-for="t in lowestTraits" :key="t.id">{{ t.name }} ({{ t.score }}/10)</span>
        </div>
        <button class="btn btn-primary" @click="saveAssessment">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Save Profile</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-block-end: 2rem;
}

.dashboard-hero {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(3, 194, 252, 0.12), rgba(3, 194, 252, 0.03));
}

.hero-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85rem;
}

.hero-left h2 {
  font-size: 1.85rem;
  color: var(--text-primary);
}

.hero-left p {
  color: var(--text-secondary);
  font-size: 1.05rem;
  max-inline-size: 600px;
}

.hero-right {
  inline-size: 180px;
}

.progress-circle-container {
  position: relative;
  inline-size: 150px;
  block-size: 150px;
}

.circle-svg {
  transform: rotate(-90deg);
  inline-size: 100%;
  block-size: 100%;
}

.circle-progress {
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease-in-out;
}

.progress-label {
  position: absolute;
  inset: 0;
  flex-direction: column;
}

.progress-label .percent {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent-cyan);
}

.progress-label .lbl {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Strategic Grid styling */
.fail-card {
  border-block-start: 4px solid var(--accent-red);
}

.success-card {
  border-block-start: 4px solid var(--accent-green);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-block-end: 1rem;
  padding-block-end: 0.5rem;
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
}

.card-icon {
  inline-size: 26px;
  block-size: 26px;
}

.text-red {
  color: var(--accent-red);
}

.text-green {
  color: var(--accent-green);
}

.text-gold {
  color: var(--accent-gold);
}

.text-glow-red {
  text-shadow: 0 0 10px rgba(255, 77, 109, 0.2);
}

.text-glow-green {
  text-shadow: 0 0 10px rgba(0, 255, 135, 0.2);
}

.strategic-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  list-style: none;
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-block-end: 1.5rem;
}

.strategic-list li strong {
  display: block;
  color: var(--text-primary);
  margin-block-end: 0.2rem;
}

.action-recommendation {
  width: 100%;
  padding: 0.5rem 1rem;
  justify-content: center;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* OLQ Profiler styling */
.olq-profiler {
  border-block-start: 4px solid var(--accent-cyan);
}

.profiler-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: 1.5rem;
  padding-block-end: 1rem;
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
}

.profiler-header .desc {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.score-display .val {
  font-family: var(--font-heading);
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--accent-cyan);
}

.score-display .lbl {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.dimensions-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-block-end: 2rem;
}

.dimension-section {
  background: var(--bg-panel-solid);
  padding: 1.25rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.dim-title {
  color: var(--accent-cyan);
  font-size: 1.1rem;
  margin-block-end: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-inline-start: 3px solid var(--accent-cyan);
  padding-inline-start: 0.5rem;
}

.traits-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.trait-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.trait-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.trait-info strong {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.trait-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.3;
}

.trait-slider {
  display: flex;
  align-items: center;
  gap: 1rem;
  inline-size: 160px;
}

.form-range {
  flex: 1;
  accent-color: var(--accent-cyan);
  cursor: pointer;
  height: 4px;
}

.score-num {
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 700;
  inline-size: 20px;
  text-align: right;
}

.profiler-footer {
  justify-content: space-between;
  padding-block-start: 1rem;
  border-block-start: 1px solid rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  gap: 1rem;
}

.profile-recommendation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.profile-recommendation strong {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.trait-tag {
  background: rgba(255, 77, 109, 0.08);
  color: var(--accent-red);
  padding: 0.15rem 0.6rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(255, 77, 109, 0.15);
}

.btn-icon {
  inline-size: 18px;
  block-size: 18px;
}

@media (max-width: 768px) {
  .dashboard-hero {
    flex-direction: column;
  }
  
  .hero-right {
    align-self: center;
  }

  .dimensions-container {
    grid-template-columns: 1fr;
  }
}
</style>
