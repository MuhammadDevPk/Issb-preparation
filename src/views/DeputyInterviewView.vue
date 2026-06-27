<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const activeTab = ref('overview') // 'overview', 'questions', 'tough', 'blame', 'outfit'
const searchQuery = ref('')

const tabs = computed(() => {
  const list = [
    { id: 'overview', label: '📋 Overview & Structure' },
    { id: 'questions', label: '❓ Question Bank' },
    { id: 'tough', label: '🔥 Tough Questions' },
    { id: 'blame', label: '🤝 Responsibility vs Blame' }
  ]
  // Gated: only admin can see the outfit guides tab
  if (authStore.profile?.role === 'admin') {
    list.push({ id: 'outfit', label: '👔 Outfit & Dressing (Admin)' })
  }
  return list
})

// Extracted questions from Deputy President Interview guides
const questionCategories = [
  {
    name: 'Personal & Family Background',
    icon: '👤',
    questions: [
      { text: 'Tell me about yourself (your educational, home, and sports background).', tip: 'Focus on facts, keep it structured, and be concise.' },
      { text: 'Tell me about your family (siblings, parent occupations, and relations).', tip: 'Be honest. Do not hide conflicts but emphasize mutual support.' },
      { text: 'What are your three biggest strengths and weaknesses?', tip: 'Ensure weaknesses are real but non-critical, showing active steps you take to improve them.' },
      { text: 'How do you spend your free time? What are your hobbies?', tip: 'Be genuine. If you write gaming or reading, be prepared to answer deep questions about them.' }
    ]
  },
  {
    name: 'Education & Achievements',
    icon: '🎓',
    questions: [
      { text: 'Why did you choose your particular educational field (e.g. Pre-Engineering, ICS)?', tip: 'Explain the reasoning behind your choice and show alignment with your aptitude.' },
      { text: 'What was your most difficult subject, and how did you overcome it?', tip: 'Demonstrate hard work, adaptive learning strategies, and resilience.' },
      { text: 'Are there any academic or non-academic achievements you are proud of?', tip: 'Mention sports, leadership roles, competitions, or overcoming specific life hurdles.' }
    ]
  },
  {
    name: 'Motivation for Armed Forces',
    icon: '🎖️',
    questions: [
      { text: 'Why do you want to join the Pakistan Armed Forces?', tip: 'Express passion, but support it with logical reasons (e.g., service, active life, disciplined career).' },
      { text: 'What do you know about the life and daily routine of an officer?', tip: 'Demonstrate that you have a realistic view of the hardships, responsibility, and discipline required.' },
      { text: 'How do you think you will contribute to the organization?', tip: 'Highlight your dedication, adaptability, technical skills, or leadership potential.' }
    ]
  },
  {
    name: 'Situational & Hypothetical Scenario Questions',
    icon: '💡',
    questions: [
      { text: 'What would you do if you see your best friend cheating in an exam?', tip: 'Balance honesty/integrity with loyalty. E.g. Stop him first, then advise him, rather than getting him rusticated immediately or ignoring it.' },
      { text: 'What would you do if one of your subordinates makes a serious mistake during a critical task?', tip: 'Take ultimate responsibility as the leader, correct the mistake first, then counsel/train the subordinate.' },
      { text: 'What would you do if you are posted in a highly difficult, isolated area with extreme weather?', tip: 'Express enthusiasm for the challenge, highlighting adaptability and duty first.' }
    ]
  },
  {
    name: 'General Awareness & Security Issues',
    icon: '🌍',
    questions: [
      { text: 'What are the main national and international issues Pakistan is currently facing?', tip: 'Be aware of economics, security, and climate issues. Remain objective, balanced, and constructive.' },
      { text: 'Explain the distinct roles of Pakistan Army, Navy, and Air Force in joint operations.', tip: 'Show basic military coordination knowledge and domain boundaries.' },
      { text: 'Detail the geographic importance and neighbors of Pakistan.', tip: 'Be clear on border issues, strategic trade routes, and regional dynamics.' }
    ]
  }
]

// Search and filter questions
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return questionCategories
  
  const query = searchQuery.value.toLowerCase()
  return questionCategories.map(cat => {
    const matched = cat.questions.filter(q => 
      q.text.toLowerCase().includes(query) || q.tip.toLowerCase().includes(query)
    )
    return { ...cat, questions: matched }
  }).filter(cat => cat.questions.length > 0)
})

