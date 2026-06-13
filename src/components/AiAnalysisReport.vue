<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  testType: {
    type: String, // 'WAT' | 'SCT' | 'SRT'
    default: 'WAT',
  },
  providerName: {
    type: String,
    default: '',
  },
})

// Score utilities
const scoreClass = (score) => {
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  return 'score-poor'
}

const gradeColor = computed(() => {
  const s = props.result?.overallScore ?? 0
  if (s >= 80) return 'var(--accent-green)'
  if (s >= 60) return 'var(--accent-gold)'
  return 'var(--accent-red)'
})

// SVG arc for score ring
const ARC_R = 54
const ARC_CIRC = 2 * Math.PI * ARC_R
const arcOffset = computed(() => {
  const pct = (props.result?.overallScore ?? 0) / 100
  return ARC_CIRC * (1 - pct)
})

const issueTagClass = (tag) => {
  const red = ['Denial', 'Blank', 'Negative', 'FamilyConflict', 'Rebellion', 'Panic', 'Avoidance', 'LackOfLeadership']
  const gold = ['Definition', 'Generic', 'Passive', 'Pessimism', 'Dependency', 'Unrealistic']
  if (red.some((r) => tag.includes(r))) return 'ai-tag ai-tag-red'
  if (gold.some((g) => tag.includes(g))) return 'ai-tag ai-tag-gold'
  return 'ai-tag ai-tag-green'
}
</script>

<template>
  <div class="ai-report" role="region" aria-label="AI Analysis Report">
    <!-- ── Header: Score Ring + Grade ── -->
    <div class="ai-report-header glass-card">
      <div class="score-ring-wrapper">
        <svg class="score-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
          <!-- Track -->
          <circle
            cx="60" cy="60" :r="ARC_R"
            fill="none"
            stroke="rgba(0,0,0,0.07)"
            stroke-width="10"
          />
          <!-- Progress arc -->
          <circle
            cx="60" cy="60" :r="ARC_R"
            fill="none"
            :stroke="gradeColor"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="ARC_CIRC"
            :stroke-dashoffset="arcOffset"
            class="arc-progress"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div class="score-ring-inner">
          <span class="score-number" :style="{ color: gradeColor }">{{ result.overallScore }}</span>
          <span class="score-max">/100</span>
        </div>
      </div>

      <div class="header-meta">
        <div class="header-top-row">
          <span class="ai-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
              <circle cx="9" cy="13" r="1" fill="currentColor" />
              <circle cx="15" cy="13" r="1" fill="currentColor" />
            </svg>
            AI ISSB Analysis
          </span>
          <span class="grade-badge" :style="{ color: gradeColor, borderColor: gradeColor }">
            Grade: {{ result.overallGrade }}
          </span>
          <span v-if="providerName" class="provider-badge">via {{ providerName }}</span>
        </div>

        <h3 class="profile-heading">Psychological Profile</h3>
        <p class="profile-text">{{ result.psychologicalProfile }}</p>
        <div class="summary-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>{{ result.summary }}</span>
        </div>
      </div>
    </div>

    <!-- ── Per-Answer Breakdown ── -->
    <div class="ai-section">
      <h3 class="ai-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        Answer-by-Answer Breakdown
      </h3>

      <div class="breakdown-list">
        <div
          v-for="item in result.items"
          :key="item.index"
          class="breakdown-card glass-card"
          :class="scoreClass(item.score)"
        >
          <div class="breakdown-top">
            <div class="breakdown-left">
              <span class="item-number">#{{ item.index }}</span>
              <div class="item-prompts">
                <span class="item-prompt">{{ item.prompt }}</span>
                <span v-if="item.domain" class="item-domain">{{ item.domain }}</span>
              </div>
            </div>
            <div class="breakdown-right">
              <div class="item-score-badge" :class="scoreClass(item.score)">
                {{ item.score }}<span class="item-score-max">/100</span>
              </div>
              <span class="item-rating" :class="scoreClass(item.score)">{{ item.rating }}</span>
            </div>
          </div>

          <!-- Candidate answer -->
          <div class="item-answer">
            <span class="item-answer-label">Your Answer:</span>
            <span class="item-answer-text" :class="{ 'blank-answer': !item.answer || item.answer.includes('[BLANK') }">
              {{ item.answer && !item.answer.includes('[BLANK') ? item.answer : 'No response given' }}
            </span>
          </div>

          <!-- SRT Dimension Scores -->
          <div v-if="item.dimensionScores" class="dimension-scores">
            <div class="dim-item" v-for="(val, key) in item.dimensionScores" :key="key">
              <span class="dim-label">{{ key.replace(/([A-Z])/g, ' $1').trim() }}</span>
              <div class="dim-bar-track">
                <div class="dim-bar" :style="{ width: (val / 25) * 100 + '%' }" :class="val >= 18 ? 'dim-bar-green' : val >= 12 ? 'dim-bar-gold' : 'dim-bar-red'"></div>
              </div>
              <span class="dim-val">{{ val }}/25</span>
            </div>
          </div>

          <!-- Issue Tags -->
          <div v-if="item.issueTags && item.issueTags.length" class="item-tags">
            <span
              v-for="tag in item.issueTags"
              :key="tag"
              :class="issueTagClass(tag)"
            >{{ tag }}</span>
          </div>

          <!-- Strengths & Issues -->
          <div class="item-feedback">
            <div v-if="item.strengths && item.strengths.length" class="feedback-col">
              <span class="feedback-head feedback-green">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Strengths
              </span>
              <ul class="feedback-list">
                <li v-for="s in item.strengths" :key="s">{{ s }}</li>
              </ul>
            </div>
            <div v-if="item.issues && item.issues.length" class="feedback-col">
              <span class="feedback-head feedback-red">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Issues
              </span>
              <ul class="feedback-list feedback-list-red">
                <li v-for="issue in item.issues" :key="issue">{{ issue }}</li>
              </ul>
            </div>
          </div>

          <!-- Improvement tip -->
          <div v-if="item.improvements && item.improvements !== 'Perfect'" class="improvement-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
              <path d="M9 18h6M10 22h4"/>
            </svg>
            <div>
              <span class="improvement-label">Suggested Improvement:</span>
              <em class="improvement-text">{{ item.improvements }}</em>
            </div>
          </div>
          <div v-else-if="item.improvements === 'Perfect'" class="perfect-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Perfect response — no changes needed!
          </div>
        </div>
      </div>
    </div>

    <!-- ── Top Mistakes ── -->
    <div v-if="result.topMistakes && result.topMistakes.length" class="ai-section">
      <h3 class="ai-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Recurring Mistake Patterns
      </h3>
      <div class="mistakes-grid">
        <div
          v-for="(mistake, i) in result.topMistakes"
          :key="i"
          class="mistake-card"
        >
          <span class="mistake-num">{{ i + 1 }}</span>
          <span class="mistake-text">{{ mistake }}</span>
        </div>
      </div>
    </div>

    <!-- ── Recommendations ── -->
    <div v-if="result.recommendations && result.recommendations.length" class="ai-section">
      <h3 class="ai-section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Personalized Recommendations
      </h3>
      <div class="recommendations-list">
        <div
          v-for="(tip, i) in result.recommendations"
          :key="i"
          class="recommendation-card"
        >
          <div class="rec-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <p class="rec-text">{{ tip }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Root container ── */
