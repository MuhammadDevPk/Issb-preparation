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

const handleApprove = async (profileId) => {
  if (!confirm('Are you sure you want to approve this candidate?')) return

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', profileId)

    if (error) throw error

    // Update local state
    const index = profiles.value.findIndex((p) => p.id === profileId)
    if (index !== -1) {
      profiles.value[index].status = 'approved'
      profiles.value[index].rejection_reason = null
    }
  } catch (e) {
    console.error('Approval failed:', e)
    alert('Failed to approve candidate: ' + e.message)
  }
}

const openRejectModal = (profileId) => {
  selectedProfileId.value = profileId
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
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReasonInput.value.trim(),
      })
      .eq('id', selectedProfileId.value)

    if (error) throw error

    // Update local state
    const index = profiles.value.findIndex((p) => p.id === selectedProfileId.value)
    if (index !== -1) {
      profiles.value[index].status = 'rejected'
      profiles.value[index].rejection_reason = rejectionReasonInput.value.trim()
    }

    closeRejectModal()
  } catch (e) {
    console.error('Rejection failed:', e)
    alert('Failed to reject candidate: ' + e.message)
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

    // 3. Status Match
    const matchesStatus = activeStatusTab.value === 'all' || p.status === activeStatusTab.value

    return matchesQuery && matchesBranch && matchesStatus
  })
})

// Settings Panel State
const settings = ref({
  course_price: 1499,
  referral_bonus: 200,
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
      <button
        @click="fetchProfiles"
        class="btn btn-secondary flex-center gap-xs"
        :disabled="isLoading"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="btn-icon"
          :class="{ spin: isLoading }"
        >
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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="search-icon"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          v-model="searchFilter"
          type="text"
          placeholder="Search by candidate name, email, or whatsapp..."
          class="form-input search-input"
        />
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
    <div class="tabs-container">
      <button
        @click="activeStatusTab = 'all'"
        class="tab-btn"
        :class="{ active: activeStatusTab === 'all' }"
      >
        All Candidates ({{ profiles.length }})
      </button>
      <button
        @click="activeStatusTab = 'pending'"
        class="tab-btn"
        :class="{ active: activeStatusTab === 'pending' }"
      >
        Pending ({{ profiles.filter((p) => p.status === 'pending').length }})
      </button>
      <button
        @click="activeStatusTab = 'approved'"
        class="tab-btn"
        :class="{ active: activeStatusTab === 'approved' }"
      >
        Approved ({{ profiles.filter((p) => p.status === 'approved').length }})
      </button>
      <button
        @click="activeStatusTab = 'rejected'"
        class="tab-btn"
        :class="{ active: activeStatusTab === 'rejected' }"
      >
        Rejected ({{ profiles.filter((p) => p.status === 'rejected').length }})
      </button>
      <button
        @click="activeStatusTab = 'settings'"
        class="tab-btn"
        :class="{ active: activeStatusTab === 'settings' }"
        style="border-color: var(--accent-gold); color: var(--accent-gold);"
      >
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
            <th>Screenshot</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="candidate in filteredProfiles" :key="candidate.id">
            <td class="candidate-info-cell">
              <div class="name">{{ candidate.full_name || 'No Name Provided' }}</div>
              <div class="email">{{ candidate.email }}</div>
              <div v-if="candidate.role === 'admin'" class="role-indicator text-glow-gold">
                System Admin
              </div>
            </td>

            <td>
              <span class="branch-label text-capitalize">{{ candidate.target_branch }}</span>
            </td>

            <td>
              <span>{{ candidate.whatsapp || 'N/A' }}</span>
            </td>

            <td>
              <span class="date">{{ formatDate(candidate.created_at) }}</span>
            </td>

            <td>
              <button
                v-if="candidate.payment_screenshot_url"
                @click="openImageModal(candidate.payment_screenshot_url)"
                class="btn-view-receipt"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="receipt-icon"
                >
                  <path d="M2 3h20v18H2zM6 8h12M6 12h12M6 16h6" />
                </svg>
                <span>Preview</span>
              </button>
              <span v-else class="text-muted text-italic">No Upload</span>
            </td>

            <td>
              <span
                class="badge"
                :class="{
                  'badge-cyan': candidate.status === 'pending',
                  'badge-green': candidate.status === 'approved',
                  'badge-red': candidate.status === 'rejected',
                }"
              >
                {{ candidate.status }}
              </span>
              <div v-if="candidate.status === 'rejected'" class="rejection-reason-sub">
                "{{ candidate.rejection_reason }}"
              </div>
            </td>

            <td class="actions-cell">
              <div class="actions-group">
                <button
                  v-if="candidate.status !== 'approved'"
                  @click="handleApprove(candidate.id)"
                  class="btn-action btn-approve"
                  title="Approve Candidate Access"
                >
                  Approve
                </button>
                <button
                  v-if="candidate.status !== 'rejected' && candidate.role !== 'admin'"
                  @click="openRejectModal(candidate.id)"
                  class="btn-action btn-reject"
                  title="Reject Receipt"
                >
                  Reject
                </button>
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
            <input
              v-model.number="settings.course_price"
              type="number"
              id="coursePrice"
              class="form-input"
              required
              min="0"
              :disabled="isSavingSettings"
            />
            <span class="input-hint">The base price a student sees on registration.</span>
          </div>

          <div class="form-group-settings">
            <label for="referralBonus" class="form-label-settings">Referral Bonus per Paid User (PKR) *</label>
            <input
              v-model.number="settings.referral_bonus"
              type="number"
              id="referralBonus"
              class="form-input"
              required
              min="0"
              :disabled="isSavingSettings"
            />
            <span class="input-hint">Deducted from referrer's price for each referred paid user.</span>
          </div>
        </div>

        <div class="form-row-settings">
          <div class="form-group-settings">
            <label for="maxDiscountPct" class="form-label-settings">Max Discount Percentage Cap (%) *</label>
            <input
              v-model.number="settings.max_discount_pct"
              type="number"
              id="maxDiscountPct"
              class="form-input"
              required
              min="0"
              max="100"
              :disabled="isSavingSettings"
            />
            <span class="input-hint">Maximum percent discount allowed (e.g. 90%).</span>
          </div>

          <div class="form-group-settings">
            <label for="maxDiscountAmount" class="form-label-settings">Max Discount Flat Cap (PKR) *</label>
            <input
              v-model.number="settings.max_discount_amount"
              type="number"
              id="maxDiscountAmount"
              class="form-input"
              required
              min="0"
              :disabled="isSavingSettings"
            />
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
        <h3>Reject Verification Request</h3>
        <p>
          Please provide a reason. The student will see this message and will be allowed to upload a
          valid screenshot.
        </p>

        <div class="form-group">
          <label for="rejectionReason" class="form-label">Reason for Rejection *</label>
          <textarea
            v-model="rejectionReasonInput"
            id="rejectionReason"
            class="form-textarea"
            placeholder="e.g. Transaction Reference Number missing, or payment amount is incorrect."
            required
          ></textarea>
        </div>

        <div class="modal-actions">
          <button @click="closeRejectModal" class="btn btn-secondary">Cancel</button>
          <button @click="handleReject" class="btn btn-primary btn-submit-rejection">
            Confirm Rejection
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
  overflow: hidden;
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
  .filters-panel {
    grid-template-columns: 1fr;
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
