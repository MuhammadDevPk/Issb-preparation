<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'

const activeFaq = ref(null)

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}

const pageTitle = 'Join PAF Online Apply 2026 | Pakistan Air Force ISSB Guide'
const pageDescription =
  'How to join the Pakistan Air Force. Find online apply dates, initial test guidelines, and complete ISSB simulator practice.'
const pageCanonical = 'https://issb-preparation.vercel.app/join-pak-airforce'

const faqItems = [
  {
    q: 'How to apply for PAF online?',
    a: 'Visit the official Pakistan Air Force induction website (joinpaf.gov.pk), click on Online Registration, provide your CNIC/B-Form, father details, select your induction branch (e.g., 158 GD Pilot or 104 CAE), and choose your preferred PAF Information & Selection Centre.'
  },
  {
    q: 'What is the required qualification for General Duty Pilot (GDP)?',
    a: 'Candidates must possess FSc (Pre-Engineering, Pre-Medical, or ICS with Physics & Maths) or A-Levels with at least 60% aggregate marks. Candidates with Pre-Medical must have cleared additional Mathematics.'
  },
  {
    q: 'What is the Flying Aptitude Test (FAT) in PAF?',
    a: 'Candidates recommended by ISSB for General Duty Pilot (GDP) branch undergo a specialized computerized Flying Aptitude Test (FAT) at PAF Academy or designated center to test hand-eye coordination, instrument perception, and multi-axis spatial orientation.'
  },
  {
    q: 'What is the syllabus for the PAF initial computerized test?',
    a: 'The test consists of Intelligence (Verbal and Non-Verbal reasoning), followed by Academic tests in English and Physics. Both sections are strictly timed and evaluated on computer terminals.'
  },
  {
    q: 'How does ISSB Command help in cracking PAF ISSB?',
    a: 'ISSB Command trains candidates with authentic 10-second Word Association Tests (WAT), rapid Sentence Completion Tests (SCT), Situation Reaction crisis simulations (SRT), and Officer Personality Inventory (OPI) psychological assessments.'
  }
]

const schemaJson = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      '@id': `${pageCanonical}#article`,
      'headline': 'Join PAF Online Apply 2026 & Complete ISSB Selection Guide',
      'description': pageDescription,
      'mainEntityOfPage': pageCanonical,
      'author': {
        '@type': 'Organization',
        'name': 'ISSB Command'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'ISSB Command',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://issb-preparation.vercel.app/og-image.png'
        }
      },
      'datePublished': '2026-01-15T00:00:00+05:00',
      'dateModified': '2026-10-09T00:00:00+05:00'
    },
    {
      '@type': 'FAQPage',
      '@id': `${pageCanonical}#faq`,
      'mainEntity': faqItems.map((item) => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.a
        }
      }))
    }
  ]
}

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: pageDescription },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:url', content: pageCanonical },
    { property: 'og:type', content: 'article' },
    { property: 'og:image', content: 'https://issb-preparation.vercel.app/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
    { name: 'twitter:image', content: 'https://issb-preparation.vercel.app/og-image.png' }
  ],
  link: [{ rel: 'canonical', href: pageCanonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(schemaJson)
    }
  ]
})
</script>

