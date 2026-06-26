<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'

const profiles = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const searchFilter = ref('')
const branchFilter = ref('all')
const activeStatusTab = ref('all')

// Dialog / Action States
const showImageModal = ref(false)
const modalImageUrl = ref('')

const showRejectModal = ref(false)
const selectedProfileId = ref(null)
const rejectionReasonInput = ref('')
const rejectType = ref('course') // 'course' or 'ai'

const detailsAiStatus = ref('unpaid')
const detailsAiApprovedUntil = ref('')
const detailsAiRejectionReason = ref('')

const fetchProfiles = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    profiles.value = data
  } catch (error) {
    console.error('Error fetching profiles:', error)
    errorMessage.value = 'Failed to fetch candidate profiles. Ensure you have admin privileges.'
  } finally {
    isLoading.value = false
  }
}

// Custom Approval Modal State
const showApproveModal = ref(false)
const approveCourseAmount = ref(1499)
const approveReferralCommission = ref(500)
const isEditMode = ref(false)

const openApproveModal = (candidate, isEdit = false) => {
  selectedProfileId.value = candidate.id
  isEditMode.value = isEdit
  if (isEdit) {
    approveCourseAmount.value = candidate.course_amount || 0
    approveReferralCommission.value = candidate.referral_commission || 0
  } else {
    approveCourseAmount.value = settings.value.course_price || 1499
    approveReferralCommission.value = settings.value.referral_bonus || 500
  }
  showApproveModal.value = true
}

const closeApproveModal = () => {
  showApproveModal.value = false
  selectedProfileId.value = null
  isEditMode.value = false
}

