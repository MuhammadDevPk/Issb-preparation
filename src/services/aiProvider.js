/**
 * ISSB AI Provider Service
 * Rotating multi-provider engine: Groq → Gemini → OpenRouter → SiliconFlow
 * Auto-falls to next provider on 429 / 5xx errors.
 * Usage counts tracked in localStorage with daily reset.
 */

// ---------------------------------------------------------------------------
// Provider definitions
// ---------------------------------------------------------------------------

// Helper to parse comma-separated keys from .env
const getKeys = (envVar) => {
  if (!envVar) return []
  return envVar.split(',').map(k => k.trim()).filter(Boolean)
}

const groqKeys = getKeys(import.meta.env.VITE_GROQ_KEYS || import.meta.env.VITE_GROQ_API_KEY)
const geminiKeys = getKeys(import.meta.env.VITE_GEMINI_KEYS || import.meta.env.VITE_GEMINI_API_KEY)
const openRouterKeys = getKeys(import.meta.env.VITE_OPENROUTER_KEYS || import.meta.env.VITE_OPENROUTER_API_KEY)
const siliconKeys = getKeys(import.meta.env.VITE_SILICON_KEYS || import.meta.env.VITE_SILICON_API_KEY)

const PROVIDERS = []

// 1. Generate Groq Pool
groqKeys.forEach((key, index) => {
  PROVIDERS.push({
    id: `groq-${index + 1}`,
    name: `Groq (Key ${index + 1})`,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    apiKey: key,
    dailyLimit: 500,
    isDead: false,
    buildHeaders(key) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      }
    },
    buildBody(model, systemPrompt, userContent, maxTokens) {
      return JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })
    },
    extractText(data) {
      return data?.choices?.[0]?.message?.content ?? null
    },
  })
})

// 2. Generate Gemini Pool
geminiKeys.forEach((key, index) => {
  PROVIDERS.push({
    id: `gemini-${index + 1}`,
    name: `Gemini (Key ${index + 1})`,
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    model: 'gemini-2.5-flash',
    apiKey: key,
    dailyLimit: 1000,
    isDead: false,
    buildHeaders(key) {
      return {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      }
    },
    buildBody(_model, systemPrompt, userContent, maxTokens) {
      return JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userContent }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      })
    },
    extractText(data) {
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    },
  })
})

// 3. Generate OpenRouter Pool
openRouterKeys.forEach((key, index) => {
  PROVIDERS.push({
    id: `openrouter-${index + 1}`,
    name: `OpenRouter (Key ${index + 1})`,
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKey: key,
    dailyLimit: 9999,
    isDead: false,
    buildHeaders(key) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': 'https://issb-prep.vercel.app',
        'X-Title': 'ISSB Prep AI',
      }
    },
    buildBody(model, systemPrompt, userContent, maxTokens) {
      return JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      })
    },
    extractText(data) {
      return data?.choices?.[0]?.message?.content ?? null
    },
  })
})

// 4. Generate SiliconFlow Pool
siliconKeys.forEach((key, index) => {
  PROVIDERS.push({
    id: `siliconflow-${index + 1}`,
    name: `SiliconFlow (Key ${index + 1})`,
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    apiKey: key,
    dailyLimit: 9999,
    isDead: false,
    buildHeaders(key) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      }
    },
    buildBody(model, systemPrompt, userContent, maxTokens) {
      return JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })
    },
    extractText(data) {
      return data?.choices?.[0]?.message?.content ?? null
    },
  })
})

// ---------------------------------------------------------------------------
// Usage tracking helpers
// ---------------------------------------------------------------------------

const USAGE_KEY = 'issb_ai_usage'

function getTodayKey() {
  return new Date().toISOString().slice(0, 10) // "2026-06-13"
}

function getUsage() {
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    // Reset if date changed
    if (parsed._date !== getTodayKey()) return {}
    return parsed
  } catch {
    return {}
  }
}

