/**
 * ISSB Vision Provider Service
 * Multi-provider vision OCR engine: Gemini → Groq Vision → OpenRouter Vision
 * Handles image-based text extraction from handwritten answer sheets.
 * Auto-falls to next provider on 429 / 5xx errors.
 */

// ---------------------------------------------------------------------------
// Vision Provider definitions
// ---------------------------------------------------------------------------

// Helper to parse comma-separated keys from .env
const getKeys = (envVar) => {
  if (!envVar) return []
  return envVar.split(',').map(k => k.trim()).filter(Boolean)
}

const groqKeys = getKeys(import.meta.env.VITE_GROQ_KEYS || import.meta.env.VITE_GROQ_API_KEY)
const geminiKeys = getKeys(import.meta.env.VITE_GEMINI_KEYS || import.meta.env.VITE_GEMINI_API_KEY)
const openRouterKeys = getKeys(import.meta.env.VITE_OPENROUTER_KEYS || import.meta.env.VITE_OPENROUTER_API_KEY)

const VISION_PROVIDERS = []

// 1. Generate Gemini Vision Pool
geminiKeys.forEach((key, index) => {
  VISION_PROVIDERS.push({
    id: `gemini-vision-${index + 1}`,
    name: `Gemini Vision (Key ${index + 1})`,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    apiKey: key,
    isDead: false,
    buildHeaders(key) {
      return {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      }
    },
    buildUrl(key) {
      return `${this.endpoint}?key=${key}`
    },
    buildBody(systemPrompt, textPrompt, base64Image, mimeType) {
      return JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: textPrompt },
          ]
        }],
        generationConfig: {
          maxOutputTokens: 4000,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      })
    },
    extractText(data) {
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    },
  })
})

// 2. Generate Groq Vision Pool
groqKeys.forEach((key, index) => {
  VISION_PROVIDERS.push({
    id: `groq-vision-${index + 1}`,
    name: `Groq Vision (Key ${index + 1})`,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    apiKey: key,
    isDead: false,
    buildHeaders(key) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      }
    },
    buildUrl() {
      return this.endpoint
    },
    buildBody(systemPrompt, textPrompt, base64Image, mimeType) {
      return JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
              { type: 'text', text: textPrompt },
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })
    },
    extractText(data) {
      return data?.choices?.[0]?.message?.content ?? null
    },
  })
})

// 3. Generate OpenRouter Vision Pool
openRouterKeys.forEach((key, index) => {
  VISION_PROVIDERS.push({
    id: `openrouter-vision-${index + 1}`,
    name: `OpenRouter Vision (Key ${index + 1})`,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'google/gemma-4-31b-it:free',
    apiKey: key,
    isDead: false,
    buildHeaders(key) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://issb-prep.vercel.app',
        'X-Title': 'ISSB Prep Vision OCR',
      }
    },
    buildUrl() {
      return this.endpoint
    },
    buildBody(systemPrompt, textPrompt, base64Image, mimeType) {
      return JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
              { type: 'text', text: textPrompt },
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      })
    },
    extractText(data) {
      return data?.choices?.[0]?.message?.content ?? null
    },
  })
})

// ---------------------------------------------------------------------------
// Cooldown Mechanism (avoid hammering rate-limited or failed providers)
// ---------------------------------------------------------------------------

const COOLDOWN_DURATION = 3 * 60 * 1000 // 3 minutes cooldown
const tempCooldowns = {}

function isProviderOnCooldown(providerId) {
  const expiry = tempCooldowns[providerId]
  if (!expiry) return false
  if (Date.now() > expiry) {
    delete tempCooldowns[providerId]
    return false
  }
  return true
}

function putProviderOnCooldown(providerId) {
  tempCooldowns[providerId] = Date.now() + COOLDOWN_DURATION
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Core vision request (single provider attempt)
// ---------------------------------------------------------------------------

async function callVisionProvider(provider, systemPrompt, textPrompt, base64Image, mimeType) {
  if (!provider.apiKey) throw new Error(`No API key for ${provider.id}`)

  const url = provider.buildUrl(provider.apiKey)
  const headers = provider.buildHeaders(provider.apiKey)
  const body = provider.buildBody(systemPrompt, textPrompt, base64Image, mimeType)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
  })

  // 401 Kill Switch: If key is unauthorized or forbidden, mark it as dead
  if (res.status === 401 || res.status === 403) {
    provider.isDead = true
    throw new Error(`Provider ${provider.id} error ${res.status}: Invalid API Key. Marked as dead.`)
  }

  if (res.status === 429) {
    throw Object.assign(new Error(`Vision provider ${provider.id} rate limited (429)`), { isRetryable: true })
  }

  if (res.status === 503) {
    throw Object.assign(new Error(`Vision provider ${provider.id} temporarily unavailable (503)`), { isRetryable: true })
  }

  if (!res.ok) {
    const errText = await res.text()
    const shortErr = errText.slice(0, 300)
    // 400 = bad request / model decommissioned, 404 = model not found
    // All non-OK responses trigger fallback to next provider
    throw new Error(`Provider ${provider.id} error ${res.status}: ${shortErr}`)
  }

  const data = await res.json()
  const text = provider.extractText(data)

  if (!text) throw new Error(`Vision provider ${provider.id} returned empty response`)

  return { text, providerName: provider.name }
}

// ---------------------------------------------------------------------------
// Public API: analyzeImage
// ---------------------------------------------------------------------------

/**
 * Send an image + prompt to vision providers in rotation.
 * Retries 429/503 errors with escalating backoff before falling to next provider.
 *
 * @param {string} systemPrompt - The OCR extraction rules
 * @param {string} textPrompt   - The specific instruction (e.g. "Extract WAT responses...")
 * @param {string} base64Image  - Pure base64 image data (no prefix)
 * @param {string} mimeType     - e.g. "image/jpeg"
 * @returns {Promise<{ text: string, providerName: string }>}
 */
export async function analyzeImage(systemPrompt, textPrompt, base64Image, mimeType = 'image/jpeg') {
  const errors = []

  // Filter out providers that are on cooldown or marked as dead
  let availableProviders = VISION_PROVIDERS.filter((p) => !isProviderOnCooldown(p.id) && !p.isDead)

  // If everyone is on cooldown or dead, throw an error immediately.
  if (availableProviders.length === 0) {
    throw new Error("⏳ Vision AI is currently overloaded or all keys are invalid. Please check keys or wait 3 minutes.")
  }

  for (const provider of availableProviders) {
    // Attempt with up to 2 retries on 429/503 (short escalating backoff)
    const RETRY_DELAYS = [2000, 4000]
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await callVisionProvider(provider, systemPrompt, textPrompt, base64Image, mimeType)
        return result
      } catch (err) {
        if (err.isRetryable && attempt < 1) {
          const backoff = RETRY_DELAYS[attempt]
          console.warn(`[Vision] ${provider.name} ${err.message}, retry ${attempt + 1}/1 in ${backoff / 1000}s...`)
          await delay(backoff)
          continue
        }
        console.warn(`[Vision] ${provider.name} failed:`, err.message)
        // Put on cooldown on failure (so subsequent images skip it)
        putProviderOnCooldown(provider.id)
        errors.push(`${provider.name}: ${err.message}`)
        break
      }
    }
  }

  throw new Error(
    `All vision providers failed.\n\nDetails:\n${errors.join('\n')}`
  )
}

export { delay }