<template>
  <main class="branch-seo-page">
    <!-- Hero Header -->
    <header class="seo-hero glass-card">
      <div class="hero-tag">
        <span class="paf-crest">🦅</span>
        <span>PAF ACADEMY ASGHAR KHAN (RISALPUR) SELECTION GUIDE</span>
      </div>
      <h1 class="seo-h1">Join PAF Online Apply 2026 & Complete ISSB Guide</h1>
      <p class="hero-lead">
        Complete operational roadmap to earn your commissioning wings in the Pakistan Air Force. Detailed criteria for GD Pilot, Aeronautical Engineering, initial computerized exams, and interactive ISSB psychological simulators.
      </p>

      <div class="hero-cta-group">
        <a href="#issb-preparation" class="btn btn-primary">
          <span>🚀 Practice Free ISSB Simulators</span>
        </a>
        <a href="https://www.joinpaf.gov.pk" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
          <span>🌐 Official PAF Registration Portal ↗</span>
        </a>
      </div>

      <div class="hero-stats-grid">
        <div class="stat-pill">
          <span class="stat-val">60%</span>
          <span class="stat-lbl">Min. FSc (Physics & Maths)</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">5' 4"</span>
          <span class="stat-lbl">GDP Height (Male & Female)</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">16–22</span>
          <span class="stat-lbl">Commissioning Age Range</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">6/6</span>
          <span class="stat-lbl">Vision Standards (GDP)</span>
        </div>
      </div>
    </header>

    <!-- Section 1: Initial Requirements & Apply Online -->
    <section class="seo-section glass-card" id="requirements">
      <div class="section-badge">COMMISSIONING BRANCHES & ELIGIBILITY</div>
      <h2>Section 1: Initial Requirements & Apply Online</h2>
      <p class="section-intro">
        The Pakistan Air Force commissions officers across operational, aeronautical, and support branches. Requirements differ based on fighter cockpit or ground engineering branches:
      </p>

      <div class="matrix-grid">
        <div class="matrix-card">
          <div class="matrix-header">
            <span class="icon">✈️</span>
            <h3>Academic Qualifications by Branch</h3>
          </div>
          <ul class="matrix-list">
            <li><strong>General Duty Pilot (GDP):</strong> FSc (Pre-Engineering, Pre-Medical with additional math, or ICS) with at least <strong>60% marks</strong>.</li>
            <li><strong>Aeronautical Engineering (CAE):</strong> FSc Pre-Engineering with Physics, Chemistry, and Mathematics with minimum <strong>65% marks</strong>.</li>
            <li><strong>Air Defence & Admin/Special Duties:</strong> FSc with minimum 60% marks in science subjects.</li>
            <li><strong>Logistics & Accounts:</strong> FSc / I.Com / B.Com / BBA / BS with min. 60% marks.</li>
          </ul>
        </div>

        <div class="matrix-card">
          <div class="matrix-header">
            <span class="icon">👁️</span>
            <h3>Physical & Visual Standards</h3>
          </div>
          <ul class="matrix-list">
            <li><strong>Height:</strong> Minimum 5 Feet 4 Inches (162.5 cm) for Male GDP; 5 Feet 4 Inches for Female GDP (5' 2" for ground branches).</li>
            <li><strong>Eye Sight (GDP):</strong> 6/6 distance vision without glasses. No laser surgery allowed for fighter stream.</li>
            <li><strong>Eye Sight (Engineering / Ground):</strong> Up to 6/18 correctable to 6/6 with prescription lenses.</li>
            <li><strong>Chest Measurement:</strong> Minimum 31 inches with 2-inch expansion range.</li>
          </ul>
        </div>
      </div>

      <div class="step-guide-box">
        <h3>Step-by-Step Online Registration via joinpaf.gov.pk</h3>
        <ol class="step-list">
          <li><strong>Visit Official Site:</strong> Go to <a href="https://www.joinpaf.gov.pk" target="_blank" rel="noopener noreferrer">joinpaf.gov.pk</a> during active registration advertisement cycles (usually March and August).</li>
          <li><strong>Select Branch:</strong> Choose 158 / 159 GD(P) Course or 104 / 105 CAE Course based on your qualification.</li>
          <li><strong>Register Biodata:</strong> Enter CNIC/B-Form number, address, and matriculation & intermediate marks.</li>
          <li><strong>Select PAF Center:</strong> Pick from Abbottabad, Bahawalpur, Faisalabad, Hyderabad, Karachi, Lahore, Multan, Mianwali, Peshawar, Quetta, Rawalpindi, or Sukkur.</li>
          <li><strong>Generate Test Slip:</strong> Print your computerized entry slip specifying reporting date, shift, and test roll number.</li>
        </ol>
      </div>
    </section>

    <!-- Section 2: The Initial Tests -->
    <section class="seo-section glass-card" id="initial-tests">
      <div class="section-badge">SELECTION CENTRE TESTING</div>
      <h2>Section 2: The Initial Tests at PAF I&SC</h2>
      <p class="section-intro">
        Initial tests at the PAF Information and Selection Centre are conducted electronically on computer terminals with immediate pass/fail output:
      </p>

      <div class="test-modules-grid">
        <div class="test-module-card">
          <span class="module-number">01</span>
          <h3>Computerized Intelligence Test</h3>
          <p>Divided into two strict sub-tests:</p>
          <ul>
            <li><strong>Verbal Intelligence (100 Questions / 40 Minutes):</strong> Analogy pairs, logical deductions, coding puzzles, mathematical series, and word relationships.</li>
            <li><strong>Non-Verbal Intelligence (100 Questions / 40 Minutes):</strong> Picture matrix series, mirror images, component assembly, and shape rotations.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">02</span>
          <h3>Academic Examinations (English & Physics)</h3>
          <p>Unlocks immediately upon qualifying the intelligence section:</p>
          <ul>
            <li><strong>Physics Test (75 Questions / 40 Minutes):</strong> Optics, thermodynamics, circular motion, vectors, kinematics, semiconductors, and electromagnetism.</li>
            <li><strong>English Test (50 Questions / 25 Minutes):</strong> Synonyms/antonyms, prepositions, sentence corrections, and active/passive syntax.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">03</span>
          <h3>Preliminary Medical Examination</h3>
          <p>Conducted by PAF Flight Surgeons to screen physical fitness:</p>
          <ul>
            <li>Complete visual acuity check and color blindness Ishihara plate test.</li>
            <li>Hearing whisper test and ear drum examination.</li>
            <li>Blood pressure, pulse regularity, flat feet, and knock-knees verification.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">04</span>
          <h3>Preliminary Interview & ISSB Call-Up</h3>
          <p>
            An interview conducted by the Selection Centre Officer assessing conversational clarity in English, aviation general knowledge, personality maturity, and defense motivation. Successful candidates are issued ISSB call-up nominations.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 3: ISSB Preparation (The Hook) -->
    <section class="seo-section glass-card highlight-box" id="issb-preparation">
      <div class="section-badge badge-cyan">PORTAL DRILLS</div>
      <h2>Section 3: ISSB Preparation (The Interactive Hook)</h2>
      <p class="section-intro">
        The Pakistan Air Force seeks candidates with high alertness, decisive courage, and sound leadership potential. Master the complete psychological battery on ISSB Command:
      </p>

      <div class="tools-grid">
        <RouterLink to="/simulator/wat" class="tool-card">
          <div class="tool-icon">⏱️</div>
          <div class="tool-content">
            <h3>Word Association Test (WAT) Simulator</h3>
            <p>10-second military projector flash words. Train subconscious positive associations under stress.</p>
            <span class="tool-link">Practice WAT Simulator →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/sct" class="tool-card">
          <div class="tool-icon">✍️</div>
          <div class="tool-content">
            <h3>Sentence Completion Test (SCT)</h3>
            <p>Rapid English and Urdu stems. Learn psychological hygiene and eliminate negative themes.</p>
            <span class="tool-link">Practice SCT Sheets →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/srt" class="tool-card">
          <div class="tool-icon">🛡️</div>
          <div class="tool-content">
            <h3>Situation Reaction Test (SRT)</h3>
            <p>30-second crisis scenarios. Deliver tactical, courageous, and lawful solutions.</p>
            <span class="tool-link">Train SRT Scenarios →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/opi" class="tool-card">
          <div class="tool-icon">🧠</div>
          <div class="tool-content">
            <h3>Officer Personality Inventory (OPI)</h3>
            <p>150 military psychometric statements with Urdu meanings and OLQ dimension ratings.</p>
            <span class="tool-link">Take OPI Assessment →</span>
          </div>
        </RouterLink>

        <RouterLink to="/roadmap" class="tool-card">
          <div class="tool-icon">🗺️</div>
          <div class="tool-content">
            <h3>5-Day ISSB Complete Roadmap</h3>
            <p>Complete curriculum covering arrival day, psych battery, GTO tasks, and Deputy interview.</p>
            <span class="tool-link">Explore 5-Day Curriculum →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/obstacles" class="tool-card">
          <div class="tool-icon">🧗</div>
          <div class="tool-content">
            <h3>GTO Obstacles Route Planner</h3>
            <p>Tarzan Swing, Monkey Bridge, Ditch, and High Wall navigation tactics to score 30+ marks.</p>
            <span class="tool-link">Plan GTO Sequence →</span>
          </div>
        </RouterLink>

        <RouterLink to="/deputy-interview" class="tool-card">
          <div class="tool-icon">👔</div>
          <div class="tool-content">
            <h3>Deputy President Interview Guide</h3>
            <p>High-frequency interview questions: why join PAF, aviation concepts, and personality probes.</p>
            <span class="tool-link">Read Interview Bank →</span>
          </div>
        </RouterLink>

        <RouterLink to="/call-letter" class="tool-card">
          <div class="tool-icon">📬</div>
          <div class="tool-content">
            <h3>ISSB Call Letter Tracker</h3>
            <p>Check reporting schedules for Kohat, Gujranwala, Malir, and Quetta, plus required luggage kit.</p>
            <span class="tool-link">Track Call Letter →</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Section 4: Final Medical & Merit List -->
    <section class="seo-section glass-card" id="final-merit">
      <div class="section-badge">POST-ISSB CLEARANCE</div>
      <h2>Section 4: Final Medical, FAT & Merit List</h2>
      <p class="section-intro">
        After securing recommendation at ISSB, PAF candidates complete two critical specialized milestones:
      </p>

      <div class="post-issb-grid">
        <div class="post-card">
          <h3>1. Central Medical Board (CMB) Masroor & FAT</h3>
          <p>
            GDP candidates undergo exhaustive aeromedical checks at the <strong>Central Medical Board (CMB) PAF Base Masroor, Karachi</strong>. This includes electroencephalogram (EEG), spinal radiography, echocardiography, and pilot anthropometry. GDP candidates also clear the <strong>Flying Aptitude Test (FAT)</strong> testing machine coordination and emergency reaction times.
          </p>
        </div>

        <div class="post-card">
          <h3>2. AHQ Final Merit List & Joining PAF Academy</h3>
          <p>
            Air Headquarters (AHQ) Islamabad compiles final merit based on:
          </p>
          <ul>
            <li>Matric & FSc academic marks.</li>
            <li>PAF Selection Centre computerized marks.</li>
            <li>ISSB Board recommendation grade & FAT score.</li>
          </ul>
          <p>
            Selected flight cadets report to the <strong>PAF Academy Asghar Khan, Risalpur</strong> for 3 to 4 years of aviation engineering and flight training (earning a BS degree from NUST and Flying Officer rank).
          </p>
        </div>
      </div>
    </section>

    <!-- Section 5: FAQs -->
    <section class="seo-section glass-card" id="faq">
      <div class="section-badge">FREQUENTLY ASKED QUESTIONS</div>
      <h2>Frequently Asked Questions: PAF Online Apply</h2>
      <div class="faq-accordion">
        <div
          v-for="(item, idx) in faqItems"
          :key="idx"
          class="faq-item"
          :class="{ open: activeFaq === idx }"
        >
          <button class="faq-question" @click="toggleFaq(idx)">
            <span>{{ item.q }}</span>
            <span class="faq-toggle-icon">{{ activeFaq === idx ? '−' : '+' }}</span>
          </button>
          <div v-show="activeFaq === idx" class="faq-answer">
            <p>{{ item.a }}</p>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.branch-seo-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.seo-hero {
  padding: 2.5rem 2rem;
  text-align: center;
  background: linear-gradient(180deg, rgba(3, 105, 161, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg, 16px);
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #0369a1;
  background: rgba(3, 105, 161, 0.1);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  margin-bottom: 1.25rem;
}

.seo-h1 {
  font-size: clamp(1.8rem, 3.8vw, 2.75rem);
  font-weight: 800;
  line-height: 1.2;
  color: #0f172a;
  margin-bottom: 1rem;
}

.hero-lead {
  font-size: clamp(1rem, 1.8vw, 1.15rem);
  color: #475569;
  max-width: 820px;
  margin: 0 auto 1.75rem;
  line-height: 1.6;
}

.hero-cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2.25rem;
}

.hero-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  max-width: 900px;
  margin: 0 auto;
}

