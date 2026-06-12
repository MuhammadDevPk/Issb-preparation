<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePreparationStore } from '../stores/preparation'

const store = usePreparationStore()
const router = useRouter()

const activeDay = ref(1)
const selectedTestId = ref('bio_data')
const showPdfModal = ref(false)
const activePdfPath = ref('')

const days = [
  { num: 1, label: 'Day 1: Arrival & Screening' },
  { num: 2, label: 'Day 2: Psychologist Day' },
  { num: 3, label: 'Day 3: GTO Tasks (Indoor & Out)' },
  { num: 4, label: 'Day 4: Individual Tasks & Interview' },
  { num: 5, label: 'Day 5: Conference & Results' },
]

const roadmapData = {
  1: [
    {
      id: 'bio_data',
      name: 'Bio-Data Form Filling',
      conductedBy: 'Administration Staff',
      timing: 'Immediately after arrival and reception.',
      purpose:
        'To collect detailed personal, family, educational, sports, and structural background info. This form serves as the primary reference document for the Psychologist and Deputy President during your interview. They evaluate stability, hobbies, and family context.',
      mistakes:
        'Lying about achievements, claiming false hobbies (e.g. "reading books" when you haven\'t read one), writing contradictory info across different form sheets, or trying to present a faked, ideal military profile.',
      strategy:
        'Be 100% honest. If you do not play sports, do not write them. Know details about whatever you write (if you write "gaming", know names of developers/engines). Practice filling these forms beforehand to ensure clean handwriting and zero overwriting.',
      pdfs: [
        { name: 'Bio Data Form', file: 'ISSB FORM FILLING-BIO DATA.pdf' },
        { name: '1st Day 4 Forms', file: 'ISSB FORM FILLING - 1st Day 4 Forms.pdf' },
        { name: 'General Day 1 Form', file: 'ISSB FORM FILLING - General Form for Day 1.pdf' },
        { name: 'Call Letter Forms', file: 'ISSB FOR FILLING-CALL LETTER.pdf' },
      ],
      simulator: null,
    },
    {
      id: 'intelligence_tests',
      name: 'Verbal & Non-Verbal Intelligence Tests',
      conductedBy: 'Testing Staff / Admin',
      timing: 'Day 1 morning, shortly after form filling.',
      purpose:
        'To measure basic IQ, logical reasoning, cognitive speed, and analytical abilities. Non-verbal tests assess spatial pattern recognition. Candidates who fail this are screened out immediately on Day 1 (Screening test).',
      mistakes:
        'Wasting too much time on a single difficult question, panicking under tight limits, guessing blindly without reading the pattern, or failing to understand instructions before starting.',
      strategy:
        'Keep a fast pace. You have around 30-40 seconds per question. If a question is too hard, skip and return later. Practice number series, coding-decoding, direction senses, and shape matrices.',
      pdfs: [
        { name: 'Mechanical Aptitude 1', file: 'Physch Day Test - Mechanical Aptitude-1.pdf' },
        { name: 'Mechanical Aptitude 2', file: 'Physc Day Test - Mechanical Aptitude-2.pdf' },
      ],
      simulator: null,
    },
    {
      id: 'day1_essays',
      name: 'English & Urdu Essay Writing',
      conductedBy: 'Psychologist Section',
      timing: 'Right after intelligence screening tests.',
      purpose:
        'To test expression clarity, intellectual maturity, grammatical accuracy, and opinions on national/personal issues. They assess if your thoughts are structured, balanced, and constructive.',
      mistakes:
        'Writing extreme, radical political or religious views, writing childish ideas, making heavy spelling mistakes, crossing out sentences repeatedly, or using copying patterns from guidebooks.',
      strategy:
        'Keep essays short, structured (Introduction, Body, positive Conclusion). Write in clean lines. Remain balanced: acknowledge problems but suggest practical constructive solutions. Practice writing under 15 minutes.',
      pdfs: [{ name: 'Essay Writing Guides & Topics', file: 'ESSAY WRITING - Essays.pdf' }],
      simulator: null,
    },
  ],
  2: [
    {
      id: 'wat_test',
      name: 'Word Association Test (WAT)',
      conductedBy: 'Psychologist',
      timing: 'Day 2 morning, Psychologist Hall.',
      purpose:
        "To probe the candidate's subconscious mind, spontaneity, emotional conflicts, fears, and natural responses. 100 words are flashed on a screen for 10 seconds each, and the candidate must write a sentence.",
      mistakes:
        'Writing pre-memorized, artificial positive sentences (e.g. for "Fear" writing "I have no fear" which is unnatural), leaving too many blank sheets, writing negative or aggressive responses (e.g. for "Kill" writing "I want to kill enemies").',
      strategy:
        'Be spontaneous. Write short, active, action-oriented sentences. Focus on positive outcomes or simple facts (e.g. for "Fail" -> "Hard work overcomes failure", for "Country" -> "I love my country" or "Pakistan is developing"). Practice with the WAT simulator to train reflexes.',
      pdfs: [
        { name: 'WAT Preparation Guide', file: 'Physc Day Test - WAT(Word Association Test).pdf' },
      ],
      simulator: '/simulator/wat',
    },
    {
      id: 'sct_test',
      name: 'Sentence Completion Test (SCT)',
      conductedBy: 'Psychologist',
      timing: 'Day 2, following WAT.',
      purpose:
        'To analyze emotional stability, maturity, family relations, attitude towards authority, and fears. Candidates are given English and Roman Urdu sheets with 26 incomplete sentences each, to complete in 6 minutes.',
      mistakes:
        'Leaving sentences incomplete, using double negatives, showing extreme frustration/sadness (e.g. "My father... hates me"), or writing faked positive sentences that clash with bio-data.',
      strategy:
        'Be quick and realistic. complete the sentence naturally showing active effort, responsibility, or general optimism. Do not write passive or running sentences. Practice writing speed.',
      pdfs: [
        {
          name: 'English Sentence Completion',
          file: 'Physc Day Test - English Sentence Completion..pdf',
        },
        {
          name: 'Urdu Sentence Completion',
          file: 'Physc Day Test - Urdu Sentence Completion .pdf',
        },
        {
          name: 'Latest Sentence Completion Sheet',
          file: 'Physch Day Test - Latest Sentence Completion.pdf',
        },
      ],
      simulator: '/simulator/sct',
    },
    {
      id: 'srt_test',
      name: 'Situation Reaction Test (SRT)',
      conductedBy: 'Psychologist',
      timing: 'Day 2 psychological battery.',
      purpose:
        'To test practical intelligence, decision-making, resourcefulness, and panic control during real-world crises. 10 situations are described, and candidate writes their immediate reaction.',
      mistakes:
        'Writing "Superman" answers (e.g. jumping alone into a rapid river to save 5 people without tools), doing nothing or running away (e.g. calling police and just waiting), or writing incomplete answers.',
      strategy:
        'Apply logical, step-by-step crisis resolution. Use available resources. Example reaction: "Alerted others, used a nearby rope, rescued the drowning person, gave first aid." Keep responses brief, logical, and action-oriented.',
      pdfs: [
        {
          name: 'SRT Situations Sheet',
          file: 'Physc Day Test - Situation (SRT) For Practice..pdf',
        },
        {
          name: 'SRT Tricks & Guidelines',
          file: 'physc Day Test - Trick To Solve Situations (SRT).pdf',
        },
      ],
      simulator: '/simulator/srt',
    },
    {
      id: 'merits_demerits',
      name: 'Merits & Demerits (Self-Description)',
      conductedBy: 'Psychologist',
      timing: 'Day 2 psychological battery.',
      purpose:
        'To measure self-awareness, honesty, maturity, and capacity for self-improvement. Candidate writes their own merits (strengths) and demerits (weaknesses).',
      mistakes:
        'Writing fake demerits (hidden merits like "I work too hard", "I am a perfectionist"), writing dangerous demerits (e.g. "I have a hot temper", "I steal"), or listing 10 merits and only 1 demerit.',
      strategy:
        'Write genuine, common demerits that can be easily improved (e.g. "I need to improve my public speaking", "I sometimes spend too much time on single tasks"). Pair them with merits like honesty, punctuality, and hard work.',
      pdfs: [
        { name: 'Merits & Demerits Analysis', file: 'Physc Day Test - Merits and Demerits.pdf' },
      ],
      simulator: null,
    },
    {
      id: 'opi_test',
      name: 'Personality Test (OPI)',
      conductedBy: 'Psychologist',
      timing: 'Day 2, afternoon.',
      purpose:
        'To map core psychological dimensions (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) using standard questionnaires.',
      mistakes:
        'Exaggerating answers to appear perfect, contradicting responses (e.g. answering "Strongly Agree" to "I love socializing" and "Strongly Agree" to "I prefer being alone"), or answering randomly.',
      strategy:
        'Read questions carefully and remain consistent. Answer based on your genuine behavior. Do not try to guess the "right military answer" because the test has built-in cross-check questions.',
      pdfs: [
        { name: 'Personality Test OPI Guide', file: 'Physc Day Test - Personality Test (OPI).pdf' },
      ],
      simulator: null,
    },
  ],
  3: [
    {
      id: 'gto_discussions',
      name: 'Group Discussions (GD) & Lecturette',
      conductedBy: 'Group Testing Officer (GTO)',
      timing: 'Day 3 morning, GTO indoor room.',
      purpose:
        'To evaluate social interaction, communication power, persuasion, tolerance of opposing views, and general knowledge. Lecturette tests confidence speaking under eyes of GTO.',
      mistakes:
        'Shouting or aggressively dominating the group, cutting off others, showing rigid opinions, staying silent, or getting nervous during the 2-minute lecturette.',
      strategy:
        'Speak with a calm, firm tone. Provide logical arguments backed by facts. Listen to others, appreciate good points, and build on them. In lecturette, structure your talk: Introduction, background, pros & cons, final solution.',
      pdfs: [
        {
          name: 'GD Topics & Lecturette Book',
          file: 'GTO Tasks - Group Discussion & Lecturette.pdf',
        },
      ],
      simulator: null,
    },
    {
      id: 'model_planning',
      name: 'Group Model Planning',
      conductedBy: 'GTO',
      timing: 'Day 3, indoor tasks.',
      purpose:
        'To assess collective planning ability, coordinate calculation, speed of decision, and teamwork. Group is given a terrain model board and a crisis scenario to solve and present a single plan.',
      mistakes:
        "Refusing to listen to other candidates' plans, pushing your own flawed plan stubbornly, staying quiet, or failing to understand the GTO's model brief (like scale/speed limits).",
      strategy:
        "Pay deep attention to the GTO's briefing. Take brief notes of speed limits, time constraints, and resources. Help the group synthesize a balanced plan. Volunteer to write or present the plan if you are confident.",
      pdfs: [{ name: 'GTO Model Planning Guide', file: 'GTO - Model Planing .pdf' }],
      simulator: null,
    },
  ],
  4: [
    {
      id: 'individual_obstacles',
      name: 'GTO Individual Obstacles',
      conductedBy: 'GTO',
      timing: 'Day 4 morning, GTO outdoor grounds.',
      purpose:
        'To test physical stamina, coordination, agility, boldness, and spatial planning. Candidate must cross 9 obstacles of varying points (1 to 10) in 3 minutes.',
      mistakes:
        'Panicking after failing an obstacle and wasting time, failing to remember the points values, starting with low-value tasks that drain energy, or breaking safety rules.',
      strategy:
        'Plan your route before starting. Begin with high-value obstacles (e.g. Tarzan Swing, Monkey Bridge) while you have energy. If you slip, move on immediately. Focus on speed and steady footing. Use the Obstacles Planner to map your run.',
      pdfs: [],
      simulator: '/simulator/obstacles',
    },
    {
      id: 'final_interview',
      name: 'Deputy President / President Interview',
      conductedBy: 'Deputy President (Brigadier / equivalent)',
      timing: 'Day 4 (sometimes Day 3), interview rooms.',
      purpose:
        'To cross-check all findings of Psychologist and GTO, test honesty, general knowledge, academic excellence, current affairs, military awareness, and emotional stability.',
      mistakes:
        'Lying (especially on facts that contradict Day 1 forms), arguing with the interviewer, getting defensive, using slang, or showing extreme nervousness.',
      strategy:
        'Dress neatly. Enter with confidence, salute, and sit upright. Maintain eye contact. If you don\'t know an answer, say "I don\'t know, Sir" honestly. Know details about your city, academics, current national issues, and the military branch you are joining.',
      pdfs: [
        { name: 'Final Interview Guide', file: 'Final Interview .pdf' },
        { name: 'Recommended Candidates Experiences', file: 'Recommend Students Experience..pdf' },
      ],
      simulator: null,
    },
  ],
  5: [
    {
      id: 'conference_day',
      name: 'Conference & Final Board Decision',
      conductedBy: 'Full Board (President, Psychologist, GTOs)',
      timing: 'Day 5 morning.',
      purpose:
        'To finalize recommendations. The GTO, Psychologist, and Deputy President debate candidates where findings differ. The candidate is called in briefly for a final look.',
      mistakes:
        'Believing the brief 15-second call is a test and over-answering, showing anxiety, or behaving informally.',
      strategy:
        'Dress cleanly. Walk in confidently, answer any simple greeting/question briefly (e.g. "How was your stay?"), thank the board, and leave. Stay calm during results announcement.',
      pdfs: [],
      simulator: null,
    },
  ],
}

