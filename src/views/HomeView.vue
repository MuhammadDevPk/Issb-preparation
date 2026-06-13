<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const appSettings = ref({
  course_price: 1499,
  referral_bonus: 200,
})

const fetchSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()
    if (!error && data) {
      appSettings.value = data
    }
  } catch (e) {
    console.error('Error fetching settings:', e)
  }
}

onMounted(() => {
  fetchSettings()
})

const goToRegister = () => {
  router.push('/register')
}

const goToLogin = () => {
  router.push('/login')
}

const goToPortal = () => {
  if (authStore.user) {
    const p = authStore.profile
    const isAdmin = p?.role === 'admin'
    const isApproved = p?.status === 'approved'
    const isTrialActive = p?.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now()
    if (isAdmin || isApproved || isTrialActive) {
      router.push('/dashboard')
    } else {
      router.push('/status')
    }
  } else {
    router.push('/register')
  }
}

// Interactive Portal Showcase State
const activeShowcaseTab = ref('dashboard') // dashboard, roadmap, simulators, obstacles, support
const activeRoadmapSubTab = ref('day1') // day1, day2, day3, day4, day5
const activeSimulatorSubTab = ref('wat') // wat, sct, srt
</script>

<template>
  <div class="landing-page">
    <!-- Navigation Header -->
    <header class="landing-nav">
      <RouterLink to="/" class="nav-logo">
        <svg class="icon-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <path d="M12 6L5 20H19L12 6Z" fill="currentColor" opacity="0.3" />
          <circle cx="12" cy="14" r="2" fill="currentColor" />
        </svg>
        <div class="logo-text">
          <span class="logo-title">ISSB COMMAND</span>
          <span class="sub-text">PREPARATION PORTAL</span>
        </div>
      </RouterLink>
      <button @click="goToPortal" class="btn btn-nav-portal">
        Go to Portal
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-icon">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </header>

    <main id="main-content">
      <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <span class="badge badge-accent">100% Target-Oriented Prep Portal</span>
        <h1>
          Stop Preparing Generically. <br /><span class="highlight">Unlock Your Recommendation.</span>
        </h1>
        <p class="hero-subtitle">
          Most ISSB candidates fail not because they lack potential, but because they study outdated
          guidebooks, try to fake their personalities, or freeze during timed psychologist tests.
          Our structured portal simulates the exact 5-day cycle. <strong>Sign up now to instantly start a 30-minute free trial with access to all timers, simulators, and guides.</strong>
        </p>

        <!-- Bullet Highlights -->
        <div class="hero-bullets">
          <div class="bullet-item">
            <span class="bullet-check">✓</span>
            <span>Complete 5-Day Step-by-Step Curriculum</span>
          </div>
          <div class="bullet-item">
            <span class="bullet-check">✓</span>
            <span>Real-time Timed Psychologist Test Simulators</span>
          </div>
          <div class="bullet-item">
            <span class="bullet-check">✓</span>
            <span>Officer-Like Qualities (OLQ) Assessment</span>
          </div>
          <div class="bullet-item">
            <span class="bullet-check">⏳</span>
            <span><strong>30-Minute Free Trial</strong> (Unlock all features instantly upon signup)</span>
          </div>
        </div>

        <div class="hero-actions">
          <button @click="goToPortal" class="btn btn-primary btn-large">Start 30-Min Free Trial</button>
          <button @click="goToPortal" class="btn btn-secondary btn-large">
            Explore Portal First
          </button>
        </div>
      </div>

      <!-- Interactive Psychologist Simulator Preview Mockup -->
      <div class="hero-simulator-preview-card">
        <div class="simulator-header">
          <div class="header-status">
            <span class="pulse-dot"></span>
            <span class="status-label">PSYCHOLOGIST TIMED ENGINE</span>
          </div>
          <div class="test-label">Word Association Test (WAT)</div>
        </div>

        <div class="simulator-body">
          <div class="word-card">
            <span class="card-hint">DAY 2 TEST 1 — SCREEN FLASH</span>
            <div class="flashed-word">CRISIS</div>
          </div>

          <div class="timer-widget">
            <div class="circular-progress">
              <svg viewBox="0 0 100 100" class="progress-ring">
                <circle cx="50" cy="50" r="40" class="bg-circle" />
                <circle cx="50" cy="50" r="40" class="active-circle" />
              </svg>
              <div class="timer-value">
                <span class="seconds">07</span>
                <span class="unit">sec</span>
              </div>
            </div>
            <div class="timer-desc">Time remaining to write and auto-submit response.</div>
          </div>

          <div class="response-preview">
            <span class="preview-label">Subconscious Candidate Response</span>
            <div class="mock-input">
              A leader resolves the <span class="typing-cursor">crisis with swift action.</span>
            </div>
          </div>

          <div class="olq-tagging">
            <span class="olq-header">Detected Officer-Like Qualities (OLQ):</span>
            <div class="olq-tags">
              <span class="olq-tag tag-success">+ Initiative</span>
              <span class="olq-tag tag-success">+ Practical Intel</span>
              <span class="olq-tag tag-success">+ Courage</span>
            </div>
          </div>
        </div>

        <div class="simulator-footer">
          <p>Traditional books teach faked, robotic sentences that get you rejected. The simulator trains your natural response speed under stress.</p>
        </div>
      </div>
    </section>

    <!-- Referral Highlight Banner -->
    <section class="referral-highlight-banner">
      <div class="banner-content">
        <div class="banner-badge">EARN YOUR PASSPORT FOR Rs. 100</div>
        <h2>Can't Afford the Course? Get it for Rs. 100 dynamically!</h2>
        <p class="banner-desc">
          No upfront payment required! Simply sign up, copy your unique referral link, and invite other candidates. 
          For every friend who signs up and registers, your course fee is slashed. 
          With just a few referrals, you can get full lifetime premium access to all simulators and solved playbooks for as low as <strong>PKR 100</strong>!
          Start sharing your link instantly upon free registration.
        </p>
        <button @click="goToPortal" class="btn btn-banner-cta">Get Your Referral Link Now</button>
      </div>
    </section>

    <!-- Why Candidates Fail / Succeed Section -->
    <section class="insights-section">
      <div class="section-header">
        <h2>The Academy Trap vs. The Scientific Command Portal</h2>
        <p>Why standard coaching academies lead to rejection and how to prepare with precision.</p>
      </div>

      <div class="insights-grid">
        <div class="insight-card card-fail">
          <div class="card-icon text-red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h3>The Outdated Academy Trap (95% Rejection)</h3>
          <ul class="insight-list">
            <li>
              <strong>Memorized Standard Sentences:</strong> Copying typical guidebook answers (e.g. writing "Atom is a power" for ATOM) that psychologists easily detect as fake and robotic.
            </li>
            <li>
              <strong>Robotic Super-Soldier Profiles:</strong> Faking answers to look perfect while contradicting your Day 1 Bio-data, resulting in rejection due to lack of consistency.
            </li>
            <li>
              <strong>Outdated Paper Booklets:</strong> Memorizing list words without practicing against the strict 10-second projector screen, causing candidates to freeze at the actual ISSB.
            </li>
            <li>
              <strong>Hostel & Camps Charges:</strong> Wasting Rs. 25,000 to Rs. 40,000 on general classes that fail to provide real-time testing simulation.
            </li>
          </ul>
        </div>

        <div class="insight-card card-succeed">
          <div class="card-icon text-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>The ISSB Command Portal (Recommended Path)</h3>
          <ul class="insight-list">
            <li>
              <strong>Genuine Subconscious Alignment:</strong> We train you to write natural, positive responses matching your profile so you pass the psychological screening.
            </li>
            <li>
              <strong>Interactive Timed Simulators:</strong> Practice WAT, SCT, and SRT tests using the exact timer cycles of the selection board.
            </li>
            <li>
              <strong>Solved Playbook Libraries:</strong> Instant access to 1000+ positive WAT sentences, 500+ SCT sheets, and GTO obstacle planners.
            </li>
            <li>
              <strong>Dynamic Referral Discounts:</strong> Earn deductions of <strong>PKR {{ appSettings.referral_bonus }}</strong> per referral. Drop the price to just Rs. 100.
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Portal Tour & Screenshots Showcase Section -->
    <section class="portal-showcase-section">
      <div class="section-header">
        <span class="badge badge-accent">Interactive Tour</span>
        <h2>Explore Inside the Command Center Portal</h2>
        <p>See exactly what you will access after registration. We hide nothing because our system is built with scientific, high-fidelity prep tools.</p>
      </div>

      <div class="showcase-container">
        <!-- Main Tabs Selector -->
        <div class="showcase-tabs">
          <button @click="activeShowcaseTab = 'dashboard'" :class="['tab-btn', { active: activeShowcaseTab === 'dashboard' }]">
            <span class="tab-num">01</span> Central Dashboard
          </button>
          <button @click="activeShowcaseTab = 'roadmap'" :class="['tab-btn', { active: activeShowcaseTab === 'roadmap' }]">
            <span class="tab-num">02</span> 5-Day Roadmap
          </button>
          <button @click="activeShowcaseTab = 'simulators'" :class="['tab-btn', { active: activeShowcaseTab === 'simulators' }]">
            <span class="tab-num">03</span> Timed Simulators
          </button>
          <button @click="activeShowcaseTab = 'obstacles'" :class="['tab-btn', { active: activeShowcaseTab === 'obstacles' }]">
            <span class="tab-num">04</span> GTO Obstacle Planner
          </button>
          <button @click="activeShowcaseTab = 'support'" :class="['tab-btn', { active: activeShowcaseTab === 'support' }]">
            <span class="tab-num">05</span> Ideas & Complaints
          </button>
        </div>

        <!-- Showcase Panels Content -->
        <div class="showcase-panels glass-card">
          <!-- 1. CENTRAL DASHBOARD -->
          <div v-if="activeShowcaseTab === 'dashboard'" class="showcase-panel fade-in">
            <div class="panel-layout">
              <div class="panel-preview">
                <img src="/media/images/dashboard/dashboard.jpg" alt="ISSB Command Portal Central Dashboard" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <div class="panel-info">
                <h3>Your Central Hub for Officer Preparation</h3>
                <p class="panel-desc">
                  This dashboard tracks your active preparation and personality profiling in real-time. It maps your progress directly to the core assessment indicators used at selection boards.
                </p>
                <ul class="panel-features-list">
                  <li>
                    <strong>Dynamic Streak Tracker:</strong> Built-in psychological triggers keeping you focused day-by-day.
                  </li>
                  <li>
                    <strong>Cadet Rank Progression:</strong> Earn preparation experience (XP) and watch your rank grow from Cadet to Captain.
                  </li>
                  <li>
                    <strong>OLQ Quick Profiler Summary:</strong> Get immediate visual analysis of your strengths and weaknesses across planning, dynamic, and leadership traits.
                  </li>
                </ul>
                <button @click="goToPortal" class="btn btn-primary">Enter Dashboard Now</button>
              </div>
            </div>
          </div>

          <!-- 2. 5-DAY ROADMAP -->
          <div v-if="activeShowcaseTab === 'roadmap'" class="showcase-panel fade-in">
            <div class="roadmap-subtabs">
              <button @click="activeRoadmapSubTab = 'day1'" :class="['subtab-btn', { active: activeRoadmapSubTab === 'day1' }]">Day 1: Arrival</button>
              <button @click="activeRoadmapSubTab = 'day2'" :class="['subtab-btn', { active: activeRoadmapSubTab === 'day2' }]">Day 2: Psychologist</button>
              <button @click="activeRoadmapSubTab = 'day3'" :class="['subtab-btn', { active: activeRoadmapSubTab === 'day3' }]">Day 3: GTO Tasks</button>
              <button @click="activeRoadmapSubTab = 'day4'" :class="['subtab-btn', { active: activeRoadmapSubTab === 'day4' }]">Day 4: Individual</button>
              <button @click="activeRoadmapSubTab = 'day5'" :class="['subtab-btn', { active: activeRoadmapSubTab === 'day5' }]">Day 5: Conference</button>
            </div>
            
            <div class="panel-layout">
              <!-- Day 1 Panel -->
              <div v-if="activeRoadmapSubTab === 'day1'" class="panel-preview fade-in">
                <img src="/media/images/dashboard/5-Day Roadmap(Day 1: Arrival & Screening).jpg" alt="Roadmap Day 1" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <!-- Day 2 Panel -->
              <div v-if="activeRoadmapSubTab === 'day2'" class="panel-preview fade-in">
                <img src="/media/images/dashboard/5-Day Roadmap(Day 2: Psychologist Day).jpg" alt="Roadmap Day 2" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <!-- Day 3 Panel -->
              <div v-if="activeRoadmapSubTab === 'day3'" class="panel-preview fade-in">
                <img src="/media/images/dashboard/5-Day Roadmap(Day 3: GTO Tasks (Indoor & Out)).jpg" alt="Roadmap Day 3" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <!-- Day 4 Panel -->
              <div v-if="activeRoadmapSubTab === 'day4'" class="panel-preview fade-in">
                <img src="/media/images/dashboard/5-Day Roadmap(Day 4: Individual Tasks & Interview).jpg" alt="Roadmap Day 4" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <!-- Day 5 Panel -->
              <div v-if="activeRoadmapSubTab === 'day5'" class="panel-preview fade-in">
                <img src="/media/images/dashboard/5-Day Roadmap(Day 5: Conference & Results).jpg" alt="Roadmap Day 5" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>

              <div class="panel-info">
                <h3>The Complete 5-Day Training Curriculum</h3>
                <p class="panel-desc">
                  Traditional guides present information as a massive list. Our roadmap structures it into the exact chronologic sequence you will encounter. Each day includes:
                </p>
                <ul class="panel-features-list">
                  <li>
                    <strong>Detailed Test Guidelines:</strong> Explaining what the test is, who conducts it, what common traps lead to failures, and what traits to project.
                  </li>
                  <li>
                    <strong>Drive-Linked PDF Viewers:</strong> Read official worksheets and recommended cadet experiences directly inside the portal without any downloading lag.
                  </li>
                  <li>
                    <strong>Targeted Simulators:</strong> Access practicing simulators matched exactly to that day's scheduled psychologist testing.
                  </li>
                </ul>
                <button @click="goToPortal" class="btn btn-primary">Open Roadmap Checklists</button>
              </div>
            </div>
          </div>

          <!-- 3. TIMED SIMULATORS -->
          <div v-if="activeShowcaseTab === 'simulators'" class="showcase-panel fade-in">
            <div class="roadmap-subtabs">
              <button @click="activeSimulatorSubTab = 'wat'" :class="['subtab-btn', { active: activeSimulatorSubTab === 'wat' }]">WAT Simulator</button>
              <button @click="activeSimulatorSubTab = 'sct'" :class="['subtab-btn', { active: activeSimulatorSubTab === 'sct' }]">SCT Sheet Trainer</button>
              <button @click="activeSimulatorSubTab = 'srt'" :class="['subtab-btn', { active: activeSimulatorSubTab === 'srt' }]">SRT Crisis Trainer</button>
            </div>
            
            <div class="panel-layout">
              <!-- WAT Simulator -->
              <div v-if="activeSimulatorSubTab === 'wat'" class="panel-preview fade-in">
                <img src="/media/images/dashboard/wat simulator.jpg" alt="WAT Simulator" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <!-- SCT Simulator -->
              <div v-if="activeSimulatorSubTab === 'sct'" class="panel-preview fade-in">
                <img src="/media/images/dashboard/SCT Simulator.jpg" alt="SCT Simulator" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <!-- SRT Simulator -->
              <div v-if="activeSimulatorSubTab === 'srt'" class="panel-preview fade-in">
                <img src="/media/images/dashboard/SRT Trainer.jpg" alt="SRT Trainer" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>

              <div class="panel-info">
                <h3>Subconscious Stress Testing Engine</h3>
                <p class="panel-desc">
                  This is the crown jewel of our preparation system. Selectors check your subconscious reactions. We train you to write positive, authentic responses under strict timing:
                </p>
                <ul class="panel-features-list">
                  <li>
                    <strong>Word Association Test (WAT):</strong> Auto-advancing words on a strict 10-second projector clock.
                  </li>
                  <li>
                    <strong>Sentence Completion Test (SCT):</strong> Practice sheets in Roman Urdu and English with a running 6-minute clock.
                  </li>
                  <li>
                    <strong>Situation Reaction Test (SRT):</strong> Crisis-control scenarios prompting practical leadership reactions in 30 seconds.
                  </li>
                </ul>
                <button @click="goToPortal" class="btn btn-primary">Launch Projector Simulator</button>
              </div>
            </div>
          </div>

          <!-- 4. GTO OBSTACLE PLANNER -->
          <div v-if="activeShowcaseTab === 'obstacles'" class="showcase-panel fade-in">
            <div class="panel-layout">
              <div class="panel-preview">
                <img src="/media/images/dashboard/GTO Obstacles.jpg" alt="GTO Obstacle sequence planner" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <div class="panel-info">
                <h3>Interactive GTO Individual Obstacles Planner</h3>
                <p class="panel-desc">
                  Candidates often fail individual GTO tasks because of physical exhaustion. Our interactive planner teaches you to formulate a tactical strategy before stepping onto the physical rope:
                </p>
                <ul class="panel-features-list">
                  <li>
                    <strong>Target Points Calculator:</strong> Drag and drop obstacles into your custom sequence (e.g. Tarzan Swing, Zig-Zag, Rope Climb) to calculate total possible scores (target is 30+).
                  </li>
                  <li>
                    <strong>Fatigue & Energy Indexing:</strong> Displays warnings if you schedule physically exhausting tasks near the end of your 3-minute sequence.
                  </li>
                  <li>
                    <strong>Safety & Tactical Guidelines:</strong> Rules and safety instructions to pass GTO inspection cleanly.
                  </li>
                </ul>
                <button @click="goToPortal" class="btn btn-primary">Plan GTO Route</button>
              </div>
            </div>
          </div>

          <!-- 5. IDEAS & COMPLAINTS -->
          <div v-if="activeShowcaseTab === 'support'" class="showcase-panel fade-in">
            <div class="panel-layout">
              <div class="panel-preview">
                <img src="/media/images/dashboard/Complaints and Ideas.jpg" alt="Ideas and Complaints board" class="screenshot-img" width="1200" height="750" loading="lazy" />
              </div>
              <div class="panel-info">
                <h3>Improvements Suggestion Board & Private Helpdesk</h3>
                <p class="panel-desc">
                  We believe in constant improvement. The portal includes a community module where candidates participate in shaping the curriculum:
                </p>
                <ul class="panel-features-list">
                  <li>
                    <strong>Public Improvement Requests:</strong> Propose new simulator features or guides. Other users can upvote/downvote suggestions with live percentage ratings.
                  </li>
                  <li>
                    <strong>Private Complaint Helpdesk:</strong> Submit bugs or activation requests directly. Checked privately by the admin.
                  </li>
                  <li>
                    <strong>Active Community Voice:</strong> Direct control of updates via candidate majority consensus.
                  </li>
                </ul>
                <button @click="goToPortal" class="btn btn-primary">Submit Feature Request</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- What's inside the Portal -->
    <section class="features-section">
      <div class="section-header">
        <h2>What You Get Inside the Command Center</h2>
        <p>Everything you need to systematically prepare, practice, and evaluate yourself.</p>
      </div>

      <div class="features-grid">
        <div class="feature-item">
          <div class="feature-icon border-blue">
            <span>01</span>
          </div>
          <h4>5-Day Structured Roadmap</h4>
          <p>
            A day-by-day checklist that clarifies the exact timeline of tests (Day 1 Arrival to Day
            5 Conference).
          </p>
        </div>

        <div class="feature-item">
          <div class="feature-icon border-blue">
            <span>02</span>
          </div>
          <h4>Interactive Simulator Panel</h4>
          <p>
            Train with timed interactive simulators for WAT, SCT, SRT, and Individual GTO Obstacles.
          </p>
        </div>

        <div class="feature-item">
          <div class="feature-icon border-blue">
            <span>03</span>
          </div>
          <h4>Officer-Like Quality (OLQ) Profiler</h4>
          <p>
            Rate yourself across the 14 critical dimensions of personality evaluated by selectors.
          </p>
        </div>

        <div class="feature-item">
          <div class="feature-icon border-blue">
            <span>04</span>
          </div>
          <h4>Drive-Linked Study Hub</h4>
          <p>
            Access all 19 official manuals, bio-data sheets, and recommended cadet experiences
            directly in-app.
          </p>
        </div>
      </div>
    </section>

    <!-- Student Testimonials Section -->
    <section class="reviews-section">
      <div class="section-header">
        <span class="badge badge-accent">Success Stories</span>
        <h2>Recommended Candidates & Cadet Reviews</h2>
        <p>See how real candidates used the Command Portal to bypass expensive coaching camps and secure recommendation for the Pakistan Army.</p>
      </div>

      <div class="reviews-grid">
        <!-- Card 1 -->
        <div class="review-card glass-card">
          <div class="review-header">
            <div class="avatar-circle">MS</div>
            <div class="candidate-info">
              <h4>MUHAMMAD SAEED UR REHMAN</h4>
              <span class="badge-branch">Pakistan Army — Approved</span>
            </div>
          </div>
          <div class="stars-row">★★★★★</div>
          <p class="review-text">
            "The timed Word Association simulator was a lifesaver. I used to freeze during standard book practice. The portal's automatic 10-second projector clock trained my brain to write spontaneous, positive sentences. Recommended for PMA 153!"
          </p>
        </div>

        <!-- Card 2 -->
        <div class="review-card glass-card">
          <div class="review-header">
            <div class="avatar-circle">AB</div>
            <div class="candidate-info">
              <h4>Aftab</h4>
              <span class="badge-branch">Pakistan Army — Approved</span>
            </div>
          </div>
          <div class="stars-row">★★★★★</div>
          <p class="review-text">
            "Coaching academies charge Rs. 35,000 and teach memorized sentences that selectors reject immediately. This portal teaches you how to project your true Officer-Like Qualities. Got recommended in my first attempt."
          </p>
        </div>

        <!-- Card 3 -->
        <div class="review-card glass-card">
          <div class="review-header">
            <div class="avatar-circle">IA</div>
            <div class="candidate-info">
              <h4>Imtiaz Ali</h4>
              <span class="badge-branch">Pakistan Army — Approved</span>
            </div>
          </div>
          <div class="stars-row">★★★★★</div>
          <p class="review-text">
            "The GTO Individual Obstacles planner is pure science. I mapped my run to score 32 points without burning out. The solved English and Urdu Sentence Completion playbooks were also highly accurate."
          </p>
        </div>

        <!-- Card 4 -->
        <div class="review-card glass-card">
          <div class="review-header">
            <div class="avatar-circle">MR</div>
            <div class="candidate-info">
              <h4>Moiz Rashid</h4>
              <span class="badge-branch">Pakistan Army — Approved</span>
            </div>
          </div>
          <div class="stars-row">★★★★★</div>
          <p class="review-text">
            "Most people fail the screening tests on Day 1. The Day-by-Day Roadmap here structures everything so you know exactly what is coming. Outstanding platform for Army candidates."
          </p>
        </div>

        <!-- Card 5 -->
        <div class="review-card glass-card">
          <div class="review-header">
            <div class="avatar-circle">AW</div>
            <div class="candidate-info">
              <h4>Awais</h4>
              <span class="badge-branch">Pakistan Army — Approved</span>
            </div>
          </div>
          <div class="stars-row">★★★★★</div>
          <p class="review-text">
            "I got my access for just Rs. 100 by sharing my referral link with 7 of my academy classmates! The support desk resolved my activation within minutes. Truly cadet-friendly."
          </p>
        </div>

        <!-- Card 6 -->
        <div class="review-card glass-card">
          <div class="review-header">
            <div class="avatar-circle">TI</div>
            <div class="candidate-info">
              <h4>Taimoor Iqbal</h4>
              <span class="badge-branch">Pakistan Army — Approved</span>
            </div>
          </div>
          <div class="stars-row">★★★★★</div>
          <p class="review-text">
            "Highly recommended. The psychologist simulators (WAT, SCT, SRT) are identical to the actual ISSB testing projection screens. If you want to bypass the academy fees, this is your best bet."
          </p>
        </div>
      </div>
    </section>

    <!-- Premium Upgrade / Pricing Section -->
    <section class="pricing-section" id="pricing">
      <div class="section-header">
        <span class="badge badge-accent">Unlock Premium Recommendation Course</span>
        <h2>Master Every Test with Solved Study Materials</h2>
        <p>
          Gain access to exclusive solved guides, full psychologist papers, and premium simulators.
        </p>
      </div>

      <div class="pricing-grid">
        <!-- Value List -->
        <div class="pricing-value-card">
          <h3>What You Get in Premium Course</h3>
          <div class="value-items">
            <div class="value-item">
              <div class="value-icon">✓</div>
              <div>
                <strong>Complete Solved WAT Guidebook</strong>
                <p>
                  1,000+ solved Word Association sentences categorized by positive responses and
                  action keys.
                </p>
              </div>
            </div>
            <div class="value-item">
              <div class="value-icon">✓</div>
              <div>
                <strong>Solved SCT (Sentence Completion) Playbook</strong>
                <p>
                  500+ solved Urdu & English incomplete sentences structured to show high emotional
                  stability.
                </p>
              </div>
            </div>
            <div class="value-item">
              <div class="value-icon">✓</div>
              <div>
                <strong>100+ Solved SRT (Situation Reactions)</strong>
                <p>
                  Complete guide with ideal crisis reactions representing high resourcefulness and
                  panic control.
                </p>
              </div>
            </div>
            <div class="value-item">
              <div class="value-icon">✓</div>
              <div>
                <strong>Deputy President Solved Interview Playbook</strong>
                <p>
                  Handpicked, high-probability questions with answered guides directly from
                  recommended candidates.
                </p>
              </div>
            </div>
            <div class="value-item">
              <div class="value-icon">✓</div>
              <div>
                <strong>GTO Obstacle Optimal Paths & Video Guide</strong>
                <p>
                  Sequence planner blueprints showing how to cross 30+ points threshold without
                  exhaustion.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Checkout / Payment Details Card -->
        <div class="pricing-checkout-card">
          <div class="card-badge">Limited Time Offer</div>
          <div class="price-box">
            <span class="price-slashed">PKR {{ appSettings.course_price * 2.5 }}</span>
            <div class="price-current-container">
              <span class="price-current">PKR {{ appSettings.course_price }}</span>
              <span class="price-or">OR</span>
              <span class="price-referral">PKR 100*</span>
            </div>
            <span class="price-sub text-muted">*Get it for PKR 100 by inviting friends via referrals!</span>
          </div>

          <div class="referral-checkout-details">
            <div class="ref-callout">
              <span class="fire-icon">🔥</span>
              <strong>Zero-Upfront Referral Option:</strong>
            </div>
            <p>
              You don't need to pay upfront! Register, copy your referral link from the dashboard/status page, and earn <strong>PKR {{ appSettings.referral_bonus }}</strong> discount on each registration. Invite friends to bring your bill down to the PKR 100 minimum!
            </p>
          </div>

          <div class="payment-instructions">
            <h3>Or Pay Full to Unlock Instantly:</h3>

            <div class="instruction-step">
              <span class="step-num">1</span>
              <div>
                <p>Send <strong>PKR {{ appSettings.course_price }}</strong> via <strong>EasyPaisa</strong> to:</p>
                <div class="payment-credentials">
                  <div class="credential-row">
                    <span class="cred-label">Number:</span>
                    <span class="cred-value highlight-text">03458643910</span>
                  </div>
                  <div class="credential-row">
                    <span class="cred-label">Account Name:</span>
                    <span class="cred-value highlight-text">umar farooq</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="instruction-step">
              <span class="step-num">2</span>
              <div>
                <p>Take a <strong>screenshot of the payment receipt</strong>.</p>
              </div>
            </div>

            <div class="instruction-step">
              <span class="step-num">3</span>
              <div>
                <p>
                  Send the receipt on <strong>WhatsApp to 03456047058</strong> to get your Premium
                  Activation Code instantly.
                </p>
              </div>
            </div>
          </div>

          <a :href="`https://wa.me/923456047058?text=Hi%20Umar,%20I%20have%20sent%20the%20payment%20of%20PKR%20${appSettings.course_price}%20for%20the%20ISSB%20Premium%20Course.%20Please%20activate%20my%20access.%20Here%20is%20my%20screenshot.`"
            target="_blank" class="btn btn-whatsapp-checkout">
            <svg viewBox="0 0 24 24" fill="currentColor" class="wa-icon">
              <path
                d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.459 3.479 1.332 4.996L2 22l5.176-1.357c1.47.8 3.123 1.22 4.825 1.22h.005c5.507 0 9.993-4.482 9.993-9.988 0-2.67-1.036-5.18-2.922-7.067C17.189 3.036 14.68 2 12.012 2zm5.727 14.04c-.25.707-1.458 1.299-2.012 1.353-.5.05-1.153.228-3.353-.678-2.812-1.16-4.63-4.026-4.77-4.215-.14-.189-1.144-1.52-1.144-2.898 0-1.38.723-2.054.98-2.324.25-.27.56-.34.75-.34h.54c.18 0 .42-.07.66.5.25.61.85 2.073.924 2.223.08.15.13.32.03.52-.1.2-.15.3-.3.47-.15.17-.32.39-.46.52-.16.15-.33.32-.14.65.19.32.85 1.402 1.83 2.274.98.872 1.802 1.14 2.062 1.274.26.13.41.11.56-.06.15-.17.65-.75.82-.99.18-.25.35-.2.6-.1.24.1 1.55.73 1.81.86.27.13.44.2.51.32.07.12.07.7-.18 1.407z" />
            </svg>
            Send Payment Screenshot
          </a>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-bottom">
      <div class="cta-content">
        <h2>Take Command of Your Military Career</h2>
        <p>Prepare with precision. Practice under time constraints. Get recommended.</p>
        <button @click="goToPortal" class="btn btn-primary btn-large">Enter Free Portal</button>
      </div>
    </section>

    </main>

    <footer class="landing-footer">
      <p>&copy; 2026 ISSB COMMAND PREPARATION PORTAL. Built for future officers.</p>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Nav Header */
