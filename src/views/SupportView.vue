<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// State
const activeTab = ref('complaints') // 'complaints' | 'improvements'
const complaints = ref([])
const improvements = ref([])
const loading = ref(false)

// Complaint Form fields
const compTitle = ref('')
const compCategory = ref('Access Issue')
const compDesc = ref('')
const compSubmitting = ref(false)
const compSuccessMsg = ref('')

// Improvement Form fields
const impTitle = ref('')
const impDesc = ref('')
const impSubmitting = ref(false)
const impSuccessMsg = ref('')

// Local storage tracking for upvotes
const votedImprovements = ref({}) // { improvement_id: 'up' | 'down' }

onMounted(async () => {
  // Load local storage states
  votedImprovements.value = JSON.parse(localStorage.getItem('issb_voted_improvements') || '{}')

  await fetchComplaints()
  await fetchImprovements()
})

const isAdmin = computed(() => {
  return authStore.profile?.role === 'admin'
})

// Fetch Complaints
const fetchComplaints = async () => {
  loading.value = true
  try {
    if (isAdmin.value) {
      // Admin sees all complaints
      const { data, error } = await supabase
        .from('complaints')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      complaints.value = data || []
    } else {
      // Auth user sees their own complaints
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      complaints.value = data || []
    }
  } catch (err) {
    console.error('Error fetching complaints:', err)
  } finally {
    loading.value = false
  }
}

// Fetch Improvements
const fetchImprovements = async () => {
  try {
    const { data, error } = await supabase
      .from('improvements')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
    if (error) throw error
    improvements.value = data || []
  } catch (err) {
    console.error('Error fetching improvements:', err)
  }
}

// Submit Complaint
const submitComplaint = async () => {
  if (!compTitle.value || !compDesc.value) return
  compSubmitting.value = true
  compSuccessMsg.value = ''

  try {
    const payload = {
      title: `[${compCategory.value}] ${compTitle.value}`,
      description: compDesc.value,
      user_id: authStore.user.id,
      email: authStore.user.email,
      whatsapp: authStore.profile?.whatsapp || null,
      status: 'pending',
    }

    const { data, error } = await supabase.from('complaints').insert(payload).select()

    if (error) throw error

    if (data && data[0]) {
      complaints.value.unshift(data[0])
    }

    compTitle.value = ''
    compDesc.value = ''
    compSuccessMsg.value =
      'Complaint submitted privately to the admin panel. We will investigate shortly.'
  } catch (err) {
    console.error('Error submitting complaint:', err)
  } finally {
    compSubmitting.value = false
  }
}

// Submit Improvement
const submitImprovement = async () => {
  if (!impTitle.value || !impDesc.value) return
  impSubmitting.value = true
  impSuccessMsg.value = ''

  try {
    const payload = {
      title: impTitle.value,
      description: impDesc.value,
      user_id: authStore.user.id,
      suggested_by: authStore.profile?.full_name || authStore.user.email,
    }

    const { data, error } = await supabase.from('improvements').insert(payload).select()

    if (error) throw error

    if (data && data[0]) {
      improvements.value.unshift(data[0])
    }

    impTitle.value = ''
    impDesc.value = ''
    impSuccessMsg.value = 'Suggestion posted successfully! All users can now view and vote on this.'
  } catch (err) {
    console.error('Error submitting improvement:', err)
  } finally {
    impSubmitting.value = false
  }
}

// Toggle Complaint Status (Admin Only)
const toggleComplaintStatus = async (complaint) => {
  if (!isAdmin.value) return
  const nextStatus = complaint.status === 'pending' ? 'resolved' : 'pending'
  try {
    const { error } = await supabase
      .from('complaints')
      .update({ status: nextStatus })
      .eq('id', complaint.id)

    if (error) throw error
    complaint.status = nextStatus
  } catch (err) {
    console.error('Error updating status:', err)
  }
}

