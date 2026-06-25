/**
 * useAiAnalysis composable
 * Provides reactive AI analysis state and test-specific analyzers
 * for WAT, SCT, and SRT simulators.
 */

import { ref } from 'vue'
import { analyzeWithAI, delay } from '../services/aiProvider.js'
import { analyzeImage, delay as visionDelay } from '../services/visionProvider.js'

// ---------------------------------------------------------------------------
// ISSB System Prompts (trained on ISSB psychology standards)
// ---------------------------------------------------------------------------

const ISSB_EXPERT_BASE = `You are an expert ISSB (Inter Services Selection Board) psychologist and assessor with 20+ years of experience evaluating Pakistani military officer candidates. You have deep knowledge of the ISSB psychological test battery including WAT, SCT, and SRT.

Your role is to analyze candidate responses and provide precise, honest feedback based on real ISSB evaluation standards. You must:
1. Score each response on a 0–100 scale
2. Identify specific psychological indicators (positive and negative)
3. Flag patterns that would concern an ISSB psychologist
4. Provide actionable improvement tips

ALWAYS respond with valid JSON matching the exact schema provided. No extra text outside JSON.`

const WAT_SYSTEM_PROMPT = `${ISSB_EXPERT_BASE}

ISSB WAT (Word Association Test) Evaluation Criteria:
- EXCELLENT (80-100): Positive, action-centered sentence; shows initiative, duty, courage, social responsibility; 4-8 words; spontaneous and genuine; first-person or third-person action verb
- GOOD (60-79): Positive but generic or slightly passive; no major red flags; acceptable length
- AVERAGE (40-59): Vague, textbook definition, or neutral; not showing officer qualities
- POOR (0-39): Denial/negation ("He never fails"), escape ("He tried to avoid"), textbook definition ("Love is an emotion"), blank, or shows psychological conflict

RED FLAGS (deduct heavily):
- Double negatives: "He did not fail", "He never gives up" (avoidance pattern)
- Textbook definitions: "Country is a nation", "Atom is a particle"
- Copied guide answers: overly formal, memorized phrases
- Passive resignation: "He accepted failure sadly"
- Blank/no response: indicates psychological block (score: 0)

IDEAL RESPONSES look like:
- "Country" → "We serve our country with pride." (action-duty)
- "Fear" → "He overcomes fear through discipline." (resolution)
- "Fail" → "Failure teaches us to try harder." (growth mindset)
- "Death" → "He died protecting his team bravely." (sacrifice)

Respond ONLY with JSON in this exact schema. You MUST evaluate and include EVERY SINGLE item from the candidate's responses in the 'items' array. The length of the 'items' array must exactly match the number of responses. Do not skip any item indices.
{
  "overallScore": <0-100 integer>,
  "overallGrade": "<A+/A/B+/B/C+/C/D>",
  "psychologicalProfile": "<2-3 sentence profile of candidate psychology>",
  "summary": "<1 sentence overall assessment>",
  "items": [
    {
      "index": <number>,
      "prompt": "<word>",
      "answer": "<candidate sentence>",
      "score": <0-100>,
      "rating": "<Excellent|Good|Average|Poor|Blank>",
      "strengths": ["<strength1>", "<strength2>"],
      "issues": ["<issue1>"],
      "improvements": "<specific better sentence or 'Perfect' if none needed>",
      "issueTags": ["<tag like: Denial|Definition|Passive|Blank|Generic|Negative>"]
    }
  ],
  "topMistakes": ["<mistake pattern 1>", "<mistake pattern 2>"],
  "recommendations": ["<personalized study tip 1>", "<personalized study tip 2>", "<tip 3>"]
}`

const SCT_SYSTEM_PROMPT = `${ISSB_EXPERT_BASE}

ISSB SCT (Sentence Completion Test) Evaluation Criteria:
The SCT reveals emotional conflicts, family relationships, social adjustment, and personal maturity. Each completion is analyzed for:

PSYCHOLOGICAL DOMAINS:
- Family Relations (father, mother sentences): Must be warm, respectful, positive
- Authority Relations (teacher, officer sentences): Must be cooperative, non-rebellious
- Stress Response (crisis, difficult sentences): Must show calm, decisive action
- Self-Concept (failure, fear sentences): Must show growth mindset, not self-pity
- Social Adjustment (team, friend sentences): Must show cooperation, empathy
- Future Orientation (future sentences): Must be optimistic and goal-directed
- Gender Attitudes (women sentences): Must be respectful and progressive

RED FLAGS:
- Family conflict: "My father always scolds me" (family distress)
- Authority rebellion: "The teacher was wrong about me" 
- Passivity: "He wanted to sleep" or "He wanted to go home"
- Dependency: "He needed someone to help him"
- Pessimism: "The future is uncertain and scary"
- Blank: indicates emotional avoidance

EXCELLENT completions show: agency, warmth, optimism, duty, leadership
POOR completions reveal: resentment, passivity, conflict, avoidance

Respond ONLY with JSON. You MUST evaluate and include EVERY SINGLE item from the candidate's completions in the 'items' array. The length of the 'items' array must exactly match the number of completions. Do not skip any item indices.
{
  "overallScore": <0-100>,
  "overallGrade": "<A+/A/B+/B/C+/C/D>",
  "psychologicalProfile": "<2-3 sentence profile>",
  "summary": "<1 sentence overall assessment>",
  "items": [
    {
      "index": <number>,
      "prompt": "<sentence starter>",
      "answer": "<candidate completion>",
      "score": <0-100>,
      "rating": "<Excellent|Good|Average|Poor|Blank>",
      "domain": "<Family|Authority|StressResponse|SelfConcept|Social|FutureOrientation|GenderAttitude|General>",
      "strengths": ["<strength>"],
      "issues": ["<issue>"],
      "improvements": "<ideal completion example>",
      "issueTags": ["<tag like: FamilyConflict|Passivity|Rebellion|Pessimism|Blank|Dependency>"]
    }
  ],
  "topMistakes": ["<pattern 1>", "<pattern 2>"],
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]
}`