.landing-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: #ffffff;
  border-bottom: 1px solid var(--border-color);
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.icon-logo {
  width: 36px;
  height: 36px;
  color: var(--accent-cyan);
}

.logo-text .logo-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: 0.05em;
  margin: 0;
  color: var(--text-primary);
  display: block;
}

.logo-text .sub-text {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  color: var(--accent-cyan);
  display: block;
}

.btn-nav-portal {
  background: transparent;
  border: 1.5px solid var(--accent-cyan);
  color: var(--accent-cyan);
  padding: 0.5rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.btn-nav-portal:hover {
  background: rgba(3, 194, 252, 0.08);
}

.arrow-icon {
  width: 16px;
  height: 16px;
}

/* Hero Section */
.hero-section {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 4rem 2rem;
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
}

.badge-accent {
  background: rgba(3, 194, 252, 0.08);
  color: var(--accent-cyan);
  border: 1px solid rgba(3, 194, 252, 0.2);
  padding: 0.35rem 0.75rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hero-content h1 {
  font-size: 2.8rem;
  font-family: var(--font-heading);
  line-height: 1.2;
  color: var(--text-primary);
  margin: 0;
}

.hero-content h1 .highlight {
  color: var(--accent-cyan);
}

.hero-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.hero-bullets {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bullet-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.98rem;
  color: var(--text-primary);
}

.bullet-check {
  color: var(--accent-green);
  font-weight: bold;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  width: 100%;
}

.btn-large {
  padding: 0.85rem 2rem;
  font-size: 1rem;
}

/* Simulator Mockup Card */
.hero-simulator-preview-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
  border-top: 4px solid var(--accent-cyan);
}

.simulator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: var(--accent-red);
  border-radius: 50%;
  animation: pulse-recording 1.5s infinite;
}

