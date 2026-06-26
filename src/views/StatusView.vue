<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'

const router = useRouter()
const authStore = useAuthStore()

const courseFileInput = ref(null)
const courseSelectedFiles = ref([])
const courseFilePreviews = ref([])

const aiFileInput = ref(null)
const aiSelectedFiles = ref([])
const aiFilePreviews = ref([])

const showPendingUploadArea = ref(false)
const activeUploadSection = ref(null) // null, 'course', 'ai'

const isSubmitting = ref(false)
const errorMessage = ref('')
const uploadStatus = ref('')

const profile = computed(() => authStore.profile)
const status = computed(() => profile.value?.status || 'pending')
const rejectionReason = computed(() => profile.value?.rejection_reason || 'No reason provided.')

const aiStatus = computed(() => profile.value?.ai_status || 'unpaid')
const aiRejectionReason = computed(() => profile.value?.ai_rejection_reason || 'No reason provided.')
const aiApprovedUntil = computed(() => profile.value?.ai_approved_until)
const isAiApprovedActive = computed(() => {
  return aiStatus.value === 'approved' && aiApprovedUntil.value && new Date(aiApprovedUntil.value).getTime() > Date.now()
})

// Referral properties for StatusView
const referralCode = computed(() => authStore.profile?.referral_code || '')
const referralClicks = computed(() => authStore.profile?.referral_clicks || 0)
const referrals = ref([])
const appSettings = ref({
  course_price: 1499,
  referral_bonus: 500,
  max_discount_pct: 90,
  max_discount_amount: 1400,
})

const isLoadingReferrals = ref(false)

const referralLink = computed(() => {
  if (!referralCode.value) return ''
  return window.location.origin + '/r/' + referralCode.value
})

const copyStatus = ref('Copy Link')
const copyReferralLink = async () => {
  if (!referralLink.value) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(referralLink.value)
    } else {
      // Fallback for non-secure contexts (HTTP)
      const textArea = document.createElement('textarea')
      textArea.value = referralLink.value
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
    console.error('Failed to copy text: ', err)
    // Last resort: prompt user to copy manually
    copyStatus.value = 'Failed'
    setTimeout(() => {
      copyStatus.value = 'Copy Link'
    }, 2000)
  }
}

// Pricing Math
const paidReferralsCount = computed(() => {
  return referrals.value.filter((r) => r.status === 'approved').length
})

const totalBonusEarned = computed(() => {
  return paidReferralsCount.value * appSettings.value.referral_bonus
})

const maxDiscountAllowed = computed(() => {
  if (
    appSettings.value.max_discount_amount !== null &&
    appSettings.value.max_discount_amount !== undefined
  ) {
    return appSettings.value.max_discount_amount
  }
  return Math.floor(
    appSettings.value.course_price * (appSettings.value.max_discount_pct / 100),
  )
})

const finalCoursePrice = computed(() => {
  const discount = Math.min(totalBonusEarned.value, maxDiscountAllowed.value)
  return Math.max(appSettings.value.course_price - discount, 0)
})

const fetchReferralStats = async () => {
  if (!authStore.user) return
  isLoadingReferrals.value = true
  try {
    // 1. Fetch settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()
    if (!settingsError && settingsData) {
      appSettings.value = settingsData
    }

    // 2. Fetch referrals
    const { data: referralsData, error: referralsError } = await supabase
      .from('profiles')
      .select('id, full_name, status, created_at')
      .eq('referred_by', authStore.user.id)
    if (!referralsError && referralsData) {
      referrals.value = referralsData
    }
  } catch (e) {
    console.error('Error fetching referral stats:', e)
  } finally {
    isLoadingReferrals.value = false
  }
}

onMounted(() => {
  fetchReferralStats()
})

const handleCourseFileChange = (e) => {
  const files = Array.from(e.target.files)
  if (!files.length) return

  errorMessage.value = ''

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      errorMessage.value = `File "${file.name}" is not an image. Only image files are allowed.`
      continue
    }

    if (file.size > 5 * 1024 * 1024) {
      errorMessage.value = `File "${file.name}" exceeds 5MB size limit.`
      continue
    }

    if (courseSelectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      continue
    }

    courseSelectedFiles.value.push(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      courseFilePreviews.value.push({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        previewUrl: event.target.result,
        fileRef: file
      })
    }
    reader.readAsDataURL(file)
  }

  if (courseFileInput.value) {
    courseFileInput.value.value = ''
  }
}

const triggerCourseFileInput = () => {
  if (courseFileInput.value) {
    courseFileInput.value.click()
  }
}

const removeCourseSelectedFile = (idx) => {
  const removedPreview = courseFilePreviews.value[idx]
  if (removedPreview) {
    courseSelectedFiles.value = courseSelectedFiles.value.filter(f => f !== removedPreview.fileRef)
    courseFilePreviews.value.splice(idx, 1)
  }
}

const clearCourseSelectedFiles = () => {
  courseSelectedFiles.value = []
  courseFilePreviews.value = []
  if (courseFileInput.value) {
    courseFileInput.value.value = ''
  }
}

