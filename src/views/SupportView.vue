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
  try {
    votedImprovements.value = JSON.parse(localStorage.getItem('issb_voted_improvements') || '{}')
  } catch (e) {
    console.error('Failed to parse voted improvements:', e)
    votedImprovements.value = {}
    localStorage.removeItem('issb_voted_improvements')
  }

  await fetchComplaints()
  await fetchImprovements()
})

const isAdmin = computed(() => {
  return authStore.profile?.role === 'admin'
})

// Parse category and title from full title e.g. [Access Issue] My ticket -> { category: 'Access Issue', title: 'My ticket' }
const parseTitleAndCategory = (fullTitle) => {
  if (fullTitle && fullTitle.startsWith('[') && fullTitle.includes(']')) {
    const parts = fullTitle.split(']')
    const category = parts[0].substring(1).trim()
    const title = parts.slice(1).join(']').trim()
    return { category, title }
  }
  return { category: 'Other', title: fullTitle || '' }
}

// Check if current user can manage (edit, delete, change status, reply to) the item
const canManage = (item) => {
  return isAdmin.value || (authStore.user && authStore.user.id === item.user_id)
}

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
      complaints.value = (data || []).map(c => {
        const parsed = parseTitleAndCategory(c.title)
        return {
          ...c,
          isEditing: false,
          editTitle: parsed.title,
          editCategory: parsed.category,
          editDesc: c.description,
          editStatus: c.status,
          editReply: c.admin_reply || '',
          saving: false
        }
      })
    } else {
      // Auth user sees their own complaints
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      complaints.value = (data || []).map(c => {
        const parsed = parseTitleAndCategory(c.title)
        return {
          ...c,
          isEditing: false,
          editTitle: parsed.title,
          editCategory: parsed.category,
          editDesc: c.description,
          editStatus: c.status,
          editReply: c.admin_reply || '',
          saving: false
        }
      })
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
    improvements.value = (data || []).map(imp => ({
      ...imp,
      isEditing: false,
      editTitle: imp.title,
      editDesc: imp.description,
      editStatus: imp.status || 'pending',
      editReply: imp.admin_reply || '',
      saving: false
    }))
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
      const parsed = parseTitleAndCategory(data[0].title)
      const newComp = {
        ...data[0],
        isEditing: false,
        editTitle: parsed.title,
        editCategory: parsed.category,
        editDesc: data[0].description,
        editStatus: data[0].status,
        editReply: data[0].admin_reply || '',
        saving: false
      }
      complaints.value.unshift(newComp)
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
      const newImp = {
        ...data[0],
        isEditing: false,
        editTitle: data[0].title,
        editDesc: data[0].description,
        editStatus: data[0].status || 'pending',
        editReply: data[0].admin_reply || '',
        saving: false
      }
      improvements.value.unshift(newImp)
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

// Edit actions for Complaints
const startEditComplaint = (comp) => {
  const parsed = parseTitleAndCategory(comp.title)
  comp.editTitle = parsed.title
  comp.editCategory = parsed.category
  comp.editDesc = comp.description
  comp.isEditing = true
}

const cancelEditComplaint = (comp) => {
  comp.isEditing = false
}

const saveComplaint = async (comp) => {
  if (!comp.editTitle || !comp.editDesc) return
  comp.saving = true
  try {
    const fullTitle = `[${comp.editCategory}] ${comp.editTitle}`
    const { error } = await supabase
      .from('complaints')
      .update({
        title: fullTitle,
        description: comp.editDesc
      })
      .eq('id', comp.id)
    if (error) throw error

    comp.title = fullTitle
    comp.description = comp.editDesc
    comp.isEditing = false
  } catch (err) {
    console.error('Error updating complaint:', err)
    alert('Failed to update complaint: ' + err.message)
  } finally {
    comp.saving = false
  }
}

const deleteComplaint = async (comp) => {
  if (!confirm('Are you sure you want to delete this complaint?')) return
  try {
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', comp.id)
    if (error) throw error

    complaints.value = complaints.value.filter(c => c.id !== comp.id)
  } catch (err) {
    console.error('Error deleting complaint:', err)
    alert('Failed to delete complaint: ' + err.message)
  }
}

const updateComplaintStatus = async (comp, newStatus) => {
  try {
    const { error } = await supabase
      .from('complaints')
      .update({ status: newStatus })
      .eq('id', comp.id)
    if (error) throw error
    comp.status = newStatus
    comp.editStatus = newStatus
  } catch (err) {
    console.error('Error updating complaint status:', err)
    alert('Failed to update status: ' + err.message)
  }
}

const saveComplaintReply = async (comp) => {
  try {
    const { error } = await supabase
      .from('complaints')
      .update({ admin_reply: comp.editReply })
      .eq('id', comp.id)
    if (error) throw error
    comp.admin_reply = comp.editReply
    alert('Reply updated successfully!')
  } catch (err) {
    console.error('Error saving complaint reply:', err)
    alert('Failed to save reply: ' + err.message)
  }
}

// Edit actions for Improvements
const startEditImprovement = (imp) => {
  imp.editTitle = imp.title
  imp.editDesc = imp.description
  imp.isEditing = true
}

const cancelEditImprovement = (imp) => {
  imp.isEditing = false
}

const saveImprovement = async (imp) => {
  if (!imp.editTitle || !imp.editDesc) return
  imp.saving = true
  try {
    const { error } = await supabase
      .from('improvements')
      .update({
        title: imp.editTitle,
        description: imp.editDesc
      })
      .eq('id', imp.id)
    if (error) throw error

    imp.title = imp.editTitle
    imp.description = imp.editDesc
    imp.isEditing = false
  } catch (err) {
    console.error('Error updating suggestion:', err)
    alert('Failed to update suggestion: ' + err.message)
  } finally {
    imp.saving = false
  }
}

const deleteImprovement = async (imp) => {
  if (!confirm('Are you sure you want to delete this suggestion?')) return
  try {
    const { error } = await supabase
      .from('improvements')
      .delete()
      .eq('id', imp.id)
    if (error) throw error

    improvements.value = improvements.value.filter(i => i.id !== imp.id)
  } catch (err) {
    console.error('Error deleting suggestion:', err)
    alert('Failed to delete suggestion: ' + err.message)
  }
}

const updateImprovementStatus = async (imp, newStatus) => {
  try {
    const { error } = await supabase
      .from('improvements')
      .update({ status: newStatus })
      .eq('id', imp.id)
    if (error) throw error
    imp.status = newStatus
    imp.editStatus = newStatus
  } catch (err) {
    console.error('Error updating suggestion status:', err)
    alert('Failed to update status: ' + err.message)
  }
}

const saveImprovementReply = async (imp) => {
  try {
    const { error } = await supabase
      .from('improvements')
      .update({ admin_reply: imp.editReply })
      .eq('id', imp.id)
    if (error) throw error
    imp.admin_reply = imp.editReply
    alert('Reply updated successfully!')
  } catch (err) {
    console.error('Error saving suggestion reply:', err)
    alert('Failed to save reply: ' + err.message)
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
            :class="[comp.status, { 'editing-card': comp.isEditing }]"
          >
            <!-- Edit Mode -->
            <div v-if="comp.isEditing" class="edit-form-inline">
              <div class="form-group mb-xs">
                <label class="label-mini">Category</label>
                <select v-model="comp.editCategory" class="input-mini">
                  <option value="Access Issue">Access Issue</option>
                  <option value="Simulator Bug">Simulator Bug</option>
                  <option value="Layout Lag">Layout Lag</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group mb-xs">
                <label class="label-mini">Subject</label>
                <input v-model="comp.editTitle" type="text" class="input-mini" required />
              </div>
              <div class="form-group mb-xs">
                <label class="label-mini">Description</label>
                <textarea v-model="comp.editDesc" rows="3" class="input-mini" required></textarea>
              </div>
              <div class="edit-actions mt-sm">
                <button @click="saveComplaint(comp)" class="btn btn-primary btn-xs" :disabled="comp.saving">
                  {{ comp.saving ? 'Saving...' : 'Save' }}
                </button>
                <button @click="cancelEditComplaint(comp)" class="btn btn-secondary btn-xs">Cancel</button>
              </div>
            </div>

            <!-- Read Mode -->
            <div v-else>
              <div class="card-header">
                <span class="category-badge">{{ comp.title.includes(']') ? comp.title.split(']')[0] + ']' : '[Other]' }}</span>
                <span class="status-badge" :class="comp.status">
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

            <!-- Manage section (Status update, reply, edit/delete actions) -->
            <div v-if="canManage(comp)" class="manage-section mt-sm">
              <div class="manage-row">
                <!-- Status selector -->
                <div class="status-selector-wrapper">
                  <label class="label-mini">Status:</label>
                  <select 
                    :value="comp.status" 
                    @change="updateComplaintStatus(comp, $event.target.value)" 
                    class="select-mini"
                  >
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved / Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <!-- Action Buttons -->
                <div class="action-buttons-wrapper" v-if="!comp.isEditing">
                  <button @click="startEditComplaint(comp)" class="btn-icon-text text-info">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-sm">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button @click="deleteComplaint(comp)" class="btn-icon-text text-danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-sm">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <!-- Reply / Response Box -->
              <div class="reply-editor-wrapper mt-xs">
                <label class="label-mini">Reply / Update:</label>
                <div class="reply-input-row">
                  <input 
                    v-model="comp.editReply" 
                    type="text" 
                    placeholder="Write response or updates..." 
                    class="input-mini reply-input"
                  />
                  <button @click="saveComplaintReply(comp)" class="btn btn-primary btn-xs reply-btn">
                    Update Reply
                  </button>
                </div>
              </div>
            </div>

            <!-- Reply display -->
            <div v-if="comp.admin_reply" class="reply-response-box mt-sm">
              <div class="reply-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reply-icon">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Official Reply</span>
              </div>
              <p class="reply-content">{{ comp.admin_reply }}</p>
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

          <div v-for="imp in improvements" :key="imp.id" class="improvement-card" :class="[imp.status || 'pending', { 'editing-card': imp.isEditing }]">
            <!-- Edit Mode -->
            <div v-if="imp.isEditing" class="edit-form-inline">
              <div class="form-group mb-xs">
                <label class="label-mini">Suggestion Title</label>
                <input v-model="imp.editTitle" type="text" class="input-mini" required />
              </div>
              <div class="form-group mb-xs">
                <label class="label-mini">Description</label>
                <textarea v-model="imp.editDesc" rows="4" class="input-mini" required></textarea>
              </div>
              <div class="edit-actions mt-sm">
                <button @click="saveImprovement(imp)" class="btn btn-primary btn-xs" :disabled="imp.saving">
                  {{ imp.saving ? 'Saving...' : 'Save' }}
                </button>
                <button @click="cancelEditImprovement(imp)" class="btn btn-secondary btn-xs">Cancel</button>
              </div>
            </div>

            <!-- Read Mode -->
            <div v-else>
              <div class="card-header mb-xs">
                <span class="status-badge" :class="imp.status || 'pending'">
                  {{ (imp.status || 'PENDING').toUpperCase() }}
                </span>
              </div>
              <h4 class="imp-title">{{ imp.title }}</h4>
              <p class="imp-desc">{{ imp.description }}</p>
            </div>

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

            <!-- Manage section (Status update, reply, edit/delete actions) -->
            <div v-if="canManage(imp)" class="manage-section mt-sm">
              <div class="manage-row">
                <!-- Status selector -->
                <div class="status-selector-wrapper">
                  <label class="label-mini">Status:</label>
                  <select 
                    :value="imp.status || 'pending'" 
                    @change="updateImprovementStatus(imp, $event.target.value)" 
                    class="select-mini"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed / Done</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <!-- Action Buttons -->
                <div class="action-buttons-wrapper" v-if="!imp.isEditing">
                  <button @click="startEditImprovement(imp)" class="btn-icon-text text-info">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-sm">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button @click="deleteImprovement(imp)" class="btn-icon-text text-danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon-sm">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <!-- Reply / Response Box -->
              <div class="reply-editor-wrapper mt-xs">
                <label class="label-mini">Reply / Update:</label>
                <div class="reply-input-row">
                  <input 
                    v-model="imp.editReply" 
                    type="text" 
                    placeholder="Write response or updates..." 
                    class="input-mini reply-input"
                  />
                  <button @click="saveImprovementReply(imp)" class="btn btn-primary btn-xs reply-btn">
                    Update Reply
                  </button>
                </div>
              </div>
            </div>

            <!-- Reply display -->
            <div v-if="imp.admin_reply" class="reply-response-box mt-sm">
              <div class="reply-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reply-icon">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Official Reply</span>
              </div>
              <p class="reply-content">{{ imp.admin_reply }}</p>
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

/* Inline Edit Form styles */
.edit-form-inline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
  border-radius: var(--border-radius-sm);
  border: 1px dashed var(--border-color);
}

.input-mini {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
  background: var(--bg-panel-solid);
  color: var(--text-primary);
  font-family: inherit;
  transition: border-color var(--transition-smooth);
}

.input-mini:focus {
  outline: none;
  border-color: var(--accent-cyan);
}

.select-mini {
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.82rem;
  background: var(--bg-panel-solid);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
}

.select-mini:focus {
  border-color: var(--accent-cyan);
}

.label-mini {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.2rem;
  display: block;
}

.mb-xs {
  margin-bottom: 0.5rem;
}

.mt-xs {
  margin-top: 0.5rem;
}

.mt-sm {
  margin-top: 0.85rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-xs {
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: var(--border-radius-sm);
}

/* Manage Area styles */
.manage-section {
  border-top: 1px dashed var(--border-color);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.manage-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.status-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-selector-wrapper .label-mini {
  margin-bottom: 0;
}

.action-buttons-wrapper {
  display: flex;
  gap: 0.75rem;
}

.btn-icon-text {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  font-weight: 600;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  transition: background var(--transition-smooth);
}

.btn-icon-text:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn-icon-sm {
  width: 14px;
  height: 14px;
}

.text-info {
  color: var(--accent-cyan);
}

.text-danger {
  color: var(--accent-red);
}

/* Reply Editor styles */
.reply-editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reply-input-row {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

.reply-input {
  flex: 1;
}

.reply-btn {
  white-space: nowrap;
}

/* Official Reply Box display */
.reply-response-box {
  background: rgba(3, 194, 252, 0.04);
  border: 1px solid rgba(3, 194, 252, 0.15);
  border-radius: var(--border-radius-sm);
  padding: 0.85rem 1rem;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent-cyan);
  margin-bottom: 0.35rem;
}

.reply-icon {
  width: 14px;
  height: 14px;
}

.reply-content {
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--text-primary);
  margin: 0;
}

/* Status indicator borders */
.complaint-card.rejected,
.improvement-card.rejected {
  border-left: 3px solid var(--accent-red);
}

.complaint-card.resolved,
.complaint-card.completed,
.improvement-card.completed {
  border-left: 3px solid var(--accent-green);
}

.complaint-card.pending,
.improvement-card.pending {
  border-left: 3px solid var(--accent-gold);
}

/* Status badge styling improvements */
.status-badge.completed {
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
</style>