@keyframes pulse-recording {
  0% { opacity: 0.3; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0.3; transform: scale(0.9); }
}

.status-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
}

.test-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-cyan);
  background: rgba(3, 194, 252, 0.08);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
}

.simulator-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.word-card {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  text-align: center;
  position: relative;
}

.card-hint {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 0.5rem;
}

.flashed-word {
  font-size: 2.2rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.timer-widget {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  border: 1px dashed rgba(3, 194, 252, 0.3);
}

.circular-progress {
  position: relative;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.progress-ring {
  transform: rotate(-90deg);
  width: 50px;
  height: 50px;
}

.progress-ring circle {
  fill: none;
  stroke-width: 6;
}

.progress-ring .bg-circle {
  stroke: var(--border-color);
}

.progress-ring .active-circle {
  stroke: var(--accent-cyan);
  stroke-dasharray: 251.2;
  stroke-dashoffset: 70; /* Mock showing 7/10s left */
  stroke-linecap: round;
}

.timer-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.timer-value .seconds {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
}

.timer-value .unit {
  font-size: 0.55rem;
  color: var(--text-muted);
}

.timer-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.response-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.mock-input {
  background: #ffffff;
  border: 1.5px solid var(--accent-cyan);
  border-radius: var(--border-radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.92rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  min-height: 42px;
  position: relative;
}

.typing-cursor {
  border-right: 2px solid var(--accent-cyan);
  padding-right: 2px;
  animation: cursor-blink 0.8s infinite;
}

@keyframes cursor-blink {
  0%, 100% { border-right-color: transparent; }
  50% { border-right-color: var(--accent-cyan); }
}

.olq-tagging {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.olq-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.olq-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.olq-tag {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
}

.tag-success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.simulator-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.simulator-footer p {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
  text-align: center;
}

/* Referral Highlight Banner */
.referral-highlight-banner {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #ffffff;
  padding: 4rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.banner-content {
  max-width: 850px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.banner-badge {
  background: rgba(3, 194, 252, 0.15);
  color: var(--accent-cyan);
  border: 1px solid rgba(3, 194, 252, 0.3);
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.banner-content h2 {
  font-size: 2.2rem;
  font-family: var(--font-heading);
  margin: 0;
  color: #ffffff;
  line-height: 1.25;
}

.banner-desc {
  font-size: 1.05rem;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
}

.btn-banner-cta {
  background: var(--accent-cyan);
  color: #ffffff;
  border: none;
  padding: 0.85rem 2rem;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-smooth);
  margin-top: 1rem;
}

.btn-banner-cta:hover {
  background: #02a3d4;
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(3, 194, 252, 0.3);
}

/* Pricing Upgrade details */
.price-current-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.price-or {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--border-color);
  padding: 0.15rem 0.4rem;
  border-radius: var(--border-radius-sm);
}

.price-referral {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--accent-green);
  font-family: var(--font-heading);
}

.referral-checkout-details {
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ref-callout {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--accent-green);
  font-size: 0.95rem;
}

.referral-checkout-details p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

/* Insights Section */
.insights-section {
  background: #f8fafc;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 5rem 2rem;
}

.section-header {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 3rem auto;
}

.section-header h2 {
  font-size: 2.2rem;
  font-family: var(--font-heading);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.section-header p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.insights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.insight-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon svg {
  width: 28px;
  height: 28px;
}

.text-red {
  color: var(--accent-red);
  background: rgba(239, 68, 68, 0.08);
}

.text-green {
  color: var(--accent-green);
  background: rgba(34, 197, 94, 0.08);
}

.insight-card h3 {
  font-size: 1.4rem;
  margin: 0;
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-left: 1.25rem;
  margin: 0;
}

.insight-list li {
  line-height: 1.6;
  color: var(--text-secondary);
}

.insight-list li strong {
  color: var(--text-primary);
}

/* Features Section */
.features-section {
  padding: 5rem 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-item {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all var(--transition-smooth);
}

.feature-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.border-blue {
  background: rgba(3, 194, 252, 0.08);
  color: var(--accent-cyan);
  border: 1.5px solid var(--accent-cyan);
}

.feature-item h4 {
  font-size: 1.2rem;
  margin: 0;
  color: var(--text-primary);
}

.feature-item p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

/* CTA Bottom */
.cta-bottom {
  background: linear-gradient(135deg, rgba(3, 194, 252, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%);
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  padding: 6rem 2rem;
  text-align: center;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.cta-content h2 {
  font-size: 2.2rem;
  font-family: var(--font-heading);
  margin: 0;
}

.cta-content p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Footer */
.landing-footer {
  padding: 2.5rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted);
  border-top: 1px solid var(--border-color);
  background: #ffffff;
}

/* Responsiveness */
@media (max-width: 992px) {
  .hero-section {
    grid-template-columns: 1fr;
    gap: 3rem;
    padding: 2rem 1rem;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .hero-content h1 {
    font-size: 2.2rem;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}

/* Pricing Section Styles */
.pricing-section {
  padding: 5rem 2rem;
  background: #ffffff;
  border-top: 1px solid var(--border-color);
}

.pricing-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3rem;
  max-width: 1400px;
  width: 100%;
  margin: 3rem auto 0 auto;
}

.pricing-value-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pricing-value-card h3 {
  font-size: 1.6rem;
  margin: 0;
  color: var(--text-primary);
}

.value-items {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.value-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.value-icon {
  width: 24px;
  height: 24px;
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  font-size: 0.85rem;
}

.value-item strong {
  display: block;
  font-size: 1.05rem;
  color: var(--text-primary);
  margin-bottom: 0.15rem;
}

.value-item p {
  color: var(--text-secondary);
  font-size: 0.92rem;
  margin: 0;
  line-height: 1.4;
}

.pricing-checkout-card {
  background: #f8fafc;
  border: 2px solid var(--accent-cyan);
  border-radius: var(--border-radius-lg);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  box-shadow: 0 15px 35px rgba(3, 194, 252, 0.05);
}

.card-badge {
  position: absolute;
  top: -12px;
  left: 2rem;
  background: var(--accent-cyan);
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.price-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.25rem;
}

.price-slashed {
  text-decoration: line-through;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.price-current {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.price-sub {
  font-size: 0.85rem;
  font-weight: 600;
}

.payment-instructions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-instructions h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.instruction-step {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.step-num {
  width: 22px;
  height: 22px;
  background: var(--accent-cyan);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.instruction-step p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.payment-credentials {
  margin-top: 0.5rem;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.credential-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.cred-label {
  color: var(--text-secondary);
}

.cred-value {
  font-weight: 700;
  color: var(--text-primary);
}

.highlight-text {
  color: var(--accent-cyan);
}

.btn-whatsapp-checkout {
  background: #25d366;
  color: #ffffff;
  border: none;
  padding: 0.85rem;
  border-radius: var(--border-radius-md);
  font-size: 1.05rem;
  font-weight: 700;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all var(--transition-smooth);
  text-decoration: none;
}

.btn-whatsapp-checkout:hover {
  background: #20ba59;
  transform: translateY(-1px);
}

.wa-icon {
  width: 20px;
  height: 20px;
}

/* Portal Showcase Section */
.portal-showcase-section {
  padding: 5rem 2rem;
  background: #f8fafc;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.showcase-container {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  align-items: start;
}

.showcase-tabs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tab-btn {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-smooth);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tab-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--text-primary);
  background: rgba(3, 194, 252, 0.02);
}

.tab-btn.active {
  background: var(--accent-cyan);
  color: #ffffff;
  border-color: var(--accent-cyan);
  box-shadow: 0 4px 15px rgba(3, 194, 252, 0.2);
}

.tab-num {
  font-size: 0.8rem;
  font-family: var(--font-heading);
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.15rem 0.35rem;
  border-radius: var(--border-radius-sm);
}

.tab-btn.active .tab-num {
  background: rgba(255, 255, 255, 0.2);
}

.showcase-panels {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  min-height: 520px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
}

.showcase-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.roadmap-subtabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.subtab-btn {
  background: #f1f5f9;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.subtab-btn:hover {
  background: #e2e8f0;
  color: var(--text-primary);
}

.subtab-btn.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

.panel-layout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2rem;
  align-items: center;
}

.panel-preview {
  background: #f1f5f9;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  display: flex;
}

.screenshot-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
  transition: transform 0.5s var(--transition-smooth);
}

.screenshot-img:hover {
  transform: scale(1.02);
}

.panel-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
}

.panel-info h3 {
  font-size: 1.5rem;
  font-family: var(--font-heading);
  margin: 0;
  color: var(--text-primary);
  line-height: 1.3;
}

.panel-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.panel-features-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-left: 1.25rem;
  margin: 0;
}

.panel-features-list li {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.panel-features-list li strong {
  color: var(--text-primary);
}

/* Animations */
.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 992px) {
  .showcase-container {
    grid-template-columns: 1fr;
  }
  
  .showcase-tabs {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.5rem;
    gap: 0.75rem;
    scrollbar-width: none;
  }
  
  .showcase-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .tab-btn {
    flex: 0 0 auto;
    white-space: nowrap;
  }
  
  .roadmap-subtabs {
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    padding-bottom: 0.5rem !important;
    gap: 0.5rem !important;
    scrollbar-width: none !important;
  }
  
  .roadmap-subtabs::-webkit-scrollbar {
    display: none !important;
  }
  
  .subtab-btn {
    flex: 0 0 auto !important;
    white-space: nowrap !important;
  }
  
  .panel-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  /* No longer need to make tab-btn block on small mobile since they scroll horizontally */
}

/* Reviews Section Styles */
.reviews-section {
  padding: 5rem 2rem;
  background: #ffffff;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.review-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.02);
  transition: all var(--transition-smooth);
}

.review-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border-color: var(--accent-cyan);
}

.review-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-circle {
  width: 46px;
  height: 46px;
  background: rgba(3, 194, 252, 0.08);
  color: var(--accent-cyan);
  border: 1.5px solid var(--accent-cyan);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
}

.candidate-info h4 {
  margin: 0 0 0.15rem 0;
  font-size: 1.05rem;
  color: var(--text-primary);
  font-weight: 700;
  text-transform: uppercase;
}

.badge-branch {
  font-size: 0.72rem;
  color: var(--accent-green);
  font-weight: 600;
  background: rgba(34, 197, 94, 0.08);
  padding: 0.15rem 0.4rem;
  border-radius: var(--border-radius-sm);
  display: inline-block;
}

.stars-row {
  color: #fbbf24;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  margin: 0;
  line-height: 1;
}

.review-text {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 0;
  font-style: italic;
}

/* Responsive Overrides (Placed at the bottom to ensure correct order of precedence) */
@media (max-width: 992px) {
  .pricing-grid {
    grid-template-columns: 1fr !important;
    gap: 2.5rem !important;
  }
  
  .panel-layout {
    grid-template-columns: 1fr !important;
    gap: 1.5rem !important;
  }
}

@media (max-width: 768px) {
  /* Nav spacing */
  .landing-nav {
    padding: 1rem 1.25rem;
    gap: 1rem;
  }

  .logo-text .logo-title {
    font-size: 1rem;
  }

  .logo-text .sub-text {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
  }

  .btn-nav-portal {
    padding: 0.45rem 1rem;
    font-size: 0.85rem;
  }

  /* Section headers */
  .pricing-section,
  .portal-showcase-section,
  .reviews-section,
  .features-section,
  .insights-section,
  .referral-highlight-banner,
  .cta-bottom {
    padding: 3.5rem 1.25rem !important;
  }

  .section-header {
    margin-bottom: 2rem;
  }

  .section-header h2 {
    font-size: 1.85rem !important;
  }

  .section-header p {
    font-size: 0.95rem !important;
  }

  /* Hero Section */
  .hero-section {
    padding: 3rem 1.25rem !important;
    gap: 2rem !important;
  }

  .hero-content {
    align-items: center;
    text-align: center;
  }

  .hero-content h1 {
    font-size: 2.2rem !important;
    text-align: center;
  }

  .hero-subtitle {
    font-size: 1rem !important;
    text-align: center;
  }

  .hero-bullets {
    align-self: stretch;
    align-items: flex-start;
    text-align: left;
    max-width: 480px;
    margin: 0 auto;
  }

  .hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.75rem;
  }

  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .hero-simulator-preview-card {
    padding: 1.25rem;
  }

  .flashed-word {
    font-size: 1.8rem !important;
  }

  /* Referral Banner */
  .banner-content h2 {
    font-size: 1.8rem !important;
  }

  .banner-desc {
    font-size: 0.95rem !important;
  }

  /* Insight Cards */
  .insight-card {
    padding: 1.5rem !important;
  }

  /* Portal Showcase */
  .showcase-panels {
    padding: 1.25rem !important;
    min-height: auto !important;
  }

  .panel-info h3 {
    font-size: 1.35rem !important;
  }

  .panel-desc {
    font-size: 0.9rem !important;
  }

  /* Reviews */
  .reviews-grid {
    grid-template-columns: 1fr !important;
    gap: 1.5rem !important;
  }

  .review-card {
    padding: 1.5rem !important;
  }

  /* Pricing Section */
  .pricing-value-card h3 {
    font-size: 1.35rem !important;
  }

  .pricing-checkout-card {
    padding: 1.5rem !important;
  }

  .price-current {
    font-size: 2.2rem !important;
  }

  .price-referral {
    font-size: 2.2rem !important;
  }

  /* CTA Bottom */
  .cta-content h2 {
    font-size: 1.8rem !important;
  }

  .cta-content p {
    font-size: 1rem !important;
  }
}

@media (max-width: 576px) {
  /* Logo adjustments */
  .icon-logo {
    width: 30px;
    height: 30px;
  }

  .logo-text .sub-text {
    display: none;
  }

  /* Tab Buttons showcase */
  .tab-btn {
    padding: 0.75rem 1rem !important;
    font-size: 0.88rem !important;
  }

  .subtab-btn {
    padding: 0.35rem 0.85rem !important;
    font-size: 0.8rem !important;
  }

  /* Pricing checkout instructions step numbers */
  .step-num {
    width: 24px !important;
    height: 24px !important;
    font-size: 0.8rem !important;
  }
}

@media (max-width: 480px) {
  .landing-nav {
    padding: 0.75rem 0.75rem;
  }

  .btn-nav-portal {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
  }

  .hero-content h1 {
    font-size: 1.85rem !important;
  }
  
  .flashed-word {
    font-size: 1.5rem !important;
  }

  .value-item {
    gap: 0.75rem !important;
  }

  .value-item strong {
    font-size: 0.95rem !important;
  }

  .value-item p {
    font-size: 0.85rem !important;
  }
}
</style>