const SRT_SYSTEM_PROMPT = `${ISSB_EXPERT_BASE}

ISSB SRT (Situation Reaction Test) Evaluation Criteria:
The SRT measures practical intelligence, leadership courage, resourcefulness, and social cooperation under pressure.

SCORING DIMENSIONS for each situation:
1. Action-Taking (0-25): Did they take immediate, concrete action? (vs. freezing/panicking)
2. Realism (0-25): Is the action physically realistic and practical? (vs. superman fantasy)
3. Social Intelligence (0-25): Did they cooperate, lead others, or seek help appropriately?
4. Outcome Focus (0-25): Did they aim for a positive resolution, not just self-preservation?

EXCELLENT (80-100): Brief, structured, realistic sequence — "Informed police, gathered locals, chased culprit, handed over"
GOOD (60-79): Action taken but one dimension weak
AVERAGE (40-59): Partial action, too vague, or overly cautious
POOR (0-39): Panic, passivity, running away, unrealistic violence, blank

RED FLAGS:
- "He ran away" or "He called police and waited" (passive, no leadership)
- "He single-handedly defeated 10 armed men" (unrealistic)
- "He got scared and didn't know what to do" (panic/inaction)  
- "He ignored the situation" (avoidance)
- Blank response (psychological block)

OFFICER-LIKE QUALITIES to reward:
- Immediate action without freezing
- Calm, methodical approach
- Involving others (team, community, authorities)
- Protecting others not just himself
- Creative use of available resources

Respond ONLY with JSON. You MUST evaluate and include EVERY SINGLE item from the candidate's reactions in the 'items' array. The length of the 'items' array must exactly match the number of situations. Do not skip any item indices.
{
  "overallScore": <0-100>,
  "overallGrade": "<A+/A/B+/B/C+/C/D>",
  "psychologicalProfile": "<2-3 sentence profile of leadership style>",
  "summary": "<1 sentence overall assessment>",
  "items": [
    {
      "index": <number>,
      "prompt": "<situation text>",
      "answer": "<candidate reaction>",
      "score": <0-100>,
      "rating": "<Excellent|Good|Average|Poor|Blank>",
      "dimensionScores": {
        "actionTaking": <0-25>,
        "realism": <0-25>,
        "socialIntelligence": <0-25>,
        "outcomeFocus": <0-25>
      },
      "strengths": ["<strength>"],
      "issues": ["<issue>"],
      "improvements": "<ideal model reaction>",
      "issueTags": ["<tag like: Passive|Unrealistic|Panic|Avoidance|Blank|LackOfLeadership>"]
    }
  ],
  "topMistakes": ["<pattern 1>", "<pattern 2>"],
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]
}`

