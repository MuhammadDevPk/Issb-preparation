<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'

const activeFaq = ref(null)

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}

const pageTitle = 'Join Pak Navy Online Apply 2026 | Registration & ISSB Prep'
const pageDescription =
  'Step-by-step guide to Pak Navy online registration. Prepare for your ISSB with our interactive 5-day roadmap and psychological test simulators.'
const pageCanonical = 'https://issb-preparation.vercel.app/join-pak-navy'

const faqItems = [
  {
    q: 'How can I apply for Pak Navy online?',
    a: 'Visit the official Pakistan Navy recruitment portal (joinpaknavy.gov.pk), select your desired induction course (such as PN Cadet or Short Service Commission), fill in your CNIC/B-Form, academic marks, and select your nearest Naval Selection and Recruitment Centre (NSRC) to generate your test roll number slip.'
  },
  {
    q: 'What is the educational qualification for PN Cadet?',
    a: 'Candidates must have passed FSc (Pre-Engineering or ICS) with at least 60% marks. Candidates with O/A-Levels must submit an IBCC equivalence certificate with at least 60% marks.'
  },
  {
    q: 'What are the physical standards for Pakistan Navy commission?',
    a: 'Male candidates must have a minimum height of 5 feet 4 inches (162.5 cm) and normal eyesight (6/6 or correctable as per branch guidelines). The initial physical test includes a 1.6 km run in 8.5 minutes, 15 push-ups, 15 sit-ups, and 3 chin-ups.'
  },
  {
    q: 'What is the syllabus for the computerized initial test in Pak Navy?',
    a: 'The test consists of three parts: Verbal Intelligence Test (analogy, classification, series, directions), Non-Verbal Intelligence Test (pattern completion, matrix, rotations), and Academic Test (English, Physics, Mathematics, and General Knowledge).'
  },
  {
    q: 'How does ISSB Command help in clearing Pak Navy ISSB?',
    a: 'ISSB Command provides realistic 10-second Word Association Test (WAT) timers, Sentence Completion (SCT) sets, Situation Reaction (SRT) crisis trainers, the complete 5-day syllabus roadmap, and Deputy President interview banks calibrated specifically for military selection boards.'
  }
]