.ai-report {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Header card ── */
.ai-report-header {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  border: 1px solid rgba(139, 92, 246, 0.25);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(3, 194, 252, 0.04) 100%);
  flex-wrap: wrap;
}

/* Score ring */
.score-ring-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 120px;
  height: 120px;
}

.score-ring-svg {
  width: 100%;
  height: 100%;
}

.arc-progress {
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.score-ring-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-number {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.score-max {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Header meta */
.header-meta {
  flex: 1;
  min-width: 240px;
}

.header-top-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-block-end: 0.85rem;
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.3);
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

.profile-heading {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-block-end: 0.35rem;
}

.profile-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin-block-end: 0.85rem;
}

.summary-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: var(--bg-panel-solid);
  border-inline-start: 3px solid var(--accent-cyan);
  padding: 0.65rem 0.85rem;
  border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}

.summary-box svg {
  flex-shrink: 0;
  margin-block-start: 2px;
  color: var(--accent-cyan);
}

/* ── Section titles ── */
.ai-section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.05rem;
  color: var(--text-primary);
  margin-block-end: 1rem;
  padding-block-end: 0.6rem;
  border-block-end: 1px solid var(--border-color);
}

.ai-section-title svg {
  color: var(--accent-cyan);
}

/* ── Breakdown cards ── */
.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.breakdown-card {
  padding: 1rem 1.25rem;
  border-radius: var(--border-radius-md);
  border-inline-start: 4px solid var(--border-color);
  transition: border-color 0.2s;
}