const activeTests = computed(() => {
  return roadmapData[activeDay.value] || []
})

const selectedTest = computed(() => {
  const tests = activeTests.value
  const found = tests.find((t) => t.id === selectedTestId.value)
  if (found) return found
  // Fallback to first test of active day if not found
  if (tests.length > 0) {
    return tests[0]
  }
  return null
})

const selectDay = (dayNum) => {
  activeDay.value = dayNum
  const tests = roadmapData[dayNum]
  if (tests && tests.length > 0) {
    selectedTestId.value = tests[0].id
  }
}

const selectTest = (testId) => {
  selectedTestId.value = testId
}

const drivePdfs = {
  'ESSAY WRITING - Essays.pdf':
    'https://drive.google.com/file/d/1RorT0fBNxsnrOsWrhE634KVfjJmFe0zn/preview',
  'Final Interview .pdf':
    'https://drive.google.com/file/d/1GBOZ1M7VwSuh9GHCyidx0TyF0XGuOLx2/preview',
  'GTO - Model Planing .pdf':
    'https://drive.google.com/file/d/1N8IJeGMcrWOWmTwfUV3lEZsiMFhZanmb/preview',
  'GTO Tasks - Group Discussion & Lecturette.pdf':
    'https://drive.google.com/file/d/1fTBFqwFKxCiOtyMwOyQLMRLskT7IV8ia/preview',
  'ISSB FOR FILLING-CALL LETTER.pdf':
    'https://drive.google.com/file/d/1LL8epzLWwtrfKoPw8jjCLoDa91LX8vUv/preview',
  'ISSB FORM FILLING - 1st Day 4 Forms.pdf':
    'https://drive.google.com/file/d/1Q8RDDBy8bb8zUwGncSKnkqHSHPwQZ9XO/preview',
  'ISSB FORM FILLING - General Form for Day 1.pdf':
    'https://drive.google.com/file/d/1muh0gvajCoSpVomG2vU2FnHo9w8vAVAw/preview',
  'ISSB FORM FILLING-BIO DATA.pdf':
    'https://drive.google.com/file/d/1KpyDpz14KCmGMg4M2uDUwIEg92WfJYoC/preview',
  'Physc Day Test - English Sentence Completion..pdf':
    'https://drive.google.com/file/d/1nkMQrfEyMVQbMYjqGqHGIfHIYgI62RJ7/preview',
  'Physc Day Test - Mechanical Aptitude-2.pdf':
    'https://drive.google.com/file/d/1icE8_IDjTM65lWuZ3tIFQlfMK3RklI2S/preview',
  'Physc Day Test - Merits and Demerits.pdf':
    'https://drive.google.com/file/d/1xZKHIBMVFvymOHzY2x5wCv3TIXE3kkTM/preview',
  'Physc Day Test - Personality Test (OPI).pdf':
    'https://drive.google.com/file/d/1jW8TBEl00Z0GHisQ8HrRz9IGdud3ewaA/preview',
  'Physc Day Test - Situation (SRT) For Practice..pdf':
    'https://drive.google.com/file/d/16YrgBIoPaElK2nhg4kiZs0M-NeSoS40c/preview',
  'physc Day Test - Trick To Solve Situations (SRT).pdf':
    'https://drive.google.com/file/d/1w2veWYM41dJhbHpfXiCbQc73nNm7r43f/preview',
  'Physc Day Test - Urdu Sentence Completion .pdf':
    'https://drive.google.com/file/d/1tHHOe_gG8ycAWo6sWDpD90LXXJ6288u6/preview',
  'Physc Day Test - WAT(Word Association Test).pdf':
    'https://drive.google.com/file/d/1N3Yvtj3up_eLZu5N8ISCEStlTuzLsyk9/preview',
  'Physch Day Test - Latest Sentence Completion.pdf':
    'https://drive.google.com/file/d/1sL_Xmq5uAWelllzYoGRhEMJ-DDSnckv2/preview',
  'Physch Day Test - Mechanical Aptitude-1.pdf':
    'https://drive.google.com/file/d/1SsH7E2E_loBHBdrKS2MN3_iXa4klxuVW/preview',
  'Recommend Students Experience..pdf':
    'https://drive.google.com/file/d/1--S9WOGzLeRW7sFobRz_rdGzLJU-y67V/preview',
}

