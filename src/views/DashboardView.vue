<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'

const store = usePreparationStore()
const router = useRouter()
const authStore = useAuthStore()

// 14 Officer Like Qualities (OLQs) divided into 4 Dimensions
const olqs = ref([
  // Dimension 1: Planning & Intelligence
  {
    id: 'intel',
    name: 'Effective Intelligence',
    dimension: 'Planning',
    score: 5,
    description: 'Ability to understand, analyze, and solve practical, day-to-day problems.',
  },
  {
    id: 'reason',
    name: 'Reasoning Ability',
    dimension: 'Planning',
    score: 5,
    description:
      'Logical thinking, grasping the core of a problem, and drawing correct conclusions.',
  },
  {
    id: 'organize',
    name: 'Organizing Ability',
    dimension: 'Planning',
    score: 5,
    description: 'Arranging resources, planning systematically, and executing structural ideas.',
  },
  {
    id: 'expression',
    name: 'Power of Expression',
    dimension: 'Planning',
    score: 5,
    description:
      'Clarity of speech and written expression, conveying ideas directly and persuasively.',
  },

  // Dimension 2: Social & Adaptability
  {
    id: 'coop',
    name: 'Cooperation',
    dimension: 'Social',
    score: 5,
    description: 'Working harmoniously in a team, putting collective goals above individual pride.',
  },
  {
    id: 'adapt',
    name: 'Social Adaptability',
    dimension: 'Social',
    score: 5,
    description: 'Adjusting well to new environments, people, and unexpected social pressures.',
  },
  {
    id: 'responsibility',
    name: 'Sense of Responsibility',
    dimension: 'Social',
    score: 5,
    description: 'Owning up to duties, acknowledging failures, and showing high integrity.',
  },

  // Dimension 3: Leadership & Influence
  {
    id: 'initiative',
    name: 'Initiative',
    dimension: 'Leadership',
    score: 5,
    description: 'Taking the first step in difficult circumstances without waiting for orders.',
  },
  {
    id: 'influence',
    name: 'Group Influencing Ability',
    dimension: 'Leadership',
    score: 5,
    description: 'Convincing or directing the group towards a solution without being aggressive.',
  },
  {
    id: 'decision',
    name: 'Speed of Decision',
    dimension: 'Leadership',
    score: 5,
    description: 'Making quick, logical choices under time pressure and high stress.',
  },
  {
    id: 'confidence',
    name: 'Self-Confidence',
    dimension: 'Leadership',
    score: 5,
    description: "Belief in one's own capabilities during crisis situations.",
  },

  // Dimension 4: Dynamic & Physical
  {
    id: 'liveliness',
    name: 'Liveliness',
    dimension: 'Dynamic',
    score: 5,
    description: 'Staying cheerful and energetic under severe mental and physical pressure.',
  },
  {
    id: 'determination',
    name: 'Determination',
    dimension: 'Dynamic',
    score: 5,
    description: 'Sticking to a task until it is completed, despite hurdles or fatigue.',
  },
  {
    id: 'courage',
    name: 'Courage & Stamina',
    dimension: 'Dynamic',
    score: 5,
    description: 'Facing danger or risk boldly, and enduring prolonged physical hardships.',
  },
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

// Referral Module properties
const referralCode = computed(() => authStore.profile?.referral_code || '')
const referralClicks = computed(() => authStore.profile?.referral_clicks || 0)
const referrals = ref([])
const appSettings = ref({
  course_price: 1499,
  referral_bonus: 200,
  max_discount_pct: 90,
  max_discount_amount: 1400,
})

const isLoadingReferrals = ref(false)

const referralLink = computed(() => {
  if (!referralCode.value) return ''
  return window.location.origin + '/r/' + referralCode.value
})

const copyStatus = ref('Copy Link')
const copyReferralLink = async () => {
  if (!referralLink.value) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(referralLink.value)
    } else {
      // Fallback for non-secure contexts (HTTP)
      const textArea = document.createElement('textarea')
      textArea.value = referralLink.value
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    copyStatus.value = 'Copied!'
    setTimeout(() => {
      copyStatus.value = 'Copy Link'
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
    copyStatus.value = 'Failed'
    setTimeout(() => {
      copyStatus.value = 'Copy Link'
    }, 2000)
  }
}

// Pricing Math
const paidReferralsCount = computed(() => {
  return referrals.value.filter((r) => r.status === 'approved').length
})

const totalBonusEarned = computed(() => {
  return paidReferralsCount.value * appSettings.value.referral_bonus
})

const maxDiscountAllowed = computed(() => {
  if (
    appSettings.value.max_discount_amount !== null &&
    appSettings.value.max_discount_amount !== undefined
  ) {
    return appSettings.value.max_discount_amount
  }
  return Math.floor(
    appSettings.value.course_price * (appSettings.value.max_discount_pct / 100),
  )
})

const finalCoursePrice = computed(() => {
  const discount = Math.min(totalBonusEarned.value, maxDiscountAllowed.value)
  return Math.max(appSettings.value.course_price - discount, 0)
})

const fetchReferralStats = async () => {
  if (!authStore.user) return
  isLoadingReferrals.value = true
  try {
    // 1. Fetch settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()
    if (!settingsError && settingsData) {
      appSettings.value = settingsData
    }

    // 2. Fetch referrals
    const { data: referralsData, error: referralsError } = await supabase
      .from('profiles')
      .select('id, full_name, status, created_at')
      .eq('referred_by', authStore.user.id)
    if (!referralsError && referralsData) {
      referrals.value = referralsData
    }
  } catch (e) {
    console.error('Error fetching referral stats:', e)
  } finally {
    isLoadingReferrals.value = false
  }
}

onMounted(() => {
  // Load saved self-assessment if exists
  const savedOlqs = localStorage.getItem('issb_olq_self_assessment')
  if (savedOlqs) {
    try {
      const parsed = JSON.parse(savedOlqs)
      olqs.value.forEach((o) => {
        if (parsed[o.id] !== undefined) {
          o.score = parsed[o.id]
        }
      })
    } catch (e) {
      console.error(e)
    }
  }
  fetchReferralStats()
})

const saveAssessment = () => {
  const exportData = {}
  olqs.value.forEach((o) => {
    exportData[o.id] = o.score
  })
  localStorage.setItem('issb_olq_self_assessment', JSON.stringify(exportData))
  store.addXP(30)
  alert('Self-Assessment profiling saved! XP Awarded.')
}

const goToRoadmap = () => {
  router.push('/roadmap')
}

const isApproved = computed(() => {
  return authStore.profile?.status === 'approved'
})

const isTrialActive = computed(() => {
  const p = authStore.profile
  return p?.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now()
})

const hasPremiumOrTrial = computed(() => {
  return isApproved.value || isTrialActive.value || authStore.profile?.role === 'admin'
})

const goToSimulator = (type) => {
  router.push(`/simulator/${type}`)
}

const goToStatus = () => {
  router.push('/status')
}
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- Top Hero Section (Dynamic based on Premium/Trial access) -->
    <section class="dashboard-hero glass-card animate-pulse-cyan">
      <div class="hero-left">
        <span class="badge badge-cyan">Tactical Command Center</span>
        
        <template v-if="hasPremiumOrTrial">
          <h2>Master the ISSB Selection Parameters</h2>
          <p>
            ISSB does not test your knowledge; it tests your <strong>personality, psychological stability,
            and leadership potential</strong>. Stop generic memorization. Understand what officers look for
            and align your mindset.
          </p>
          <button class="btn btn-primary" @click="goToRoadmap">
            <span>Start 5-Day Roadmap Training</span>
            <svg
              class="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </template>
        <template v-else>
          <h2>Practice Timed Test Simulators (Free)</h2>
          <p>
            Improve your response speed and structural thinking under selection board projector clocks. 
            Practice Word Association, Sentence Completion, and Situation Reactions for free.
          </p>
          <div class="free-simulators-action-row">
            <button class="btn btn-primary btn-sm" @click="goToSimulator('wat')">WAT Simulator</button>
            <button class="btn btn-primary btn-sm" @click="goToSimulator('sct')">SCT Sheet</button>
            <button class="btn btn-primary btn-sm" @click="goToSimulator('srt')">SRT Trainer</button>
            <button class="btn btn-primary btn-sm" @click="goToSimulator('obstacles')">GTO Obstacles</button>
          </div>
        </template>
      </div>

      <div class="hero-right flex-center">
        <template v-if="hasPremiumOrTrial">
          <div class="progress-circle-container">
            <svg class="circle-svg" viewBox="0 0 100 100">
              <circle
                class="circle-bg"
                cx="50"
                cy="50"
                r="40"
                stroke="#cbd5e1"
                stroke-width="8"
                fill="none"
              />
              <circle
                class="circle-progress"
                cx="50"
                cy="50"
                r="40"
                stroke="var(--accent-cyan)"
                stroke-width="8"
                fill="none"
                :stroke-dasharray="2 * Math.PI * 40"
                :stroke-dashoffset="2 * Math.PI * 40 * (1 - progressPercent / 100)"
              />
            </svg>
            <div class="progress-label flex-center">
              <span class="percent text-glow">{{ progressPercent }}%</span>
              <span class="lbl">Completed</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="free-badge-widget flex-center">
            <span class="badge-icon">🎖️</span>
            <span class="badge-lbl">Practice Area</span>
            <span class="badge-sub">Free Simulators</span>
          </div>
        </template>
      </div>
    </section>

    <!-- AI Psychologist Promotion / Access Status Banner -->
    <section class="dashboard-ai-promo glass-card" :class="isApproved ? 'status-approved-banner' : 'status-trial-banner'">
      <div class="promo-header">
        <div class="promo-title-group">
          <span class="badge" :class="isApproved ? 'badge-green' : 'badge-purple-ai'">
            {{ isApproved ? 'Active' : 'Free Trial' }}
          </span>
          <h3>
            {{ isApproved ? '🎖️ AI Psychological Assessor Fully Active' : '🧠 Unlock Your Real-Time AI Psychologist Assessor' }}
          </h3>
        </div>
        <div class="status-pulse-indicator">
          <span class="pulse-dot" :class="isApproved ? 'bg-green' : 'bg-purple'"></span>
          <span class="status-lbl">{{ isApproved ? 'AI Assessor Ready' : 'Diagnostics Locked' }}</span>
        </div>
      </div>

      <div class="promo-body">
        <p class="promo-intro-text">
          Our advanced AI is programmed with standard ISSB psychological evaluation parameters. 
          When you practice in our simulators, the AI evaluates every sentence against actual selection metrics.
        </p>

        <div class="promo-features-row">
          <div class="promo-feat">
            <span class="feat-icon">🔍</span>
            <strong>Mistake & Avoidance Check</strong>
            <p>Catches negative thoughts, textbook guidebook copies, double-negations, and escape attitudes.</p>
          </div>
          <div class="promo-feat">
            <span class="feat-icon">💡</span>
            <strong>Sentence Rephrasing</strong>
            <p>Shows you exactly how to rewrite weak answers to project optimal confidence and duty.</p>
          </div>
          <div class="promo-feat">
            <span class="feat-icon">📊</span>
            <strong>OLQ Profile Diagnostics</strong>
            <p>Extracts and maps your traits (Initiative, Courage, Cooperation) directly to a formatted report.</p>
          </div>
        </div>

        <div v-if="!isApproved" class="upgrade-pitch-box">
          <div class="pitch-text">
            <strong>⚠️ Faking your personality will get you rejected.</strong> 
            Academies teach memorized answers that selectors easily catch. Use our AI to scan your subconscious answers. 
            Unlock lifetime premium access for just <strong>PKR {{ appSettings.course_price }}</strong> or as low as <strong>PKR 100</strong> via referrals.
          </div>
        </div>
      </div>

      <div class="promo-actions">
        <template v-if="isApproved">
          <span class="approved-text">✓ You have lifetime premium access to the AI psychologist assessor.</span>
          <div class="action-buttons">
            <button class="btn btn-secondary btn-sm" @click="goToSimulator('wat')">WAT Simulator</button>
            <button class="btn btn-secondary btn-sm" @click="goToSimulator('sct')">SCT Sheet Trainer</button>
            <button class="btn btn-secondary btn-sm" @click="goToSimulator('srt')">SRT Crisis Trainer</button>
          </div>
        </template>
        <template v-else>
          <div class="price-info">
            <span class="price-slashed-dash">PKR {{ appSettings.course_price * 2.5 }}</span>
            <span class="price-current-dash">PKR {{ appSettings.course_price }}</span>
            <span class="price-or-dash">or</span>
            <span class="price-referral-dash">PKR 100*</span>
          </div>
          <div class="action-buttons-trial">
            <button class="btn btn-ai shadow-glow-purple" @click="goToStatus">
              Unlock Unlimited AI Diagnostics
            </button>
            <button class="btn btn-secondary" @click="goToRoadmap">
              Practice Simulators First
            </button>
          </div>
        </template>
      </div>
    </section>

    <!-- Strategic Grid: Failures vs Successes -->
    <section class="strategic-grid grid-2">
      <!-- Why Candidates Fail -->
      <div class="glass-card fail-card">
        <div class="card-header border-red">
          <svg
            class="card-icon text-red"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h3>Why Candidates Fail</h3>
        </div>
        <ul class="strategic-list">
          <li>
            <strong class="text-glow-red">Artificial & Memorized Responses:</strong>
            Writing standard WAT sentences or copying TAT stories from guidebooks shows a fake
            personality that gets exposed during interview checks.
          </li>
          <li>
            <strong class="text-glow-red">Negative / Depressive Thoughts:</strong>
            Expressing despair, violence, fear, or insecurity in psychology tests indicates
            emotional instability.
          </li>
          <li>
            <strong class="text-glow-red">Form Contradictions:</strong>
            Lying on Bio-Data forms (day 1) about hobbies, achievements, or family background leads
            to instant detection in interviews.
          </li>
          <li>
            <strong class="text-glow-red">Dominating or Passive GTO Behavior:</strong>
            Shouting and arguing with team members during group tasks, or staying completely silent,
            shows lack of cooperative social skills.
          </li>
          <li>
            <strong class="text-glow-red">Lack of Confidence & General Knowledge:</strong>
            Stuttering, lying, or failing to answer basic military, political, or academic questions
            under pressure.
          </li>
        </ul>
        <div class="action-recommendation badge badge-red">
          CRITICAL AVOIDANCE: Do not write pre-memorized sentences/stories!
        </div>
      </div>

      <!-- Why Candidates Succeed -->
      <div class="glass-card success-card">
        <div class="card-header border-green">
          <svg
            class="card-icon text-green"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-linecap="round" />
            <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round" />
          </svg>
          <h3>Why Candidates Succeed</h3>
        </div>
        <ul class="strategic-list">
          <li>
            <strong class="text-glow-green">Authenticity & Natural Expression:</strong>
            Writing simple, honest, and spontaneous answers. Showing your true thoughts rather than
            a copied "ideal" image.
          </li>
          <li>
            <strong class="text-glow-green">Emotional Resilience & Positive Mindset:</strong>
            Approaching stressful situation tasks with constructive, active solutions. Focus on duty
            and action.
          </li>
          <li>
            <strong class="text-glow-green">Complete Honesty on Day 1 Bio-Data:</strong>
            Ensuring absolute truth about hobbies, sports, and life details, allowing a smooth,
            confident interview presentation.
          </li>
          <li>
            <strong class="text-glow-green">Group-First Cooperation:</strong>
            Acting as a supportive group member during GTO tasks: facilitating the team, listening,
            and offering solutions.
          </li>
          <li>
            <strong class="text-glow-green">Bold Initiative & Decision Speed:</strong>
            Taking lead quickly when a group task gets stuck, showing clear reasoning, and making
            fast adjustments.
          </li>
        </ul>
        <div class="action-recommendation badge badge-green">
          RECOMMENDED PATH: Be genuine, cooperative, and physically alert!
        </div>
      </div>
    </section>

    <!-- Referral Module System Card -->
    <section class="referral-system-section glass-card">
      <div class="referral-header">
        <div>
          <span class="badge badge-cyan">Earn & Discount Program</span>
          <h3>Candidate Referral Network</h3>
          <p class="desc">
            Invite friends to prepare together. Get <strong>PKR {{ appSettings.referral_bonus }}</strong> off your course price for each friend who registers and activates their account!
          </p>
        </div>
        
        <div class="pricing-discount-display">
          <div class="discount-pill">
            <span class="lbl">Your Course Price:</span>
            <span class="val text-cyan">PKR {{ finalCoursePrice }}</span>
            <span class="sub text-muted" v-if="totalBonusEarned > 0">(Discount: -PKR {{ Math.min(totalBonusEarned, maxDiscountAllowed) }})</span>
          </div>
        </div>
      </div>

      <div class="referral-grid">
        <!-- Share Link Panel -->
        <div class="referral-card-panel bg-light">
          <h4>Your Unique Invite Link</h4>
          <p>Copy and share this referral URL with other candidates:</p>
          
          <div class="share-input-wrapper">
            <input type="text" readonly :value="referralLink" class="form-input share-url-input" />
            <button class="btn btn-primary btn-copy" @click="copyReferralLink">
              <span>{{ copyStatus }}</span>
            </button>
          </div>

          <div class="referral-rules">
            <h5>Program Rules & Limits:</h5>
            <ul>
              <li>Get +PKR {{ appSettings.referral_bonus }} deduction for every friend who completes payment.</li>
              <li>Base Course Fee: <strong>PKR {{ appSettings.course_price }}</strong></li>
              <li>Deductions stop after reaching a max discount of <strong>PKR {{ maxDiscountAllowed }}</strong> (Min price: <strong>PKR {{ Math.max(appSettings.course_price - maxDiscountAllowed, 0) }}</strong>).</li>
              <li>You can refer unlimited friends, even after hitting the maximum discount limit!</li>
            </ul>
          </div>
        </div>

        <!-- Metrics Dashboard -->
        <div class="referral-card-panel bg-light">
          <h4>Your Referrals Analytics</h4>
          
          <div class="metrics-summary-grid">
            <div class="metric-box">
              <span class="val text-cyan">{{ referralClicks }}</span>
              <span class="lbl">Link Clicks</span>
            </div>
            <div class="metric-box">
              <span class="val">{{ referrals.length }}</span>
              <span class="lbl">Registrations</span>
            </div>
            <div class="metric-box">
              <span class="val text-green">{{ paidReferralsCount }}</span>
              <span class="lbl">Paid Referrals</span>
            </div>
            <div class="metric-box">
              <span class="val text-gold">PKR {{ totalBonusEarned }}</span>
              <span class="lbl">Earned Bonus</span>
            </div>
          </div>

          <!-- Referral candidates list -->
          <div class="referrals-list-wrapper">
            <h5>Referred Candidates ({{ referrals.length }})</h5>
            <div v-if="isLoadingReferrals" class="referrals-list-loading">
              <span class="spinner"></span> Loading stats...
            </div>
            <div v-else-if="referrals.length === 0" class="referrals-empty">
              No friends have registered using your code yet. Share your link above to get started!
            </div>
            <div v-else class="referrals-table-container">
              <table class="referrals-mini-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="refCandidate in referrals" :key="refCandidate.id">
                    <td>
                      <span class="ref-name">{{ refCandidate.full_name || 'Candidate Joined' }}</span>
                    </td>
                    <td>
                      <span class="badge badge-mini" :class="{
                        'badge-mini-green': refCandidate.status === 'approved',
                        'badge-mini-cyan': refCandidate.status === 'pending',
                        'badge-mini-red': refCandidate.status === 'rejected'
                      }">
                        {{ refCandidate.status === 'approved' ? 'Paid / Active' : refCandidate.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Officer-Like Qualities Self-Assessment Profiler -->
    <section class="olq-profiler glass-card">
      <div class="profiler-header">
        <div>
          <h3>OLQ Self-Assessment Profiler</h3>
          <p class="desc">
            Rate yourself on the 14 traits evaluated at ISSB to analyze your profile and identify
            development areas.
          </p>
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
            <div
              v-for="olq in olqs.filter((o) => o.dimension === 'Planning')"
              :key="olq.id"
              class="trait-row"
            >
              <div class="trait-info">
                <strong>{{ olq.name }}</strong>
                <span class="trait-desc">{{ olq.description }}</span>
              </div>
              <div class="trait-slider">
                <input
                  type="range"
                  min="1"
                  max="10"
                  v-model.number="olq.score"
                  class="form-range"
                />
                <span
                  class="score-num text-glow"
                  :class="olq.score >= 7 ? 'text-green' : olq.score >= 4 ? 'text-gold' : 'text-red'"
                  >{{ olq.score }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Social Dimension -->
        <div class="dimension-section">
          <h4 class="dim-title">Social & Adaptability</h4>
          <div class="traits-list">
            <div
              v-for="olq in olqs.filter((o) => o.dimension === 'Social')"
              :key="olq.id"
              class="trait-row"
            >
              <div class="trait-info">
                <strong>{{ olq.name }}</strong>
                <span class="trait-desc">{{ olq.description }}</span>
              </div>
              <div class="trait-slider">
                <input
                  type="range"
                  min="1"
                  max="10"
                  v-model.number="olq.score"
                  class="form-range"
                />
                <span
                  class="score-num text-glow"
                  :class="olq.score >= 7 ? 'text-green' : olq.score >= 4 ? 'text-gold' : 'text-red'"
                  >{{ olq.score }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Leadership Dimension -->
        <div class="dimension-section">
          <h4 class="dim-title">Leadership & Influence</h4>
          <div class="traits-list">
            <div
              v-for="olq in olqs.filter((o) => o.dimension === 'Leadership')"
              :key="olq.id"
              class="trait-row"
            >
              <div class="trait-info">
                <strong>{{ olq.name }}</strong>
                <span class="trait-desc">{{ olq.description }}</span>
              </div>
              <div class="trait-slider">
                <input
                  type="range"
                  min="1"
                  max="10"
                  v-model.number="olq.score"
                  class="form-range"
                />
                <span
                  class="score-num text-glow"
                  :class="olq.score >= 7 ? 'text-green' : olq.score >= 4 ? 'text-gold' : 'text-red'"
                  >{{ olq.score }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Dimension -->
        <div class="dimension-section">
          <h4 class="dim-title">Dynamic & Physical</h4>
          <div class="traits-list">
            <div
              v-for="olq in olqs.filter((o) => o.dimension === 'Dynamic')"
              :key="olq.id"
              class="trait-row"
            >
              <div class="trait-info">
                <strong>{{ olq.name }}</strong>
                <span class="trait-desc">{{ olq.description }}</span>
              </div>
              <div class="trait-slider">
                <input
                  type="range"
                  min="1"
                  max="10"
                  v-model.number="olq.score"
                  class="form-range"
                />
                <span
                  class="score-num text-glow"
                  :class="olq.score >= 7 ? 'text-green' : olq.score >= 4 ? 'text-gold' : 'text-red'"
                  >{{ olq.score }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="profiler-footer flex-center">
        <div class="profile-recommendation" v-if="lowestTraits.length > 0">
          <strong>Key Improvement Goals:</strong>
          <span class="trait-tag" v-for="t in lowestTraits" :key="t.id"
            >{{ t.name }} ({{ t.score }}/10)</span
          >
        </div>
        <button class="btn btn-primary" @click="saveAssessment">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="btn-icon"
          >
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
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

/* Referral System Card styles */
.referral-system-section {
  border-block-start: 4px solid var(--accent-cyan);
}

.referral-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: 1.5rem;
  padding-block-end: 1rem;
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
  gap: 1.5rem;
}

.referral-header .desc {
  font-size: 0.92rem;
  color: var(--text-secondary);
  margin-top: 0.35rem;
  line-height: 1.45;
}

.pricing-discount-display {
  display: flex;
  align-items: center;
}

.discount-pill {
  background: white;
  border: 1px solid var(--border-color);
  padding: 0.75rem 1.25rem;
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.discount-pill .lbl {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.discount-pill .val {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 800;
}

.discount-pill .sub {
  font-size: 0.72rem;
  font-weight: 600;
}

.referral-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.referral-card-panel {
  padding: 1.5rem;
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.referral-card-panel.bg-light {
  background: #f8fafc;
  border: 1px solid var(--border-color);
}

.referral-card-panel h4 {
  font-size: 1.05rem;
  color: var(--text-primary);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 0.5rem;
}

.share-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.share-url-input {
  font-family: monospace;
  font-size: 0.8rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 0.5rem;
  flex: 1;
}

.btn-copy {
  padding: 0 1rem;
  font-size: 0.85rem;
  white-space: nowrap;
}

.referral-rules {
  margin-top: 0.5rem;
}

.referral-rules h5 {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.referral-rules ul {
  list-style: disc;
  padding-left: 1.25rem;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metrics-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.metric-box {
  background: white;
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-box .val {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
}

.metric-box .lbl {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.referrals-list-wrapper {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.referrals-list-wrapper h5 {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.referrals-list-loading,
.referrals-empty {
  background: white;
  border: 1px solid var(--border-color);
  padding: 1.5rem 1rem;
  border-radius: var(--border-radius-md);
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.referrals-table-container {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  max-height: 150px;
  overflow-y: auto;
}

.referrals-mini-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.82rem;
}

.referrals-mini-table th,
.referrals-mini-table td {
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.referrals-mini-table th {
  background: #f1f5f9;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 0.72rem;
}

.referrals-mini-table tr:last-child td {
  border-bottom: none;
}

.ref-name {
  font-weight: 600;
  color: var(--text-primary);
}

.badge-mini {
  padding: 0.15rem 0.45rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.badge-mini-green {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
}

.badge-mini-cyan {
  background: var(--accent-cyan-glow);
  color: #0369a1;
}

.badge-mini-red {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}

@media (max-width: 992px) {
  .referral-grid {
    grid-template-columns: 1fr;
  }
}

/* Dashboard AI Promotion Section */
.dashboard-ai-promo {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  border-radius: var(--border-radius-lg);
  border-inline-start: 4px solid #7c3aed !important;
  transition: all var(--transition-smooth);
}

.status-trial-banner {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(79, 70, 229, 0.03));
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.status-approved-banner {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(3, 194, 252, 0.03));
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-inline-start: 4px solid var(--accent-green) !important;
}

.promo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.promo-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.badge-purple-ai {
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.25);
  padding: 0.25rem 0.6rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.promo-title-group h3 {
  font-size: 1.35rem;
  margin: 0;
  color: var(--text-primary);
}

.status-pulse-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pulse-dot.bg-purple {
  background-color: #7c3aed;
  animation: pulse-purple-dot 1.5s infinite;
}

.pulse-dot.bg-green {
  background-color: var(--accent-green);
  animation: pulse-green-dot 1.5s infinite;
}

@keyframes pulse-purple-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(124, 58, 237, 0); }
}

@keyframes pulse-green-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
}

.status-lbl {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.promo-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.promo-intro-text {
  font-size: 0.98rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.promo-features-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.promo-feat {
  background: white;
  border: 1px solid var(--border-color);
  padding: 1.25rem;
  border-radius: var(--border-radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.status-trial-banner .promo-feat {
  border-color: rgba(124, 58, 237, 0.15);
}

.feat-icon {
  font-size: 1.35rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.promo-feat strong {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.promo-feat p {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.45;
  margin: 0;
}

.upgrade-pitch-box {
  background: rgba(124, 58, 237, 0.04);
  border: 1px dashed rgba(124, 58, 237, 0.25);
  padding: 1rem 1.25rem;
  border-radius: var(--border-radius-md);
}

.pitch-text {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.promo-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 1.25rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.approved-text {
  font-size: 0.9rem;
  color: var(--accent-green);
  font-weight: 600;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.price-slashed-dash {
  text-decoration: line-through;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.price-current-dash {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary);
}

.price-or-dash {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.price-referral-dash {
  font-family: var(--font-heading);
  font-weight: 800;
  color: #7c3aed;
  font-size: 1.35rem;
}

.action-buttons, .action-buttons-trial {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.4rem 0.85rem;
  font-size: 0.85rem;
}

.btn-ai {
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  color: #ffffff !important;
  border: none;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
  transition: all var(--transition-smooth);
}

.btn-ai:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35);
}

.shadow-glow-purple {
  animation: glow-purple-btn 2s infinite;
}

@keyframes glow-purple-btn {
  0%, 100% { box-shadow: 0 0 8px rgba(124, 58, 237, 0.2); }
  50% { box-shadow: 0 0 16px rgba(124, 58, 237, 0.45); }
}

@media (max-width: 768px) {
  .promo-header, .promo-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  .action-buttons-trial, .action-buttons {
    width: 100%;
  }
  .action-buttons-trial button, .action-buttons button {
    flex: 1;
  }
}

.free-simulators-action-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.free-badge-widget {
  flex-direction: column;
  background: white;
  border: 1px solid var(--border-color);
  padding: 1.25rem 1rem;
  border-radius: var(--border-radius-lg);
  min-width: 130px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.free-badge-widget .badge-icon {
  font-size: 1.8rem;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.free-badge-widget .badge-lbl {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
}

.free-badge-widget .badge-sub {
  font-size: 0.65rem;
  color: var(--accent-green);
  font-weight: 600;
}
</style>
