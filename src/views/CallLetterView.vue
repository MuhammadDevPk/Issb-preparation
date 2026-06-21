<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// State
const activeTab = ref('tracker') // 'tracker' or 'generator'

// Form Fields
const candidateName = ref('')
const fatherName = ref('')
const cnic = ref('')
const rollNumber = ref('')
const selectedCourse = ref('154 PMA Long Course')
const selectedCenter = ref('Kohat')
const reportingDate = ref('')
const batchNumber = ref('')

// Pre-fill from Auth Store if profile exists
onMounted(() => {
  if (authStore.profile) {
    candidateName.value = authStore.profile.full_name || ''
    // Default values if empty
    rollNumber.value = '2405' + Math.floor(1000 + Math.random() * 9000)
    batchNumber.value = 'B-' + Math.floor(1000 + Math.random() * 9000)
    
    // Set reporting date to 2 weeks from now as default
    const twoWeeks = new Date()
    twoWeeks.setDate(twoWeeks.getDate() + 14)
    reportingDate.value = twoWeeks.toISOString().split('T')[0]
  } else {
    // Guest default values so they see a nice populated letter initially
    candidateName.value = 'GUEST CANDIDATE'
    fatherName.value = 'GUARDIAN NAME'
    cnic.value = '37405-1234567-1'
    rollNumber.value = '2405' + Math.floor(1000 + Math.random() * 9000)
    batchNumber.value = 'B-' + Math.floor(1000 + Math.random() * 9000)
    
    const twoWeeks = new Date()
    twoWeeks.setDate(twoWeeks.getDate() + 14)
    reportingDate.value = twoWeeks.toISOString().split('T')[0]
  }
})

// Centers metadata
const centersData = {
  Kohat: {
    name: 'Inter Services Selection Board Kohat',
    tele: '0922-9260085',
    address: 'Kohat Cantt, Khyber Pakhtunkhwa, Post Code 26000',
    railwayStation: 'Kohat Railway Station / Cantt Bus Terminal',
    refPrefix: 'ISSB/KHT/CALL-UP'
  },
  Gujranwala: {
    name: 'Inter Services Selection Board Gujranwala',
    tele: '055-9201088',
    address: 'Rahwali Cantt, Gujranwala, Punjab, Post Code 52250',
    railwayStation: 'Gujranwala Cantt Railway Station / General Bus Stand',
    refPrefix: 'ISSB/GRW/CALL-UP'
  },
  Malir: {
    name: 'Inter Services Selection Board Malir',
    tele: '021-99247481',
    address: 'Malir Cantt, Karachi, Sindh, Post Code 75270',
    railwayStation: 'Cantt Railway Station Karachi / Malir Station reception',
    refPrefix: 'ISSB/MLR/CALL-UP'
  },
  Quetta: {
    name: 'Inter Services Selection Board Quetta',
    tele: '081-2882245',
    address: 'Quetta Cantt, Balochistan',
    railwayStation: 'Quetta Railway Station reception desk',
    refPrefix: 'ISSB/QTA/CALL-UP'
  }
}

// Referral sharing
const referralLink = computed(() => {
  const code = authStore.profile?.referral_code || ''
  return window.location.origin + (code ? '/r/' + code : '/register')
})

const shareText = computed(() => {
  return `Hey! I just generated my mock ISSB Call Up Letter and started Day 1 preparation. Check your ISSB Status & practice project clocks simulators here: ${referralLink.value}`
})

const copyStatus = ref('Copy Link')
const copyShareLink = async () => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareText.value)
    } else {
      const textArea = document.createElement('textarea')
      textArea.value = shareText.value
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
    console.error('Failed to copy share link: ', err)
  }
}

const triggerPrint = () => {
  window.print()
}

