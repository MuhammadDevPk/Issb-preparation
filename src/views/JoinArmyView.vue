<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'

const activeFaq = ref(null)

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}

const pageTitle = 'Join Pak Army Online Apply 2026 | Initial Test & ISSB Guide'
const pageDescription =
  'Complete guide to joining the Pakistan Army. Get online apply details, initial test syllabus, and practice with our free ISSB WAT and SRT simulators.'
const pageCanonical = 'https://issb-preparation.vercel.app/join-pak-army'

const faqItems = [
  {
    q: 'How to apply for Pak Army online?',
    a: 'Candidates can register online at the official portal (joinpakarmy.gov.pk) during induction announcements for PMA Long Course (usually opened twice a year in April and October) or visit the nearest Army Selection and Recruitment Centre (AS&RC) with required original documents and registration fee.'
  },
  {
    q: 'What is the qualification required for PMA Long Course?',
    a: 'Intermediate (FA/FSc or equivalent) with a minimum of 55% marks. Candidates with 60% marks in BA/BSc/BS or serving army soldiers can also apply with respective age relaxations.'
  },
  {
    q: 'What are the physical test standards for Pakistan Army?',
    a: 'Candidates must complete a 1.6 km (1 mile) run in 8 minutes, 15 push-ups in 2 minutes, 20 sit-ups in 2 minutes, 3 chin-ups in 2 minutes, and cross a ditch measuring 7.4 x 7.4 feet with a depth of 4 feet.'
  },
  {
    q: 'What is tested in the Army AS&RC computerized test?',
    a: 'The test comprises Verbal Intelligence (analogy, coding, series, classifications), Non-Verbal Intelligence (visual pattern matrices, rotations, odd-one-out), and an Academic Test covering English, Mathematics, General Knowledge, Pak Studies, and Islamic Studies.'
  },
  {
    q: 'How can I prepare for Army ISSB psychological tests online?',
    a: 'Use ISSB Command to practice real 10-second Word Association Tests (WAT), 26-sentence timed Sentence Completion Tests (SCT), Situation Reaction crisis simulations (SRT), and full 150-question Officer Personality Inventory (OPI) assessments.'
  }
]