// STAR formula examples
const starExamples = [
  {
    question: 'Tell me about your biggest failure.',
    situation: 'In college, I failed to clear a critical physics midterm exam because I was overconfident and did not manage my prep time.',
    task: 'I had to cover a massive backlog while keeping up with new coursework, aiming to secure an A-grade in the final.',
    action: 'I created a daily study plan, consulted my teacher during office hours, cut down on distractions, and practiced solving past papers.',
    result: 'I scored an A-grade in the finals and learned the value of consistency, humility, and proper time management.'
  },
  {
    question: 'Why should we select you?',
    situation: 'During intermediate and sports events, I have consistently taken responsibility and led teams under pressure.',
    task: 'To represent my team as a candidate who possesses the potential to be trained into a balanced, mature military leader.',
    action: 'I developed self-discipline, stayed physically active, cultivated analytical thinking, and remained honest in my self-assessment.',
    result: 'My continuous self-improvement aligns with the officer qualities sought at ISSB. I am ready to be trained.'
  },
  {
    question: 'What would you do if your senior officers give you an unfair order?',
    situation: 'As a junior officer in a field operation, an instruction is passed down that seems contradictory or unsafe.',
    task: 'To ensure mission success and safety while upholding absolute military chain-of-command and discipline.',
    action: 'I would politely seek clarification to ensure I fully understand the commander\'s intent, pointing out critical risks if unseen, but once the final command is issued, I will execute it with complete dedication.',
    result: 'Maintained integrity and trust while ensuring absolute discipline and mission focus.'
  },
  {
    question: 'What if you don\'t get commissioned?',
    situation: 'Being recommended is my primary goal, but competitive selection processes have uncertain outcomes.',
    task: 'To maintain my determination and choose a constructive, backup career path without losing motivation.',
    action: 'I will analyze my weaknesses from this attempt, work hard to rectify them, and apply again. Meanwhile, I will pursue my degree in Computer Science/Engineering as an alternative plan.',
    result: 'Shows emotional stability, maturity, and goal-oriented resilience. Never shows panic or depression.'
  }
]

// Blame vs Responsibility dataset
const blameComparisons = [
  {
    situation: 'Poor performance in intermediate board exams',
    blame: 'My college teachers did not teach properly, and the papers were checked unfairly.',
    responsible: 'I should have paid more attention, self-studied consistently, and sought extra help when needed.'
  },
  {
    situation: 'Late submission of a group project',
    blame: 'My group members were lazy and they did not remind me or send their parts on time.',
    responsible: 'I did not establish clear deadlines or follow up regularly. I should have managed the team better.'
  },
  {
    situation: 'Losing a key sports match',
    blame: 'The referee was completely biased and made unfair decisions against our team.',
    responsible: 'We made defensive errors and failed to adapt to the opponent\'s style. We will practice harder next time.'
  },
  {
    situation: 'Developing a bad habit or poor routine',
    blame: 'My home environment is stressful and my friends forced me into these habits.',
    responsible: 'It is my responsibility to control my actions, choose my social circle wisely, and improve my routine.'
  }
]

// Admin Outfit Guides (9 images)
const outfitGuides = ref([
  { title: 'Deputy President Interview Details', filename: 'Deputy President Interview Details.jpeg' },
  { title: 'Dressing & Outfit Guide (Male Candidates)', filename: 'DEPUTY PRESIDENT INTERVIEW BEST OUTFIT GUIDE FOR MALE CANDIDATES.jpeg' },
  { title: 'Best Tie Combinations with White Shirt', filename: 'BEST TIE COMBINATIONS WITH WHITE SHIRT.jpeg' },
  { title: 'Handling Tough Questions Guide', filename: 'HANDLING TOUGH QUESTIONS IN DEPUTY PRESIDENT INTERVIEW.jpeg' },
  { title: 'How to Prepare (Part 1: Entry & Posture)', filename: 'HOW TO PREPARE FOR DEPUTY PRESIDENT INTERVIEW part 1.jpeg' },
  { title: 'How to Prepare (Part 2: Body Language & Tone)', filename: 'HOW TO PREPARE FOR DEPUTY PRESIDENT INTERVIEW part 2.jpeg' },
  { title: 'How to Prepare (Part 3: Leaving & Mindset)', filename: 'HOW TO PREPARE FOR DEPUTY PRESIDENT INTERVIEW part 3.jpeg' },
  { title: 'Do\'s, Don\'ts and Dressing Overview', filename: 'How to prepare for Deputy president Interview Do’s and don’ts and dressing.jpeg' },
  { title: 'Never Blame, Take Responsibility Guide', filename: 'NEVER BLAME TAKE RESPONSIBILITY, SHOW MATURITY.jpeg' }
])