const openPdf = (file) => {
  activePdfPath.value = drivePdfs[file] || ''
  if (activePdfPath.value) {
    showPdfModal.value = true
  } else {
    console.error('PDF mapping not found for file:', file)
  }
}

const launchSimulator = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="roadmap-wrapper">
    <!-- Day Selector Navbar -->
    <nav class="day-selector-bar glass-card">
      <button
        v-for="day in days"
        :key="day.num"
        class="day-btn"
        :class="{ active: activeDay === day.num }"
        @click="selectDay(day.num)"
      >
        <span>{{ day.label }}</span>
      </button>
    </nav>

    <!-- Main Content Area Grid -->
    <div class="roadmap-grid">
      <!-- Left side: Tests List of active day -->
      <aside class="tests-list-panel glass-card">
        <h3 class="panel-title text-glow">SCHEDULED TESTS</h3>
        <div class="tests-menu">
          <button
            v-for="test in activeTests"
            :key="test.id"
            class="test-menu-item"
            :class="{ active: selectedTestId === test.id }"
            @click="selectTest(test.id)"
          >
            <div class="item-header">
              <span class="test-name">{{ test.name }}</span>
              <span
                class="status-dot"
                :class="{ completed: store.isModuleCompleted(test.id) }"
              ></span>
            </div>
            <span class="test-meta">By {{ test.conductedBy }}</span>
          </button>
        </div>
      </aside>

      <!-- Right side: Guideline detail sheet -->
      <main class="guideline-details-panel glass-card" v-if="selectedTest">
        <div class="details-header">
          <div>
            <h2>{{ selectedTest.name }}</h2>
            <span class="meta-tag"
              >Conducted by: <strong>{{ selectedTest.conductedBy }}</strong></span
            >
            <span class="meta-tag ml-3"
              >Timing: <strong>{{ selectedTest.timing }}</strong></span
            >
          </div>

          <button
            class="btn"
            :class="store.isModuleCompleted(selectedTest.id) ? 'btn-success' : 'btn-secondary'"
            @click="store.toggleModuleCompleted(selectedTest.id)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="btn-icon"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{{
              store.isModuleCompleted(selectedTest.id) ? 'Completed' : 'Mark Complete (+50XP)'
            }}</span>
          </button>
        </div>

        <div class="details-body">
          <!-- Guide Segment: Purpose -->
          <div class="segment border-blue">
            <h4>
              <svg
                class="seg-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Purpose & What They Evaluate
            </h4>
            <p>{{ selectedTest.purpose }}</p>
          </div>

          <!-- Guide Segment: Mistakes -->
          <div class="segment border-red">
            <h4>
              <svg
                class="seg-icon text-red"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Common Pitfalls & Mistakes to Avoid
            </h4>
            <p>{{ selectedTest.mistakes }}</p>
          </div>

          <!-- Guide Segment: Strategy -->
          <div class="segment border-green">
            <h4>
              <svg
                class="seg-icon text-green"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Preparation Mindset & Strategy
            </h4>
            <p>{{ selectedTest.strategy }}</p>
          </div>

          <!-- Practice Options Row -->
          <div class="actions-row">
            <!-- Launch simulator if exists -->
            <button
              v-if="selectedTest.simulator"
              class="btn btn-primary"
              @click="launchSimulator(selectedTest.simulator)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="btn-icon"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Launch Simulator</span>
            </button>

            <!-- Linked PDF Documents -->
            <div
              class="pdf-links-container"
              v-if="selectedTest.pdfs && selectedTest.pdfs.length > 0"
            >
              <span class="pdf-label">Study Guidebooks:</span>
              <div class="pdf-buttons">
                <button
                  v-for="pdf in selectedTest.pdfs"
                  :key="pdf.file"
                  class="btn btn-secondary btn-sm"
                  @click="openPdf(pdf.file)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="btn-icon text-glow"
                  >
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>{{ pdf.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- PDF Viewer Modal -->
    <div class="modal-overlay flex-center" v-if="showPdfModal" @click.self="showPdfModal = false">
      <div class="pdf-modal-container glass-card">
        <div class="modal-header">
          <h3>Study Guidebook Material</h3>
          <button class="btn btn-secondary close-btn" @click="showPdfModal = false">CLOSE</button>
        </div>
        <div class="modal-body-pdf">
          <iframe :src="activePdfPath" class="pdf-iframe"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roadmap-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-block-end: 2rem;
}

.day-selector-bar {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  overflow-x: auto;
  gap: 0.5rem;
}

.day-btn {
  flex: 1;
  padding: 0.85rem 1rem;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-smooth);
  text-align: center;
  white-space: nowrap;
}