.breakdown-card.score-excellent { border-inline-start-color: var(--accent-green); }
.breakdown-card.score-good      { border-inline-start-color: var(--accent-gold); }
.breakdown-card.score-poor      { border-inline-start-color: var(--accent-red); }

.breakdown-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-block-end: 0.6rem;
  gap: 1rem;
}

.breakdown-left {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}

.item-number {
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  padding: 0.1rem 0.4rem;
  white-space: nowrap;
}

.item-prompts {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.item-prompt {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--accent-cyan);
}

.item-domain {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.breakdown-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  flex-shrink: 0;
}

.item-score-badge {
  font-family: var(--font-heading);
  font-size: 1.3rem;
  font-weight: 700;
}

.item-score-badge.score-excellent { color: var(--accent-green); }
.item-score-badge.score-good      { color: var(--accent-gold); }
.item-score-badge.score-poor      { color: var(--accent-red); }

.item-score-max {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.item-rating {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.item-rating.score-excellent { color: var(--accent-green); }
.item-rating.score-good      { color: var(--accent-gold); }
.item-rating.score-poor      { color: var(--accent-red); }

/* Candidate answer */
.item-answer {
  margin-block-end: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.item-answer-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.item-answer-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-style: italic;
  background: var(--bg-panel-solid);
  padding: 0.4rem 0.65rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
}

.blank-answer {
  color: var(--accent-red);
  font-style: normal;
}

/* Dimension bars (SRT) */
.dimension-scores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
  margin-block: 0.6rem;
  background: var(--bg-panel-solid);
  padding: 0.65rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
}

.dim-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
}

.dim-label {
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 100px;
  text-transform: capitalize;
}

.dim-bar-track {
  flex: 1;
  height: 6px;
  background: rgba(0,0,0,0.07);
  border-radius: 999px;
  overflow: hidden;
}

.dim-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.8s ease;
}

.dim-bar-green { background: var(--accent-green); }
.dim-bar-gold  { background: var(--accent-gold); }
.dim-bar-red   { background: var(--accent-red); }

.dim-val {
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
}

/* Tags */
.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-block: 0.5rem;
}

/* Feedback */
.item-feedback {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-block: 0.6rem;
}

.feedback-col {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.feedback-head {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.feedback-green { color: var(--accent-green); }
.feedback-red   { color: var(--accent-red); }

.feedback-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.feedback-list li {
  font-size: 0.82rem;
  color: var(--text-secondary);
  padding-inline-start: 0.75rem;
  position: relative;
}

.feedback-list li::before {
  content: '•';
  position: absolute;
  inset-inline-start: 0;
  color: var(--accent-green);
}

.feedback-list-red li::before {
  color: var(--accent-red);
}

/* Improvement tip */
.improvement-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: rgba(3, 194, 252, 0.04);
  border: 1px solid rgba(3, 194, 252, 0.2);
  border-radius: var(--border-radius-sm);
  padding: 0.5rem 0.75rem;
  margin-block-start: 0.5rem;
}

.improvement-box svg {
  flex-shrink: 0;
  color: var(--accent-cyan);
  margin-block-start: 2px;
}

.improvement-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: block;
  margin-block-end: 0.15rem;
}

.improvement-text {
  font-size: 0.88rem;
  color: var(--text-primary);
  font-style: italic;
}

.perfect-box {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--accent-green);
  font-size: 0.82rem;
  font-weight: 600;
  margin-block-start: 0.4rem;
  padding: 0.35rem 0.6rem;
  background: var(--accent-green-glow);
  border-radius: var(--border-radius-sm);
  border: 1px solid rgba(21, 128, 61, 0.2);
}

/* ── Mistakes grid ── */
.mistakes-grid {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.mistake-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: rgba(185, 28, 28, 0.04);
  border: 1px solid rgba(185, 28, 28, 0.18);
  border-radius: var(--border-radius-md);
  padding: 0.75rem 1rem;
}

.mistake-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: var(--accent-red);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--font-heading);
}

.mistake-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.45;
  padding-block-start: 2px;
}

/* ── Recommendations ── */
.recommendations-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.recommendation-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: rgba(21, 128, 61, 0.04);
  border: 1px solid rgba(21, 128, 61, 0.2);
  border-radius: var(--border-radius-md);
  padding: 0.9rem 1rem;
}

.rec-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: var(--accent-green-glow);
  border: 1px solid rgba(21, 128, 61, 0.25);
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-green);
}

.rec-text {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>