const outfitLightboxOpen = ref(false)
const outfitLightboxIndex = ref(0)

const openOutfitLightbox = (idx) => {
  outfitLightboxIndex.value = idx
  outfitLightboxOpen.value = true
}

const closeOutfitLightbox = () => {
  outfitLightboxOpen.value = false
}

const prevOutfitLightbox = () => {
  const count = outfitGuides.value.length
  outfitLightboxIndex.value = (outfitLightboxIndex.value - 1 + count) % count
}

const nextOutfitLightbox = () => {
  const count = outfitGuides.value.length
  outfitLightboxIndex.value = (outfitLightboxIndex.value + 1) % count
}

const handleOutfitLightboxKeys = (e) => {
  if (!outfitLightboxOpen.value) return
  if (e.key === 'Escape') closeOutfitLightbox()
  if (e.key === 'ArrowLeft') prevOutfitLightbox()
  if (e.key === 'ArrowRight') nextOutfitLightbox()
}

onMounted(() => {
  window.addEventListener('keydown', handleOutfitLightboxKeys)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleOutfitLightboxKeys)
})
</script>

<template>
  <div class="interview-wrapper">
    <!-- Header -->
    <div class="interview-header glass-card">
      <div class="header-content">
        <span class="badge badge-gold">💡 ISSB Final Assessment</span>
        <h1>Deputy President (DP) Interview</h1>
        <p class="subtitle-text">
          The final one-on-one assessment in the ISSB testing process. Typically conducted by a Brigadier or equivalent, focusing on personality, emotional maturity, general awareness, and Officer-Like Qualities (OLQs).
        </p>
      </div>
      <div class="header-action">
        <button class="btn btn-secondary" @click="router.push('/roadmap')">
          ← Back to Roadmap
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-container glass-card">
      <div class="tabs-row">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab 1: Overview & Structure -->
    <div class="tab-panel glass-card" v-if="activeTab === 'overview'">
      <div class="grid-2">
        <div class="info-block border-blue">
          <h3>🎯 Purpose of the DP Interview</h3>
          <p>
            The DP Interview is not a formal academic knowledge test. The primary goal is to assess your core personality traits, confidence, integrity, values, motivations, and suitability to serve as a commissioned officer.
          </p>
          <ul class="olq-list" style="margin-top: 1rem;">
            <li><strong>Personality & Character:</strong> Your honesty, values, and self-discipline.</li>
            <li><strong>Confidence & Composure:</strong> Ability to handle direct questioning and stress.</li>
            <li><strong>Motivation:</strong> Sincerity of your desire to serve in the armed forces.</li>
            <li><strong>Maturity:</strong> Your reactions to difficult or unexpected situational questions.</li>
            <li><strong>General Awareness:</strong> Basic knowledge of global issues, regional security, and Pakistan.</li>
          </ul>
        </div>
        
        <div class="info-block border-gold">
          <h3>⏱️ Structure & Environment</h3>
          <div class="meta-row">
            <span class="meta-label">Duration:</span>
            <span class="meta-value">Typically 15 to 30 minutes per candidate.</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Interviewer:</span>
            <span class="meta-value">Deputy President of ISSB (Brigadier / equivalent).</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Environment:</span>
            <span class="meta-value">Private, one-on-one, formal office setting.</span>
          </div>
          <div class="meta-row" style="border-bottom: none;">
            <span class="meta-label">Primary Inputs:</span>
            <span class="meta-value">Your Bio-Data Form, academic results, and GTO performance indicators.</span>
          </div>
        </div>
      </div>

      <div class="tactical-tips border-green" style="margin-top: 1.5rem;">
        <h4>💡 Critical Success Tips:</h4>
        <div class="tips-grid">
          <div class="tip-card">
            <h5>1. Maintain Integrity</h5>
            <p>Never tell a lie. The Deputy President will cross-question you on your statements. Contradictions will damage your profile.</p>
          </div>
          <div class="tip-card">
            <h5>2. Dress Comfortably</h5>
            <p>Ensure your outfit (suit or Shalwar Kameez with waistcoat) is neat, ironed, and well-fitted. Polished shoes and tidy grooming make the first impression.</p>
          </div>
          <div class="tip-card">
            <h5>3. Composure Under Pressure</h5>
            <p>If you face a tough question or get challenged, stay calm. Never get defensive, argue, or panic. Pause, think, and answer with maturity.</p>
          </div>
          <div class="tip-card">
            <h5>4. Admit "Don't Know"</h5>
            <p>If you do not know the answer to a general knowledge question, say: <em>"I don't know, Sir"</em> politely, rather than guessing blindly.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Question Bank -->
    <div class="tab-panel glass-card" v-if="activeTab === 'questions'">
      <div class="search-bar-row">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-input search-field" 
          placeholder="🔍 Search questions by keyword (e.g. weaknesses, motivation, army)..." 
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
      </div>

      <div class="categories-container" v-if="filteredCategories.length > 0">
        <div 
          v-for="cat in filteredCategories" 
          :key="cat.name" 
          class="category-panel border-blue"
          style="margin-bottom: 1.5rem;"
        >
          <div class="category-header">
            <span class="cat-icon">{{ cat.icon }}</span>
            <h4>{{ cat.name }}</h4>
          </div>
          
          <div class="questions-list">
            <div 
              v-for="(q, idx) in cat.questions" 
              :key="idx" 
              class="question-item glass-card"
            >
              <div class="q-text">❓ {{ q.text }}</div>
              <div class="q-tip">
                <strong>💡 Preparation Tip:</strong> {{ q.tip }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="no-results glass-card" v-else>
        <p>🔍 No questions match your search query. Try another keyword.</p>
      </div>
    </div>

    <!-- Tab 3: Tough Questions (STAR Method) -->
    <div class="tab-panel glass-card" v-if="activeTab === 'tough'">
      <div class="star-explanation border-gold">
        <h3>⭐ The STAR Response Formula</h3>
        <p>
          When asked tough situational or failure-related questions, keep your answer structured, logical, and growth-oriented by following the STAR method:
        </p>
        <div class="star-flow">
          <div class="star-step">
            <span class="star-letter">S</span>
            <strong>Situation</strong>
            <span>Briefly set the context.</span>
          </div>
          <div class="star-step">
            <span class="star-letter">T</span>
            <strong>Task</strong>
            <span>Define the challenge or goal.</span>
          </div>
          <div class="star-step">
            <span class="star-letter">A</span>
            <strong>Action</strong>
            <span>Explain the steps YOU took.</span>
          </div>
          <div class="star-step">
            <span class="star-letter">R</span>
            <strong>Result</strong>
            <span>Share the positive outcome or what you learned.</span>
          </div>
        </div>
      </div>

      <h3 style="margin-top: 2rem; margin-bottom: 1rem;">🔥 Sample Tough Questions & Responses</h3>
      <div class="star-examples-grid">
        <div 
          v-for="(ex, idx) in starExamples" 
          :key="idx" 
          class="star-example-card glass-card"
        >
          <h4 class="ex-question">Q: {{ ex.question }}</h4>
          
          <div class="ex-parts">
            <div class="ex-part"><span class="lbl s-lbl">S</span> <p>{{ ex.situation }}</p></div>
            <div class="ex-part"><span class="lbl t-lbl">T</span> <p>{{ ex.task }}</p></div>
            <div class="ex-part"><span class="lbl a-lbl">A</span> <p>{{ ex.action }}</p></div>
            <div class="ex-part"><span class="lbl r-lbl">R</span> <p>{{ ex.result }}</p></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Responsibility vs Blame -->
    <div class="tab-panel glass-card" v-if="activeTab === 'blame'">
      <div class="blame-overview border-red">
        <h3>🤝 Never Blame. Take Responsibility.</h3>
        <p>
          Military psychologists and the Deputy President are looking for candidates who demonstrate <strong>maturity</strong> and <strong>accountability</strong>. 
          Blaming parents, teachers, friends, resources, or the "system" for your shortcomings shows lack of control, immaturity, and makes you look defensive.
        </p>
        <p style="margin-top: 0.5rem; font-weight: 500;">
          👉 The Mindset Shift: Stop making excuses. Acknowledge mistakes, accept ownership, and explain how you are working to improve.
        </p>
      </div>

      <h3 style="margin-top: 2rem; margin-bottom: 1rem;">⚖️ Blaming (Weak) vs. Responsible (Strong) Examples</h3>
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Situation</th>
              <th class="col-avoid">❌ Don't Say (Blaming / Weak)</th>
              <th class="col-use">✅ Say This Instead (Responsible / Strong)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in blameComparisons" :key="idx">
              <td class="sit-cell"><strong>{{ item.situation }}</strong></td>
              <td class="blame-cell text-red">{{ item.blame }}</td>
              <td class="resp-cell text-green">{{ item.responsible }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="formula-box border-green" style="margin-top: 1.5rem;">
        <h4>🏆 The Responsibility Formula:</h4>
        <div class="formula-steps">
          <div class="f-step"><strong>1. Accept:</strong> Own the mistake/situation honestly without hesitation.</div>
          <div class="arrow">➔</div>
          <div class="f-step"><strong>2. Learn:</strong> Identify the lesson or exact point of failure.</div>
          <div class="arrow">➔</div>
          <div class="f-step"><strong>3. Improve:</strong> Share the steps you have taken or are taking to correct it.</div>
          <div class="arrow">➔</div>
          <div class="f-step"><strong>4. Move Forward:</strong> Present a solution-oriented, positive path.</div>
        </div>
      </div>
    </div>

    <!-- Tab 5: Outfit & Dressing (Admin Only) -->
    <div class="tab-panel glass-card" v-if="activeTab === 'outfit' && authStore.profile?.role === 'admin'">
      <div class="guides-header" style="margin-bottom: 1.5rem;">
        <h3 class="text-glow">👔 Admin Panel: Dressing, Ties, & Outfit Boards</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
          Admin access only. These visual boards are hidden from standard candidates. Study outfit matching and tie length guides.
        </p>
      </div>
      
      <div class="guides-grid">
        <div 
          v-for="(item, itemIdx) in outfitGuides" 
          :key="itemIdx"
          class="guide-card glass-card interactive"
          @click="openOutfitLightbox(itemIdx)"
        >
          <div class="guide-image-container">
            <img 
              :src="'/media/images/tests-guides/Deputy Interview guide/' + item.filename" 
              :alt="item.title"
              class="guide-thumbnail"
              loading="lazy"
            />
            <div class="guide-card-overlay">
              <span class="zoom-text">🔍 Click to View Full Size</span>
            </div>
          </div>
          <div class="guide-card-footer">
            <span class="guide-card-title">{{ item.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Outfit Lightbox Modal (Admin only) -->
    <div class="lightbox-modal" v-if="outfitLightboxOpen && authStore.profile?.role === 'admin'" @click.self="closeOutfitLightbox">
      <div class="lightbox-content-wrapper">
        <button class="lightbox-close-btn" @click="closeOutfitLightbox">×</button>
        <button 
          class="lightbox-nav-btn prev-btn" 
          @click="prevOutfitLightbox" 
          v-if="outfitGuides.length > 1"
        >
          ‹
        </button>
        <div class="lightbox-image-box">
          <img 
            :src="'/media/images/tests-guides/Deputy Interview guide/' + outfitGuides[outfitLightboxIndex].filename" 
            :alt="outfitGuides[outfitLightboxIndex].title"
            class="lightbox-image"
          />
          <div class="lightbox-caption">
            <span class="caption-category">Deputy Interview Prep Guide</span>
            <h4 class="caption-title">{{ outfitGuides[outfitLightboxIndex].title }}</h4>
          </div>
        </div>
        <button 
          class="lightbox-nav-btn next-btn" 
          @click="nextOutfitLightbox" 
          v-if="outfitGuides.length > 1"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.interview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
}

.interview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.header-content h1 {
  font-size: 1.85rem;
  margin-top: 0.25rem;
}

.subtitle-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 0.5rem;
  max-width: 800px;
}

.tabs-container {
  padding: 0.5rem;
}

.tabs-row {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-smooth);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(0, 242, 254, 0.08);
  color: var(--accent-cyan);
  border: 1px solid rgba(0, 242, 254, 0.25);
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.info-block {
  padding: 1.25rem;
  border-left: 4px solid var(--accent-cyan);
  background: rgba(3, 194, 252, 0.02);
  border-radius: var(--border-radius-md);
}

.info-block.border-gold {
  border-left-color: var(--accent-gold);
  background: rgba(245, 158, 11, 0.02);
}

.info-block h3 {
  font-size: 1.15rem;
  margin-bottom: 0.75rem;
}

.olq-list {
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 0.65rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
}

.meta-label {
  font-weight: 600;
  color: var(--text-primary);
}

.meta-value {
  color: var(--text-secondary);
  text-align: right;
  max-width: 65%;
}

.tactical-tips {
  padding: 1.25rem;
  background: rgba(34, 197, 94, 0.02);
  border-left: 4px solid var(--accent-green);
  border-radius: var(--border-radius-md);
}

.tactical-tips h4 {
  font-size: 1.15rem;
  margin-bottom: 1rem;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.tip-card h5 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.tip-card p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Question Bank Tab */
.search-bar-row {
  position: relative;
  width: 100%;
}

.search-field {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.5rem;
  background: var(--bg-panel-solid, #f8fafc);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.95rem;
  color: var(--text-primary);
}

.search-field:focus {
  outline: 2px solid var(--accent-cyan);
  border-color: transparent;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 0.5rem;
}

.category-panel {
  padding: 1.25rem;
  background: rgba(3, 194, 252, 0.01);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 0.5rem;
}

.category-header h4 {
  font-size: 1.1rem;
}

.cat-icon {
  font-size: 1.25rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-item {
  padding: 1rem;
  background: var(--bg-panel-solid, #f8fafc);
}

.q-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.q-tip {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  border-top: 1px solid rgba(255,255,255,0.03);
  padding-top: 0.5rem;
}

.q-tip strong {
  color: var(--accent-cyan);
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

/* STAR Answering method */
.star-explanation {
  padding: 1.25rem;
  border-left: 4px solid var(--accent-gold);
  background: rgba(245, 158, 11, 0.02);
  border-radius: var(--border-radius-md);
}

.star-explanation h3 {
  font-size: 1.15rem;
  margin-bottom: 0.75rem;
}

.star-flow {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 1.25rem;
}

.star-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.star-letter {
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--accent-gold);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.star-step strong {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.star-step span:last-child {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.star-examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.star-example-card h4 {
  font-size: 0.95rem;
  color: var(--accent-cyan);
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 0.5rem;
}

.ex-parts {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.ex-part {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.ex-part .lbl {
  font-size: 0.7rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  margin-top: 2px;
}

.s-lbl { background: var(--accent-cyan); }
.t-lbl { background: var(--accent-gold); }
.a-lbl { background: var(--accent-green); }
.r-lbl { background: #8b5cf6; }

.ex-part p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Blame vs Responsibility */
.blame-overview {
  padding: 1.25rem;
  border-left: 4px solid var(--accent-red);
  background: rgba(239, 68, 68, 0.02);
  border-radius: var(--border-radius-md);
}

.blame-overview h3 {
  font-size: 1.15rem;
  margin-bottom: 0.75rem;
}

.comparison-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  text-align: left;
}

.comparison-table th, .comparison-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.comparison-table th {
  background: var(--bg-panel-solid, #f8fafc);
  font-weight: 600;
  color: var(--text-primary);
}

.col-avoid {
  color: var(--accent-red);
}

.col-use {
  color: var(--accent-green);
}

.sit-cell {
  background: var(--bg-panel-solid, #f8fafc);
  width: 25%;
}

.blame-cell {
  color: var(--accent-red);
  width: 37.5%;
  line-height: 1.4;
}

.resp-cell {
  color: var(--accent-green);
  width: 37.5%;
  line-height: 1.4;
}

.formula-box {
  padding: 1.25rem;
  border-left: 4px solid var(--accent-green);
  background: rgba(34, 197, 94, 0.02);
  border-radius: var(--border-radius-md);
}

.formula-box h4 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.formula-steps {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.f-step {
  background: rgba(255,255,255,0.03);
  padding: 0.75rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
  border: 1px solid rgba(255,255,255,0.05);
  flex: 1;
  min-width: 150px;
}

.arrow {
  color: var(--text-muted);
  font-size: 1.2rem;
}

/* Dressing/Outfit gallery (Admin-only) */
.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.guide-card {
  overflow: hidden;
  padding: 0;
  border-radius: var(--border-radius-md);
  transition: transform var(--transition-smooth), border-color var(--transition-smooth);
}

.guide-image-container {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: rgba(0,0,0,0.1);
}

.guide-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-smooth);
}

.guide-card:hover .guide-thumbnail {
  transform: scale(1.05);
}

.guide-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-smooth);
}

.guide-card:hover .guide-card-overlay {
  opacity: 1;
}

.zoom-text {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(0,0,0,0.6);
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
}

.guide-card-footer {
  padding: 0.75rem;
  text-align: center;
  background: var(--bg-panel-solid, #f8fafc);
  border-top: 1px solid var(--border-color);
}

.guide-card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

/* Lightbox Modal */
.lightbox-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.lightbox-content-wrapper {
  position: relative;
  width: 100%;
  max-width: 900px;
  max-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image-box {
  background: #000;
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  max-height: 80vh;
  width: auto;
  max-width: 100%;
}

.lightbox-image {
  max-width: 100%;
  max-height: calc(80vh - 70px);
  object-fit: contain;
}

.lightbox-close-btn {
  position: absolute;
  top: -2.5rem;
  right: 0;
  font-size: 2rem;
  color: #fff;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--transition-smooth);
}

.lightbox-close-btn:hover {
  opacity: 1;
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 3rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-smooth);
  opacity: 0.6;
}

.lightbox-nav-btn:hover {
  opacity: 1;
  background: rgba(3, 194, 252, 0.8);
}

.prev-btn {
  left: -4rem;
}

.next-btn {
  right: -4rem;
}

.lightbox-caption {
  padding: 0.75rem 1.25rem;
  background: rgba(30, 41, 59, 0.95);
  color: #fff;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.caption-category {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-cyan);
  letter-spacing: 0.05em;
}

.caption-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.15rem 0 0 0;
}

/* Responsiveness */
@media (max-width: 992px) {
  .prev-btn { left: 0.5rem; z-index: 10; }
  .next-btn { right: 0.5rem; z-index: 10; }
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  
  .interview-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-action {
    margin-top: 0.5rem;
  }
  
  .star-flow {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .star-examples-grid {
    grid-template-columns: 1fr;
  }
  
  .formula-steps {
    flex-direction: column;
    align-items: stretch;
  }
  
  .arrow {
    text-align: center;
    transform: rotate(90deg);
    margin: 0.25rem 0;
  }

  .comparison-table th, .comparison-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }

  .sit-cell { width: 30%; }
  .blame-cell, .resp-cell { width: 35%; }

  /* Mobile Fullscreen Lightbox */
  .lightbox-modal {
    padding: 0;
    background: #000000;
  }

  .lightbox-content-wrapper {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
  }

  .lightbox-image-box {
    width: 100%;
    height: 100%;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
    box-shadow: none;
    background: #000000;
    justify-content: center;
  }

  .lightbox-image {
    width: 100%;
    height: 100%;
    max-height: 100dvh;
    object-fit: contain;
  }

  .lightbox-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(8px);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    z-index: 12;
    padding: 1rem 1.25rem;
  }

  .lightbox-close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    left: auto;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #ffffff;
    z-index: 20;
    opacity: 0.9;
    padding-bottom: 4px;
  }

  .lightbox-nav-btn {
    width: 44px;
    height: 44px;
    font-size: 2.5rem;
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(255, 255, 255, 0.15);
    z-index: 15;
  }

  .prev-btn { left: 0.75rem; }
  .next-btn { right: 0.75rem; }
}

@media (max-width: 480px) {
  .guides-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }
}
</style>
