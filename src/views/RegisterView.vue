<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../supabase'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Form Fields
const fullName = ref('')
const email = ref('')
const password = ref('')
const whatsapp = ref('')
const targetBranch = ref('army')
const fileInput = ref(null)
const selectedFile = ref(null)
const filePreview = ref(null)

// UI States
const isSubmitting = ref(false)
const errorMessage = ref('')
const uploadProgressText = ref('')
const referredByCode = ref('')

const appSettings = ref({
  course_price: 1499,
  referral_bonus: 200,
})

const fetchSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()
    if (!error && data) {
      appSettings.value = data
    }
  } catch (e) {
    console.error('Error fetching settings:', e)
  }
}

onMounted(() => {
  const urlRef = route.query.ref || sessionStorage.getItem('issb_referral_code') || localStorage.getItem('issb_referred_by_code') || ''
  referredByCode.value = urlRef.toString().toUpperCase().trim()
  
  fetchSettings()
  // Pre-fill fields if candidate submitted the lead capture form on the home page
  if (route.query.name) fullName.value = route.query.name
  if (route.query.email) email.value = route.query.email
  if (route.query.whatsapp) whatsapp.value = route.query.whatsapp
  if (route.query.branch) targetBranch.value = route.query.branch
})

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Validate it's an image
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Only image files (PNG, JPG, JPEG) are allowed.'
    selectedFile.value = null
    filePreview.value = null
    return
  }

  // Limit size to 5MB
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'File size must be under 5MB.'
    selectedFile.value = null
    filePreview.value = null
    return
  }

  errorMessage.value = ''
  selectedFile.value = file

  // Create preview URL
  const reader = new FileReader()
  reader.onload = (event) => {
    filePreview.value = event.target.result
  }
  reader.readAsDataURL(file)
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const removeSelectedFile = () => {
  selectedFile.value = null
  filePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const fetchIP = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    return data.ip || 'unknown'
  } catch (e) {
    console.error('Failed to get IP address:', e)
    return 'unknown'
  }
}