// Handle Vote Action
const handleVote = async (improvement, voteType) => {
  const currentVote = votedImprovements.value[improvement.id]
  let upvoteDiff = 0
  let downvoteDiff = 0

  if (currentVote === voteType) {
    // Cancel vote
    delete votedImprovements.value[improvement.id]
    if (voteType === 'up') upvoteDiff = -1
    else downvoteDiff = -1
  } else {
    // If switching vote
    if (currentVote === 'up') {
      upvoteDiff = -1
      downvoteDiff = 1
    } else if (currentVote === 'down') {
      upvoteDiff = 1
      downvoteDiff = -1
    } else {
      // New vote
      if (voteType === 'up') upvoteDiff = 1
      else downvoteDiff = 1
    }
    votedImprovements.value[improvement.id] = voteType
  }

  // Update locally
  localStorage.setItem('issb_voted_improvements', JSON.stringify(votedImprovements.value))
  improvement.upvotes = Math.max(0, improvement.upvotes + upvoteDiff)
  improvement.downvotes = Math.max(0, improvement.downvotes + downvoteDiff)

  // Update Supabase
  try {
    const { error } = await supabase
      .from('improvements')
      .update({
        upvotes: improvement.upvotes,
        downvotes: improvement.downvotes,
      })
      .eq('id', improvement.id)
    if (error) throw error
  } catch (err) {
    console.error('Error voting:', err)
  }
}

