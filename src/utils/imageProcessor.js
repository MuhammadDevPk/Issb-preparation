/**
 * Image Processing Utility for ISSB Paper Test Mode
 * Handles client-side validation, compression, and base64 conversion.
 * Designed for mobile camera uploads of handwritten answer sheets.
 */

const MAX_FILE_SIZE_MB = 10 // Max raw upload size
const MAX_WIDTH = 1200 // Resize target for OCR readability
const JPEG_QUALITY = 0.75 // Compression quality
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

/**
 * Validates an image file before processing.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImage(file) {
  if (!file) return { valid: false, error: 'No file selected.' }

  // Check type — HEIC is common on iPhones, Canvas will still handle it
  const type = file.type || ''
  if (!ALLOWED_TYPES.includes(type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic|heif)$/i)) {
    return { valid: false, error: `Unsupported format "${type || file.name.split('.').pop()}". Use JPEG, PNG, or WebP.` }
  }

  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > MAX_FILE_SIZE_MB) {
    return { valid: false, error: `File is ${sizeMB.toFixed(1)}MB — maximum is ${MAX_FILE_SIZE_MB}MB.` }
  }

  return { valid: true }
}

/**
 * Loads a File into an HTMLImageElement.
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image — file may be corrupt.'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compresses and resizes an image file using Canvas API.
 * Returns a base64 string (without the data:...;base64, prefix) + metadata.
 *
 * @param {File} file - The image file from input/camera
 * @param {object} [opts]
 * @param {number} [opts.maxWidth=1200]
 * @param {number} [opts.quality=0.75]
 * @returns {Promise<{ base64: string, base64WithPrefix: string, mimeType: string, sizeKB: number, width: number, height: number }>}
 */
export async function compressImage(file, opts = {}) {
  const maxWidth = opts.maxWidth ?? MAX_WIDTH
  const quality = opts.quality ?? JPEG_QUALITY

  const img = await loadImageFromFile(file)

  // Calculate new dimensions (maintain aspect ratio)
  let { width, height } = img
  if (width > maxWidth) {
    const ratio = maxWidth / width
    width = maxWidth
    height = Math.round(height * ratio)
  }

  // Draw onto canvas and export as JPEG
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  const base64WithPrefix = dataUrl
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')

  // Calculate approximate size
  const sizeKB = Math.round((base64.length * 3) / 4 / 1024)

  return {
    base64,           // Pure base64 (for Gemini inline_data)
    base64WithPrefix, // data:image/jpeg;base64,... (for OpenAI image_url format)
    mimeType: 'image/jpeg',
    sizeKB,
    width,
    height,
  }
}

/**
 * Processes multiple image files: validates, compresses, and returns structured data.
 *
 * @param {File[]} files - Array of File objects from <input> or drag-and-drop
 * @param {number} [maxImages=10]
 * @returns {Promise<{ images: Array, errors: string[] }>}
 */
export async function processImageFiles(files, maxImages = 10) {
  const images = []
  const errors = []

  const filesToProcess = Array.from(files).slice(0, maxImages)

  for (let i = 0; i < filesToProcess.length; i++) {
    const file = filesToProcess[i]
    const validation = validateImage(file)

    if (!validation.valid) {
      errors.push(`Image ${i + 1}: ${validation.error}`)
      continue
    }

    try {
      const compressed = await compressImage(file)
      images.push({
        ...compressed,
        originalName: file.name,
        originalSizeKB: Math.round(file.size / 1024),
        index: i + 1,
      })
    } catch (err) {
      errors.push(`Image ${i + 1}: ${err.message}`)
    }
  }

  return { images, errors }
}