const handleRegister = async () => {
  if (!fullName.value || !email.value || !password.value) {
    errorMessage.value = 'Please fill out all required fields.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  uploadProgressText.value = 'Verifying security guidelines...'

  try {
    // 0. Fetch candidate IP and verify trial status
    const ip = await fetchIP()
    const { data: isBlocked, error: rpcError } = await supabase.rpc('check_ip_trial_status', { ip_addr: ip })
    
    if (rpcError) {
      console.error('RPC Error check_ip_trial_status:', rpcError)
    }

    if (isBlocked) {
      errorMessage.value = 'You cannot create a new account, please use your old account.'
      isSubmitting.value = false
      return
    }

    const refCode = referredByCode.value || null
    uploadProgressText.value = 'Creating candidate account...'

    // 1. Sign up candidate via Auth Store
    const regResult = await authStore.register(email.value, password.value, {
      full_name: fullName.value,
      whatsapp: whatsapp.value,
      target_branch: targetBranch.value,
      referred_by_code: refCode,
      ip_address: ip,
    })

    if (!regResult.user) {
      throw new Error('Failed to create account. Please try again.')
    }

    const userId = regResult.user.id
    let publicUrl = ''

    if (selectedFile.value) {
      uploadProgressText.value = 'Uploading payment screenshot...'

      // 2. Upload payment screenshot to storage bucket
      const file = selectedFile.value
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('payment_screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(
          'Payment screenshot upload failed, but your account was created. Please log in and upload the receipt on the status page.',
        )
      }

      // 3. Retrieve public URL
      uploadProgressText.value = 'Saving receipt information...'
      const {
        data: { publicUrl: url },
      } = supabase.storage.from('payment_screenshots').getPublicUrl(fileName)
      publicUrl = url

      // 4. Update student profile with receipt url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ payment_screenshot_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error('Failed to save receipt link. Please contact support.')
      }
    }

    // Clear the referral code from local storage since registration succeeded
    if (refCode) {
      localStorage.removeItem('issb_referred_by_code')
    }
    // Success — redirect based on approval status or free trial
    uploadProgressText.value = 'Account registration complete!'

    // Profile is already fetched inside authStore.register() with retry logic
    setTimeout(() => {
      const redirectPath = route.query.redirect || '/dashboard'
      router.push(redirectPath)
    }, 500)
  } catch (error) {
    console.error('Registration failed:', error)
    errorMessage.value = error.message || 'An error occurred during registration.'
    isSubmitting.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <main class="register-page">
    <div class="register-layout">
      <!-- Left side: Payment Instructions -->
      <div class="instructions-panel glass-card">
        <div class="panel-header" @click="goHome">
          <svg class="icon-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
            <path d="M12 6L5 20H19L12 6Z" fill="currentColor" opacity="0.3" />
            <circle cx="12" cy="14" r="2" fill="currentColor" />
          </svg>
          <span class="logo-title">ISSB COMMAND</span>
          <span class="sub-text">PREPARATION PORTAL</span>
        </div>

        <div class="pricing-overview">
          <span class="badge badge-cyan">LIFETIME ACCESS PASS</span>
          <div class="price-box">
            <span class="slashed-price">PKR {{ appSettings.course_price * 2.5 }}</span>
            <span class="current-price">PKR {{ appSettings.course_price }}</span>
          </div>
          <p class="price-desc">
            Gain unlimited access to 1000+ solved WAT sentences, 500+ SCT keys, 100+ Situation
            Reaction Guides, GTO Obstacle planning blueprints, and premium simulation tools.
          </p>
        </div>

        <div class="payment-steps">
          <h2>Payment Verification Process</h2>

          <div class="step">
            <span class="step-badge">1</span>
            <div class="step-info">
              <p>Transfer <strong>PKR {{ appSettings.course_price }}</strong> via <strong>EasyPaisa</strong> to:</p>
              <div class="payment-details">
                <div class="detail-row">
                  <span class="lbl">EasyPaisa Number:</span>
                  <span class="val highlight-text">03458643910</span>
                </div>
                <div class="detail-row">
                  <span class="lbl">Account Name:</span>
                  <span class="val">umar farooq</span>
                </div>
              </div>
            </div>
          </div>

          <div class="step">
            <span class="step-badge">2</span>
            <div class="step-info">
              <p>
                Take a screenshot of the transaction receipt showing the reference number and date.
              </p>
            </div>
          </div>

          <div class="step">
            <span class="step-badge">3</span>
            <div class="step-info">
              <p>
                Fill out the registration form on the right, upload the screenshot, and submit. The
                admin will verify and approve your portal access within 1-2 hours.
              </p>
            </div>
          </div>
        </div>

        <div class="support-contact">
          <p>Need support or instant activation?</p>
          <a href="https://wa.me/923456047058?text=Hi%20Umar,%20I'm%20registering%20on%20the%20ISSB%20Preparation%20Portal%20and%20need%20assistance."
            target="_blank" class="whatsapp-link">
            WhatsApp Admin: 03456047058
          </a>
        </div>
      </div>

      <!-- Right side: Registration Form -->
      <div class="form-panel glass-card">
        <div class="form-title">
          <h1>Candidate Registration</h1>
          <p>Submit your details to register. You can upload payment screenshot now or later.</p>
        </div>

        <!-- Referral Code Active Banner -->
        <div v-if="referredByCode" class="referral-banner">
          <span class="referral-banner-icon">🎁</span>
          <span class="referral-banner-text">
            Referred by code: <strong>{{ referredByCode }}</strong>. You qualify for discounted course pricing.
          </span>
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

        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-row">
            <div class="form-group">
              <label for="fullName" class="form-label">Full Name *</label>
              <input v-model="fullName" type="text" id="fullName" class="form-input" placeholder="e.g. Muhammad Ali"
                required :disabled="isSubmitting" />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Email Address *</label>
              <input v-model="email" type="email" id="email" class="form-input" placeholder="e.g. name@example.com"
                required :disabled="isSubmitting" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password" class="form-label">Password *</label>
              <input v-model="password" type="password" id="password" class="form-input" placeholder="Min 6 characters"
                required minlength="6" :disabled="isSubmitting" />
            </div>

            <div class="form-group">
              <label for="whatsapp" class="form-label">WhatsApp Number (Optional)</label>
              <input v-model="whatsapp" type="tel" id="whatsapp" class="form-input" placeholder="e.g. +92 300 1234567"
                :disabled="isSubmitting" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="branch" class="form-label">Target Force Branch *</label>
              <select v-model="targetBranch" id="branch" class="form-select" :disabled="isSubmitting">
                <option value="army">
                  Pakistan Army (PMA Long Course / TCC / Direct Commission)
                </option>
                <option value="navy">Pakistan Navy (PN Cadet / SSC / Direct Entry)</option>
                <option value="airforce">
                  Pakistan Air Force (GD Pilot / CAE / SSC / Direct Branch)
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="referredByCode" class="form-label">Referral Code (Optional)</label>
              <input v-model="referredByCode" type="text" id="referredByCode" class="form-input" placeholder="e.g. REF123"
                :disabled="isSubmitting" @input="referredByCode = $event.target.value.toUpperCase()" />
            </div>
          </div>

          <!-- Screenshot upload area -->
          <div class="form-group">
            <label class="form-label">Payment Receipt Screenshot (Optional)</label>
            <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileChange"
              :disabled="isSubmitting" />

            <div v-if="!selectedFile" class="upload-dropzone" @click="triggerFileInput">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span>Click to Upload Payment Screenshot</span>
              <p class="upload-hint">Format: PNG, JPG, JPEG (Max 5MB) | Can be uploaded later</p>
            </div>

            <div v-else class="upload-preview-card">
              <div class="preview-info">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
              </div>
              <div class="preview-img-container">
                <img :src="filePreview" alt="Receipt preview" class="preview-img" />
              </div>
              <button type="button" class="btn-remove-file" @click="removeSelectedFile" :disabled="isSubmitting">
                Remove Screenshot
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-submit" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="flex-center gap-xs">
              <span class="spinner"></span>
              <span>{{ uploadProgressText }}</span>
            </span>
            <span v-else-if="selectedFile">Register & Request Access</span>
            <span v-else>Register (Pay/Upload Later)</span>
          </button>
        </form>

        <div class="form-footer">
          <p>
            Already registered?
            <button @click="goToLogin" class="link-btn">Log In</button>
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 2rem;
  background: radial-gradient(circle at 10% 20%,
      rgba(2, 132, 199, 0.05) 0%,
      rgba(241, 245, 249, 1) 90%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-layout {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 2rem;
  max-width: 1100px;
  width: 100%;
}

.instructions-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2.5rem;
  background: var(--bg-panel);
}

.panel-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  cursor: pointer;
}

