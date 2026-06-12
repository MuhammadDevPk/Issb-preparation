<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Lead Form State
const leadName = ref('')
const leadEmail = ref('')
const leadWhatsapp = ref('')
const leadBranch = ref('army')
const formSubmitted = ref(false)

const handleLeadSubmit = () => {
  if (!leadName.value || !leadEmail.value) return

  // Save lead mock-locally (could be hooked up to Supabase later)
  const lead = {
    name: leadName.value,
    email: leadEmail.value,
    whatsapp: leadWhatsapp.value,
    branch: leadBranch.value,
    date: new Date().toISOString(),
  }

  const existingLeads = JSON.parse(localStorage.getItem('issb_leads') || '[]')
  existingLeads.push(lead)
  localStorage.setItem('issb_leads', JSON.stringify(existingLeads))

  formSubmitted.value = true

  // Redirect to Dashboard after 1.5 seconds
  setTimeout(() => {
    router.push('/dashboard')
  }, 1500)
}

const goToPortal = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="landing-page">
    <!-- Navigation Header -->
    <header class="landing-nav">
      <div class="nav-logo">
        <svg class="icon-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2L2 22H22L12 2Z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
          <path d="M12 6L5 20H19L12 6Z" fill="currentColor" opacity="0.3" />
          <circle cx="12" cy="14" r="2" fill="currentColor" />
        </svg>
        <div class="logo-text">
          <h2>ISSB COMMAND</h2>
          <span class="sub-text">PREPARATION PORTAL</span>
        </div>
      </div>
      <button @click="goToPortal" class="btn btn-nav-portal">
        Go to Portal
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="arrow-icon"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <span class="badge badge-accent">100% Target-Oriented Prep Portal</span>
        <h1>
          Stop Preparing Generically. <br /><span class="highlight"
            >Unlock Your Recommendation.</span
          >
        </h1>
        <p class="hero-subtitle">
          Most ISSB candidates fail not because they lack potential, but because they study outdated
          guidebooks, try to fake their personalities, or freeze during timed psychologist tests.
          Our structured portal simulates the exact 5-day cycle to prepare you for success.
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
        </div>

        <div class="hero-actions">
          <a href="#lead-form" class="btn btn-primary btn-large">Start Preparing Now</a>
          <button @click="goToPortal" class="btn btn-secondary btn-large">
            Explore Portal First
          </button>
        </div>
      </div>

      <!-- Lead Capture Form Card -->
      <div class="hero-form-card" id="lead-form">
        <div class="form-header" v-if="!formSubmitted">
          <h3>Unlock Free Access</h3>
          <p>Get access to the 5-Day roadmap, simulators, and study guides instantly.</p>
        </div>

        <form @submit.prevent="handleLeadSubmit" class="lead-form" v-if="!formSubmitted">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              v-model="leadName"
              type="text"
              id="name"
              placeholder="e.g. Muhammad Ali"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              v-model="leadEmail"
              type="email"
              id="email"
              placeholder="e.g. name@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="whatsapp">WhatsApp/Phone Number (Optional)</label>
            <input
              v-model="leadWhatsapp"
              type="tel"
              id="whatsapp"
              placeholder="e.g. +92 300 1234567"
            />
          </div>

          <div class="form-group">
            <label for="branch">Target Force Branch</label>
            <select v-model="leadBranch" id="branch">
              <option value="army">Pakistan Army (PMA/TCC/Direct)</option>
              <option value="navy">Pakistan Navy (PN Cadet/SSC)</option>
              <option value="airforce">Pakistan Air Force (CAE/GD Pilot/SSC)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-submit-lead">
            Get Started Free
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="btn-icon"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        <div class="form-success-state" v-else>
          <div class="success-icon-wrapper">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="success-svg"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h4>Access Granted!</h4>
          <p>Redirecting you to your preparation command dashboard...</p>
        </div>
      </div>
    </section>

    <!-- Why Candidates Fail / Succeed Section -->
    <section class="insights-section">
      <div class="section-header">
        <h2>The Core Difference: Failure vs. Recommendation</h2>
        <p>Understanding what the board is looking for determines your final result.</p>
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
          <h3>Why 95% of Candidates Fail</h3>
          <ul class="insight-list">
            <li>
              <strong>Memorized Responses:</strong> Writing textbook answers for WAT/SCT that clash
              with self-descriptions.
            </li>
            <li>
              <strong>Faked Personalities:</strong> Trying to project a "superman" military identity
              instead of showing genuine traits.
            </li>
            <li>
              <strong>Lack of Timed Speed:</strong> Panicking and leaving sheets blank during
              rapid-fire psychologist tests.
            </li>
            <li>
              <strong>Aggressive Domination:</strong> Shouting or trying to overpower the group
              during GTO task debates.
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
          <h3>How to Guarantee Recommendation</h3>
          <ul class="insight-list">
            <li>
              <strong>Subconscious Honesty:</strong> Projecting natural, authentic responses that
              align with bio-data.
            </li>
            <li>
              <strong>Logical Problem Solving:</strong> Approaching GTO planning and SRT crises with
              practical, step-by-step solutions.
            </li>
            <li>
              <strong>Officer-Like Qualities (OLQ):</strong> Consciously showing responsibility,
              teamwork, courage, and determination.
            </li>
            <li>
              <strong>Timed Confidence:</strong> Training your speed so responses flow automatically
              under pressure.
            </li>
          </ul>
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

    <!-- CTA Section -->
    <section class="cta-bottom">
      <div class="cta-content">
        <h2>Take Command of Your Military Career</h2>
        <p>Prepare with precision. Practice under time constraints. Get recommended.</p>
        <button @click="goToPortal" class="btn btn-primary btn-large">Enter Free Portal</button>
      </div>
    </section>

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
}

.icon-logo {
  width: 36px;
  height: 36px;
  color: var(--accent-cyan);
}

.logo-text h2 {
  font-size: 1.15rem;
  letter-spacing: 0.05em;
  margin: 0;
  color: var(--text-primary);
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

/* Form Card */
.hero-form-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius-lg);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-header h3 {
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0 0 0.35rem 0;
}

.form-header p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.lead-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group select {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.95rem;
  background: #f8fafc;
  color: var(--text-primary);
  transition: all var(--transition-smooth);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent-cyan);
  background: #ffffff;
}

.btn-submit-lead {
  background: var(--accent-cyan);
  color: #ffffff;
  border: none;
  padding: 0.85rem;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all var(--transition-smooth);
  margin-top: 0.5rem;
}

.btn-submit-lead:hover {
  background: #02a3d4;
  transform: translateY(-1px);
}

.form-success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 0;
  gap: 1rem;
}

.success-icon-wrapper {
  width: 60px;
  height: 60px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-green);
}

.success-svg {
  width: 30px;
  height: 30px;
}

.form-success-state h4 {
  font-size: 1.35rem;
  margin: 0;
}

.form-success-state p {
  font-size: 0.95rem;
  color: var(--text-secondary);
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
}
</style>