function incrementUsage(providerId) {
  const usage = getUsage()
  usage._date = getTodayKey()
  usage[providerId] = (usage[providerId] ?? 0) + 1
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
}

function isProviderAtLimit(provider) {
  const usage = getUsage()
  return (usage[provider.id] ?? 0) >= provider.dailyLimit
}

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
// Core request function (single provider attempt)
// ---------------------------------------------------------------------------

async function callProvider(provider, systemPrompt, userContent, maxTokens = 2000) {
  if (!provider.apiKey) throw new Error(`No API key for ${provider.id}`)

  const url = provider.id.startsWith('gemini')
    ? `${provider.endpoint}?key=${provider.apiKey}`
    : provider.endpoint

  const headers = provider.buildHeaders(provider.apiKey)
  const body = provider.buildBody(provider.model, systemPrompt, userContent, maxTokens)

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
    throw Object.assign(new Error(`Provider ${provider.id} rate limited (429)`), {
      isRetryable: true,
    })
  }

  if (res.status === 503) {
    throw Object.assign(new Error(`Provider ${provider.id} temporarily unavailable (503)`), {
      isRetryable: true,
    })
  }

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Provider ${provider.id} error ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = provider.extractText(data)

  if (!text) throw new Error(`Provider ${provider.id} returned empty response`)

  incrementUsage(provider.id)
  return { text, providerName: provider.name }
}

// ---------------------------------------------------------------------------
// Public API: analyzeWithAI
// ---------------------------------------------------------------------------

/**
 * Send a prompt to AI providers in rotation.
 * Retries 429 errors once (with backoff) before falling to next provider.
 * Returns { text: string, providerName: string }
 *
 * @param {string} systemPrompt - The ISSB expert persona / rules
 * @param {string} userContent  - The candidate answers to analyze
 * @param {number} [maxTokens]  - Token budget for the response
 */
export async function analyzeWithAI(systemPrompt, userContent, maxTokens = 2500) {
  const errors = []

  // Filter out providers that are at daily limit, on cooldown, or marked as dead
  let availableProviders = PROVIDERS.filter(
    (p) => !isProviderAtLimit(p) && !isProviderOnCooldown(p.id) && !p.isDead,
  )

  // If everyone is on cooldown/dead/limit, throw immediately.
  if (availableProviders.length === 0) {
    throw new Error("⏳ AI is currently overloaded or all keys are invalid. Please check keys or wait 3 minutes.")
  }

  for (const provider of availableProviders) {
    // Attempt with up to 2 retries on 429/503 (short escalating backoff)
    // Kept short so a failing provider is put on cooldown quickly,
    // allowing the next healthy provider to take over without long waits.
    const RETRY_DELAYS = [2000, 4000]
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await callProvider(provider, systemPrompt, userContent, maxTokens)
        return result
      } catch (err) {
        if (err.isRetryable && attempt < 1) {
          const backoff = RETRY_DELAYS[attempt]
          console.warn(
            `[AI] ${provider.name} ${err.message}, retry ${attempt + 1}/1 in ${backoff / 1000}s...`,
          )
          await delay(backoff)
          continue
        }
        console.warn(`[AI] ${provider.name} failed:`, err.message)
        // Put on cooldown on failure (so subsequent chunks skip it)
        putProviderOnCooldown(provider.id)
        errors.push(`${provider.name}: ${err.message}`)
        break
      }
    }
  }

  throw new Error(`All AI providers failed or exhausted.\n\nDetails:\n${errors.join('\n')}`)
}

/** Exposed delay utility for chunked analysis pacing */
export { delay }

/**
 * Returns current provider usage stats for display.
 */
export function getProviderUsageStats() {
  const usage = getUsage()
  return PROVIDERS.map((p) => ({
    id: p.id,
    name: p.name,
    used: usage[p.id] ?? 0,
    limit: p.dailyLimit,
    exhausted: isProviderAtLimit(p),
  }))
}