const handleAiFileChange = (e) => {
  const files = Array.from(e.target.files)
  if (!files.length) return

  errorMessage.value = ''

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      errorMessage.value = `File "${file.name}" is not an image. Only image files are allowed.`
      continue
    }

    if (file.size > 5 * 1024 * 1024) {
      errorMessage.value = `File "${file.name}" exceeds 5MB size limit.`
      continue
    }

    if (aiSelectedFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      continue
    }

    aiSelectedFiles.value.push(file)

    const reader = new FileReader()
    reader.onload = (event) => {
      aiFilePreviews.value.push({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        previewUrl: event.target.result,
        fileRef: file
      })
    }
    reader.readAsDataURL(file)
  }

  if (aiFileInput.value) {
    aiFileInput.value.value = ''
  }
}

const triggerAiFileInput = () => {
  if (aiFileInput.value) {
    aiFileInput.value.click()
  }
}

const removeAiSelectedFile = (idx) => {
  const removedPreview = aiFilePreviews.value[idx]
  if (removedPreview) {
    aiSelectedFiles.value = aiSelectedFiles.value.filter(f => f !== removedPreview.fileRef)
    aiFilePreviews.value.splice(idx, 1)
  }
}

const clearAiSelectedFiles = () => {
  aiSelectedFiles.value = []
  aiFilePreviews.value = []
  if (aiFileInput.value) {
    aiFileInput.value.value = ''
  }
}

const clearAllSelectedFiles = () => {
  clearCourseSelectedFiles()
  clearAiSelectedFiles()
  errorMessage.value = ''
}