.day-btn:hover {
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-primary);
}

.day-btn.active {
  background: rgba(0, 242, 254, 0.08);
  color: var(--accent-cyan);
  border: 1px solid rgba(0, 242, 254, 0.25);
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.05);
}

/* Roadmap Grid Layout */
.roadmap-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.tests-list-panel {
  padding: 1.25rem;
}

.panel-title {
  font-size: 0.85rem;
  color: var(--text-muted);
  letter-spacing: 0.15em;
  margin-block-end: 1rem;
  border-block-end: 1px solid rgba(255, 255, 255, 0.05);
  padding-block-end: 0.5rem;
}

.tests-menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.test-menu-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.85rem 1rem;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-smooth);
}

.test-menu-item:hover {
  background: var(--bg-primary);
  border-color: var(--border-color-hover);
}

.test-menu-item.active {
  background: var(--accent-cyan-glow);
  border-color: var(--accent-cyan);
}

.test-menu-item.active .test-name {
  color: var(--accent-cyan);
}

.test-menu-item .item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.test-name {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

.test-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-block-start: 0.25rem;
}

.status-dot {
  inline-size: 8px;
  block-size: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 1px solid #94a3b8;
}

.status-dot.completed {
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
  border-color: transparent;
}

/* Guideline Details */
.guideline-details-panel {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-block-end: 1px solid rgba(0, 0, 0, 0.06);
  padding-block-end: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.details-header h2 {
  font-size: 1.6rem;
  color: var(--text-primary);
  margin-block-end: 0.35rem;
}

.meta-tag {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.meta-tag strong {
  color: var(--text-primary);
}

.ml-3 {
  margin-inline-start: 1rem;
}

.btn-icon {
  inline-size: 16px;
  block-size: 16px;
}

.details-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.segment {
  background: var(--bg-panel-solid);
  padding: 1.25rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
}

.segment h4 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-block-end: 0.75rem;
}

.seg-icon {
  inline-size: 18px;
  block-size: 18px;
  color: var(--accent-cyan);
}

.segment p {
  color: var(--text-secondary);
  font-size: 0.98rem;
  line-height: 1.6;
}

.border-blue {
  border-inline-start: 3px solid var(--accent-cyan);
}

.border-red {
  border-inline-start: 3px solid var(--accent-red);
}

.border-green {
  border-inline-start: 3px solid var(--accent-green);
}

.actions-row {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-block-start: 1rem;
  padding-block-start: 1.5rem;
  border-block-start: 1px solid rgba(255, 255, 255, 0.05);
}

.pdf-links-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pdf-label {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pdf-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: var(--border-radius-sm);
}

/* Modal styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85); /* Slightly darker solid overlay instead of blur */
  z-index: 1000;
  padding: 2rem;
}

.pdf-modal-container {
  width: 90%;
  max-width: 1200px;
  height: 90%;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel-solid);
  padding: 0;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-block-end: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-header h3 {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  color: var(--text-primary);
}

.close-btn {
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  border-radius: var(--border-radius-sm);
}

.modal-body-pdf {
  flex: 1;
  width: 100%;
  height: 100%;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #20242b;
}

@media (max-width: 992px) {
  .roadmap-grid {
    grid-template-columns: 1fr;
  }
}
</style>