.stat-pill {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(3, 105, 161, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0369a1;
}

.stat-lbl {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.seo-section {
  padding: 2.25rem 2rem;
  border-radius: var(--border-radius-lg, 16px);
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}

.section-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #0369a1;
  background: rgba(3, 105, 161, 0.08);
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.badge-cyan {
  background: var(--accent-cyan);
  color: #ffffff;
}

.seo-section h2 {
  font-size: clamp(1.4rem, 2.5vw, 1.9rem);
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.section-intro {
  color: #475569;
  font-size: 1.05rem;
  line-height: 1.6;
  margin-bottom: 1.75rem;
}

.matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.matrix-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
}

.matrix-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.matrix-header .icon {
  font-size: 1.5rem;
}

.matrix-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
}

.matrix-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #334155;
}

.step-guide-box {
  background: linear-gradient(135deg, rgba(3, 105, 161, 0.04) 0%, rgba(255, 255, 255, 0.8) 100%);
  border: 1px dashed #0369a1;
  border-radius: 12px;
  padding: 1.5rem;
}

.step-guide-box h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
}

.step-list {
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.95rem;
  line-height: 1.55;
  color: #334155;
}

.step-list a {
  color: #0369a1;
  text-decoration: underline;
  font-weight: 600;
}

.test-modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