const handleCourseUpload = async () => {
  if (courseSelectedFiles.value.length === 0) {
    errorMessage.value = 'Please select at least one file to upload.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  uploadStatus.value = 'Uploading receipt screenshot(s)...'

  try {
    const userId = authStore.user.id
    const urls = []
    let count = 1

    for (const file of courseSelectedFiles.value) {
      uploadStatus.value = `Uploading payment screenshot ${count}/${courseSelectedFiles.value.length}...`
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/course_${Date.now()}_${count}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('payment_screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('payment_screenshots').getPublicUrl(fileName)

      urls.push(publicUrl)
      count++
    }

    const joinedPublicUrls = urls.join(',')

    uploadStatus.value = 'Updating request...'

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        payment_screenshot_url: joinedPublicUrls,
        status: 'pending',
        rejection_reason: null,
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Refresh store
    await authStore.fetchProfile(userId)

    // Clean up
    clearCourseSelectedFiles()
    uploadStatus.value = 'Submission complete!'
    showPendingUploadArea.value = false
  } catch (error) {
    console.error('Course upload failed:', error)
    errorMessage.value = error.message || 'Failed to submit screenshots.'
  } finally {
    isSubmitting.value = false
  }
}

const handleAiUpload = async () => {
  if (aiSelectedFiles.value.length === 0) {
    errorMessage.value = 'Please select at least one file to upload.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  uploadStatus.value = 'Uploading receipt screenshot(s)...'

  try {
    const userId = authStore.user.id
    const urls = []
    let count = 1

    for (const file of aiSelectedFiles.value) {
      uploadStatus.value = `Uploading AI payment screenshot ${count}/${aiSelectedFiles.value.length}...`
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/ai_${Date.now()}_${count}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('payment_screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('payment_screenshots').getPublicUrl(fileName)

      urls.push(publicUrl)
      count++
    }

    const joinedPublicUrls = urls.join(',')

    uploadStatus.value = 'Updating request...'

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ai_payment_screenshot_url: joinedPublicUrls,
        ai_status: 'pending',
        ai_rejection_reason: null,
      })
      .eq('id', userId)

    if (updateError) throw updateError

    // Refresh store
    await authStore.fetchProfile(userId)

    // Clean up
    clearAiSelectedFiles()
    uploadStatus.value = 'Submission complete!'
    activeUploadSection.value = null
  } catch (error) {
    console.error('AI upload failed:', error)
    errorMessage.value = error.message || 'Failed to submit screenshots.'
  } finally {
    isSubmitting.value = false
  }
}

const handleSignOut = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (e) {
    console.error('Logout failed:', e)
  }
}

const goHome = () => {
  router.push('/')
}

const checkApprovalStatus = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    if (!authStore.user) {
      await authStore.initialize()
    }
    if (authStore.user) {
      await authStore.fetchProfile(authStore.user.id)
      if (authStore.profile?.status === 'approved') {
        router.push('/dashboard')
      } else {
        alert(
          'Your payment verification status is still: ' +
          authStore.profile?.status?.toUpperCase() +
          '.\n\nIf you have already uploaded a screenshot of your EasyPaisa receipt, please wait for admin verification (usually takes 1-2 hours) or message our support team on WhatsApp.',
        )
      }
    } else {
      router.push('/login')
    }
  } catch (e) {
    console.error('Error checking status:', e)
    errorMessage.value = 'Failed to fetch status: ' + e.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="status-page">
    <div class="status-container glass-card" :class="{ 'border-rejected': status === 'rejected' }">
      <!-- Top header bar -->
      <div class="status-header" @click="goHome" title="Return to Home Page">
        <svg class="icon-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <path d="M12 6L5 20H19L12 6Z" fill="currentColor" opacity="0.3" />
          <circle cx="12" cy="14" r="2" fill="currentColor" />
        </svg>
        <span class="logo-title">ISSB COMMAND</span>
        <span class="sub-text">PREPARATION PORTAL</span>
      </div>

      <!-- Pending Status Card Content -->
      <div v-if="status === 'pending'" class="status-content">
        <div v-if="!profile?.payment_screenshot_url || showPendingUploadArea" class="pending-upload-flow w-100">
          <div class="icon-wrapper spin-glow" style="margin: 0 auto 1rem auto;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon text-cyan">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>

          <div class="status-info">
            <h3>{{ profile?.payment_screenshot_url ? 'Update Payment Receipt(s)' : 'Upload Payment Receipt' }}</h3>
            <p>
              Please transfer the course fee to activate your portal access.
            </p>
          </div>

          <!-- Payment Credentials Box -->
          <div class="payment-credentials-card">
            <h4>EasyPaisa Payment Details</h4>
            <div class="credential-row">
              <span class="lbl">Account Number:</span>
              <span class="val text-cyan">03458643910</span>
            </div>
            <div class="credential-row">
              <span class="lbl">Account Name:</span>
              <span class="val">umar farooq</span>
            </div>
            <div class="credential-row">
              <span class="lbl">Base Price:</span>
              <span class="val">PKR {{ appSettings.course_price }}</span>
            </div>
            <div v-if="totalBonusEarned > 0" class="credential-row text-green">
              <span class="lbl">Referral Discount:</span>
              <span class="val">-PKR {{ Math.min(totalBonusEarned, maxDiscountAllowed) }}</span>
            </div>
            <div class="credential-row"
              style="border-top: 1px dashed var(--border-color); padding-top: 0.25rem; margin-top: 0.25rem;">
              <span class="lbl" style="font-weight: 700;">Final Amount:</span>
              <span class="val text-cyan" style="font-weight: 800; font-size: 1rem;">PKR {{ finalCoursePrice }}</span>
            </div>
          </div>

          <!-- Error Alert inside StatusView -->
          <div v-if="errorMessage" class="error-alert" style="margin-top: 1.25rem;">
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Upload Dropzone -->
          <div class="reupload-section" style="margin-top: 1.5rem;">
            <input ref="courseFileInput" type="file" accept="image/*" multiple style="display: none" @change="handleCourseFileChange"
              :disabled="isSubmitting" />

            <div v-if="courseSelectedFiles.length === 0" class="upload-dropzone" @click="triggerCourseFileInput">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span>Upload EasyPaisa Receipt Screenshot(s)</span>
              <p class="upload-hint">Format: PNG, JPG, JPEG (Max 5MB per file) | Multiple allowed</p>
            </div>

            <div v-else class="selected-files-list">
              <div v-for="(preview, idx) in courseFilePreviews" :key="preview.id" class="upload-preview-card mb-xs">
                <div class="preview-info">
                  <span class="file-name">{{ preview.name }}</span>
                </div>
                <div class="preview-img-container">
                  <img :src="preview.previewUrl" alt="Receipt preview" class="preview-img" />
                </div>
                <button type="button" class="btn-remove-file" @click="removeCourseSelectedFile(idx)" :disabled="isSubmitting">
                  Remove Screenshot {{ courseFilePreviews.length > 1 ? idx + 1 : '' }}
                </button>
              </div>

              <div class="preview-actions mt-xs">
                <p v-if="uploadStatus" class="upload-progress-text">{{ uploadStatus }}</p>
                <button type="button" class="btn-submit-receipt" @click="handleCourseUpload"
                  :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="btn-spinner"></span>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon-upload">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <span>{{ isSubmitting ? 'Submitting...' : 'Submit Receipt(s)' }}</span>
                </button>
                <div class="preview-secondary-actions">
                  <button type="button" class="btn btn-secondary btn-small" @click="triggerCourseFileInput" :disabled="isSubmitting">
                    + Add More
                  </button>
                  <button type="button" class="btn-remove-file" @click="clearCourseSelectedFiles(); showPendingUploadArea = false" :disabled="isSubmitting">
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Cancel editing / go back button if no file is selected -->
            <button v-if="courseSelectedFiles.length === 0 && profile?.payment_screenshot_url" type="button" class="btn btn-secondary btn-block mt-xs" @click="showPendingUploadArea = false" :disabled="isSubmitting">
              Go Back to Status Verification
            </button>
          </div>
        </div>

        <div v-else class="w-100">
          <div class="icon-wrapper spin-glow" style="margin: 0 auto 1rem auto;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              class="status-icon text-cyan animate-pulse">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>

          <div class="status-info">
            <h3>Verification in Progress</h3>
            <p>
              We are reviewing your payment screenshot. This process typically takes between 1-2
              hours.
            </p>
          </div>

          <!-- Checklist -->
          <div class="verification-checklist" style="margin-top: 1.5rem;">
            <div class="check-item done">
              <span class="check-circle">✓</span>
              <span>Account Registered Successfully</span>
            </div>
            <div class="check-item done">
              <span class="check-circle">✓</span>
              <span>Payment Receipt Received</span>
            </div>
            <div class="check-item active">
              <span class="check-circle">●</span>
              <span>Admin Review & Approval (Pending)</span>
            </div>
          </div>

          <!-- Support Info -->
          <div class="support-info-card" style="margin-top: 1.5rem;">
            <strong>Need Instant Activation?</strong>
            <p>
              Message our support team on WhatsApp with your registered email for express
              verification.
            </p>
            <a href="https://wa.me/923456047058?text=Hi%20Umar,%20I%20have%20registered%20on%20the%20ISSB%20Preparation%20Portal.%20My%20email%20is%20"
              target="_blank" class="btn btn-secondary btn-whatsapp">
              WhatsApp Verification Support
            </a>
          </div>

          <div class="refresh-actions" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <button @click="checkApprovalStatus" class="btn btn-primary btn-refresh">
              Check Status Now
            </button>
            <button @click="showPendingUploadArea = true" class="btn btn-secondary btn-block">
              Upload / Resubmit Different Receipts
            </button>
          </div>
        </div>
      </div>

      <!-- Rejected Status Card Content -->
      <div v-else-if="status === 'rejected'" class="status-content">
        <div class="icon-wrapper icon-rejected">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon text-red">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <div class="status-info">
          <h3 class="text-red">Payment Verification Rejected</h3>
          <p>Unfortunately, your payment verification was rejected by our administration.</p>
        </div>

        <!-- Rejection Details -->
        <div class="rejection-box">
          <strong>Rejection Reason:</strong>
          <p>{{ rejectionReason }}</p>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMessage" class="error-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="alert-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Re-upload Form -->
        <div class="reupload-section">
          <h4>Submit Updated Receipt Screenshot(s)</h4>

          <input ref="courseFileInput" type="file" accept="image/*" multiple style="display: none" @change="handleCourseFileChange"
            :disabled="isSubmitting" />

          <div v-if="courseSelectedFiles.length === 0" class="upload-dropzone" @click="triggerCourseFileInput">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span>Upload Valid Receipt Screenshot(s)</span>
            <p class="upload-hint">Format: PNG, JPG, JPEG (Max 5MB per file) | Multiple allowed</p>
          </div>

          <div class="selected-files-list" v-else>
            <div v-for="(preview, idx) in courseFilePreviews" :key="preview.id" class="upload-preview-card mb-xs">
              <div class="preview-info">
                <span class="file-name">{{ preview.name }}</span>
              </div>
              <div class="preview-img-container">
                <img :src="preview.previewUrl" alt="New Receipt preview" class="preview-img" />
              </div>
              <button type="button" class="btn-remove-file" @click="removeCourseSelectedFile(idx)" :disabled="isSubmitting">
                Remove Screenshot {{ courseFilePreviews.length > 1 ? idx + 1 : '' }}
              </button>
            </div>
            
            <div class="preview-actions mt-xs">
              <p v-if="uploadStatus" class="upload-progress-text">{{ uploadStatus }}</p>
              <button type="button" class="btn-submit-receipt" @click="handleCourseUpload"
                :disabled="isSubmitting">
                <span v-if="isSubmitting" class="btn-spinner"></span>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon-upload">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <span>{{ isSubmitting ? 'Submitting...' : 'Submit Receipt(s)' }}</span>
              </button>
              <div class="preview-secondary-actions">
                <button type="button" class="btn btn-secondary btn-small" @click="triggerCourseFileInput" :disabled="isSubmitting">
                  + Add More
                </button>
                <button type="button" class="btn-remove-file" @click="clearCourseSelectedFiles" :disabled="isSubmitting">
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Reminder details for reference -->
        <div class="payment-reminder-box">
          <strong>EasyPaisa Transfer Credentials:</strong>
          <p>
            Amount: <strong>PKR {{ finalCoursePrice }}</strong> | Account Name: <strong>umar farooq</strong> |
            Number: <strong>03458643910</strong>
          </p>
        </div>
      </div>

      <!-- Action panel footer (Logout & Nav) -->
      <div class="status-footer">
        <div class="footer-nav-links">
          <button @click="goHome" class="link-btn-nav">← Return to Home Landing Page</button>
          <button v-if="status === 'approved'" @click="router.push('/dashboard')" class="link-btn-nav text-green-link">
            Go to Dashboard →
          </button>
        </div>
        <button @click="handleSignOut" class="btn-logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="logout-icon">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log Out / Sign In as different candidate</span>
        </button>
      </div>
    </div>

    <!-- Unlimited AI Access Status Card -->
    <div class="status-container glass-card" :class="{ 'border-rejected': aiStatus === 'rejected' }" style="border-top-color: #8b5cf6;">
      <!-- Card header -->
      <div class="status-header">
        <svg class="icon-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: #8b5cf6;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
          <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span class="logo-title" style="color: #8b5cf6;">UNLIMITED AI ACCESS</span>
        <span class="sub-text">1-MONTH EVALUATION PLAN</span>
      </div>

      <!-- AI Approved Status -->
      <div v-if="isAiApprovedActive" class="status-content">
        <div class="icon-wrapper spin-glow" style="background: rgba(139, 92, 246, 0.1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.15); margin: 0 auto 1rem auto;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon" style="color: #8b5cf6;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div class="status-info">
          <h3 style="color: #10b981;">Access Approved & Active</h3>
          <p>
            You have unlimited AI Image Evaluations active until:
            <strong class="text-cyan">{{ new Date(aiApprovedUntil).toLocaleDateString() }}</strong>
          </p>
        </div>
        <div class="support-info-card w-100" style="margin-top: 1rem;">
          <button @click="router.push('/dashboard')" class="btn btn-primary w-full" style="background: #8b5cf6; border: none; color: white;">
            Go to Practice Dashboard
          </button>
        </div>
      </div>

      <!-- AI Pending Status -->
      <div v-else-if="aiStatus === 'pending'" class="status-content">
        <div class="icon-wrapper spin-glow" style="background: rgba(139, 92, 246, 0.1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.15); margin: 0 auto 1rem auto;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon animate-pulse" style="color: #8b5cf6;">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div class="status-info">
          <h3>Verification in Progress</h3>
          <p>We are reviewing your AI payment screenshot. This typically takes 1-2 hours.</p>
        </div>
        
        <div class="verification-checklist w-100" style="margin-top: 1rem;">
          <div class="check-item done" style="color: #10b981;">
            <span class="check-circle">✓</span>
            <span>Receipt Screenshot Submitted</span>
          </div>
          <div class="check-item active" style="color: #8b5cf6;">
            <span class="check-circle">●</span>
            <span>Admin Approval (Pending)</span>
          </div>
        </div>

        <div class="support-info-card w-100" style="margin-top: 1.5rem;">
          <strong>Need Express AI Activation?</strong>
          <p>Message our support team on WhatsApp for fast-track verification.</p>
          <a href="https://wa.me/923456047058?text=Hi%20Umar,%20I%20have%20uploaded%20my%20screenshot%20for%20Unlimited%20AI%20Access.%20My%20email%20is%20" target="_blank" class="btn btn-secondary btn-whatsapp">
            WhatsApp Verification Support
          </a>
        </div>
        <button @click="activeUploadSection = 'ai'; clearAllSelectedFiles()" class="btn btn-secondary w-full" style="margin-top: 1rem;">
          Resubmit Screenshot
        </button>
      </div>

      <!-- AI Unpaid / None Status Upload Flow -->
      <div v-else class="status-content">
        <!-- If editing/uploading for AI -->
        <div v-if="activeUploadSection === 'ai'" class="pending-upload-flow w-100">
          <div class="status-info">
            <h3>Upload Payment Receipt</h3>
            <p>Please transfer the AI subscription fee of Rs. 999 to unlock unlimited handwriting evaluations.</p>
          </div>

          <!-- AI Payment Box -->
          <div class="payment-credentials-card">
            <h4>EasyPaisa Payment Details</h4>
            <div class="credential-row">
              <span class="lbl">Account Number:</span>
              <span class="val text-cyan">03458643910</span>
            </div>
            <div class="credential-row">
              <span class="lbl">Account Name:</span>
              <span class="val">umar farooq</span>
            </div>
            <div class="credential-row">
              <span class="lbl">AI Access Amount:</span>
              <span class="val text-cyan" style="font-weight: 800; font-size: 1rem;">PKR 999</span>
            </div>
            <div class="credential-row">
              <span class="lbl">Validity:</span>
              <span class="val">30 Days (1 Month)</span>
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="errorMessage" class="error-alert" style="margin-top: 1.25rem;">
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Dropzone -->
          <div class="reupload-section" style="margin-top: 1.5rem;">
            <input ref="aiFileInput" type="file" accept="image/*" multiple style="display: none" @change="handleAiFileChange" :disabled="isSubmitting" />

            <div v-if="aiSelectedFiles.length === 0" class="upload-dropzone" @click="triggerAiFileInput">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span>Upload EasyPaisa AI Receipt</span>
              <p class="upload-hint">Format: PNG, JPG, JPEG (Max 5MB)</p>
            </div>

            <div v-else class="selected-files-list">
              <div v-for="(preview, idx) in aiFilePreviews" :key="preview.id" class="upload-preview-card mb-xs">
                <div class="preview-info">
                  <span class="file-name">{{ preview.name }}</span>
                </div>
                <div class="preview-img-container">
                  <img :src="preview.previewUrl" alt="Receipt preview" class="preview-img" />
                </div>
                <button type="button" class="btn-remove-file" @click="removeAiSelectedFile(idx)" :disabled="isSubmitting">
                  Remove Screenshot
                </button>
              </div>

              <div class="preview-actions mt-xs">
                <p v-if="uploadStatus" class="upload-progress-text">{{ uploadStatus }}</p>
                <button type="button" class="btn-submit-receipt" @click="handleAiUpload" :disabled="isSubmitting" style="background: #8b5cf6;">
                  <span v-if="isSubmitting" class="btn-spinner"></span>
                  <span>{{ isSubmitting ? 'Submitting...' : 'Submit Receipt(s)' }}</span>
                </button>
                <div class="preview-secondary-actions">
                  <button type="button" class="btn btn-secondary btn-small" @click="triggerAiFileInput" :disabled="isSubmitting">
                    + Add More
                  </button>
                  <button type="button" class="btn-remove-file" @click="clearAiSelectedFiles(); activeUploadSection = null" :disabled="isSubmitting">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Normal Gated AI Screen -->
        <div v-else class="w-100">
          <div class="icon-wrapper icon-rejected" style="background: rgba(139, 92, 246, 0.1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.15); margin: 0 auto 1rem auto;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon" style="color: #8b5cf6;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <div class="status-info">
            <h3 v-if="aiStatus === 'rejected'" class="text-red">AI Access Request Rejected</h3>
            <h3 v-else>Unlock Unlimited AI Evaluations</h3>
            
            <p v-if="aiStatus === 'rejected'" class="text-red">
              Reason: <strong>{{ aiRejectionReason }}</strong>
            </p>
            <p v-else>
              Get unlimited evaluations for handwritten tests (WAT, SCT, SRT) for 30 days!
            </p>
          </div>

          <!-- AI Payment Box -->
          <div class="payment-credentials-card" style="margin-top: 1.25rem; border-color: rgba(139, 92, 246, 0.3);">
            <h4 style="color: #8b5cf6;">EasyPaisa Transfer Details (Rs. 999)</h4>
            <div class="credential-row">
              <span class="lbl">Account Number:</span>
              <span class="val text-cyan" style="font-weight: 700;">03458643910</span>
            </div>
            <div class="credential-row">
              <span class="lbl">Account Name:</span>
              <span class="val" style="font-weight: 700;">umar farooq</span>
            </div>
            <div class="credential-row">
              <span class="lbl">AI Access Price:</span>
              <span class="val text-cyan" style="font-weight: 800;">PKR 999</span>
            </div>
            <div class="credential-row">
              <span class="lbl">Validity:</span>
              <span class="val" style="font-weight: 600;">30 Days (1 Month)</span>
            </div>
          </div>

          <div class="support-info-card" style="margin-top: 1rem; border-color: rgba(139, 92, 246, 0.15); background: rgba(139, 92, 246, 0.02);">
            <strong style="color: #8b5cf6;">How to Get Unlimited AI Access:</strong>
            <ol style="margin-top: 0.35rem; padding-left: 1.2rem; font-size: 0.85rem; color: var(--text-secondary); text-align: left; display: flex; flex-direction: column; gap: 0.35rem;">
              <li>Transfer <strong>Rs. 999</strong> to the EasyPaisa account details above.</li>
              <li>Take a <strong>screenshot</strong> of the successful transaction receipt.</li>
              <li>Click <strong>"Upload Payment Screenshot"</strong> below, select your screenshot, and submit.</li>
              <li>Once verified (usually 1-2 hours), you will get 1 month of unlimited image-based handwriting evaluations.</li>
            </ol>
          </div>

          <!-- Features list -->
          <div class="verification-checklist" style="margin-top: 1rem;">
            <div class="check-item active" style="color: #8b5cf6;">
              <span class="check-circle">✓</span>
              <span>Unlimited OCR Handwriting Extraction</span>
            </div>
            <div class="check-item active" style="color: #8b5cf6;">
              <span class="check-circle">✓</span>
              <span>Full OLQ Breakdown & Psychological Scoring</span>
            </div>
            <div class="check-item active" style="color: #8b5cf6;">
              <span class="check-circle">✓</span>
              <span>Rephrasings & Corrected Answers</span>
            </div>
          </div>

          <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; width: 100%;">
            <button @click="activeUploadSection = 'ai'; clearAllSelectedFiles()" class="btn btn-primary w-full" style="background: #8b5cf6; border: none; padding: 0.75rem 1rem; font-weight: 600; color: white;">
              Upload Payment Screenshot (Rs. 999)
            </button>
            <a href="https://wa.me/923456047058?text=Hi%20Umar,%20I%20want%20to%20purchase%20Unlimited%20AI%20Image%20Evaluation%20access%20for%20Rs.%20999.%20My%20email%20is%20" target="_blank" class="btn btn-secondary btn-whatsapp">
              WhatsApp Verification / Questions
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Referral Panel on Status View (Available to candidates even before approval!) -->
    <div class="status-container glass-card referral-status-card">
      <div class="referral-header-status">
        <span class="badge badge-cyan">Earn Dynamic Discounts</span>
        <h3>Candidate Referral Network</h3>
        <p class="desc">
          Invite friends to prepare together. Get <strong>PKR {{ appSettings.referral_bonus }}</strong> discount on your
          course price for each friend who registers and activates their account!
        </p>
      </div>

      <div class="referral-status-content">
        <div class="form-group-status-url">
          <label class="form-label-mini">Your Unique Invite Link</label>
          <div class="share-input-wrapper-mini">
            <input type="text" readonly :value="referralLink" class="form-input share-url-input-mini" />
            <button class="btn btn-primary btn-copy-mini" @click="copyReferralLink">
              <span>{{ copyStatus }}</span>
            </button>
          </div>
        </div>

        <div class="metrics-summary-grid-mini">
          <div class="metric-box-mini">
            <span class="val text-cyan">{{ referralClicks }}</span>
            <span class="lbl">Clicks</span>
          </div>
          <div class="metric-box-mini">
            <span class="val">{{ referrals.length }}</span>
            <span class="lbl">Joins</span>
          </div>
          <div class="metric-box-mini">
            <span class="val text-green">{{ paidReferralsCount }}</span>
            <span class="lbl">Paid</span>
          </div>
          <div class="metric-box-mini">
            <span class="val text-gold">PKR {{ totalBonusEarned }}</span>
            <span class="lbl">Earned</span>
          </div>
        </div>

        <div class="price-discount-summary-status">
          <div class="price-row-status">
            <span>Base Course Price:</span>
            <span>PKR {{ appSettings.course_price }}</span>
          </div>
          <div class="price-row-status text-green">
            <span>Your Referral Discount:</span>
            <span>-PKR {{ Math.min(totalBonusEarned, maxDiscountAllowed) }}</span>
          </div>
          <div class="price-row-status total-row text-cyan">
            <span>Final Price to Pay:</span>
            <span>PKR {{ finalCoursePrice }}</span>
          </div>
        </div>

        <!-- Referral program rules & limits -->
        <div class="referral-rules-mini">
          <p>
            * Minimum price drops to <strong>PKR {{ Math.max(appSettings.course_price - maxDiscountAllowed, 0)
              }}</strong> (stopped at <strong>{{ appSettings.max_discount_pct }}%</strong> discount limit).
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.status-page {
  min-height: 100vh;
  padding: 4rem 2rem;
  background: radial-gradient(circle at 10% 20%,
      rgba(2, 132, 199, 0.05) 0%,
      rgba(241, 245, 249, 1) 90%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2.5rem;
  flex-wrap: wrap;
}

.status-container {
  max-width: 500px;
  width: 100%;
  padding: 3rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  border-top: 4px solid var(--accent-cyan);
}

.status-container.border-rejected {
  border-top-color: var(--accent-red);
}

.status-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
  cursor: pointer;
  transition: opacity var(--transition-smooth);
}

.status-header:hover {
  opacity: 0.85;
}

.icon-logo {
  width: 48px;
  height: 48px;
  color: var(--accent-cyan);
  margin-bottom: 0.5rem;
}

.status-header .logo-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: 0.05em;
  margin: 0;
  display: block;
}

