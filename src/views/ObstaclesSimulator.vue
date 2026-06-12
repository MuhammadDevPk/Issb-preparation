<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'

const store = usePreparationStore()
const router = useRouter()

const obstacles = [
  { id: 'boxing_ring', name: 'Boxing Ring', points: 1, difficulty: 'Easy', fatigue: 10, desc: 'Jump over the outer rope, roll under the center bar, and hop out the other side.' },
  { id: 'double_ditch', name: 'Double Ditch', points: 2, difficulty: 'Easy', fatigue: 15, desc: 'Jump across a 6-foot ditch, land on the middle step, and jump across the second ditch.' },
  { id: 'zig_zag', name: 'Zig-Zag Balance', points: 4, difficulty: 'Medium', fatigue: 10, desc: 'Walk quickly across narrow wooden planks set at angles without losing balance.' },
  { id: 'high_jump', name: 'High Jump', points: 5, difficulty: 'Medium', fatigue: 25, desc: 'Clear a 3.5-foot high bar without knocking it over. Requires lower-body explosion.' },
  { id: 'hanging_plank', name: 'Hanging Plank', points: 6, difficulty: 'Medium', fatigue: 20, desc: 'Climb a ladder, run across a suspended plank that swings, and jump down.' },
  { id: 'monkey_bridge', name: 'Monkey Bridge', points: 7, difficulty: 'Hard', fatigue: 30, desc: 'Walk across a single thick steel cable while holding onto an upper hand-rope.' },
  { id: 'tarzan_swing', name: 'Tarzan Swing', points: 8, difficulty: 'Hard', fatigue: 35, desc: 'Climb to a platform, grab a heavy rope, swing across a ditch, and land safely on a line.' },
  { id: 'rope_climb', name: 'Rope Climbing', points: 9, difficulty: 'Hard', fatigue: 45, desc: 'Climb up a vertical 12-foot rope using hand-over-hand grip and slide down.' },
  { id: 'tarzan_wall', name: 'Tarzan Wall', points: 10, difficulty: 'Hard', fatigue: 40, desc: 'Run, jump to grab the edge of an 8-foot high wall, pull yourself up, and drop down.' }
]

const plannedRoute = ref([]) // Array of obstacle objects representing sequence

const addToRoute = (obs) => {
  plannedRoute.value.push({
    ...obs,
    uniqueId: Date.now() + Math.random().toString(36).substr(2, 5)
  })
  saveRouteToStore()
}

const removeFromRoute = (index) => {
  plannedRoute.value.splice(index, 1)
  saveRouteToStore()
}

const clearRoute = () => {
  plannedRoute.value = []
  saveRouteToStore()
}

const saveRouteToStore = () => {
  const ids = plannedRoute.value.map(o => o.id)
  store.saveObstacleRoute(ids)
}

const totalPoints = computed(() => {
  return plannedRoute.value.reduce((acc, curr) => acc + curr.points, 0)
})

const totalFatigue = computed(() => {
  return plannedRoute.value.reduce((acc, curr) => acc + curr.fatigue, 0)
})

// Calculate tactical tips dynamically based on route sequence
const tacticalTips = computed(() => {
  const tips = []
  
  if (plannedRoute.value.length === 0) {
    tips.push({
      type: 'info',
      text: 'Click obstacles below to start planning your sequence. Aim for a route that maximizes your points.'
    })
    return tips
  }

  // Score tip
  if (totalPoints.value < 30) {
    tips.push({
      type: 'warn',
      text: `Your current planned score is ${totalPoints.value} points. At ISSB, a highly recommended candidate aims for at least 30+ points by completing obstacles fast and repeating high-value ones.`
    })
  } else {
    tips.push({
      type: 'success',
      text: `Excellent! Your planned score is ${totalPoints.value} points. This score shows top-tier physical capability and aggression.`
    })
  }

  // Fatigue sequence checks
  const lastThree = plannedRoute.value.slice(-3)
  const heavyFinishers = lastThree.filter(o => o.id === 'rope_climb' || o.id === 'tarzan_wall')
  if (heavyFinishers.length > 0) {
    tips.push({
      type: 'danger',
      text: 'Tactical Warning: Placing Rope Climbing or Tarzan Wall at the end of your run is risky. Due to severe forearm fatigue and lactic acid build-up, you may slip. Move these high-effort tasks to the middle of your run.'
    })
  }

  // Easy starter check
  if (plannedRoute.value[0]?.points >= 8) {
    tips.push({
      type: 'warn',
      text: 'Physiological Tip: Starting with a 8-10 points obstacle (like Tarzan Wall) immediately without warm-up can cause muscle pulls. Try starting with Boxing Ring or Zig-Zag to get your heart rate up.'
    })
  }

  return tips
})

const goToRoadmap = () => {
  router.push('/roadmap')
}
</script>