// Formatting helpers
const formatCnic = (val) => {
  const cleaned = val.replace(/\D/g, '')
  if (cleaned.length <= 5) return cleaned
  if (cleaned.length <= 12) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`
}

const onCnicInput = (e) => {
  cnic.value = formatCnic(e.target.value)
}

const formatDateString = (str) => {
  if (!str) return 'N/A'
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(str).toLocaleDateString('en-US', options)
}

const getTodayDateString = () => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('en-US', options)
}

const activeCenterInfo = computed(() => {
  return centersData[selectedCenter.value] || centersData.Kohat
})
</script>

<template>
  <div class="call-letter-page">
    <!-- Screen Header (Hidden during printing) -->
    <header class="page-title-section no-print">
      <span class="badge badge-cyan">Official Utilities</span>
      <h2>ISSB Call Status & Call Letter Portal</h2>
      <p class="description">
        Track your official selection dates or generate a high-fidelity Practice Call Notice to plan your clothing checklist and boost your motivation.
      </p>
    </header>

    <!-- Tab Switcher (Hidden during printing) -->
    <div class="tab-switcher no-print">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'tracker' }"
        @click="activeTab = 'tracker'"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        <span>Official Status Tracker</span>
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'generator' }"
        @click="activeTab = 'generator'"
      >
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Mock Call Letter Generator <span class="viral-badge">Viral 🔥</span></span>
      </button>
    </div>

    <!-- TAB 1: OFFICIAL TRACKER (Hidden during printing) -->
    <div v-if="activeTab === 'tracker'" class="tab-content tracker-tab no-print">
      <div class="tracker-grid">
        <!-- Status Link Card -->
        <div class="glass-card tracker-card border-blue">
          <div class="card-header-icon bg-cyan-glow text-cyan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </div>
          <h3>Check Official ISSB Website</h3>
          <p>
            Official Call Letters and candidate batch scheduling are managed directly by the Armed Forces Selection Boards on their secure servers. Redirection is required to check live status.
          </p>

          <div class="official-link-section">
            <a 
              href="http://203.124.41.150/issb/" 
              target="_blank" 
              class="btn btn-primary btn-redirect"
            >
              <span>Check Official Call Status ↗</span>
            </a>
            <span class="url-text">Official Server IP: http://203.124.41.150/issb/</span>
          </div>

          <div class="checklist-guide">
            <h5>How to search your status:</h5>
            <ol>
              <li>Click the button above to open the official portal in a new browser tab.</li>
              <li>Locate the <strong>"Call Status"</strong> query form on their homepage.</li>
              <li>Input your 13-digit CNIC number <strong>without dashes or spaces</strong> (e.g., <code>3740512345671</code>).</li>
              <li>Click "Search" to view your reporting date and assigned center.</li>
            </ol>
          </div>
        </div>

        <!-- Declaration Form Card -->
        <div class="glass-card tracker-card border-green">
          <div class="card-header-icon bg-green-glow text-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3>Required Declaration Form</h3>
          <p>
            All candidates reporting to the ISSB center must submit a signed copy of the official ISSB Declaration Form. Download the document below to print, fill, and carry it with you.
          </p>

          <div class="official-link-section">
            <a 
              href="/media/documents/Declaration%20Form.docx" 
              download="Declaration Form.docx"
              class="btn btn-success btn-redirect"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon-svg">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download Declaration Form</span>
            </a>
          </div>

          <div class="checklist-guide">
            <h5>Form Instructions:</h5>
            <ol>
              <li>Download the official Word (.docx) document to your device.</li>
              <li>Print the form on a clean, standard A4 white paper.</li>
              <li>Fill in all the required details (Name, CNIC, Father's Name) in block letters.</li>
              <li>Sign the form. Get it countersigned by a parent or guardian.</li>
            </ol>
          </div>
        </div>

        <!-- FAQs Card -->
        <div class="glass-card faq-card">
          <div class="card-header-icon bg-gold-glow text-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="header-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3>Candidate Call Up FAQs</h3>
          
          <div class="faq-list">
            <div class="faq-item">
              <h6>When are ISSB dates issued?</h6>
              <p>
                Usually 15 to 45 days after clearing your initial army/navy/airforce center interview, depending on course lists and selection cycles.
              </p>
            </div>
            
            <div class="faq-item">
              <h6>What does "Under Process" status mean?</h6>
              <p>
                It means your initial recommendation has been processed and you are placed in the scheduling pool. Your exact batch dates are currently being arranged. Keep checking weekly.
              </p>
            </div>

            <div class="faq-item">
              <h6>Can I change my assigned ISSB date?</h6>
              <p>
                ISSB dates are strictly non-negotiable except for serious medical reasons or overlapping academic university exams. In such cases, contact the call-up section of your assigned center immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: MOCK LETTER GENERATOR -->
    <div v-else class="tab-content generator-tab">
      <div class="generator-layout">
        <!-- Form Inputs Panel (Hidden during printing) -->
        <div class="form-panel glass-card no-print">
          <h4>Configure Call Notice</h4>
          <p class="panel-subtitle">Fill in details to instantly generate and preview your personalized practice document.</p>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Candidate Name</label>
              <input 
                type="text" 
                v-model="candidateName" 
                placeholder="Enter full name" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Father's Name</label>
              <input 
                type="text" 
                v-model="fatherName" 
                placeholder="Enter father's name" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">CNIC / Smart Card</label>
              <input 
                type="text" 
                :value="cnic" 
                @input="onCnicInput"
                placeholder="xxxxx-xxxxxxx-x" 
                class="form-input"
                maxlength="15"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Roll Number</label>
              <input 
                type="text" 
                v-model="rollNumber" 
                placeholder="e.g. 562410" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Assigned Course</label>
              <select v-model="selectedCourse" class="form-select">
                <option value="154 PMA Long Course">154 PMA Long Course</option>
                <option value="155 PMA Long Course">155 PMA Long Course</option>
                <option value="Technical Cadet Course (TCC-38)">Technical Cadet Course (TCC-38)</option>
                <option value="Lady Cadet Course (LCC-25)">Lady Cadet Course (LCC-25)</option>
                <option value="Short Service Commission (SSC)">Short Service Commission (SSC)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">ISSB Selection Center</label>
              <select v-model="selectedCenter" class="form-select">
                <option value="Kohat">ISSB Kohat</option>
                <option value="Gujranwala">ISSB Gujranwala</option>
                <option value="Malir">ISSB Malir</option>
                <option value="Quetta">ISSB Quetta</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Reporting Date</label>
              <input 
                type="date" 
                v-model="reportingDate" 
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Batch Group ID</label>
              <input 
                type="text" 
                v-model="batchNumber" 
                placeholder="e.g. K-1452" 
                class="form-input"
              />
            </div>
          </div>

          <!-- Quick Actions inside Form -->
          <div class="form-actions-box">
            <button @click="triggerPrint" class="btn btn-success w-100 mb-sm">
              <svg class="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Print / Save PDF Call Letter</span>
            </button>

            <div class="share-motivation-card">
              <h6>Share on Social Media & WhatsApp</h6>
              <p>Motivate friends and invite them to study together. Share a preparation link:</p>
              
              <div class="share-buttons-row">
                <a 
                  :href="'https://wa.me/?text=' + encodeURIComponent(shareText)" 
                  target="_blank" 
                  class="btn-social btn-whatsapp-share"
                >
                  Share WhatsApp
                </a>
                <button 
                  @click="copyShareLink" 
                  class="btn-social btn-copy-link"
                >
                  {{ copyStatus }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- High-Fidelity Call Letter Document (Printed Page Wrapper) -->
        <div class="print-page-wrapper">
          <div class="military-call-letter" id="printable-call-letter">
            <!-- Crest Header -->
            <div class="letter-header">
              <div class="crest-placeholder">
                <!-- SVG Military Seal Representation -->
                <svg viewBox="0 0 100 100" class="military-seal">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#223e22" stroke-width="3"></circle>
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#223e22" stroke-width="1" stroke-dasharray="3,3"></circle>
                  <!-- Laurel wreath -->
                  <path d="M25 60 C 20 40, 30 25, 45 22" fill="none" stroke="#223e22" stroke-width="2" stroke-linecap="round"></path>
                  <path d="M75 60 C 80 40, 70 25, 55 22" fill="none" stroke="#223e22" stroke-width="2" stroke-linecap="round"></path>
                  <!-- Star and Crescent -->
                  <path d="M 45 42 A 8 8 0 1 0 57 52 A 9 9 0 1 1 45 42" fill="#223e22"></path>
                  <polygon points="56,38 60,42 55,43 59,47 54,49 52,44 48,46" fill="#223e22" transform="scale(0.85) translate(10, 2)"></polygon>
                  <!-- Text inside circle -->
                  <text x="50" y="80" text-anchor="middle" font-size="8" font-weight="bold" fill="#223e22" font-family="monospace">ISSB</text>
                </svg>
              </div>
              <h3 class="letter-title">{{ activeCenterInfo.name.toUpperCase() }}</h3>
              <p class="tele-ref">Tele: {{ activeCenterInfo.tele }}</p>
              <p class="address-text">{{ activeCenterInfo.address }}</p>
            </div>

            <!-- Letter Metadata Row -->
            <div class="letter-meta-row">
              <div>Ref: <strong>{{ activeCenterInfo.refPrefix }}/{{ batchNumber || 'M-9821' }}/{{ rollNumber || 'C-485' }}</strong></div>
              <div>Date: <strong>{{ getTodayDateString() }}</strong></div>
            </div>

            <!-- Main Subject -->
            <div class="letter-subject">
              SUBJECT: <u><strong>CALL UP NOTICE FOR ISSB TESTS - {{ selectedCourse.toUpperCase() }}</strong></u>
            </div>

            <!-- Candidate Details -->
            <div class="recipient-details">
              To,<br />
              Candidate: <strong>{{ candidateName.toUpperCase() || '____________________' }}</strong><br />
              Father's Name: <strong>{{ fatherName.toUpperCase() || '____________________' }}</strong><br />
              CNIC / Form-B: <strong>{{ cnic || '_____-_______-_' }}</strong><br />
              Roll Number: <strong>{{ rollNumber || '______' }}</strong>
            </div>

            <!-- Body Paragraphs -->
            <div class="letter-body">
              <p>
                1. You have been selected to appear before the Selection Board for academic, psychological, and physical testing. You are hereby directed to report at the <strong>{{ activeCenterInfo.railwayStation }}</strong> reception desk on <strong>{{ formatDateString(reportingDate) }}</strong> no later than <strong>0800 hours</strong>. Official military transport will be provided to carry you to the ISSB center.
              </p>
              <p>
                2. Candidates arriving late (after 1200 hours) will not be allowed to take tests under any circumstances. You will reside at the ISSB premises for 4 days. Messing, lodging, and medical facilities are provided. 
              </p>
              <p>
                3. **CRITICAL:** Ensure you bring all <strong>MANDATORY ORIGINAL DOCUMENTS</strong> listed below. Candidates without matric/intermediate sanads or equivalence certificates will be sent back immediately.
              </p>
            </div>

            <!-- Multi-tab lists styled for paper -->
            <div class="letter-lists-container">
              <!-- Column 1: Documents & Prohibited items -->
              <div class="list-section-doc">
                <h5 class="section-heading-paper">MANDATORY DOCUMENT CHECKLIST</h5>
                <ul class="paper-bullet-list">
                  <li><strong>Original Call Notice:</strong> This printed document.</li>
                  <li><strong>Matric Sanad & Result Card:</strong> Original certificates. Secondary school board copies only.</li>
                  <li><strong>Intermediate FSc/FA Sanad & Result Card:</strong> Original certificates.</li>
                  <li><strong>Hope Certificate:</strong> If FSc Part-II exams are pending, bring original college principal hope certificate along with Part-I marksheet.</li>
                  <li><strong>CNIC / B-Form:</strong> Original CNIC (or B-form if under 18 years).</li>
                  <li><strong>Attested Photos:</strong> 1 passport photo attested from front, 3 photos attested from back.</li>
                  <li><strong>Postal Order:</strong> Rs. 100 postal order in name of President ISSB.</li>
                </ul>
              </div>

              <!-- Column 2: Clothing Checklist -->
              <div class="list-section-cloth">
                <h5 class="section-heading-paper">ITEMS / CLOTHING TO PACK</h5>
                <ul class="paper-bullet-list">
                  <li><strong>Sports Dress:</strong> 2-3 sets of white shorts and white T-shirts (half sleeves) with white collar.</li>
                  <li><strong>Joggers / Canvas Shoes:</strong> 1 pair of clean white sports shoes along with 3 pairs of white socks.</li>
                  <li><strong>Formal Suits:</strong> 1 lounge suit or dress shirt/pants with necktie for dining room and interview sessions.</li>
                  <li><strong>National Dress:</strong> 2-3 sets of clean Shalwar Kameez with matching waistcoat.</li>
                  <li><strong>Security:</strong> One small padlock with keys to lock your personal luggage cupboard.</li>
                  <li><strong>Stationery:</strong> 2-3 blue/black ballpoint pens and 1 clipboard.</li>
                  <li><strong>Grooming:</strong> Shaving kit, toothbrush, toothpaste, hair brush, and soap.</li>
                </ul>
              </div>
            </div>

            <!-- Prohibited warnings -->
            <div class="prohibited-box-paper">
              <strong>WARNING - PROHIBITED ITEMS:</strong> Mobile phones, smartwatches, cameras, recording equipment, laptops, tablets, memory cards, electronic items, drugs, and weapons are strictly prohibited inside the center. Any candidate found possessing these items is liable to immediate expulsion and disqualification.
            </div>

            <!-- Sign Block -->
            <div class="stamp-and-sign">
              <!-- Approved Stamp Replica -->
              <div class="mock-stamp">
                <div class="stamp-inner">
                  <span>MOCK NOTICE</span>
                  <span class="stamp-sub">FOR PRACTICE</span>
                </div>
              </div>

              <div class="signature-block">
                <div class="signature-line"></div>
                <strong>(Officer Incharge Call Up Section)</strong><br />
                For President ISSB<br />
                {{ activeCenterInfo.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.call-letter-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title-section {
  margin-bottom: 2rem;
}

.page-title-section h2 {
  font-size: 1.85rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  max-width: 800px;
}

/* Tab Switcher */
.tab-switcher {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1.25rem;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(3, 194, 252, 0.08);
  color: var(--accent-cyan);
  border-color: rgba(3, 194, 252, 0.25);
}

.tab-icon {
  width: 18px;
  height: 18px;
}

.viral-badge {
  background: var(--accent-gold-glow);
  color: var(--accent-gold);
  font-size: 0.7rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  margin-left: 0.25rem;
  font-weight: 700;
}

/* Tracker Grid */
.tracker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.tracker-card, .faq-card {
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-cyan-glow {
  background: var(--accent-cyan-glow);
}

.bg-gold-glow {
  background: var(--accent-gold-glow);
}

.bg-green-glow {
  background: var(--accent-green-glow);
}

.header-icon {
  width: 24px;
  height: 24px;
}

.tracker-card h3, .faq-card h3 {
  font-size: 1.35rem;
  margin: 0;
}

.tracker-card p, .faq-card p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.official-link-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-redirect {
  justify-content: center;
  padding: 0.95rem;
}

.url-text {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-family: monospace;
  text-align: center;
}

.checklist-guide {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
}

.checklist-guide h5 {
  font-size: 0.88rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.checklist-guide ol {
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checklist-guide li {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* FAQ Section */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.faq-item h6 {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.35rem;
}

.faq-item p {
  font-size: 0.88rem !important;
}

/* Generator Section */
.generator-layout {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 2rem;
  align-items: start;
}

.form-panel {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel-subtitle {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: -0.75rem;
  margin-bottom: 0.5rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-actions-box {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
  margin-top: 0.5rem;
}

.mb-sm {
  margin-bottom: 1rem;
}

.btn-icon-svg {
  width: 18px;
  height: 18px;
}

.share-motivation-card {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.share-motivation-card h6 {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-primary);
}

.share-motivation-card p {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.share-buttons-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-social {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.5rem;
  font-size: 0.82rem;
  font-family: var(--font-heading);
  font-weight: 700;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all var(--transition-smooth);
}

.btn-whatsapp-share {
  background: #25d366;
  color: white;
}

.btn-whatsapp-share:hover {
  background: #20ba5a;
  transform: translateY(-1px);
}

.btn-copy-link {
  background: #ffffff;
  border-color: #cbd5e1;
  color: var(--text-secondary);
}

.btn-copy-link:hover {
  background: #f8fafc;
  border-color: #94a3b8;
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* Printable Document Preview */
.print-page-wrapper {
  background: #cbd5e1;
  padding: 1.5rem;
  border-radius: var(--border-radius-lg);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
}

.military-call-letter {
  background: #fdfdfb;
  color: #1a2c1a;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 800px;
  border: 1px solid #1c2b1c;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 0.92rem;
  line-height: 1.5;
  position: relative;
  overflow: hidden;
}

/* Double inner borders mimicking official correspondence */
.military-call-letter::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 1px solid #1c2b1c;
  pointer-events: none;
}

.letter-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.crest-placeholder {
  width: 70px;
  height: 70px;
  margin-bottom: 0.75rem;
}

.military-seal {
  width: 100%;
  height: 100%;
}

.letter-title {
  font-family: 'Courier New', monospace;
  font-weight: 900;
  font-size: 1.15rem;
  color: #1a2c1a;
  letter-spacing: 0.05em;
  margin: 0 0 0.25rem 0;
}

.tele-ref {
  font-size: 0.82rem;
  font-family: 'Courier New', monospace;
  margin: 0;
}

.address-text {
  font-size: 0.78rem;
  font-style: italic;
  margin: 0;
}

.letter-meta-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #1c2b1c;
  padding-bottom: 0.5rem;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
}

.letter-subject {
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.recipient-details {
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-size: 0.88rem;
}

.letter-body {
  margin-bottom: 1.5rem;
  text-align: justify;
}

.letter-body p {
  margin-bottom: 0.85rem;
}

.letter-lists-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-heading-paper {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 900;
  border-bottom: 1.5px solid #1c2b1c;
  padding-bottom: 0.25rem;
  margin-bottom: 0.65rem;
}

.paper-bullet-list {
  list-style-type: none;
  padding-left: 0;
}

.paper-bullet-list li {
  font-size: 0.78rem;
  margin-bottom: 0.45rem;
  position: relative;
  padding-left: 0.85rem;
  line-height: 1.35;
}

.paper-bullet-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  top: 0;
}

.prohibited-box-paper {
  background: #f4f4f0;
  border: 1px solid #1c2b1c;
  padding: 0.85rem;
  font-size: 0.75rem;
  line-height: 1.4;
  margin-bottom: 2rem;
  text-align: justify;
}

.stamp-and-sign {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 1rem;
  min-height: 90px;
}

/* Circular Mock Stamp */
.mock-stamp {
  width: 110px;
  height: 110px;
  border: 3px double #b91c1c;
  border-radius: 50%;
  color: #b91c1c;
  opacity: 0.45;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-12deg);
  pointer-events: none;
}

.stamp-inner {
  text-align: center;
  font-family: 'Courier New', monospace;
  font-weight: 900;
  font-size: 0.7rem;
  line-height: 1.1;
  display: flex;
  flex-direction: column;
}

.stamp-sub {
  font-size: 0.55rem;
  border-top: 1px solid #b91c1c;
  margin-top: 2px;
  padding-top: 2px;
}

.signature-block {
  text-align: center;
  font-size: 0.82rem;
}

.signature-line {
  width: 180px;
  border-bottom: 1px dashed #1c2b1c;
  margin-bottom: 0.5rem;
}

/* Responsiveness overrides */
@media (max-width: 992px) {
  .generator-layout {
    grid-template-columns: 1fr;
  }
  
  .tracker-grid {
    grid-template-columns: 1fr;
  }

  .print-page-wrapper {
    padding: 0.5rem;
  }

  .military-call-letter {
    padding: 2rem 1.25rem;
  }
  
  .letter-lists-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .call-letter-page {
    padding: 0.25rem 0;
  }

  .tab-switcher {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 1.5rem;
  }

  .tab-btn {
    width: 100%;
    justify-content: center;
    padding: 0.85rem;
    font-size: 0.9rem;
    border: 1px solid var(--border-color);
  }

  .tab-btn.active {
    border-color: rgba(3, 194, 252, 0.4);
    background: rgba(3, 194, 252, 0.08);
  }

  .tracker-card, .faq-card {
    padding: 1.75rem 1.25rem;
  }

  .form-panel {
    padding: 1.25rem;
  }

  .stamp-and-sign {
    flex-direction: column-reverse;
    align-items: center;
    gap: 1.5rem;
    text-align: center;
  }

  .signature-block {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .page-title-section h2 {
    font-size: 1.5rem;
  }

  .share-buttons-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .military-call-letter {
    padding: 1.5rem 1rem;
    font-size: 0.85rem;
  }

  .military-call-letter::before {
    top: 6px;
    left: 6px;
    right: 6px;
    bottom: 6px;
  }

  .crest-placeholder {
    width: 55px;
    height: 55px;
  }

  .letter-title {
    font-size: 1rem;
  }

  .letter-meta-row {
    flex-direction: column;
    gap: 0.35rem;
    align-items: flex-start;
  }

  .mock-stamp {
    width: 95px;
    height: 95px;
  }
  
  .stamp-inner {
    font-size: 0.65rem;
  }

  .stamp-sub {
    font-size: 0.5rem;
  }
}

/* ────────────────────────────────────────────────────────
   PRINT SPECIFIC CSS OVERRIDES
   ──────────────────────────────────────────────────────── */
@media print {
  /* Hide all dashboard/app headers, inputs, and navigation sidebars */
  body, html {
    background: #ffffff !important;
    color: #000000 !important;
    font-size: 12pt !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  /* Force layout screens to vanish */
  .no-print,
  .app-header,
  .navigation-panel,
  .trial-countdown-banner,
  .page-title-section,
  .tab-switcher,
  .form-panel,
  .mobile-backdrop,
  .hamburger-btn {
    display: none !important;
    height: 0 !important;
    width: 0 !important;
    overflow: hidden !important;
    opacity: 0 !important;
  }

  /* Reset main layouts and margins */
  .app-container {
    padding: 0 !important;
    margin: 0 !important;
    gap: 0 !important;
    max-width: 100% !important;
  }

  .main-layout {
    grid-template-columns: 1fr !important;
    gap: 0 !important;
  }

  .content-screen {
    padding: 0 !important;
    margin: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Make document isolated and take entire printed sheet */
  .print-page-wrapper {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    background: #ffffff !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    visibility: visible !important;
  }

  .military-call-letter {
    border: none !important;
    box-shadow: none !important;
    padding: 15mm 15mm !important; /* Standard print margin */
    width: 100% !important;
    max-width: 100% !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family: 'Times New Roman', Times, serif !important;
    font-size: 11pt !important;
    line-height: 1.4 !important;
    box-sizing: border-box;
    page-break-inside: avoid;
  }

  .military-call-letter::before {
    border: 1px solid #000000 !important;
  }

  .letter-title {
    font-size: 14pt !important;
    color: #000000 !important;
  }

  .letter-meta-row, .letter-subject, .recipient-details {
    color: #000000 !important;
  }

  .letter-body {
    font-size: 11pt !important;
  }

  .letter-lists-container {
    grid-template-columns: 1fr 1fr !important;
    gap: 20px !important;
  }

  .prohibited-box-paper {
    background: #ffffff !important;
    border: 1.5px solid #000000 !important;
  }

  .mock-stamp {
    border-color: #000000 !important;
    color: #000000 !important;
    opacity: 0.8 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .stamp-inner {
    border-color: #000000 !important;
  }

  .stamp-sub {
    border-top-color: #000000 !important;
  }

  .signature-line {
    border-bottom-color: #000000 !important;
  }
}
</style>