.status-header .sub-text {
  font-family: var(--font-heading);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--accent-cyan);
}

.status-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}

.icon-wrapper {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spin-glow {
  background: var(--accent-cyan-glow);
  box-shadow: 0 0 20px rgba(3, 194, 252, 0.15);
}

.icon-rejected {
  background: var(--accent-red-glow);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
}

.status-icon {
  width: 40px;
  height: 40px;
}

.text-cyan {
  color: var(--accent-cyan);
}

.text-red {
  color: var(--accent-red);
}

.status-info h3 {
  font-size: 1.35rem;
  margin-bottom: 0.5rem;
}

.status-info p {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.verification-checklist {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.check-item.done {
  color: var(--accent-green);
}

.check-item.active {
  color: var(--accent-cyan);
  font-weight: 600;
}

.check-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  border: 1px solid currentColor;
}

.check-item.done .check-circle {
  background: var(--accent-green-glow);
}

.check-item.active .check-circle {
  background: var(--accent-cyan-glow);
  animation: pulse-active 1.5s infinite;
}

@keyframes pulse-active {
  0% {
    box-shadow: 0 0 0 0 rgba(3, 194, 252, 0.4);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(3, 194, 252, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(3, 194, 252, 0);
  }
}

.support-info-card {
  width: 100%;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.support-info-card strong {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.support-info-card p {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0 0 0.5rem 0;
}

.btn-whatsapp {
  width: 100%;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.25);
  color: #15803d;
  font-size: 0.85rem;
}

.btn-whatsapp:hover {
  background: rgba(34, 197, 94, 0.15);
  border-color: #16a34a;
}

.refresh-actions {
  width: 100%;
}

.btn-refresh {
  width: 100%;
  padding: 0.8rem;
}

.rejection-box {
  width: 100%;
  background: rgba(239, 68, 68, 0.05);
  border: 1px dashed rgba(239, 68, 68, 0.3);
  border-radius: var(--border-radius-lg);
  padding: 1.25rem;
  text-align: left;
}

.rejection-box strong {
  color: var(--accent-red);
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.25rem;
}

.rejection-box p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.reupload-section {
  width: 100%;
  text-align: left;
}

.reupload-section h4 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.upload-dropzone {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  background: var(--bg-primary);
  transition: all var(--transition-smooth);
}

.upload-dropzone:hover {
  border-color: var(--accent-cyan);
  background: rgba(3, 194, 252, 0.02);
}

.upload-icon {
  width: 28px;
  height: 28px;
  color: var(--text-muted);
}

.upload-dropzone span {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.upload-preview-card {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-primary);
}

.preview-info {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.preview-img-container {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  max-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.preview-img {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.preview-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.btn-remove-file {
  background: transparent;
  color: var(--text-muted);
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: underline;
}

.payment-reminder-box {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 0.75rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-align: left;
  line-height: 1.4;
}

.error-alert {
  background: var(--accent-red-glow);
  color: var(--accent-red);
  border: 1px solid rgba(185, 28, 28, 0.25);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
}

.alert-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.status-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.footer-nav-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  font-size: 0.88rem;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
  padding-bottom: 0.75rem;
}

.link-btn-nav {
  background: transparent;
  border: none;
  color: var(--accent-cyan);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  font-family: var(--font-heading);
}

.link-btn-nav:hover {
  text-decoration: underline;
}

.text-green-link {
  color: #15803d;
}

.btn-logout {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.btn-logout:hover {
  color: var(--accent-red);
}

.logout-icon {
  width: 16px;
  height: 16px;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Premium Submit Receipt Button */
.btn-submit-receipt {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.9rem 1.5rem;
  background: linear-gradient(135deg, rgba(0, 242, 254, 0.85), rgba(79, 209, 197, 0.75));
  color: #0a0f1e;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 18px rgba(0, 242, 254, 0.25);
  text-transform: uppercase;
}

.btn-submit-receipt:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0, 242, 254, 0.4);
  background: linear-gradient(135deg, rgba(0, 242, 254, 1), rgba(79, 209, 197, 0.9));
}

.btn-submit-receipt:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon-upload {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(10, 15, 30, 0.3);
  border-radius: 50%;
  border-top-color: #0a0f1e;
  animation: spin 0.8s ease-in-out infinite;
  flex-shrink: 0;
}

.upload-progress-text {
  font-size: 0.8rem;
  color: var(--accent-cyan);
  text-align: center;
  margin: 0 0 0.6rem 0;
  font-weight: 600;
  animation: pulse-text 1.5s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.preview-secondary-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.6rem;
}

.w-100 {
  width: 100%;
}

.payment-credentials-card {
  width: 100%;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 1.25rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.payment-credentials-card h4 {
  font-size: 0.95rem;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
}

.credential-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.credential-row .lbl {
  color: var(--text-muted);
}

.credential-row .val {
  font-weight: 700;
}

/* Referral Status Card styles */
.referral-status-card {
  border-top-color: var(--accent-cyan) !important;
  padding: 2.25rem 2rem !important;
  gap: 1.25rem !important;
  margin-top: 1rem;
}

.referral-header-status h3 {
  font-size: 1.25rem;
  margin-top: 0.25rem;
  color: var(--text-primary);
}

.referral-header-status .desc {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-top: 0.35rem;
}

.referral-status-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.form-group-status-url {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: left;
}

.form-label-mini {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
}

.share-input-wrapper-mini {
  display: flex;
  gap: 0.5rem;
}

.share-url-input-mini {
  font-family: monospace;
  font-size: 0.78rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 0.45rem;
  flex: 1;
}

.btn-copy-mini {
  padding: 0 0.85rem;
  font-size: 0.78rem;
  white-space: nowrap;
}

.metrics-summary-grid-mini {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.metric-box-mini {
  background: white;
  border: 1px solid var(--border-color);
  padding: 0.6rem 0.25rem;
  border-radius: var(--border-radius-md);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.metric-box-mini .val {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
}

.metric-box-mini .lbl {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
}

.price-discount-summary-status {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  text-align: left;
}

.price-row-status {
  display: flex;
  justify-content: space-between;
  font-weight: 500;
}

.price-row-status.total-row {
  border-top: 1px dashed var(--border-color);
  padding-top: 0.35rem;
  margin-top: 0.15rem;
  font-weight: 700;
  font-size: 0.88rem;
}

.referral-rules-mini {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: left;
  line-height: 1.35;
}

.total-highlight {
  border-top: 1px dashed var(--border-color);
  padding-top: 0.4rem;
  margin-top: 0.25rem;
  font-weight: 800;
  font-size: 0.95rem;
}
</style>