const OPI_SYSTEM_PROMPT = `${ISSB_EXPERT_BASE}

ISSB OPI (Occupational Personality Inventory) Evaluation Criteria:
The OPI evaluates the candidate across the Big Five OCEAN personality traits:
1. Openness to Experience (Intellect, Aesthetics, Adventurousness)
2. Conscientiousness (Duty, Grit, Orderliness, Achievement Striving)
3. Extraversion (Leadership, Initiative, Assertiveness, Gregariousness)
4. Agreeableness (Cooperation, Trust, Altruism, Humility)
5. Emotional Stability / Low Neuroticism (Stress Tolerance, Panic Control, Temper Control)

At ISSB, psychologists look for:
- High Conscientiousness (responsible, disciplined, structured, goal-driven)
- High Emotional Stability / Low Neuroticism (resilient under fire, calm, stable, self-confident)
- High Extraversion (ready to lead, assertive, communicative, active, physically driven)
- High Agreeableness (team player, empathetic, cooperative, but NOT submissive or gullible)
- High Openness (creative planner, intellectually curious, adaptable)

RED FLAGS (Critical Concerns):
- High Neuroticism (anxiety, anger issues, panic in emergency, depression, self-doubt)
- Very low Conscientiousness (messy, lazy, breaks rules, procrastinates, puts off tasks)
- Extravagant "Faking" (answers too good to be true, contradicting similar statements, claiming moral perfection on Lie Scale)
- Neutral Trap (choosing Neutral too often to avoid committing)

Your task is to analyze the candidate's OPI scores and their specific response profile. Provide a comprehensive summary, overall score out of 100, overall grade, a detailed evaluation of each OPI dimension (trait), and specific mistakes to avoid and improvement tips for each trait.

Respond ONLY with JSON in this exact schema:
{
  "overallScore": <0-100 integer representing general suitability>,
  "overallGrade": "<A+/A/B+/B/C+/C/D>",
  "psychologicalProfile": "<detailed multi-sentence analysis of candidate's character traits based on their answers>",
  "summary": "<1 sentence overall suitability assessment>",
  "dimensionEvaluations": {
    "Openness": {
      "score": <0-100 integer matching their performance>,
      "status": "<Strong/Moderate/Needs Improvement>",
      "evaluation": "<2-3 sentences assessing their intellectual flexibility, planning capability, and adaptability>",
      "mistakes": ["<specific mistake in their answers under this trait or things to avoid, or 'None' if excellent>"],
      "tips": ["<concrete recommendation to improve this trait or frame answers better next time>"]
    },
    "Conscientiousness": {
      "score": <0-100 integer>,
      "status": "<Strong/Moderate/Needs Improvement>",
      "evaluation": "<2-3 sentences assessing their discipline, sense of duty, order, and achievement striving>",
      "mistakes": ["<specific mistake in their answers under this trait or things to avoid, or 'None' if excellent>"],
      "tips": ["<concrete recommendation to improve this trait or frame answers better next time>"]
    },
    "Extraversion": {
      "score": <0-100 integer>,
      "status": "<Strong/Moderate/Needs Improvement>",
      "evaluation": "<2-3 sentences assessing their leadership potential, verbal agility, assertiveness, and physical drive>",
      "mistakes": ["<specific mistake in their answers under this trait or things to avoid, or 'None' if excellent>"],
      "tips": ["<concrete recommendation to improve this trait or frame answers better next time>"]
    },
    "Agreeableness": {
      "score": <0-100 integer>,
      "status": "<Strong/Moderate/Needs Improvement>",
      "evaluation": "<2-3 sentences assessing their cooperation, social empathy, trust, and humility without submissiveness>",
      "mistakes": ["<specific mistake in their answers under this trait or things to avoid, or 'None' if excellent>"],
      "tips": ["<concrete recommendation to improve this trait or frame answers better next time>"]
    },
    "EmotionalStability": {
      "score": <0-100 integer>,
      "status": "<Strong/Moderate/Needs Improvement>",
      "evaluation": "<2-3 sentences assessing their stress tolerance, panic threshold, self-esteem, and composure>",
      "mistakes": ["<specific mistake in their answers under this trait or things to avoid, or 'None' if excellent>"],
      "tips": ["<concrete recommendation to improve this trait or frame answers better next time>"]
    }
  },
  "warnings": ["<warning 1 like 'Neutral Trap detected' or 'Consistency discrepancy in Assertiveness' or none>"],
  "recommendations": ["<personalized general recommendation 1>", "<personalized general recommendation 2>"]
}
`


// ---------------------------------------------------------------------------
// Batch Prompts for Chunked Analysis
// ---------------------------------------------------------------------------

const WAT_BATCH_SYSTEM_PROMPT = `${ISSB_EXPERT_BASE}

Evaluate this batch of WAT (Word Association Test) responses.
For each response, score it (0-100), rate it (Excellent/Good/Average/Poor/Blank), list 1-2 strengths or issues, and suggest a specific improvement.

CRITICAL: You MUST evaluate and include EVERY SINGLE item provided in the batch. The 'items' array must contain exactly the same items as the input batch, in the same order. Do not skip any.

Respond ONLY with JSON in this exact schema:
{
  "items": [
    {
      "index": <number>,
      "prompt": "<word>",
      "answer": "<candidate sentence>",
      "score": <0-100>,
      "rating": "<Excellent|Good|Average|Poor|Blank>",
      "strengths": ["<strength>"],
      "issues": ["<issue>"],
      "improvements": "<suggested sentence or 'Perfect'>",
      "issueTags": ["<tag like: Denial|Definition|Passive|Blank|Generic|Negative>"]
    }
  ]
}
`

const SCT_BATCH_SYSTEM_PROMPT = `${ISSB_EXPERT_BASE}

Evaluate this batch of SCT (Sentence Completion Test) responses.
For each completion, score it (0-100), rate it (Excellent/Good/Average/Poor/Blank), identify the psychological domain, list strengths/issues, and suggest an improvement.

CRITICAL: You MUST evaluate and include EVERY SINGLE item provided in the batch. Do not skip any.

Respond ONLY with JSON in this exact schema:
{
  "items": [
    {
      "index": <number>,
      "prompt": "<sentence starter>",
      "answer": "<candidate completion>",
      "score": <0-100>,
      "rating": "<Excellent|Good|Average|Poor|Blank>",
      "domain": "<Family|Authority|StressResponse|SelfConcept|Social|FutureOrientation|GenderAttitude|General>",
      "strengths": ["<strength>"],
      "issues": ["<issue>"],
      "improvements": "<ideal completion>",
      "issueTags": ["<tag like: FamilyConflict|Passivity|Rebellion|Pessimism|Blank|Dependency>"]
    }
  ]
}
`