const schemaJson = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      '@id': `${pageCanonical}#article`,
      'headline': 'Join Pak Army Online Apply 2026 & Complete ISSB Selection Guide',
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
        <span class="army-crest">⚔️</span>
        <span>PAKISTAN MILITARY ACADEMY (PMA) SELECTION GUIDE</span>
      </div>
      <h1 class="seo-h1">Join Pak Army Online Apply 2026 & Complete ISSB Guide</h1>
      <p class="hero-lead">
        Your ultimate blueprint for joining the Pakistan Army as a Commissioned Officer. Step-by-step registration for PMA Long Course & TCC, initial intelligence syllabus, and interactive ISSB psychological simulators.
      </p>

      <div class="hero-cta-group">
        <a href="#issb-preparation" class="btn btn-primary">
          <span>🚀 Practice Free ISSB Simulators</span>
        </a>
        <a href="https://www.joinpakarmy.gov.pk" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
          <span>🌐 Official Army Registration Portal ↗</span>
        </a>
      </div>

      <div class="hero-stats-grid">
        <div class="stat-pill">
          <span class="stat-val">55%</span>
          <span class="stat-lbl">Min. Intermediate (FA/FSc)</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">5' 4"</span>
          <span class="stat-lbl">Minimum Height (Male)</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">17–22</span>
          <span class="stat-lbl">PMA Cadet Age Limit</span>
        </div>
        <div class="stat-pill">
          <span class="stat-val">2 Years</span>
          <span class="stat-lbl">Training at PMA Kakul</span>
        </div>
      </div>
    </header>

    <!-- Section 1: Initial Requirements & Apply Online -->
    <section class="seo-section glass-card" id="requirements">
      <div class="section-badge">ELIGIBILITY & REGISTRATION</div>
      <h2>Section 1: Initial Requirements & Apply Online</h2>
      <p class="section-intro">
        The Pakistan Army offers prestigious commissions through multiple entry routes including the <strong>PMA Long Course</strong> (regular combat arms), <strong>Technical Cadet Course (TCC)</strong> (engineering through NUST), and <strong>Lady Cadet Course (LCC)</strong>.
      </p>

      <div class="matrix-grid">
        <div class="matrix-card">
          <div class="matrix-header">
            <span class="icon">🎖️</span>
            <h3>Academic Criteria</h3>
          </div>
          <ul class="matrix-list">
            <li><strong>PMA Long Course:</strong> Minimum <strong>55% marks</strong> in FA / FSc (Pre-Eng, Pre-Med, ICS, I.Com, Arts). Candidates with 60% in BA/BSc can apply up to age 23.</li>
            <li><strong>Hope Certificate:</strong> Candidates who appeared in FSc Part-II exams can apply with a 55% Hope Certificate signed by their college principal.</li>
            <li><strong>Technical Cadet (TCC):</strong> FSc Pre-Engineering or ICS with Physics, Maths & Chemistry/Computer with at least <strong>65% marks</strong>.</li>
          </ul>
        </div>

        <div class="matrix-card">
          <div class="matrix-header">
            <span class="icon">🏃</span>
            <h3>Physical & Age Standards</h3>
          </div>
          <ul class="matrix-list">
            <li><strong>Age Range:</strong> 17 to 22 years on the first day of the reporting month (3 months relaxation on upper and lower limit).</li>
            <li><strong>Gender & Marital Status:</strong> Male, Unmarried (Pakistani citizen or Azad Kashmir/Gilgit-Baltistan domicile).</li>
            <li><strong>Height:</strong> Minimum 5 Feet 4 Inches (162.5 cm).</li>
            <li><strong>Weight & Vision:</strong> As per Pakistan Army Body Mass Index (BMI) chart. Visual standards: 6/6 distance vision with or without glasses.</li>
          </ul>
        </div>
      </div>

      <div class="step-guide-box">
        <h3>Step-by-Step Online Registration via joinpakarmy.gov.pk</h3>
        <ol class="step-list">
          <li><strong>Access Portal:</strong> Navigate to <a href="https://www.joinpakarmy.gov.pk" target="_blank" rel="noopener noreferrer">joinpakarmy.gov.pk</a> during the active registration window.</li>
          <li><strong>Select Desired Course:</strong> Choose PMA Long Course (e.g., 156 / 157 PMA LC) or Technical Cadet Course.</li>
          <li><strong>Input Personal Data:</strong> Enter your CNIC or B-Form number, father’s Army/Civilian credentials, address, and matric/intermediate marks.</li>
          <li><strong>Choose Selection Centre (AS&RC):</strong> Pick your nearest center: Rawalpindi, Lahore, Karachi, Peshawar, Quetta, Multan, Faisalabad, Gilgit, Hyderabad, D.I. Khan, Muzaffarabad, or Khuzdar.</li>
          <li><strong>Print Exam Slip:</strong> Save and print your examination slip mentioning your roll number, test date, and reporting time.</li>
        </ol>
      </div>
    </section>

    <!-- Section 2: The Initial Tests -->
    <section class="seo-section glass-card" id="initial-tests">
      <div class="section-badge">AS&RC SCREENING</div>
      <h2>Section 2: The Initial Tests at AS&RC</h2>
      <p class="section-intro">
        Initial screening at the Army Selection and Recruitment Centre tests intelligence, physical resilience, and medical suitability before nominating candidates for ISSB.
      </p>

      <div class="test-modules-grid">
        <div class="test-module-card">
          <span class="module-number">01</span>
          <h3>Computerized Intelligence Test</h3>
          <p>Administered on touch-screen computers at the AS&RC:</p>
          <ul>
            <li><strong>Verbal Intelligence (84 Questions / 30 Minutes):</strong> Analogies, alphabetical series, number sequences, direction sense, and coding-decoding puzzles.</li>
            <li><strong>Non-Verbal Intelligence (64 Questions / 28 Minutes):</strong> Visual abstract reasoning, pattern matrices, odd figure out, mirror imaging, and shape folding.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">02</span>
          <h3>Academic Examination</h3>
          <p>Unlocks immediately upon qualifying the intelligence section:</p>
          <ul>
            <li><strong>English (20 Questions):</strong> Prepositions, synonyms/antonyms, passive voice, and grammar rules.</li>
            <li><strong>Mathematics & Pak Studies (20 Questions):</strong> Algebraic formulas, percentages, ratio-proportion, historical dates, and constitutional facts.</li>
            <li><strong>General Knowledge & Islamic Studies (10 Questions):</strong> World capitals, military ranks, defence pacts, and Quranic events.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">03</span>
          <h3>Physical Efficiency Test (PET)</h3>
          <p>Conducted outdoors under strict physical evaluators:</p>
          <ul>
            <li><strong>1.6 km (1 Mile) Run:</strong> Must pass in under 8 minutes (scoring graded 1 to 4 marks).</li>
            <li><strong>Push-ups:</strong> 15 clean repetitions in 2 minutes.</li>
            <li><strong>Sit-ups:</strong> 20 repetitions in 2 minutes.</li>
            <li><strong>Chin-ups:</strong> 3 vertical repetitions above the bar.</li>
            <li><strong>Ditch Crossing:</strong> Leap across 7.4 x 7.4 ft ditch with 4 ft depth.</li>
          </ul>
        </div>

        <div class="test-module-card">
          <span class="module-number">04</span>
          <h3>Preliminary Medical & Interview</h3>
          <p>
            Screening for flat feet, knock-knees, carrier angle, vision clarity, and BMI. Followed by a preliminary interview with the AS&RC Commanding Officer evaluating spoken English, current affairs knowledge, and confidence.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 3: ISSB Preparation (The Hook) -->
    <section class="seo-section glass-card highlight-box" id="issb-preparation">
      <div class="section-badge badge-cyan">ISSB COMMAND SUITE</div>
      <h2>Section 3: ISSB Preparation (The Interactive Hook)</h2>
      <p class="section-intro">
        The Inter Services Selection Board tests your <strong>Officer-Like Qualities (OLQs)</strong> over a comprehensive 5-day cycle. Gain a massive competitive edge with our specialized interactive test tools:
      </p>

      <div class="tools-grid">
        <RouterLink to="/simulator/wat" class="tool-card">
          <div class="tool-icon">⏱️</div>
          <div class="tool-content">
            <h3>Word Association Test (WAT) Simulator</h3>
            <p>10-second projector flash words. Master natural, positive, and non-premeditated responses.</p>
            <span class="tool-link">Practice WAT Simulator →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/sct" class="tool-card">
          <div class="tool-icon">✍️</div>
          <div class="tool-content">
            <h3>Sentence Completion Test (SCT)</h3>
            <p>Timed English and Urdu stems. Learn psychological hygiene and eliminate negative themes.</p>
            <span class="tool-link">Practice SCT Sheets →</span>
          </div>
        </RouterLink>

        <RouterLink to="/simulator/srt" class="tool-card">
          <div class="tool-icon">🛡️</div>
          <div class="tool-content">
            <h3>Situation Reaction Test (SRT)</h3>
            <p>30-second crisis management scenarios. Deliver tactical, courageous, and lawful solutions.</p>
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
            <p>High-frequency interview questions: why join Army, rapid-fire arithmetic, and leadership probes.</p>
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
      <div class="section-badge">POST-ISSB PROCEDURE</div>
      <h2>Section 4: Final Medical & Merit List</h2>
      <p class="section-intro">
        Passing ISSB with a "Recommended" stamp is the gateway to commissioning, followed by final clearance:
      </p>

      <div class="post-issb-grid">
        <div class="post-card">
          <h3>1. Final Medical Examination at CMH</h3>
          <p>
            Recommended candidates undergo detailed clinical tests at the nearest Combined Military Hospital (CMH). This includes chest radiography, pathology blood screens (Hepatitis B/C, HIV), ENT hearing inspection, surgical examinations, and ophthalmologist vision evaluations. Candidates must obtain an <strong>Unconditional Category 'A'</strong> medical fitness certificate.
          </p>
        </div>

        <div class="post-card">
          <h3>2. GHQ Merit List & Joining PMA Kakul</h3>
          <p>
            General Headquarters (GHQ) Rawalpindi evaluates overall performance by combining:
          </p>
          <ul>
            <li>Matric & FSc academic marks.</li>
            <li>AS&RC Initial Intelligence and Physical scores.</li>
            <li>ISSB selection board recommendation grade.</li>
          </ul>
          <p>
            Top-ranking candidates receive official joining letters for the <strong>Pakistan Military Academy (PMA) Kakul, Abbottabad</strong>. Cadets undergo 2 years of intensive military leadership, tactics, and academic training before graduating as Second Lieutenants.
          </p>
        </div>
      </div>
    </section>

    <!-- Section 5: FAQs -->
    <section class="seo-section glass-card" id="faq">
      <div class="section-badge">FREQUENTLY ASKED QUESTIONS</div>
      <h2>Frequently Asked Questions: Pak Army Online Apply</h2>
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
  background: linear-gradient(180deg, rgba(21, 128, 61, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
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
  color: var(--accent-green, #15803d);
  background: var(--accent-green-glow, rgba(34, 197, 94, 0.12));
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
  border: 1px solid rgba(21, 128, 61, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--accent-green, #15803d);
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
  color: var(--accent-green, #15803d);
  background: rgba(21, 128, 61, 0.08);
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
  background: linear-gradient(135deg, rgba(21, 128, 61, 0.04) 0%, rgba(255, 255, 255, 0.8) 100%);
  border: 1px dashed var(--accent-green, #15803d);
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
  color: var(--accent-green, #15803d);
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
  color: rgba(21, 128, 61, 0.2);
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
  border-color: var(--accent-green, #15803d);
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
  color: var(--accent-green, #15803d);
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