<template>
  <div class="obstacles-wrapper">
    <div class="header-banner glass-card">
      <div class="header-flex">
        <div class="header-text-container">
          <span class="badge badge-cyan">GTO Tasks</span>
          <h2>GTO Individual Obstacles Route Planner</h2>
          <p>
            Individual Obstacles test your physical courage, agility, determination, and spatial decision-making under stress. You have exactly **3 minutes** to clear as many obstacles as possible. Create a strategy to cross them in the most efficient sequence.
          </p>
        </div>
        <button class="btn btn-secondary back-btn" @click="goToRoadmap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Roadmap</span>
        </button>
      </div>
    </div>

    <!-- Layout Grid -->
    <div class="planner-grid">
      <!-- Left: Workspace Route -->
      <aside class="route-panel glass-card border-blue">
        <div class="panel-header">
          <h3>Your Planned Route</h3>
          <button class="btn btn-secondary btn-sm" @click="clearRoute" :disabled="plannedRoute.length === 0">RESET</button>
        </div>

        <!-- Metric summaries -->
        <div class="metrics-row grid-2">
          <div class="metric-box">
            <span class="lbl">Planned Score</span>
            <span class="val text-glow" :class="totalPoints >= 30 ? 'text-green' : 'text-gold'">{{ totalPoints }} pts</span>
          </div>
          <div class="metric-box">
            <span class="lbl">Fatigue Index</span>
            <span class="val" :class="totalFatigue > 200 ? 'text-red' : 'text-cyan'">{{ totalFatigue }}</span>
          </div>
        </div>

        <!-- Route timeline list -->
        <div class="timeline-container">
          <div v-if="plannedRoute.length === 0" class="empty-state flex-center">
            <span>Route is empty. Add obstacles below.</span>
          </div>
          <div v-else class="timeline-list">
            <div v-for="(obs, index) in plannedRoute" :key="obs.uniqueId" class="timeline-item">
              <span class="seq-num">#{{ index + 1 }}</span>
              <div class="item-details">
                <strong>{{ obs.name }}</strong>
                <span class="points-label">{{ obs.points }} Points</span>
              </div>
              <button class="remove-btn" @click="removeFromRoute(index)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="close-icon">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Tactical Advisor box -->
        <div class="advisor-box">
          <h4 class="title text-glow">Tactical Advisor Feedback</h4>
          <div class="tips-list">
            <div v-for="(tip, idx) in tacticalTips" :key="idx" class="tip-card" :class="'tip-' + tip.type">
              <span class="tip-dot"></span>
              <p>{{ tip.text }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right: Obstacles Cards Deck -->
      <main class="deck-panel glass-card">
        <h3>Available Obstacles</h3>
        <p class="subtitle">Click an obstacle to append it to your running sequence.</p>

        <div class="deck-grid grid-3">
          <div v-for="obs in obstacles" :key="obs.id"
               class="obstacle-card glass-card interactive"
               @click="addToRoute(obs)">
            <div class="card-top">
              <span class="badge" :class="obs.points >= 8 ? 'badge-red' : obs.points >= 5 ? 'badge-gold' : 'badge-cyan'">
                {{ obs.points }} PTS
              </span>
              <span class="diff-label" :class="obs.difficulty === 'Hard' ? 'text-red' : obs.difficulty === 'Medium' ? 'text-gold' : 'text-green'">
                {{ obs.difficulty }}
              </span>
            </div>
            <h4>{{ obs.name }}</h4>
            <p class="obs-desc">{{ obs.desc }}</p>
            <div class="card-bottom">
              <span class="fatigue-lbl">Fatigue: <strong>{{ obs.fatigue }}</strong></span>
              <span class="add-indicator text-glow">+ Add to Route</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.obstacles-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-block-end: 2rem;
}

.header-banner {
  padding: 1.5rem;
}

.header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

.header-text-container {
  flex: 1;
}

.back-btn {
  flex-shrink: 0;
}

.header-banner h2 {
  font-size: 1.6rem;
  margin-block-end: 0.35rem;
}

.header-banner p {
  color: var(--text-secondary);
}

/* Layout Grid */
.planner-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.route-panel {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  font-size: 1.1rem;
}

.metrics-row {
  background: rgba(255, 255, 255, 0.01);
  padding: 0.75rem;
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.metric-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-box .lbl {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.metric-box .val {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
}

.timeline-container {
  max-block-size: 300px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: var(--border-radius-md);
  background: rgba(8, 12, 20, 0.4);
  padding: 0.5rem;
}

.empty-state {
  block-size: 120px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--border-radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.seq-num {
  font-family: var(--font-heading);
  font-weight: 600;
  color: var(--accent-cyan);
  font-size: 0.85rem;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-details strong {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.points-label {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.remove-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  color: var(--accent-red);
}

.close-icon {
  inline-size: 16px;
  block-size: 16px;
}

.advisor-box {
  background: rgba(255, 255, 255, 0.01);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.advisor-box .title {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-block-end: 0.75rem;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tip-card {
  display: flex;
  gap: 0.5rem;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--text-secondary);
}

.tip-dot {
  inline-size: 6px;
  block-size: 6px;
  border-radius: 50%;
  margin-block-start: 4px;
  flex-shrink: 0;
}

.tip-info .tip-dot { background: var(--accent-cyan); }
.tip-warn .tip-dot { background: var(--accent-gold); }
.tip-danger .tip-dot { background: var(--accent-red); }
.tip-success .tip-dot { background: var(--accent-green); }

/* Deck Panel */
.deck-panel {
  padding: 1.5rem;
}

.deck-panel h3 {
  font-size: 1.25rem;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-block-end: 1.5rem;
}

.obstacle-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-block-size: 180px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: 0.75rem;
}

.diff-label {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.obstacle-card h4 {
  font-size: 1.05rem;
  color: var(--text-primary);
  margin-block-end: 0.35rem;
}

.obs-desc {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-block-end: 1rem;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  border-block-start: 1px solid rgba(255, 255, 255, 0.03);
  padding-block-start: 0.5rem;
}

.fatigue-lbl {
  color: var(--text-muted);
}

.fatigue-lbl strong {
  color: var(--text-secondary);
}

.add-indicator {
  color: var(--accent-cyan);
  font-weight: 500;
}

.text-cyan {
  color: var(--accent-cyan);
}

@media (max-width: 992px) {
  .planner-grid {
    grid-template-columns: 1fr;
  }
}
</style>