// Compute Voting Percentage
const getVotePercentage = (upvotes, downvotes) => {
  const total = upvotes + downvotes
  if (total === 0) return { up: 50, down: 50 }
  const upPercent = Math.round((upvotes / total) * 100)
  return {
    up: upPercent,
    down: 100 - upPercent,
  }
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="support-wrapper">
    <!-- Tab Controls Bar -->
    <nav class="tab-navbar glass-card">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'complaints' }"
        @click="activeTab = 'complaints'"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="tab-icon"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Complaints Board (Private)</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'improvements' }"
        @click="activeTab = 'improvements'"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="tab-icon"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Feature Improvements (Public)</span>
      </button>
    </nav>

    <!-- Complaints Tab Screen -->
    <div v-if="activeTab === 'complaints'" class="tab-grid">
      <!-- Left Form column -->
      <div class="form-column glass-card">
        <h3>Submit a Support Complaint</h3>
        <p class="subtitle">
          Report portal bugs, payment code access delays, or outline issues here. Only you and
          admins can view these.
        </p>

        <form @submit.prevent="submitComplaint" class="support-form">
          <div class="form-group">
            <label>Category</label>
            <select v-model="compCategory">
              <option value="Access Issue">Access Issue / Pay Activation</option>
              <option value="Simulator Bug">Simulator Bug / Timer Glitch</option>
              <option value="Layout Lag">Layout Lag / Scrolling Bug</option>
              <option value="Other">Other Issues</option>
            </select>
          </div>

          <div class="form-group">
            <label>Brief Subject</label>
            <input
              v-model="compTitle"
              type="text"
              placeholder="e.g. Cannot view Day 4 PDFs"
              required
            />
          </div>

          <div class="form-group">
            <label>Explain Complaint Details</label>
            <textarea
              v-model="compDesc"
              rows="5"
              placeholder="Explain the issue step-by-step so our admin can resolve it."
              required
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="compSubmitting">
            <span>{{ compSubmitting ? 'Submitting...' : 'Submit Complaint' }}</span>
          </button>

          <p v-if="compSuccessMsg" class="success-alert">{{ compSuccessMsg }}</p>
        </form>
      </div>

      <!-- Right History/Admin view column -->
      <div class="history-column glass-card">
        <h3>{{ isAdmin ? 'Admin Complaints Control Room' : 'Your Complaint History' }}</h3>
        <p class="subtitle">
          {{
            isAdmin
              ? 'Manage all user complaints, resolve tickets, and change status.'
              : 'Follow resolution updates from the admin team below.'
          }}
        </p>

        <div v-if="loading" class="flex-center py-5">
          <span class="loading-spinner"></span>
        </div>

        <div v-else class="complaints-list">
          <div v-if="complaints.length === 0" class="empty-state">
            <p>No complaints submitted yet.</p>
          </div>

          <div
            v-for="comp in complaints"
            :key="comp.id"
            class="complaint-card"
            :class="comp.status"
          >
            <div class="card-header">
              <span class="category-badge">{{ comp.title.split(']')[0] + ']' }}</span>
              <span
                class="status-badge"
                :class="comp.status"
                @click="toggleComplaintStatus(comp)"
                :title="isAdmin ? 'Click to toggle status' : ''"
              >
                {{ comp.status.toUpperCase() }}
              </span>
            </div>
            <h4 class="card-title">
              {{
                comp.title.includes(']')
                  ? comp.title.split(']').slice(1).join(']').trim()
                  : comp.title
              }}
            </h4>
            <p class="card-desc">{{ comp.description }}</p>

            <div class="card-footer">
              <span class="date">{{ formatDate(comp.created_at) }}</span>
              <span class="user-info" v-if="isAdmin && comp.profiles">
                By: {{ comp.profiles.full_name }} ({{ comp.profiles.email }})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Improvements Tab Screen -->
    <div v-if="activeTab === 'improvements'" class="tab-grid">
      <!-- Left Form Column -->
      <div class="form-column glass-card">
        <h3>Request an Improvement</h3>
        <p class="subtitle">
          Have an idea to make this portal better? Suggest feature modules, training simulators, or
          resources. All users can view and vote.
        </p>

        <form @submit.prevent="submitImprovement" class="support-form">
          <div class="form-group">
            <label>Feature Title</label>
            <input
              v-model="impTitle"
              type="text"
              placeholder="e.g. Add general knowledge flashcards"
              required
            />
          </div>

          <div class="form-group">
            <label>Describe Your Suggestion</label>
            <textarea
              v-model="impDesc"
              rows="6"
              placeholder="Explain what this feature is and how it will help ISSB candidates."
              required
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="impSubmitting">
            <span>{{ impSubmitting ? 'Posting Idea...' : 'Submit Suggestion' }}</span>
          </button>

          <p v-if="impSuccessMsg" class="success-alert">{{ impSuccessMsg }}</p>
        </form>
      </div>

      <!-- Right Public suggestions list -->
      <div class="history-column glass-card">
        <h3>Feature Request Board</h3>
        <p class="subtitle">
          Vote on features you want to see. High upvote requests get prioritized by our team.
        </p>

        <div class="improvements-list">
          <div v-if="improvements.length === 0" class="empty-state">
            <p>No suggestions have been posted yet. Be the first to suggest an improvement!</p>
          </div>

          <div v-for="imp in improvements" :key="imp.id" class="improvement-card">
            <h4 class="imp-title">{{ imp.title }}</h4>
            <p class="imp-desc">{{ imp.description }}</p>

            <!-- Upvote / Downvote Visual Percentage Bar -->
            <div class="voting-analytics">
              <div class="voting-bar">
                <div
                  class="bar-up"
                  :style="{ width: getVotePercentage(imp.upvotes, imp.downvotes).up + '%' }"
                ></div>
                <div
                  class="bar-down"
                  :style="{ width: getVotePercentage(imp.upvotes, imp.downvotes).down + '%' }"
                ></div>
              </div>
              <div class="voting-labels">
                <span class="label-up"
                  >{{ getVotePercentage(imp.upvotes, imp.downvotes).up }}% Upvoted</span
                >
                <span class="label-down"
                  >{{ getVotePercentage(imp.upvotes, imp.downvotes).down }}% Downvoted</span
                >
              </div>
            </div>

            <!-- Vote Actions -->
            <div class="imp-card-footer">
              <div class="vote-buttons">
                <!-- Upvote -->
                <button
                  class="btn btn-vote-up"
                  :class="{ active: votedImprovements[imp.id] === 'up' }"
                  @click="handleVote(imp, 'up')"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    class="vote-icon"
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>Upvote ({{ imp.upvotes }})</span>
                </button>

                <!-- Downvote -->
                <button
                  class="btn btn-vote-down"
                  :class="{ active: votedImprovements[imp.id] === 'down' }"
                  @click="handleVote(imp, 'down')"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    class="vote-icon"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <span>Downvote ({{ imp.downvotes }})</span>
                </button>
              </div>

              <div class="author-details">
                <span class="author">By: {{ imp.suggested_by }}</span>
                <span class="bullet">•</span>
                <span class="date">{{ formatDate(imp.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.support-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-block-end: 2rem;
}

.tab-navbar {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.85rem 1rem;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-smooth);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid transparent;
  background: transparent;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(3, 194, 252, 0.08);
  color: var(--accent-cyan);
  border: 1px solid rgba(3, 194, 252, 0.25);
}

.tab-icon {
  width: 18px;
  height: 18px;
}

.tab-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.form-column,
.history-column {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h3 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  margin-top: -0.75rem;
}

.support-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
.form-group select,
.form-group textarea {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.95rem;
  background: var(--bg-panel-solid);
  color: var(--text-primary);
  transition: all var(--transition-smooth);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-cyan);
  background: #ffffff;
}