const SRT_BATCH_SYSTEM_PROMPT = `${ISSB_EXPERT_BASE}

Evaluate this batch of SRT (Situation Reaction Test) responses.
For each reaction, score it (0-100), rate it (Excellent/Good/Average/Poor/Blank), score the individual dimensions, list strengths/issues, and suggest an improvement.

CRITICAL: You MUST evaluate and include EVERY SINGLE item provided in the batch. Do not skip any.

Respond ONLY with JSON in this exact schema:
{
  "items": [
    {
      "index": <number>,
      "prompt": "<situation>",
      "answer": "<candidate reaction>",
      "score": <0-100>,
      "rating": "<Excellent|Good|Average|Poor|Blank>",
      "dimensionScores": {
        "actionTaking": <0-25>,
        "realism": <0-25>,
        "socialIntelligence": <0-25>,
        "outcomeFocus": <0-25>
      },
      "strengths": ["<strength>"],
      "issues": ["<issue>"],
      "improvements": "<ideal reaction>",
      "issueTags": ["<tag like: Passive|Unrealistic|Panic|Avoidance|Blank|LackOfLeadership>"]
    }
  ]
}
`

// ---------------------------------------------------------------------------
// Summary Synthesis Prompts
// ---------------------------------------------------------------------------

const WAT_SUMMARY_SYSTEM_PROMPT = `You are an expert ISSB psychologist. Based on the candidate's WAT (Word Association Test) detailed evaluation results, generate an overall psychological profile, overall score out of 100, overall grade, recurring mistakes, and actionable recommendations.

CANDIDATE PERFORMANCE SUMMARY:
Total words: {total}
Average score: {avgScore}
Excellent answers: {excellentCount}
Good answers: {goodCount}
Average answers: {averageCount}
Poor answers: {poorCount}
Blank/Timed out: {blankCount}

Respond ONLY with JSON in this exact schema:
{
  "overallScore": <0-100 integer representing general suitability>,
  "overallGrade": "<A+/A/B+/B/C+/C/D>",
  "psychologicalProfile": "<2-3 sentence profile>",
  "summary": "<1 sentence overall assessment>",
  "topMistakes": ["<pattern 1>", "<pattern 2>"],
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]
}
`

const SCT_SUMMARY_SYSTEM_PROMPT = `You are an expert ISSB psychologist. Based on the candidate's SCT (Sentence Completion Test) detailed evaluation results, generate an overall psychological profile, overall score out of 100, overall grade, recurring mistakes, and actionable recommendations.

CANDIDATE PERFORMANCE SUMMARY:
Total sentences: {total}
Average score: {avgScore}
Excellent answers: {excellentCount}
Good answers: {goodCount}
Average answers: {averageCount}
Poor answers: {poorCount}
Blank/Left blank: {blankCount}

Respond ONLY with JSON in this exact schema:
{
  "overallScore": <0-100 integer representing general suitability>,
  "overallGrade": "<A+/A/B+/B/C+/C/D>",
  "psychologicalProfile": "<2-3 sentence profile>",
  "summary": "<1 sentence overall assessment>",
  "topMistakes": ["<pattern 1>", "<pattern 2>"],
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]
}
`

const SRT_SUMMARY_SYSTEM_PROMPT = `You are an expert ISSB psychologist. Based on the candidate's SRT (Situation Reaction Test) detailed evaluation results, generate an overall psychological profile, overall score out of 100, overall grade, recurring mistakes, and actionable recommendations.

CANDIDATE PERFORMANCE SUMMARY:
Total situations: {total}
Average score: {avgScore}
Excellent answers: {excellentCount}
Good answers: {goodCount}
Average answers: {averageCount}
Poor answers: {poorCount}
Blank/Timed out: {blankCount}

Respond ONLY with JSON in this exact schema:
{
  "overallScore": <0-100 integer representing general suitability>,
  "overallGrade": "<A+/A/B+/B/C+/C/D>",
  "psychologicalProfile": "<2-3 sentence profile>",
  "summary": "<1 sentence overall assessment>",
  "topMistakes": ["<pattern 1>", "<pattern 2>"],
  "recommendations": ["<tip 1>", "<tip 2>", "<tip 3>"]
}
`

// ---------------------------------------------------------------------------
// Vision OCR Prompts (Paper Test Mode)
// ---------------------------------------------------------------------------

const WAT_OCR_SYSTEM = `You are an expert OCR system specializing in reading handwritten ISSB WAT (Word Association Test) answer sheets. Students write numbered sentences next to each word on paper.

Your job is to extract EVERY handwritten sentence from the photo as accurately as possible.

RULES:
1. Each WAT response is a sentence the student wrote next to or below a numbered word
2. If a response is blank, crossed out, or completely illegible, set sentence to "[BLANK]"
3. Preserve the student's exact wording, including any spelling mistakes — do NOT correct them
4. Number items sequentially starting from 1
5. Extract ALL visible items — do not skip any

Respond ONLY with JSON: { "responses": [{ "index": 1, "sentence": "the student's handwritten sentence" }] }`

const SCT_OCR_SYSTEM = `You are an expert OCR system specializing in reading handwritten ISSB SCT (Sentence Completion Test) answer sheets. Students complete sentence starters by writing the rest of the sentence on paper.

Your job is to extract EVERY handwritten completion from the photo as accurately as possible.

RULES:
1. Each SCT response is the text the student wrote to complete a sentence starter
2. If a response is blank or illegible, set completion to "[BLANK]"
3. Preserve the student's exact wording, including spelling mistakes — do NOT correct them
4. Number items sequentially starting from 1
5. Extract ALL visible items — do not skip any

Respond ONLY with JSON: { "responses": [{ "index": 1, "completion": "the student's handwritten completion" }] }`