.icon-logo {
  width: 42px;
  height: 42px;
  color: var(--accent-cyan);
}

.panel-header .logo-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.2rem;
  letter-spacing: 0.05em;
  margin: 0;
  display: block;
}

.panel-header .sub-text {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  color: var(--accent-cyan);
}

.pricing-overview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1.5rem;
}

.price-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.slashed-price {
  text-decoration: line-through;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.current-price {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.price-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.payment-steps {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.payment-steps h4 {
  font-size: 1rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 0.5rem;
}

.step {
  display: flex;
  gap: 0.85rem;
}

.step-badge {
  width: 22px;
  height: 22px;
  background: var(--accent-cyan);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.step-info p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.payment-details {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 0.5rem 0.75rem;
  margin-top: 0.4rem;
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
}

.detail-row .lbl {
  color: var(--text-muted);
}

.detail-row .val {
  font-weight: 700;
}

.highlight-text {
  color: var(--accent-cyan);
}

.support-contact {
  border-top: 1px solid var(--border-color);
  padding-top: 1.25rem;
  font-size: 0.85rem;
}

.whatsapp-link {
  display: block;
  margin-top: 0.25rem;
  color: #15803d;
  font-weight: 600;
  text-decoration: underline;
}

.form-panel {
  padding: 2.5rem;
  background: var(--bg-panel);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-title h3 {
  font-size: 1.4rem;
  margin-bottom: 0.25rem;
}

.form-title p {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-group {
  margin-bottom: 0;
}

.upload-dropzone {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
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
  width: 36px;
  height: 36px;
  color: var(--text-muted);
}

.upload-dropzone span {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.upload-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.upload-preview-card {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-primary);
}

.preview-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.preview-info .file-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.preview-img-container {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  max-height: 150px;
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

.btn-remove-file {
  background: transparent;
  color: var(--accent-red);
  font-weight: 600;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.85rem;
  text-align: center;
}

.btn-submit {
  width: 100%;
  padding: 0.85rem;
  font-size: 1rem;
}

.error-alert {
  background: var(--accent-red-glow);
  color: var(--accent-red);
  border: 1px solid rgba(185, 28, 28, 0.25);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.referral-banner {
  background: var(--accent-cyan-glow);
  color: #0369a1;
  border: 1px solid rgba(3, 194, 252, 0.25);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.referral-banner-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.referral-banner-text {
  line-height: 1.4;
}

.alert-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.form-footer {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.link-btn {
  background: transparent;
  border: none;
  color: var(--accent-cyan);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  margin-left: 0.25rem;
}

.link-btn:hover {
  color: #0270a5;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
}

.gap-xs {
  gap: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 992px) {
  .register-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}
</style>
