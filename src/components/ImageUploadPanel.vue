<script setup>
import { ref, computed } from 'vue'
import { processImageFiles } from '../utils/imageProcessor.js'

const props = defineProps({
  maxImages: { type: Number, default: 10 },
  testType: { type: String, default: 'WAT' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['images-ready', 'error'])

const images = ref([])          // Array of processed image objects
const errors = ref([])
const isProcessing = ref(false)
const dragOver = ref(false)

const totalOriginalKB = computed(() => images.value.reduce((s, i) => s + i.originalSizeKB, 0))
const totalCompressedKB = computed(() => images.value.reduce((s, i) => s + i.sizeKB, 0))
const canAddMore = computed(() => images.value.length < props.maxImages)

// Handle file selection (camera or gallery)
async function handleFiles(event) {
  const files = event.target?.files
  if (!files || files.length === 0) return
  await addFiles(files)
  // Reset the input so the same file can be re-selected
  event.target.value = ''
}

// Handle drag-and-drop
function onDragOver(e) {
  e.preventDefault()
  dragOver.value = true
}
function onDragLeave() {
  dragOver.value = false
}
async function onDrop(e) {
  e.preventDefault()
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) await addFiles(files)
}

// Core file processing
async function addFiles(files) {
  if (props.disabled) return
  isProcessing.value = true
  errors.value = []

  const remaining = props.maxImages - images.value.length
  if (remaining <= 0) {
    errors.value.push(`Maximum ${props.maxImages} images allowed.`)
    isProcessing.value = false
    return
  }

  const result = await processImageFiles(files, remaining)
  if (result.errors.length > 0) {
    errors.value = result.errors
  }
  if (result.images.length > 0) {
    images.value.push(...result.images)
  }
  isProcessing.value = false
}

// Remove an image
function removeImage(index) {
  images.value.splice(index, 1)
}

// Submit images for OCR
function submitImages() {
  if (images.value.length === 0) {
    errors.value = ['Please upload at least one image of your answer sheet.']
    return
  }
  emit('images-ready', { images: images.value })
}

// Clear all
function clearAll() {
  images.value = []
  errors.value = []
}
</script>

<template>
  <div class="upload-panel glass-card">
    <div class="upload-header">
      <h3>📸 Upload Answer Sheet Photos</h3>
      <p class="upload-desc">
        Take photos of your handwritten {{ testType }} answer sheets and upload them. 
        AI will extract your answers and evaluate them.
        <strong>Up to {{ maxImages }} images allowed.</strong>
      </p>
    </div>

    <!-- Error messages -->
    <div v-if="errors.length > 0" class="upload-errors">
      <div v-for="(err, i) in errors" :key="i" class="error-item">⚠️ {{ err }}</div>
    </div>

    <!-- Drop zone + buttons -->
    <div
      v-if="canAddMore"
      class="drop-zone"
      :class="{ 'drag-active': dragOver, 'is-disabled': disabled }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="drop-zone-content">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p class="drop-text">Drag & drop images here</p>
        <span class="drop-or">or</span>

        <div class="upload-buttons">
          <label class="btn btn-primary btn-upload" :class="{ disabled }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Take Photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              class="file-input-hidden"
              @change="handleFiles"
              :disabled="disabled"
            />
          </label>

          <label class="btn btn-secondary btn-upload" :class="{ disabled }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Choose from Gallery
            <input
              type="file"
              accept="image/*"
              multiple
              class="file-input-hidden"
              @change="handleFiles"
              :disabled="disabled"
            />
          </label>
        </div>
      </div>
    </div>

    <!-- Processing indicator -->
    <div v-if="isProcessing" class="processing-indicator">
      <div class="spinner"></div>
      <span>Compressing images...</span>
    </div>

    <!-- Image preview grid -->
    <div v-if="images.length > 0" class="preview-section">
      <div class="preview-header">
        <span class="preview-count">{{ images.length }} / {{ maxImages }} images</span>
        <span class="size-info">
          Original: {{ totalOriginalKB }}KB → Compressed: {{ totalCompressedKB }}KB
          <span class="savings-badge">{{ Math.round((1 - totalCompressedKB / totalOriginalKB) * 100) }}% saved</span>
        </span>
      </div>

      <div class="preview-grid">
        <div v-for="(img, idx) in images" :key="idx" class="preview-card">
          <img :src="img.base64WithPrefix" :alt="'Page ' + (idx + 1)" class="preview-thumb" />
          <div class="preview-meta">
            <span class="page-label">Page {{ idx + 1 }}</span>
            <span class="size-label">{{ img.sizeKB }}KB • {{ img.width }}×{{ img.height }}</span>
          </div>
          <button class="btn-remove" @click="removeImage(idx)" title="Remove this image">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div class="upload-actions">
        <button class="btn btn-secondary" @click="clearAll" :disabled="disabled">Clear All</button>
        <button class="btn btn-ai btn-submit-images" @click="submitImages" :disabled="disabled || images.length === 0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
            <circle cx="9" cy="13" r="1" fill="currentColor" />
            <circle cx="15" cy="13" r="1" fill="currentColor" />
          </svg>
          Extract & Analyze with AI
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-panel {
  border-block-start: 4px solid var(--accent-purple-ai, #a855f7);
}

.upload-header h3 {
  margin-block-end: 0.25rem;
}

.upload-desc {
  color: var(--text-secondary);
  font-size: 0.92rem;
  margin-block-end: 1rem;
}

/* Errors */
.upload-errors {
  margin-block-end: 1rem;
}

.error-item {
  background: rgba(239, 68, 68, 0.08);
  color: var(--accent-red);
  padding: 0.5rem 0.75rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
  margin-block-end: 0.35rem;
}

/* Drop zone */
.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-md);
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
  margin-block-end: 1rem;
}

.drop-zone.drag-active {
  border-color: var(--accent-purple-ai, #a855f7);
  background: rgba(168, 85, 247, 0.04);
}

.drop-zone.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  color: var(--text-muted);
  opacity: 0.5;
}

.drop-text {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin: 0;
}

.drop-or {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.upload-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-block-start: 0.5rem;
}

.btn-upload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-upload.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.file-input-hidden {
  display: none;
}

/* Processing */
.processing-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-purple-ai, #a855f7);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Preview section */
.preview-section {
  margin-block-start: 1rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preview-count {
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.size-info {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.savings-badge {
  display: inline-block;
  background: rgba(34, 197, 94, 0.1);
  color: var(--accent-green);
  font-weight: 600;
  font-size: 0.72rem;
  padding: 0.1rem 0.4rem;
  border-radius: var(--border-radius-sm);
  margin-inline-start: 0.25rem;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.75rem;
  margin-block-end: 1rem;
}

.preview-card {
  position: relative;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  overflow: hidden;
  background: var(--bg-panel-solid, #f8fafc);
}

.preview-thumb {
  width: 100%;
  height: 100px;
  object-fit: cover;
  display: block;
}

.preview-meta {
  padding: 0.35rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.page-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.size-label {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.btn-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: var(--accent-red);
}

/* Upload actions */
.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-block-start: 0.5rem;
  border-block-start: 1px solid var(--border-color);
}

.btn-submit-images {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
</style>