const confirmApproval = async () => {
  if (!selectedProfileId.value) return
  isLoading.value = true
  try {
    const updateData = {
      course_amount: approveCourseAmount.value,
      referral_commission: approveReferralCommission.value
    }

    if (!isEditMode.value) {
      updateData.status = 'approved'
      updateData.rejection_reason = null
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', selectedProfileId.value)

    if (error) throw error

    // Update local state
    const index = profiles.value.findIndex((p) => p.id === selectedProfileId.value)
    if (index !== -1) {
      if (!isEditMode.value) {
        profiles.value[index].status = 'approved'
        profiles.value[index].rejection_reason = null
      }
      profiles.value[index].course_amount = approveCourseAmount.value
      profiles.value[index].referral_commission = approveReferralCommission.value
    }
    closeApproveModal()
  } catch (e) {
    console.error('Operation failed:', e)
    alert('Failed to update candidate details: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

// Details Modal State & Actions
const showDetailsModal = ref(false)
const detailsProfile = ref(null)
const detailsCourseAmount = ref(1499)
const detailsReferralCommission = ref(500)
const detailsCustomReferralBonus = ref(null)

const openDetailsModal = (candidate) => {
  detailsProfile.value = candidate
  detailsCourseAmount.value = candidate.course_amount || 0
  detailsReferralCommission.value = candidate.referral_commission || 0
  detailsCustomReferralBonus.value = candidate.custom_referral_bonus !== null && candidate.custom_referral_bonus !== undefined
    ? candidate.custom_referral_bonus
    : ''
  detailsAiStatus.value = candidate.ai_status || 'unpaid'
  detailsAiApprovedUntil.value = candidate.ai_approved_until
    ? (() => {
        const d = new Date(candidate.ai_approved_until)
        const tzoffset = d.getTimezoneOffset() * 60000
        return new Date(d.getTime() - tzoffset).toISOString().substring(0, 16)
      })()
    : ''
  detailsAiRejectionReason.value = candidate.ai_rejection_reason || ''
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  detailsProfile.value = null
  detailsAiStatus.value = 'unpaid'
  detailsAiApprovedUntil.value = ''
  detailsAiRejectionReason.value = ''
}

const saveDetailsChanges = async () => {
  if (!detailsProfile.value) return
  isLoading.value = true
  try {
    const customBonus = detailsCustomReferralBonus.value === '' || detailsCustomReferralBonus.value === null
      ? null
      : Number(detailsCustomReferralBonus.value)

    let aiApprovedUntilVal = null
    if (detailsAiApprovedUntil.value) {
      try {
        aiApprovedUntilVal = new Date(detailsAiApprovedUntil.value).toISOString()
      } catch (e) {
        console.error('Invalid date format:', e)
      }
    }

    const updateFields = {
      course_amount: detailsCourseAmount.value,
      referral_commission: detailsReferralCommission.value,
      custom_referral_bonus: customBonus,
      ai_status: detailsAiStatus.value,
      ai_approved_until: aiApprovedUntilVal,
      ai_rejection_reason: detailsAiStatus.value === 'rejected' ? detailsAiRejectionReason.value.trim() : null
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', detailsProfile.value.id)

    if (error) throw error

    // Update local state
    const index = profiles.value.findIndex((p) => p.id === detailsProfile.value.id)
    if (index !== -1) {
      profiles.value[index].course_amount = detailsCourseAmount.value
      profiles.value[index].referral_commission = detailsReferralCommission.value
      profiles.value[index].custom_referral_bonus = customBonus
      profiles.value[index].ai_status = detailsAiStatus.value
      profiles.value[index].ai_approved_until = aiApprovedUntilVal
      profiles.value[index].ai_rejection_reason = updateFields.ai_rejection_reason
    }
    closeDetailsModal()
  } catch (e) {
    console.error('Failed to update candidate details:', e)
    alert('Failed to save details: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

const handleSoftDelete = async (profileId) => {
  if (!confirm('Are you sure you want to soft delete this candidate? They will lose access to the portal but can be restored from the Trash tab.')) return

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', profileId)

    if (error) throw error

    const index = profiles.value.findIndex(p => p.id === profileId)
    if (index !== -1) {
      profiles.value[index].deleted_at = new Date().toISOString()
    }
  } catch (e) {
    console.error('Soft delete failed:', e)
    alert('Failed to soft delete: ' + e.message)
  }
}

const handleRestore = async (profileId) => {
  if (!confirm('Are you sure you want to restore this candidate? They will regain access to their portal.')) return

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: null })
      .eq('id', profileId)

    if (error) throw error

    const index = profiles.value.findIndex(p => p.id === profileId)
    if (index !== -1) {
      profiles.value[index].deleted_at = null
    }
  } catch (e) {
    console.error('Restore failed:', e)
    alert('Failed to restore candidate: ' + e.message)
  }
}

const handlePermanentDelete = async (profileId) => {
  if (!confirm('WARNING: Are you sure you want to PERMANENTLY delete this candidate? This will purge all their profile information and user accounts from auth database. This cannot be undone.')) return

  try {
    // Call the security definer Postgres function RPC
    const { error } = await supabase.rpc('delete_auth_user', { target_user_id: profileId })

    if (error) throw error

    // Remove from local profiles state
    profiles.value = profiles.value.filter(p => p.id !== profileId)
    alert('Candidate permanently deleted successfully.')
  } catch (e) {
    console.error('Permanent delete failed:', e)
    alert('Failed to delete permanently: ' + e.message)
  }
}

const getReferralStats = (candidateId) => {
  const refs = profiles.value.filter(p => p.referred_by === candidateId && p.deleted_at === null)
  const approvedRefs = refs.filter(p => p.status === 'approved')
  const earnings = approvedRefs.reduce((sum, r) => sum + Number(r.referral_commission || 0), 0)
  return {
    totalCount: refs.length,
    approvedCount: approvedRefs.length,
    earnings
  }
}

const getReferrerEmail = (referredById) => {
  if (!referredById) return ''
  const refProfile = profiles.value.find(p => p.id === referredById)
  return refProfile ? refProfile.email : 'Unknown Referrer'
}

const openRejectModal = (profileId, type = 'course') => {
  selectedProfileId.value = profileId
  rejectType.value = type
  rejectionReasonInput.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  selectedProfileId.value = null
  rejectionReasonInput.value = ''
}

const handleReject = async () => {
  if (!rejectionReasonInput.value.trim()) {
    alert('Please enter a rejection reason.')
    return
  }

  try {
    const updateFields = rejectType.value === 'ai'
      ? { ai_status: 'rejected', ai_rejection_reason: rejectionReasonInput.value.trim() }
      : { status: 'rejected', rejection_reason: rejectionReasonInput.value.trim() }

    const { error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', selectedProfileId.value)

    if (error) throw error

    // Update local state
    const index = profiles.value.findIndex((p) => p.id === selectedProfileId.value)
    if (index !== -1) {
      if (rejectType.value === 'ai') {
        profiles.value[index].ai_status = 'rejected'
        profiles.value[index].ai_rejection_reason = rejectionReasonInput.value.trim()
      } else {
        profiles.value[index].status = 'rejected'
        profiles.value[index].rejection_reason = rejectionReasonInput.value.trim()
      }
    }

    closeRejectModal()
  } catch (e) {
    console.error('Rejection failed:', e)
    alert('Failed to reject: ' + e.message)
  }
}

const handleAiApprove = async (candidate) => {
  if (!confirm(`Are you sure you want to approve AI Image Evaluation access for ${candidate.full_name || candidate.email} for 1 month?`)) return
  isLoading.value = true
  try {
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
    
    const { error } = await supabase
      .from('profiles')
      .update({
        ai_status: 'approved',
        ai_approved_until: oneMonthFromNow.toISOString(),
        ai_rejection_reason: null
      })
      .eq('id', candidate.id)

    if (error) throw error

    // Update local state
    const index = profiles.value.findIndex((p) => p.id === candidate.id)
    if (index !== -1) {
      profiles.value[index].ai_status = 'approved'
      profiles.value[index].ai_approved_until = oneMonthFromNow.toISOString()
      profiles.value[index].ai_rejection_reason = null
    }
    
    alert('AI Access approved successfully for 1 month.')
  } catch (e) {
    console.error('AI Approval failed:', e)
    alert('Failed to approve AI Access: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

const openImageModal = (url) => {
  modalImageUrl.value = url
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  modalImageUrl.value = ''
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Filtering computed profiles
const filteredProfiles = computed(() => {
  return profiles.value.filter((p) => {
    // 1. Search Query Match
    const query = searchFilter.value.toLowerCase().trim()
    const matchesQuery =
      !query ||
      p.full_name?.toLowerCase().includes(query) ||
      p.email?.toLowerCase().includes(query) ||
      p.whatsapp?.includes(query)

    // 2. Branch Match
    const matchesBranch = branchFilter.value === 'all' || p.target_branch === branchFilter.value

    // 3. Status/Trash Match
    let matchesStatus = false
    if (activeStatusTab.value === 'trash') {
      matchesStatus = p.deleted_at !== null
    } else if (p.deleted_at === null) {
      if (activeStatusTab.value === 'all') {
        matchesStatus = true
      } else if (activeStatusTab.value === 'ai_pending') {
        matchesStatus = p.ai_status === 'pending'
      } else if (activeStatusTab.value === 'ai_approved') {
        matchesStatus = p.ai_status === 'approved'
      } else if (activeStatusTab.value === 'ai_rejected') {
        matchesStatus = p.ai_status === 'rejected'
      } else {
        matchesStatus = p.status === activeStatusTab.value
      }
    }

    return matchesQuery && matchesBranch && matchesStatus
  })
})

// Settings Panel State
const settings = ref({
  course_price: 1499,
  referral_bonus: 500,
  max_discount_pct: 90,
  max_discount_amount: 1400,
})
const isSavingSettings = ref(false)
const settingsSuccessMessage = ref('')

const fetchSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()
    if (error) throw error
    if (data) {
      settings.value = data
    }
  } catch (e) {
    console.error('Error fetching settings:', e)
  }
}

const saveSettings = async () => {
  isSavingSettings.value = true
  settingsSuccessMessage.value = ''
  try {
    const { error } = await supabase
      .from('app_settings')
      .update({
        course_price: settings.value.course_price,
        referral_bonus: settings.value.referral_bonus,
        max_discount_pct: settings.value.max_discount_pct,
        max_discount_amount: settings.value.max_discount_amount,
      })
      .eq('id', 1)

    if (error) throw error
    settingsSuccessMessage.value = 'Settings updated successfully!'
    setTimeout(() => {
      settingsSuccessMessage.value = ''
    }, 3000)
  } catch (e) {
    console.error('Error saving settings:', e)
    alert('Failed to save settings: ' + e.message)
  } finally {
    isSavingSettings.value = false
  }
}

onMounted(() => {
  fetchProfiles()
  fetchSettings()
})
</script>

<template>
  <div class="admin-users-wrapper">
    <div class="admin-header glass-card">
      <div class="header-title-area">
        <span class="badge badge-gold">System Administrator</span>
        <h2>Candidate Verification Pool</h2>
        <p>
          Manage, review, and approve candidate payment screenshot requests to grant site-wide
          portal access.
        </p>
      </div>
      <button @click="fetchProfiles" class="btn btn-secondary flex-center gap-xs" :disabled="isLoading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"
          :class="{ spin: isLoading }">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
        </svg>
        <span>Refresh Records</span>
      </button>
    </div>

    <!-- Error state -->
    <div v-if="errorMessage" class="error-banner glass-card">
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Filters panel -->
    <div v-if="activeStatusTab !== 'settings'" class="filters-panel glass-card">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input v-model="searchFilter" type="text" placeholder="Search by candidate name, email, or whatsapp..."
          class="form-input search-input" />
      </div>

      <div class="branch-filter">
        <select v-model="branchFilter" class="form-select">
          <option value="all">All Forces Branches</option>
          <option value="army">Pakistan Army</option>
          <option value="navy">Pakistan Navy</option>
          <option value="airforce">Pakistan Air Force</option>
        </select>
      </div>
    </div>

    <!-- Status Tabs -->
    <div class="tabs-container" style="flex-wrap: wrap; gap: 0.5rem;">
      <button @click="activeStatusTab = 'all'" class="tab-btn" :class="{ active: activeStatusTab === 'all' }">
        All Candidates ({{profiles.filter((p) => p.deleted_at === null).length}})
      </button>
      <button @click="activeStatusTab = 'pending'" class="tab-btn" :class="{ active: activeStatusTab === 'pending' }">
        Pending Course ({{profiles.filter((p) => p.status === 'pending' && p.deleted_at === null).length}})
      </button>
      <button @click="activeStatusTab = 'approved'" class="tab-btn" :class="{ active: activeStatusTab === 'approved' }">
        Approved Course ({{profiles.filter((p) => p.status === 'approved' && p.deleted_at === null).length}})
      </button>
      <button @click="activeStatusTab = 'rejected'" class="tab-btn" :class="{ active: activeStatusTab === 'rejected' }">
        Rejected Course ({{profiles.filter((p) => p.status === 'rejected' && p.deleted_at === null).length}})
      </button>
      <button @click="activeStatusTab = 'ai_pending'" class="tab-btn" :class="{ active: activeStatusTab === 'ai_pending' }" style="border-color: var(--accent-cyan);">
        AI Pending ({{profiles.filter((p) => p.ai_status === 'pending' && p.deleted_at === null).length}})
      </button>
      <button @click="activeStatusTab = 'ai_approved'" class="tab-btn" :class="{ active: activeStatusTab === 'ai_approved' }">
        AI Approved ({{profiles.filter((p) => p.ai_status === 'approved' && p.deleted_at === null).length}})
      </button>
      <button @click="activeStatusTab = 'ai_rejected'" class="tab-btn" :class="{ active: activeStatusTab === 'ai_rejected' }">
        AI Rejected ({{profiles.filter((p) => p.ai_status === 'rejected' && p.deleted_at === null).length}})
      </button>
      <button @click="activeStatusTab = 'trash'" class="tab-btn tab-btn-trash"
        :class="{ active: activeStatusTab === 'trash' }">
        Trash ({{profiles.filter((p) => p.deleted_at !== null).length}})
      </button>
      <button @click="activeStatusTab = 'settings'" class="tab-btn" :class="{ active: activeStatusTab === 'settings' }"
        style="border-color: var(--accent-gold); color: var(--accent-gold);">
        Portal Settings ⚙️
      </button>
    </div>

    <!-- Candidates Table or Settings Form -->
    <div v-if="activeStatusTab !== 'settings'" class="table-container glass-card">
      <div v-if="isLoading" class="table-loading flex-center">
        <span class="spinner"></span>
        <span>Retrieving candidate pool records...</span>
      </div>

      <div v-else-if="filteredProfiles.length === 0" class="table-empty flex-center">
        <p>No candidates match your search filters.</p>
      </div>

      <table v-else class="candidates-table">
        <thead>
          <tr>
            <th>Candidate Info</th>
            <th>Target Branch</th>
            <th>WhatsApp</th>
            <th>Registration Date</th>
            <th>Course Payment</th>
            <th>Course Status</th>
            <th>AI Payment</th>
            <th>AI Status</th>
            <th>Referrals</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidate in filteredProfiles" :key="candidate.id">
            <td class="candidate-info-cell">
              <div class="name">{{ candidate.full_name || 'No Name Provided' }}</div>
              <div class="email">{{ candidate.email }}</div>
              <div v-if="candidate.referred_by" class="referrer-email"
                style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 0.2rem;">
                Ref by: {{ getReferrerEmail(candidate.referred_by) }}
              </div>
              <div v-if="candidate.role === 'admin'" class="role-indicator text-glow-gold">
                System Admin
              </div>
            </td>

            <td data-label="Branch">
              <span class="branch-label text-capitalize">{{ candidate.target_branch }}</span>
            </td>

            <td data-label="WhatsApp">
              <span>{{ candidate.whatsapp || 'N/A' }}</span>
            </td>

            <td data-label="Registered">
              <span class="date">{{ formatDate(candidate.created_at) }}</span>
            </td>

            <td data-label="Course Payment">
              <div v-if="candidate.payment_screenshot_url" class="screenshot-previews-list"
                style="display: flex; flex-direction: column; gap: 0.35rem;">
                <button v-for="(url, idx) in candidate.payment_screenshot_url.split(',')" :key="idx"
                  @click="openImageModal(url)" class="btn-view-receipt"
                  style="padding: 0.25rem 0.5rem; font-size: 0.78rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="receipt-icon"
                    style="width: 12px; height: 12px;">
                    <path d="M2 3h20v18H2zM6 8h12M6 12h12M6 16h6" />
                  </svg>
                  <span>Preview {{ candidate.payment_screenshot_url.split(',').length > 1 ? idx + 1 : '' }}</span>
                </button>
              </div>
              <span v-else class="text-muted text-italic">No Upload</span>
            </td>

            <td data-label="Course Status">
              <span class="badge" :class="{
                'badge-cyan': candidate.status === 'pending',
                'badge-green': candidate.status === 'approved',
                'badge-red': candidate.status === 'rejected',
              }">
                {{ candidate.status }}
              </span>
              <div v-if="candidate.status === 'approved'" style="font-size: 0.8rem; margin-top: 0.25rem; font-weight: 600; color: var(--text-secondary);">
                PKR {{ candidate.course_amount || 0 }}
              </div>
              <div v-if="candidate.status === 'rejected'" class="rejection-reason-sub">
                "{{ candidate.rejection_reason }}"
              </div>
              <div v-if="candidate.deleted_at" class="text-italic"
                style="color: #ef4444; font-size: 0.72rem; margin-top: 0.25rem;">
                Soft Deleted ({{ formatDate(candidate.deleted_at) }})
              </div>
            </td>

            <td data-label="AI Payment">
              <div v-if="candidate.ai_payment_screenshot_url" class="screenshot-previews-list"
                style="display: flex; flex-direction: column; gap: 0.35rem;">
                <button v-for="(url, idx) in candidate.ai_payment_screenshot_url.split(',')" :key="idx"
                  @click="openImageModal(url)" class="btn-view-receipt"
                  style="padding: 0.25rem 0.5rem; font-size: 0.78rem;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="receipt-icon"
                    style="width: 12px; height: 12px;">
                    <path d="M2 3h20v18H2zM6 8h12M6 12h12M6 16h6" />
                  </svg>
                  <span>Preview {{ candidate.ai_payment_screenshot_url.split(',').length > 1 ? idx + 1 : '' }}</span>
                </button>
              </div>
              <span v-else class="text-muted text-italic">No Upload</span>
            </td>

            <td data-label="AI Status">
              <span class="badge" :class="{
                'badge-cyan': candidate.ai_status === 'pending',
                'badge-green': candidate.ai_status === 'approved',
                'badge-red': candidate.ai_status === 'rejected',
                'badge-gray': !candidate.ai_status || candidate.ai_status === 'unpaid',
              }">
                {{ candidate.ai_status || 'unpaid' }}
              </span>
              <div v-if="candidate.ai_status === 'approved' && candidate.ai_approved_until" class="ai-expiry"
                style="font-size: 0.75rem; color: var(--accent-cyan); margin-top: 0.25rem; font-weight: 600;">
                Until: {{ formatDate(candidate.ai_approved_until) }}
              </div>
              <div v-if="candidate.ai_status === 'rejected'" class="rejection-reason-sub">
                "{{ candidate.ai_rejection_reason }}"
              </div>
            </td>

            <td data-label="Referrals">
              <div class="ref-count">Count: {{ getReferralStats(candidate.id).totalCount }}</div>
              <div class="ref-earnings" v-if="getReferralStats(candidate.id).earnings > 0"
                style="color: var(--accent-cyan); font-weight: 600; font-size: 0.82rem; margin-top: 0.15rem;">
                Earned: PKR {{ getReferralStats(candidate.id).earnings }}
              </div>
            </td>

            <td class="actions-cell">
              <div class="actions-group" style="flex-wrap: wrap; gap: 0.35rem;">
                <!-- If not soft-deleted (active candidate) -->
                <template v-if="!candidate.deleted_at">
                  <!-- Course Access Approval/Rejection buttons -->
                  <button v-if="candidate.status === 'pending'" @click="openApproveModal(candidate, false)"
                    class="btn-action btn-approve" title="Approve Course Access"
                    style="background: var(--accent-green); border-color: var(--accent-green);">
                    Approve Course
                  </button>
                  <button v-if="candidate.status === 'pending' && candidate.role !== 'admin'"
                    @click="openRejectModal(candidate.id, 'course')" class="btn-action btn-reject" title="Reject Course Receipt">
                    Reject Course
                  </button>

                  <!-- AI Evaluation Access Approval/Rejection buttons -->
                  <button v-if="candidate.ai_status !== 'approved'" @click="handleAiApprove(candidate)"
                    class="btn-action btn-approve" title="Approve AI Access"
                    style="background: var(--accent-cyan); border-color: var(--accent-cyan);">
                    Approve AI
                  </button>
                  <button v-if="candidate.ai_status !== 'approved' && candidate.role !== 'admin'"
                    @click="openRejectModal(candidate.id, 'ai')" class="btn-action btn-reject" title="Reject AI Receipt">
                    Reject AI
                  </button>

                  <!-- General Action buttons -->
                  <button @click="openDetailsModal(candidate)" class="btn-action btn-details"
                    title="View Details & Settings">
                    Details
                  </button>
                  <button v-if="candidate.role !== 'admin'" @click="handleSoftDelete(candidate.id)"
                    class="btn-action btn-soft-delete" title="Move to Trash">
                    Soft Delete
                  </button>
                </template>

                <!-- If soft-deleted -->
                <template v-else>
                  <button @click="handleRestore(candidate.id)" class="btn-action btn-restore"
                    title="Restore Candidate Access">
                    Restore
                  </button>
                  <button @click="handlePermanentDelete(candidate.id)" class="btn-action btn-delete-perm"
                    title="Delete Account Permanently">
                    Delete Perm
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Portal Settings Panel -->
    <div v-else class="settings-panel-container glass-card">
      <div class="settings-section-header">
        <h3>Portal Referral & Price Settings</h3>
        <p>Configure course price, referral reward, and maximum allowed discounts.</p>
      </div>

      <div v-if="settingsSuccessMessage" class="success-banner-settings">
        <span>{{ settingsSuccessMessage }}</span>
      </div>

      <form @submit.prevent="saveSettings" class="settings-form">
        <div class="form-row-settings">
          <div class="form-group-settings">
            <label for="coursePrice" class="form-label-settings">Base Course Price (PKR) *</label>
            <input v-model.number="settings.course_price" type="number" id="coursePrice" class="form-input" required
              min="0" :disabled="isSavingSettings" />
            <span class="input-hint">The base price a student sees on registration.</span>
          </div>

          <div class="form-group-settings">
            <label for="referralBonus" class="form-label-settings">Referral Bonus per Paid User (PKR) *</label>
            <input v-model.number="settings.referral_bonus" type="number" id="referralBonus" class="form-input" required
              min="0" :disabled="isSavingSettings" />
            <span class="input-hint">Deducted from referrer's price for each referred paid user.</span>
          </div>
        </div>

        <div class="form-row-settings">
          <div class="form-group-settings">
            <label for="maxDiscountPct" class="form-label-settings">Max Discount Percentage Cap (%) *</label>
            <input v-model.number="settings.max_discount_pct" type="number" id="maxDiscountPct" class="form-input"
              required min="0" max="100" :disabled="isSavingSettings" />
            <span class="input-hint">Maximum percent discount allowed (e.g. 90%).</span>
          </div>

          <div class="form-group-settings">
            <label for="maxDiscountAmount" class="form-label-settings">Max Discount Flat Cap (PKR) *</label>
            <input v-model.number="settings.max_discount_amount" type="number" id="maxDiscountAmount" class="form-input"
              required min="0" :disabled="isSavingSettings" />
            <span class="input-hint">Maximum flat deduction allowed (e.g. 1400 PKR).</span>
          </div>
        </div>

        <div class="settings-actions">
          <button type="submit" class="btn btn-primary" :disabled="isSavingSettings">
            <span v-if="isSavingSettings" class="spinner"></span>
            <span v-else>Save Settings</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Lightbox Modal for Payment Screenshot Preview -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="modal-content image-modal" @click.stop>
        <button class="modal-close" @click="closeImageModal">&times;</button>
        <h3>Payment Receipt Screenshot</h3>
        <div class="modal-image-container">
          <img :src="modalImageUrl" alt="Payment Screenshot" class="modal-image" />
        </div>
        <div class="modal-actions">
          <a :href="modalImageUrl" target="_blank" class="btn btn-secondary">Open in New Tab</a>
          <button @click="closeImageModal" class="btn btn-primary">Close Preview</button>
        </div>
      </div>
    </div>

    <!-- Modal for Specifying Rejection Reason -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeRejectModal">
      <div class="modal-content form-modal" @click.stop>
        <button class="modal-close" @click="closeRejectModal">&times;</button>
        <h3>Reject {{ rejectType === 'ai' ? 'AI Evaluation' : 'Course' }} Verification Request</h3>
        <p>
          Please provide a reason. The student will see this message and will be allowed to upload a
          valid screenshot.
        </p>

        <div class="form-group">
          <label for="rejectionReason" class="form-label">Reason for Rejection *</label>
          <textarea v-model="rejectionReasonInput" id="rejectionReason" class="form-textarea"
            :placeholder="rejectType === 'ai' ? 'e.g. Invalid AI payment receipt screenshot or incorrect amount.' : 'e.g. Transaction Reference Number missing, or payment amount is incorrect.'"
            required></textarea>
        </div>

        <div class="modal-actions">
          <button @click="closeRejectModal" class="btn btn-secondary">Cancel</button>
          <button @click="handleReject" class="btn btn-primary btn-submit-rejection">
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>

    <!-- Modal for Custom Approval / Editing -->
    <div v-if="showApproveModal" class="modal-overlay" @click="closeApproveModal">
      <div class="modal-content form-modal" @click.stop>
        <button class="modal-close" @click="closeApproveModal">&times;</button>
        <h3>{{ isEditMode ? 'Edit Candidate Payment Info' : 'Approve Candidate Access' }}</h3>
        <p>
          Configure the course price paid and the referrer's commission details for this candidate.
        </p>

        <div class="form-group">
          <label for="approveCourseAmount" class="form-label">Course Amount Paid (PKR) *</label>
          <input v-model.number="approveCourseAmount" type="number" id="approveCourseAmount" class="form-input" required
            min="0" />
        </div>

        <div class="form-group">
          <label for="approveReferralCommission" class="form-label">Referrer Commission (PKR) *</label>
          <input v-model.number="approveReferralCommission" type="number" id="approveReferralCommission"
            class="form-input" required min="0" />
        </div>

        <div class="modal-actions">
          <button @click="closeApproveModal" class="btn btn-secondary">Cancel</button>
          <button @click="confirmApproval" class="btn btn-primary">
            {{ isEditMode ? 'Save Changes' : 'Confirm & Approve' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal for Viewing Candidate Details & Custom Rate Configuration -->
    <div v-if="showDetailsModal && detailsProfile" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content form-modal" @click.stop style="max-width: 600px;">
        <button class="modal-close" @click="closeDetailsModal">&times;</button>
        <h3>Candidate Details & Settings</h3>
        <p style="margin-bottom: 0.75rem;">
          View candidate details and manage pricing snapshots and custom referral commission rates.
        </p>

        <!-- General Info Grid -->
        <div
          style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f8fafc; padding: 1rem; border-radius: var(--border-radius-md); font-size: 0.85rem; border: 1px solid var(--border-color); margin-bottom: 0.5rem;">
          <div>
            <strong style="color: var(--text-muted);">Name:</strong> {{ detailsProfile.full_name || 'N/A' }}
          </div>
          <div>
            <strong style="color: var(--text-muted);">Email:</strong> {{ detailsProfile.email }}
          </div>
          <div>
            <strong style="color: var(--text-muted);">WhatsApp:</strong> {{ detailsProfile.whatsapp || 'N/A' }}
          </div>
          <div>
            <strong style="color: var(--text-muted);">Branch:</strong> <span class="text-capitalize">{{
              detailsProfile.target_branch }}</span>
          </div>
          <div>
            <strong style="color: var(--text-muted);">Status:</strong> <span class="text-uppercase"
              style="font-weight: 700;">{{ detailsProfile.status }}</span>
          </div>
          <div>
            <strong style="color: var(--text-muted);">Registered On:</strong> {{ formatDate(detailsProfile.created_at)
            }}
          </div>
          <div>
            <strong style="color: var(--text-muted);">AI Status:</strong> <span class="text-uppercase"
              style="font-weight: 700;">{{ detailsProfile.ai_status || 'unpaid' }}</span>
          </div>
          <div>
            <strong style="color: var(--text-muted);">AI Expiry:</strong> <span>{{ detailsProfile.ai_approved_until ? formatDate(detailsProfile.ai_approved_until) : 'None' }}</span>
          </div>
          <div v-if="detailsProfile.referred_by" style="grid-column: span 2;">
            <strong style="color: var(--text-muted);">Referred By:</strong> {{
              getReferrerEmail(detailsProfile.referred_by)
            }}
          </div>
        </div>

        <!-- Editable Pricing Snapshots -->
        <div
          style="border-top: 1px solid var(--border-color); padding-top: 1rem; display: flex; flex-direction: column; gap: 1rem; max-height: 50vh; overflow-y: auto; padding-right: 0.25rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label for="detailsCourseAmount" class="form-label" style="font-size: 0.75rem;">Course Amount Paid (PKR)
                *</label>
              <input v-model.number="detailsCourseAmount" type="number" id="detailsCourseAmount" class="form-input"
                required min="0" />
              <span style="font-size: 0.7rem; color: var(--text-muted);">Price when this candidate registered.</span>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label for="detailsReferralCommission" class="form-label" style="font-size: 0.75rem;">Referrer Commission
                (PKR) *</label>
              <input v-model.number="detailsReferralCommission" type="number" id="detailsReferralCommission"
                class="form-input" required min="0" />
              <span style="font-size: 0.7rem; color: var(--text-muted);">Referral price when they registered.</span>
            </div>
          </div>

          <!-- Option to set referral price for each student -->
          <div class="form-group" style="margin-bottom: 0;">
            <label for="detailsCustomReferralBonus" class="form-label" style="font-size: 0.75rem;">Custom Referral Bonus
              for
              this candidate (PKR)</label>
            <input v-model.number="detailsCustomReferralBonus" type="number" id="detailsCustomReferralBonus"
              class="form-input" placeholder="e.g. 600 (Leave blank to use system default)" min="0" />
            <span style="font-size: 0.7rem; color: var(--text-muted);">
              Set custom commission rate this candidate earns for each future referral they make.
            </span>
          </div>

          <!-- AI Subscription Settings -->
          <div style="border-top: 1px dashed var(--border-color); padding-top: 1rem; display: flex; flex-direction: column; gap: 1rem;">
            <h4 style="font-size: 0.9rem; margin: 0; color: var(--text-secondary);">AI Evaluation Access Settings</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div class="form-group" style="margin-bottom: 0;">
                <label for="detailsAiStatusSelect" class="form-label" style="font-size: 0.75rem;">AI Access Status</label>
                <select v-model="detailsAiStatus" id="detailsAiStatusSelect" class="form-select">
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label for="detailsAiApprovedUntilInput" class="form-label" style="font-size: 0.75rem;">AI Approved Until</label>
                <input v-model="detailsAiApprovedUntil" type="datetime-local" id="detailsAiApprovedUntilInput" class="form-input" />
              </div>
            </div>

            <div v-if="detailsAiStatus === 'rejected'" class="form-group" style="margin-bottom: 0;">
              <label for="detailsAiRejectionReasonInput" class="form-label" style="font-size: 0.75rem;">AI Rejection Reason</label>
              <textarea v-model="detailsAiRejectionReason" id="detailsAiRejectionReasonInput" class="form-textarea" placeholder="Reason for rejecting AI access screenshot"></textarea>
            </div>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <button @click="closeDetailsModal" class="btn btn-secondary">Close</button>
          <button @click="saveDetailsChanges" class="btn btn-primary">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-users-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.badge-gray {
  background: rgba(100, 116, 139, 0.12);
  color: var(--text-muted);
  border-color: rgba(100, 116, 139, 0.25);
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-title-area h2 {
  font-size: 1.85rem;
  margin-top: 0.25rem;
}

.header-title-area p {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-top: 0.35rem;
}

.error-banner {
  background: var(--accent-red-glow);
  color: var(--accent-red);
  border: 1px solid rgba(185, 28, 28, 0.25);
  padding: 1rem;
}

.filters-panel {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  padding: 1.25rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 20px;
  height: 20px;
  color: var(--text-muted);
}

.search-input {
  padding-left: 2.75rem;
}

.tabs-container {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 2px;
}

.tab-btn {
  padding: 0.6rem 1.25rem;
  border-radius: var(--border-radius-md);
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  transition: all var(--transition-smooth);
}

.tab-btn:hover {
  background: rgba(3, 194, 252, 0.04);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent-cyan);
  color: #ffffff;
  border-color: var(--accent-cyan);
  box-shadow: 0 4px 12px var(--accent-cyan-glow);
}

.table-container {
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-loading,
.table-empty {
  padding: 4rem 2rem;
  flex-direction: column;
  gap: 1rem;
  color: var(--text-muted);
  font-size: 1rem;
}

.candidates-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.92rem;
  min-width: 1100px;
}

.candidates-table th {
  background: var(--bg-panel-solid);
  padding: 1rem 1.5rem;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
}

.candidates-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  vertical-align: middle;
}

.candidates-table tr:last-child td {
  border-bottom: none;
}

.candidate-info-cell .name {
  font-weight: 700;
  color: var(--text-primary);
}

.candidate-info-cell .email {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.1rem;
}

.role-indicator {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.2rem;
}

.branch-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.btn-view-receipt {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: var(--accent-cyan-glow);
  color: var(--accent-cyan);
  border: 1px solid rgba(3, 194, 252, 0.15);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.btn-view-receipt:hover {
  background: var(--accent-cyan);
  color: #ffffff;
}

.receipt-icon {
  width: 14px;
  height: 14px;
}

.rejection-reason-sub {
  font-size: 0.75rem;
  color: var(--accent-red);
  margin-top: 0.25rem;
  font-style: italic;
  max-width: 160px;
  overflow: scroll !important;
  height: 100px
}

.actions-cell {
  width: 160px;
}

.actions-group {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.4rem 0.85rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-smooth);
  border: 1px solid transparent;
}

.btn-approve {
  background: var(--accent-green);
  color: #ffffff;
}

.btn-approve:hover {
  background: #116430;
}

.btn-reject {
  background: transparent;
  border-color: #cbd5e1;
  color: var(--text-secondary);
}

.btn-reject:hover {
  background: var(--accent-red-glow);
  color: var(--accent-red);
  border-color: rgba(185, 28, 28, 0.25);
}

.btn-soft-delete {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.btn-soft-delete:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: #ef4444;
}

.btn-restore {
  background: var(--accent-cyan);
  color: #ffffff;
  border: 1px solid var(--accent-cyan);
}

.btn-restore:hover {
  background: #0284c7;
  border-color: #0284c7;
}

.btn-delete-perm {
  background: #dc2626;
  color: #ffffff;
  border: 1px solid #dc2626;
}

.btn-delete-perm:hover {
  background: #991b1b;
  border-color: #991b1b;
}

.btn-edit {
  background: var(--accent-cyan-glow);
  color: var(--accent-cyan);
  border: 1px solid rgba(3, 194, 252, 0.2);
}

.btn-edit:hover {
  background: var(--accent-cyan);
  color: #ffffff;
  border-color: var(--accent-cyan);
}

.btn-details {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-details:hover {
  background: rgba(3, 194, 252, 0.05);
  color: var(--accent-cyan);
  border-color: var(--accent-cyan);
}

.tab-btn-trash {
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.tab-btn-trash:hover {
  background: rgba(239, 68, 68, 0.05);
  color: #b91c1c;
}

.tab-btn-trash.active {
  background: #ef4444 !important;
  color: #ffffff !important;
  border-color: #ef4444 !important;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2) !important;
}

/* Modal styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  padding: 2.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 550px;
  width: 100%;
}

.image-modal {
  max-width: 650px;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  font-size: 1.8rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-content h3 {
  font-size: 1.35rem;
  margin: 0;
}

.modal-content p {
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.45;
  margin: 0;
}

.modal-image-container {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  max-height: 400px;
  background: #f8fafc;
  display: flex;
  justify-content: center;
}

.modal-image {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 1.25rem;
}

.btn-submit-rejection {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: #ffffff;
}

.btn-submit-rejection:hover {
  background: #991b1b;
}

/* Spinner and keyframe */
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid var(--border-color);
  border-radius: 50%;
  border-top-color: var(--accent-cyan);
  animation: spin 1s ease-in-out infinite;
}

.btn-icon.spin {
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .admin-header .btn {
    width: 100%;
    justify-content: center;
  }

  .filters-panel {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .tabs-container {
    padding-bottom: 0.5rem;
  }

  /* Table responsive card overrides */
  .candidates-table thead {
    display: none;
  }

  .candidates-table,
  .candidates-table tbody,
  .candidates-table tr,
  .candidates-table td {
    display: block;
    width: 100%;
  }

  .candidates-table tr {
    margin-bottom: 1.25rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    padding: 1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  }

  .candidates-table tr:last-child {
    margin-bottom: 0;
  }

  .candidates-table td {
    border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
    padding: 0.75rem 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: right;
  }

  .candidates-table td:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .candidates-table td::before {
    content: attr(data-label);
    font-weight: 700;
    color: var(--text-muted);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
    margin-right: 1rem;
  }

  .candidates-table td.candidate-info-cell {
    display: block;
    text-align: left;
    padding-top: 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }

  .candidates-table td.candidate-info-cell::before {
    display: none;
  }

  .candidates-table td.candidate-info-cell .email {
    font-size: 0.85rem;
  }

  .candidates-table td.actions-cell {
    width: 100%;
    justify-content: stretch;
    padding-top: 1rem;
  }

  .candidates-table td.actions-cell::before {
    display: none;
  }

  .actions-group {
    width: 100%;
    display: flex;
    gap: 0.75rem;
  }

  .btn-action {
    flex: 1;
    justify-content: center;
    padding: 0.6rem;
    font-size: 0.85rem;
  }

  /* Portal Settings Container Mobile Override */
  .settings-panel-container {
    padding: 1.5rem;
  }
}

/* Portal Settings Styling */
.settings-panel-container {
  padding: 2.5rem;
  border-top: 4px solid var(--accent-gold);
}

.settings-section-header {
  margin-bottom: 2rem;
}

.settings-section-header h3 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.settings-section-header p {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.success-banner-settings {
  background: var(--accent-green-glow);
  color: var(--accent-green);
  border: 1px solid rgba(34, 197, 94, 0.25);
  padding: 0.75rem 1.25rem;
  border-radius: var(--border-radius-md);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.form-group-settings {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label-settings {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.input-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .form-row-settings {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