.btn-block {
  width: 100%;
  padding: 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  justify-content: center;
}

.success-alert {
  background: rgba(34, 197, 94, 0.08);
  color: var(--accent-green);
  border: 1px solid rgba(34, 197, 94, 0.2);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.9rem;
  margin: 0;
}

/* Complaints List */
.complaints-list,
.improvements-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-muted);
}

.complaint-card {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: border-color var(--transition-smooth);
}

.complaint-card.resolved {
  border-left: 3px solid var(--accent-green);
}

.complaint-card.pending {
  border-left: 3px solid var(--accent-gold);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-cyan);
  background: rgba(3, 194, 252, 0.08);
  padding: 0.2rem 0.5rem;
  border-radius: var(--border-radius-sm);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: var(--accent-gold);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-badge.resolved {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-badge.pending:hover,
.status-badge.resolved:hover {
  cursor: pointer;
  opacity: 0.9;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.card-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: var(--text-muted);
  border-top: 1px solid rgba(0, 0, 0, 0.03);
  padding-top: 0.5rem;
}

/* Improvements Card Styles */
.improvement-card {
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.imp-title {
  font-size: 1.15rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.imp-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* Voting Progress Bar */
.voting-analytics {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.voting-bar {
  display: flex;
  height: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 999px;
  overflow: hidden;
}

.bar-up {
  height: 100%;
  background: var(--accent-cyan);
  transition: width 0.3s ease;
}

.bar-down {
  height: 100%;
  background: var(--accent-red);
  transition: width 0.3s ease;
}

.voting-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 500;
}

.label-up {
  color: var(--accent-cyan);
}

.label-down {
  color: var(--accent-red);
}

.imp-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.03);
  padding-top: 0.75rem;
}

.vote-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-vote-up,
.btn-vote-down {
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--bg-panel-solid);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: all var(--transition-smooth);
  cursor: pointer;
}

.vote-icon {
  width: 14px;
  height: 14px;
}

.btn-vote-up:hover {
  background: rgba(3, 194, 252, 0.05);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.btn-vote-up.active {
  background: rgba(3, 194, 252, 0.1);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
  box-shadow: 0 0 10px rgba(3, 194, 252, 0.1);
}

.btn-vote-down:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: var(--accent-red);
  color: var(--accent-red);
}

.btn-vote-down.active {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--accent-red);
  color: var(--accent-red);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
}

.author-details {
  display: flex;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 242, 254, 0.1);
  border-top-color: var(--accent-cyan);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 992px) {
  .tab-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
