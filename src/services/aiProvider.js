/**
 * ISSB AI Provider Service
 * Rotating multi-provider engine: Groq → Gemini → OpenRouter → SiliconFlow
 * Auto-falls to next provider on 429 / 5xx errors.
 * Usage counts tracked in localStorage with daily reset.
 */

// ---------------------------------------------------------------------------
// Provider definitions
// ---------------------------------------------------------------------------

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq (Llama 3.3)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dailyLimit: 500,
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
  },
  {
    id: 'gemini',
    name: 'Gemini 2.0 Flash',
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    model: 'gemini-2.0-flash',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    dailyLimit: 1000,
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
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Llama 3)',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    dailyLimit: 9999,
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
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow (Qwen)',
    endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    apiKey: import.meta.env.VITE_SILICON_API_KEY,
    dailyLimit: 9999,
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
  },
]

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
// Core request function (single provider attempt)
// ---------------------------------------------------------------------------

async function callProvider(provider, systemPrompt, userContent, maxTokens = 2000) {
  if (!provider.apiKey) throw new Error(`No API key for ${provider.id}`)

  const url =
    provider.id === 'gemini'
      ? `${provider.endpoint}?key=${provider.apiKey}`
      : provider.endpoint

  const headers =
    provider.id === 'gemini'
      ? provider.buildHeaders(provider.apiKey)
      : provider.buildHeaders(provider.apiKey)

  const body = provider.buildBody(provider.model, systemPrompt, userContent, maxTokens)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
  })

  if (res.status === 429 || res.status >= 500) {
    throw new Error(`Provider ${provider.id} returned ${res.status}`)
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
 * Returns { text: string, providerName: string }
 *
 * @param {string} systemPrompt - The ISSB expert persona / rules
 * @param {string} userContent  - The candidate answers to analyze
 * @param {number} [maxTokens]  - Token budget for the response
 */
export async function analyzeWithAI(systemPrompt, userContent, maxTokens = 2500) {
  const errors = []

  for (const provider of PROVIDERS) {
    if (isProviderAtLimit(provider)) {
      errors.push(`${provider.name}: daily limit reached`)
      continue
    }

    try {
      const result = await callProvider(provider, systemPrompt, userContent, maxTokens)
      return result
    } catch (err) {
      console.warn(`[AI] ${provider.name} failed:`, err.message)
      errors.push(`${provider.name}: ${err.message}`)
    }
  }

  throw new Error(
    `All AI providers failed or exhausted.\n\nDetails:\n${errors.join('\n')}`
  )
}

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