.test-module-card {
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.module-number {
  font-size: 1.8rem;
  font-weight: 900;
  color: rgba(3, 105, 161, 0.2);
  line-height: 1;
}

.test-module-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.test-module-card p,
.test-module-card ul {
  font-size: 0.92rem;
  line-height: 1.5;
  color: #475569;
}

.test-module-card ul {
  padding-left: 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 1.25rem;
}

.tool-card {
  display: flex;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.25rem;
  text-decoration: none;
  transition: all 0.25s ease;
}

.tool-card:hover {
  border-color: var(--accent-cyan);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px -4px rgba(2, 112, 165, 0.15);
}

.tool-icon {
  font-size: 2rem;
  line-height: 1;
}

.tool-content h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.tool-content p {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.45;
  margin-bottom: 0.65rem;
}

.tool-link {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-cyan);
}

.post-issb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.post-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
}

.post-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.post-card p,
.post-card ul {
  font-size: 0.95rem;
  color: #334155;
  line-height: 1.55;
}

.post-card ul {
  padding-left: 1.25rem;
  margin: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.faq-accordion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.faq-item.open {
  border-color: #0369a1;
}

.faq-question {
  width: 100%;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  background: #f8fafc;
  cursor: pointer;
}

.faq-toggle-icon {
  font-size: 1.3rem;
  font-weight: 700;
  color: #0369a1;
}

.faq-answer {
  padding: 1rem 1.25rem;
  background: #ffffff;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #475569;
}

@media (max-width: 768px) {
  .seo-hero {
    padding: 1.75rem 1.25rem;
  }
  .seo-section {
    padding: 1.5rem 1.25rem;
  }
}
</style>