const schemaJson = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      '@id': `${pageCanonical}#article`,
      'headline': 'Join Pak Navy Online Apply 2026 & Complete ISSB Selection Guide',
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
        <span class="navy-crest">⚓</span>
        <span>PAKISTAN NAVAL ACADEMY (PNA) SELECTION GUIDE</span>
      </div>
      <h1 class="seo-h1">Join Pak Navy Online Apply 2026 & Complete ISSB Guide</h1>
      <p class="hero-lead">
        Comprehensive candidate roadmap for Pakistan Navy induction. Access official registration steps, initial computerized syllabus, physical standards, and interactive ISSB psychological simulators.
      </p>

      <div class="hero-cta-group">
        <a href="#issb-preparation" class="btn btn-primary">
          <span>🚀 Practice Free ISSB Simulators</span>
        </a>
        <a href="https://www.joinpaknavy.gov.pk" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
          <span>🌐 Official Navy Registration Portal ↗</span>
        </a>
      </div>

      <div class="hero-stats-grid">
        <div class="stat-pill">
          <span class="stat-val">60%</span>
          <span class="stat-lbl">Min. FSc (Pre-Eng/ICS)</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">5' 4"</span>
          <span class="stat-lbl">Minimum Height (Male)</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">16.5–21</span>
          <span class="stat-lbl">PN Cadet Age Limit</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">5 Days</span>
          <span class="stat-lbl">ISSB Selection Testing</span>
        </div>
      </div>
    </header>

    <!-- Section 1: Initial Requirements & Apply Online -->
    <section class="seo-section glass-card" id="requirements">
      <div class="section-badge">CRITERIA & REGISTRATION</div>
      <h2>Section 1: Initial Requirements & Apply Online</h2>
      <p class="section-intro">
        Joining the Pakistan Navy as a Commissioned Officer through the <strong>PN Cadet Course</strong> or <strong>Short Service Commission (SSC)</strong> requires meeting strict educational, age, and physical medical criteria set by Naval Headquarters (NHQ).
      </p>

      <div class="matrix-grid">
        <div class="matrix-card">
          <div class="matrix-header">
            <span class="icon">🎓</span>
            <h3>Academic Qualifications</h3>
          </div>
          <ul class="matrix-list">
            <li><strong>PN Cadet (Permanent):</strong> Matric & FSc (Pre-Engineering or ICS with Physics & Maths) with at least <strong>60% marks</strong>.</li>
            <li><strong>A-Level Candidates:</strong> Equivalence certificate from IBCC with min. 60% aggregate.</li>
            <li><strong>Short Service Commission (SSC):</strong> BE / BS in Electrical, Mechanical, Software, Cyber Security, or MBBS for Medical branch.</li>
          </ul>
        </div>

        <div class="matrix-card">
          <div class="matrix-header">
            <span class="icon">📐</span>
            <h3>Physical & Medical Standards</h3>
          </div>
          <ul class="matrix-list">
            <li><strong>Height:</strong> 5 Feet 4 Inches (162.5 cm) for Male candidates; 5 Feet 0 Inches for Female Medical/Specialist branches.</li>
            <li><strong>Chest:</strong> 31 inches unexpanded with 2 inches minimum expansion capability (31" – 33").</li>
            <li><strong>Eye Sight:</strong> 6/6 without glasses for Operations / Executive branch; correctable with glasses for Technical & Supply branches.</li>
            <li><strong>Weight:</strong> In accordance with Body Mass Index (BMI) medical tables.</li>
          </ul>
        </div>
      </div>

      <div class="step-guide-box">
        <h3>Step-by-Step Online Registration Process</h3>
        <ol class="step-list">
          <li><strong>Visit Official Website:</strong> Open <a href="https://www.joinpaknavy.gov.pk" target="_blank" rel="noopener noreferrer">joinpaknavy.gov.pk</a> during active induction windows (typically May-June and October-November).</li>
          <li><strong>Fill Candidate Profile:</strong> Enter candidate CNIC/B-Form, Father's details, domicile district, and educational records.</li>
          <li><strong>Select Examination Center:</strong> Choose your nearest Naval Selection and Recruitment Centre (NSRC) in Karachi, Lahore, Rawalpindi, Peshawar, Quetta, Multan, Faisalabad, Sukkur, Gwadar, or Gilgit.</li>
          <li><strong>Print Roll Number Slip:</strong> Download your computerized registration slip displaying test date, time, and required original documents.</li>
        </ol>
      </div>
    </section>

    <!-- Section 2: The Initial Tests -->
    <section class="seo-section glass-card" id="initial-tests">
      <div class="section-badge">STAGE 1 TESTING</div>
      <h2>Section 2: The Initial Tests at NSRC</h2>
      <p class="section-intro">
        Before receiving an ISSB call-up, all applicants must qualify the preliminary screening exams at their designated Naval Selection and Recruitment Centre.
      </p>

      <div class="test-modules-grid">
        <div class="test-module-card">
          <span class="module-number">01</span>
          <h3>Computerized Intelligence Test</h3>
          <p>
            An automated timed test split into two sections:
          </p>
          <ul>
            <li><strong>Verbal Intelligence:</strong> 80–90 MCQs (analogies, number series, coding/decoding, blood relations, alphabet patterns). Approx. 30–35 minutes.</li>
            <li><strong>Non-Verbal Intelligence:</strong> 60–70 visual MCQs (figure rotation, odd-figure-out, pattern matrix, mirror symmetry). Approx. 25–30 minutes.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">02</span>
          <h3>Academic Examination</h3>
          <p>
            Administered immediately upon passing the intelligence section:
          </p>
          <ul>
            <li><strong>English:</strong> Prepositions, active/passive voice, vocabulary, comprehension, grammar rules.</li>
            <li><strong>Physics & Mathematics:</strong> Vectors, mechanics, calculus, trigonometry, electromagnetic laws.</li>
            <li><strong>General Knowledge & Pak Studies:</strong> Current geopolitical affairs, Islamic history, and Pakistan defence geography.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">03</span>
          <h3>Preliminary Physical Test (PET)</h3>
          <p>
            Conducted on ground to measure baseline endurance:
          </p>
          <ul>
            <li><strong>1.6 km (1 Mile) Run:</strong> Must complete within 8 minutes 30 seconds.</li>
            <li><strong>Push-ups:</strong> 15 repetitions in 2 minutes.</li>
            <li><strong>Sit-ups:</strong> 15 repetitions in 2 minutes.</li>
            <li><strong>Chin-ups:</strong> 3 clean repetitions.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">04</span>
          <h3>Medical & Preliminary Interview</h3>
          <p>
            Initial screening for knock-knees, flat feet, vision abnormalities, surgical scars, and skin conditions. Followed by a 5-minute confidence and spoken English interview with the Selection Officer.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 3: ISSB Preparation (The Hook) -->
    <section class="seo-section glass-card highlight-box" id="issb-preparation">
      <div class="section-badge badge-cyan">COMMAND SELECTION PORTAL</div>
      <h2>Section 3: ISSB Preparation (The Interactive Hook)</h2>
      <p class="section-intro">
        The Inter Services Selection Board (ISSB) is the decisive phase. Passing requires mastering the <strong>14 Officer-Like Qualities (OLQs)</strong> tested across psychological, indoor, and outdoor dimensions. Use our interactive simulators calibrated to official testing standards:
      </p>

      <div class="tools-grid">
        <RouterLink to="/simulator/wat" class="tool-card">
          <div class="tool-icon">⏱️</div>
          <div class="tool-content">
            <h3>Word Association Test (WAT) Simulator</h3>
            <p>Practice 10-second projector flash words with Roman Urdu meanings and military psychological reaction frameworks.</p>
            <span class="tool-link">Launch WAT Simulator →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/sct" class="tool-card">
          <div class="tool-icon">✍️</div>
          <div class="tool-content">
            <h3>Sentence Completion Test (SCT)</h3>
            <p>Timed English and Urdu incomplete sentence sets. Learn to avoid defense mechanisms and negative projections.</p>
            <span class="tool-link">Practice SCT Sheets →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/srt" class="tool-card">
          <div class="tool-icon">🛡️</div>
          <div class="tool-content">
            <h3>Situation Reaction Test (SRT)</h3>
            <p>Real-time 30-second crisis scenarios. Formulate decisive, moral, and courageous military solutions.</p>
            <span class="tool-link">Train SRT Scenarios →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/opi" class="tool-card">
          <div class="tool-icon">🧠</div>
          <div class="tool-content">
            <h3>Officer Personality Inventory (OPI)</h3>
            <p>Interactive 150-question psychological inventory with trait-by-trait breakdowns and honesty checks.</p>
            <span class="tool-link">Take OPI Assessment →</span>
          </div>
        </RouterLink>

        <RouterLink to="/roadmap" class="tool-card">
          <div class="tool-icon">🗺️</div>
          <div class="tool-content">
            <h3>5-Day ISSB Complete Roadmap</h3>
            <p>Day-by-day walkthrough covering Arrival, Psychological Battery, GTO Outdoor Tasks, and Final Board Conference.</p>
            <span class="tool-link">Explore 5-Day Syllabus →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/obstacles" class="tool-card">
          <div class="tool-icon">🧗</div>
          <div class="tool-content">
            <h3>GTO Obstacles Route Planner</h3>
            <p>Interactive map of Individual Obstacles (Tarzan Swing, Monkey Bridge, Rope Climb) to maximize your score past 30 points.</p>
            <span class="tool-link">Plan GTO Sequence →</span>
          </div>
        </RouterLink>

        <RouterLink to="/deputy-interview" class="tool-card">
          <div class="tool-icon">👔</div>
          <div class="tool-content">
            <h3>Deputy President Interview Guide</h3>
            <p>High-frequency interview questions, military current affairs probes, rapid-fire math, and ideal answers.</p>
            <span class="tool-link">Read Interview Bank →</span>
          </div>
        </RouterLink>

        <RouterLink to="/call-letter" class="tool-card">
          <div class="tool-icon">📬</div>
          <div class="tool-content">
            <h3>ISSB Call Letter Tracker</h3>
            <p>Check reporting schedules for Kohat, Gujranwala, Malir, and Quetta centers, plus packing checklist.</p>
            <span class="tool-link">Track Call Letter →</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Section 4: Final Medical & Merit List -->
    <section class="seo-section glass-card" id="final-merit">
      <div class="section-badge">POST-ISSB CLEARANCE</div>
      <h2>Section 4: Final Medical & Merit List</h2>
      <p class="section-intro">
        Receiving a "Recommended" letter at ISSB is a major achievement, but final induction into the Pakistan Naval Academy depends on two crucial remaining steps:
      </p>

      <div class="post-issb-grid">
        <div class="post-card">
          <h3>1. Final Medical Examination (CMH / Naval Hospital)</h3>
          <p>
            Conducted at the nearest Combined Military Hospital (CMH) or Naval Hospital (PNS Shifa Karachi, PNS Hafeez Islamabad). The examination includes detailed blood and urine biochemistry, chest X-rays, abdominal ultrasound, ECG, audiometry hearing tests, and surgical review. Candidates must be declared <strong>Medically Fit (Category 'A')</strong>.
          </p>
        </div>

        <div class="post-card">
          <h3>2. NHQ Overall Merit Compilation & Joining</h3>
          <p>
            Naval Headquarters (NHQ) Islamabad compiles the final national merit list based on weighted aggregate marks:
          </p>
          <ul>
            <li>Academic record (Matric & FSc percentage).</li>
            <li>NSRC Initial Intelligence and Academic score.</li>
            <li>ISSB Board recommendation grade.</li>
          </ul>
          <p>
            Selected candidates receive official joining letters to report at <strong>Pakistan Naval Academy (PNA) PNS Rahnuma, Manora (Karachi)</strong> for 1.5 to 2 years of rigorous naval officer training leading to the award of Sub-Lieutenant rank.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 5: FAQs -->
    <section class="seo-section glass-card" id="faq">
      <div class="section-badge">FREQUENTLY ASKED QUESTIONS</div>
      <h2>Frequently Asked Questions: Pak Navy Online Apply</h2>
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
  background: linear-gradient(180deg, rgba(2, 112, 165, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
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
  color: var(--accent-cyan);
  background: var(--accent-cyan-glow);
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
  border: 1px solid rgba(2, 112, 165, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--accent-cyan);
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
  color: var(--accent-cyan);
  background: rgba(2, 112, 165, 0.08);
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
  background: linear-gradient(135deg, rgba(2, 112, 165, 0.04) 0%, rgba(255, 255, 255, 0.8) 100%);
  border: 1px dashed var(--accent-cyan);
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
  color: var(--accent-cyan);
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
  color: rgba(2, 112, 165, 0.2);
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
  border-color: var(--accent-cyan);
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
  color: var(--accent-cyan);
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