const SRT_OCR_SYSTEM = `You are an expert OCR system specializing in reading handwritten ISSB SRT (Situation Reaction Test) answer sheets. Students write their reaction/response to each situation on paper.

Your job is to extract EVERY handwritten reaction from the photo as accurately as possible.

RULES:
1. Each SRT response is the student's written reaction to a given situation
2. If a response is blank or illegible, set reaction to "[BLANK]"
3. Preserve the student's exact wording, including spelling mistakes — do NOT correct them
4. Number items sequentially starting from 1
5. Extract ALL visible items — do not skip any

Respond ONLY with JSON: { "responses": [{ "index": 1, "reaction": "the student's handwritten reaction" }] }`

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAiAnalysis() {
  const isAnalyzing = ref(false)
  const analysisResult = ref(null)
  const analysisError = ref(null)
  const currentProvider = ref(null)

  // Progress tracking
  const analysisProgress = ref(0)       // 0–100
  const analysisPhase = ref(null)        // 'ocr' | 'batch' | 'summary' | null

  // OCR extraction result (for review/edit before evaluation)
  const ocrResult = ref(null)           // { responses: [...], providerName }
  const ocrError = ref(null)
  const analysisProgressText = ref('')   // e.g. "Evaluating batch 2 of 4..."

  // ---- Chunked internal runner ----
  async function runChunkedAnalysis(items, type) {
    isAnalyzing.value = true
    analysisResult.value = null
    analysisError.value = null
    currentProvider.value = null
    analysisProgress.value = 0
    analysisPhase.value = 'batch'
    analysisProgressText.value = 'Preparing analysis...'

    try {
      const chunks = []
      const chunkSize = 10
      for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize))
      }

      const allEvaluatedItems = []
      let batchPrompt = ''
      if (type === 'wat') batchPrompt = WAT_BATCH_SYSTEM_PROMPT
      else if (type === 'sct') batchPrompt = SCT_BATCH_SYSTEM_PROMPT
      else if (type === 'srt') batchPrompt = SRT_BATCH_SYSTEM_PROMPT

      // Reserve 85% of progress for batch evaluation, 15% for summary
      const batchProgressWeight = 85
      const totalChunks = chunks.length

      // 1. Run batch evaluation for each chunk with delays
      for (let cIdx = 0; cIdx < totalChunks; cIdx++) {
        const chunk = chunks[cIdx]

        // Update progress text
        analysisProgressText.value = `Evaluating batch ${cIdx + 1} of ${totalChunks}... (${chunk.length} items)`
        analysisProgress.value = Math.round((cIdx / totalChunks) * batchProgressWeight)

        const chunkText = chunk
          .map((item) => {
            if (type === 'wat') {
              return `${item.index}. Word: "${item.word}" | Answer: "${(!item.text || !item.text.trim()) ? '[BLANK - NO RESPONSE]' : item.text}"`
            } else if (type === 'sct') {
              return `${item.index}. Starter: "${item.prompt}..." | Completion: "${item.text && item.text.trim() ? item.text : '[BLANK - NO RESPONSE]'}"`
            } else {
              return `${item.index}. Situation: "${item.situation}" | Reaction: "${(!item.text || !item.text.trim()) ? '[BLANK - NO RESPONSE]' : item.text}"`
            }
          })
          .join('\n')

        // Per-chunk retry (up to 2 attempts with backoff)
        let chunkSuccess = false
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const { text, providerName } = await analyzeWithAI(
              batchPrompt,
              `Evaluate this batch ${cIdx + 1} of ${totalChunks}:\n\n${chunkText}`,
              3000
            )
            currentProvider.value = providerName

            const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
            const parsed = JSON.parse(cleaned)

            if (parsed.items && Array.isArray(parsed.items)) {
              allEvaluatedItems.push(...parsed.items)
              chunkSuccess = true
              break
            } else {
              throw new Error('AI returned invalid batch response format')
            }
          } catch (chunkErr) {
            console.warn(`[useAiAnalysis] Chunk ${cIdx + 1} attempt ${attempt + 1} failed:`, chunkErr.message)
            if (attempt === 0) {
              analysisProgressText.value = `Batch ${cIdx + 1} failed, retrying in 8s...`
              await delay(8000)
            }
          }
        }

        // If chunk still failed after retries, fill with fallback entries
        if (!chunkSuccess) {
          console.warn(`[useAiAnalysis] Chunk ${cIdx + 1} completely failed, using fallback entries`)
          for (const item of chunk) {
            allEvaluatedItems.push({
              index: item.index,
              prompt: item.word || item.prompt || item.situation || '',
              answer: item.text || '[BLANK - NO RESPONSE]',
              score: 0,
              rating: 'Blank',
              strengths: [],
              issues: ['AI evaluation failed for this item — please retry'],
              improvements: 'N/A',
              issueTags: ['EvaluationFailed'],
            })
          }
        }

        // Update progress after chunk completes
        analysisProgress.value = Math.round(((cIdx + 1) / totalChunks) * batchProgressWeight)

        // Rate-limiting delay between chunks (skip after last chunk)
        // 12 seconds ensures token usage stays within free-tier 60s TPM windows
        if (cIdx < totalChunks - 1) {
          analysisProgressText.value = `Batch ${cIdx + 1} complete. Cooling down before next batch... (12s)`
          await delay(12000)
        }
      }

      // ---- Gap-filling: ensure every input item has a result ----
      const evaluatedIndexSet = new Set(allEvaluatedItems.map((i) => i.index))
      for (const item of items) {
        if (!evaluatedIndexSet.has(item.index)) {
          allEvaluatedItems.push({
            index: item.index,
            prompt: item.word || item.prompt || item.situation || '',
            answer: item.text || '[BLANK - NO RESPONSE]',
            score: 0,
            rating: 'Blank',
            strengths: [],
            issues: ['This item was skipped by AI — please retry analysis'],
            improvements: 'N/A',
            issueTags: ['Skipped'],
          })
        }
      }

      // 2. Compute overall counts
      const total = allEvaluatedItems.length
      const avgScore = Math.round(
        allEvaluatedItems.reduce((acc, curr) => acc + (curr.score || 0), 0) / (total || 1)
      )
      const excellentCount = allEvaluatedItems.filter((i) => i.rating === 'Excellent').length
      const goodCount = allEvaluatedItems.filter((i) => i.rating === 'Good').length
      const averageCount = allEvaluatedItems.filter((i) => i.rating === 'Average').length
      const poorCount = allEvaluatedItems.filter((i) => i.rating === 'Poor').length
      const blankCount = allEvaluatedItems.filter((i) => i.rating === 'Blank' || i.rating === 'Blank/Avoidance').length

      // 3. Summary synthesis phase
      analysisPhase.value = 'summary'
      analysisProgress.value = 88
      analysisProgressText.value = 'Generating overall psychological profile...'

      const responsesSummary = allEvaluatedItems
        .sort((a, b) => a.index - b.index)
        .map(
          (item) =>
            `- #${item.index}. Prompt: "${item.prompt || ''}" | Answer: "${item.answer || ''}" | Score: ${item.score}/100 | Rating: ${item.rating} | Issues: ${item.issues?.join(', ') || 'None'}`
        )
        .join('\n')

      let summaryPrompt = ''
      if (type === 'wat') summaryPrompt = WAT_SUMMARY_SYSTEM_PROMPT
      else if (type === 'sct') summaryPrompt = SCT_SUMMARY_SYSTEM_PROMPT
      else if (type === 'srt') summaryPrompt = SRT_SUMMARY_SYSTEM_PROMPT

      const userContent = `CANDIDATE DETAILS AND RATINGS:
${responsesSummary}

Total: ${total}
Average Item Score: ${avgScore}`

      // Fill placeholders in prompt
      const finalPrompt = summaryPrompt
        .replace('{total}', total)
        .replace('{avgScore}', avgScore)
        .replace('{excellentCount}', excellentCount)
        .replace('{goodCount}', goodCount)
        .replace('{averageCount}', averageCount)
        .replace('{poorCount}', poorCount)
        .replace('{blankCount}', blankCount)

      analysisProgress.value = 92

      const { text: summaryText, providerName: finalProvider } = await analyzeWithAI(
        finalPrompt,
        userContent,
        2500
      )
      currentProvider.value = finalProvider

      analysisProgress.value = 97
      analysisProgressText.value = 'Finalizing report...'

      const summaryCleaned = summaryText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      const summaryParsed = JSON.parse(summaryCleaned)

      // Merge items and summaries
      analysisResult.value = {
        overallScore: summaryParsed.overallScore ?? avgScore,
        overallGrade: summaryParsed.overallGrade ?? 'C',
        psychologicalProfile: summaryParsed.psychologicalProfile,
        summary: summaryParsed.summary,
        items: allEvaluatedItems.sort((a, b) => a.index - b.index),
        topMistakes: summaryParsed.topMistakes,
        recommendations: summaryParsed.recommendations,
      }

      analysisProgress.value = 100
      analysisProgressText.value = 'Analysis complete!'
    } catch (err) {
      console.error('[useAiAnalysis] Chunked Error:', err)
      analysisError.value = err.message ?? 'Unknown error occurred during analysis.'
    } finally {
      isAnalyzing.value = false
      analysisPhase.value = null
    }
  }

  // ---- Shared internal runner ----
  async function runAnalysis(systemPrompt, userContent) {
    isAnalyzing.value = true
    analysisResult.value = null
    analysisError.value = null
    currentProvider.value = null
    analysisProgress.value = 30
    analysisProgressText.value = 'Analyzing test answers with AI...'

    try {
      const { text, providerName } = await analyzeWithAI(systemPrompt, userContent, 3000)
      currentProvider.value = providerName
      analysisProgress.value = 80
      analysisProgressText.value = 'Parsing psychological evaluation...'

      // Parse JSON — handle markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned)
      analysisResult.value = parsed
      analysisProgress.value = 100
      analysisProgressText.value = 'Analysis complete!'
    } catch (err) {
      console.error('[useAiAnalysis] Error:', err)
      analysisError.value = err.message ?? 'Unknown error occurred during analysis.'
    } finally {
      isAnalyzing.value = false
    }
  }

  // ---- WAT Analyzer ----
  async function analyzeWAT(responses) {
    if (responses.length > 30) {
      const items = responses.map((r, i) => ({
        index: i + 1,
        word: r.word,
        prompt: r.word,
        text: r.text,
        timeOut: r.timeOut
      }))
      await runChunkedAnalysis(items, 'wat')
      return
    }

    const answered = responses.filter((r) => r.text && r.text.trim())
    const total = responses.length

    const itemsText = responses
      .map(
        (r, i) =>
          `${i + 1}. Word: "${r.word}" | Answer: "${(!r.text || !r.text.trim()) ? '[BLANK - NO RESPONSE]' : r.text}"`
      )
      .join('\n')

    const userContent = `Analyze this WAT test submission from an ISSB candidate.

Total words: ${total}
Answered: ${answered.length}
Blank/Timed out: ${total - answered.length}

CANDIDATE RESPONSES:
${itemsText}

Provide detailed ISSB psychological analysis. Be honest and precise — this feedback will help the candidate improve.`

    await runAnalysis(WAT_SYSTEM_PROMPT, userContent)
  }

  // ---- SCT Analyzer ----
  async function analyzeSCT(responses, language = 'english') {
    if (responses.length > 30) {
      const items = responses.map((r, i) => ({
        index: i + 1,
        prompt: r.prompt,
        text: r.text
      }))
      await runChunkedAnalysis(items, 'sct')
      return
    }

    const answered = responses.filter((r) => r.text && r.text.trim())
    const total = responses.length

    const itemsText = responses
      .map(
        (r, i) =>
          `${i + 1}. Starter: "${r.prompt}..." | Completion: "${r.text && r.text.trim() ? r.text : '[BLANK - NO RESPONSE]'}"`
      )
      .join('\n')

    const userContent = `Analyze this SCT test submission from an ISSB candidate.

Language: ${language.toUpperCase()}
Total sentences: ${total}
Completed: ${answered.length}
Left blank: ${total - answered.length}

CANDIDATE COMPLETIONS:
${itemsText}

Evaluate each completion against ISSB psychological standards. Identify emotional patterns, family adjustment, stress response quality, and social maturity indicators.`

    await runAnalysis(SCT_SYSTEM_PROMPT, userContent)
  }

  // ---- SRT Analyzer ----
  async function analyzeSRT(responses) {
    if (responses.length > 30) {
      const items = responses.map((r, i) => ({
        index: i + 1,
        situation: r.situation,
        prompt: r.situation,
        text: r.text,
        timeOut: r.timeOut
      }))
      await runChunkedAnalysis(items, 'srt')
      return
    }

    const answered = responses.filter((r) => r.text && r.text.trim())
    const total = responses.length

    const itemsText = responses
      .map(
        (r, i) =>
          `${i + 1}. Situation: "${r.situation}" | Reaction: "${(!r.text || !r.text.trim()) ? '[BLANK - NO RESPONSE]' : r.text}"`
      )
      .join('\n')

    const userContent = `Analyze this SRT test submission from an ISSB candidate.

Total situations: ${total}
Reacted to: ${answered.length}
Blank/Timed out: ${total - answered.length}

CANDIDATE REACTIONS:
${itemsText}

Evaluate each reaction for officer-like qualities: courage, realism, leadership, social intelligence, and practical problem-solving. Score each situation across all dimensions.`

    await runAnalysis(SRT_SYSTEM_PROMPT, userContent)
  }

  // ---- OPI Analyzer ----
  async function analyzeOPI(responses, scores, consistencyScore, neutralPercentage) {
    const scoresSummary = Object.entries(scores)
      .map(([dim, pct]) => `${dim}: ${pct.toFixed(1)}%`)
      .join(', ')

    const flaggedItems = responses
      .filter((r) => Math.abs(r.value - r.recommendedValue) >= 3)
      .slice(0, 15)
      .map(
        (r) =>
          `- Statement: "${r.statement}" | Answer: ${r.userChoiceText} (Recommended: ${r.recommendedChoice}) | Trait: ${r.trait} | Rationale: ${r.rationale}`
      )
      .join('\n')

    const userContent = `Analyze this OPI (Occupational Personality Inventory) submission from an ISSB candidate.

OPI SCORING SUMMARY:
${scoresSummary}
Consistency Score: ${consistencyScore.toFixed(1)}%
Neutral Answers: ${neutralPercentage.toFixed(1)}% of total test items.

TOP FLAGGED DEVIATIONS (Discrepancies from military recommendations):
${flaggedItems || 'None (Excellent alignment!)'}

Provide a detailed psychological review focusing on the candidate's Big Five personality profile, their suitability for a military commission, consistency checks, and specific advice to overcome their weaknesses.`

    await runAnalysis(OPI_SYSTEM_PROMPT, userContent)
  }

  // ---- Vision OCR Extraction (Paper Test Mode) ----
  /**
   * Extract handwritten responses from uploaded images using Vision OCR.
   * Returns structured data for user review/editing before evaluation.
   *
   * @param {Array<{base64: string, mimeType: string}>} images - Compressed images
   * @param {'wat'|'sct'|'srt'} testType
   * @param {string[]} [promptList] - The words/starters/situations shown during paper test
   */
  async function extractFromImages(images, testType, promptList = []) {
    isAnalyzing.value = true
    ocrResult.value = null
    ocrError.value = null
    analysisResult.value = null
    analysisError.value = null
    currentProvider.value = null
    analysisProgress.value = 0
    analysisPhase.value = 'ocr'
    analysisProgressText.value = 'Preparing to extract handwriting...'

    try {
      let systemPrompt = WAT_OCR_SYSTEM
      if (testType === 'sct') systemPrompt = SCT_OCR_SYSTEM
      else if (testType === 'srt') systemPrompt = SRT_OCR_SYSTEM

      const allExtracted = []
      const totalImages = images.length

      for (let i = 0; i < totalImages; i++) {
        const img = images[i]
        analysisProgressText.value = `Extracting handwriting from page ${i + 1} of ${totalImages}...`
        analysisProgress.value = Math.round(((i) / totalImages) * 80)

        let textPrompt = ''
        if (testType === 'wat') {
          textPrompt = `Extract all handwritten WAT sentences from this answer sheet photo. This is page ${i + 1} of ${totalImages}.`
        } else if (testType === 'sct') {
          textPrompt = `Extract all handwritten sentence completions from this SCT answer sheet photo. This is page ${i + 1} of ${totalImages}.`
        } else {
          textPrompt = `Extract all handwritten reactions from this SRT answer sheet photo. This is page ${i + 1} of ${totalImages}.`
        }

        // Retry logic per image
        let extracted = null
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const { text, providerName } = await analyzeImage(
              systemPrompt,
              textPrompt,
              img.base64,
              img.mimeType
            )
            currentProvider.value = providerName

            const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
            const parsed = JSON.parse(cleaned)

            if (parsed.responses && Array.isArray(parsed.responses)) {
              extracted = parsed.responses
              break
            } else {
              throw new Error('OCR returned invalid format')
            }
          } catch (err) {
            console.warn(`[OCR] Image ${i + 1} attempt ${attempt + 1} failed:`, err.message)
            if (attempt === 0) {
              analysisProgressText.value = `Page ${i + 1} failed, retrying...`
              await delay(3000)
            }
          }
        }

        if (extracted) {
          allExtracted.push(...extracted)
        } else {
          console.warn(`[OCR] Image ${i + 1} completely failed`)
        }

        analysisProgress.value = Math.round(((i + 1) / totalImages) * 80)

        // Rate-limiting delay between images (throttling vision requests sequentially)
        if (i < totalImages - 1) {
          analysisProgressText.value = `Page ${i + 1} done. Waiting before next...`
          await delay(4000)
        }
      }

      if (allExtracted.length === 0) {
        throw new Error('Could not extract any text from the uploaded images. Please ensure the images are clear and contain handwritten answers.')
      }

      analysisProgress.value = 85
      analysisProgressText.value = 'Structuring extracted responses...'

      // Re-index sequentially and map to the prompt list if available
      const structuredResponses = allExtracted.map((item, idx) => {
        const seqIndex = idx + 1
        const promptItem = promptList[idx] || ''

        if (testType === 'wat') {
          return {
            index: seqIndex,
            word: promptItem,
            text: item.sentence || item.text || item.completion || item.reaction || '[BLANK]',
            timeOut: false,
          }
        } else if (testType === 'sct') {
          return {
            index: seqIndex,
            prompt: promptItem,
            text: item.completion || item.sentence || item.text || item.reaction || '[BLANK]',
          }
        } else {
          return {
            index: seqIndex,
            situation: promptItem,
            text: item.reaction || item.sentence || item.text || item.completion || '[BLANK]',
            timeOut: false,
          }
        }
      })

      // If we have more prompts than extracted, fill remaining as blank
      if (promptList.length > structuredResponses.length) {
        for (let i = structuredResponses.length; i < promptList.length; i++) {
          const seqIndex = i + 1
          if (testType === 'wat') {
            structuredResponses.push({ index: seqIndex, word: promptList[i], text: '[BLANK]', timeOut: false })
          } else if (testType === 'sct') {
            structuredResponses.push({ index: seqIndex, prompt: promptList[i], text: '[BLANK]' })
          } else {
            structuredResponses.push({ index: seqIndex, situation: promptList[i], text: '[BLANK]', timeOut: false })
          }
        }
      }

      analysisProgress.value = 90
      analysisProgressText.value = 'Extraction complete! Review your answers below.'

      ocrResult.value = {
        responses: structuredResponses,
        providerName: currentProvider.value,
        totalExtracted: allExtracted.length,
        totalExpected: promptList.length || allExtracted.length,
      }
    } catch (err) {
      console.error('[OCR] Extraction error:', err)
      ocrError.value = err.message ?? 'Failed to extract text from images.'
    } finally {
      isAnalyzing.value = false
      analysisPhase.value = null
    }
  }

  // ---- Reset ----
  function resetAnalysis() {
    isAnalyzing.value = false
    analysisResult.value = null
    analysisError.value = null
    currentProvider.value = null
    analysisProgress.value = 0
    analysisPhase.value = null
    analysisProgressText.value = ''
    ocrResult.value = null
    ocrError.value = null
  }

  return {
    isAnalyzing,
    analysisResult,
    analysisError,
    currentProvider,
    analysisProgress,
    analysisPhase,
    analysisProgressText,
    ocrResult,
    ocrError,
    analyzeWAT,
    analyzeSCT,
    analyzeSRT,
    analyzeOPI,
    extractFromImages,
    resetAnalysis,
  }
}
