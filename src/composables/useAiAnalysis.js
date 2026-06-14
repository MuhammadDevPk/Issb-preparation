/**
 * useAiAnalysis composable
 * Provides reactive AI analysis state and test-specific analyzers
 * for WAT, SCT, and SRT simulators.
 */

import { ref } from 'vue'
import { analyzeWithAI } from '../services/aiProvider.js'

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

Respond ONLY with JSON in this exact schema:
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

Respond ONLY with JSON:
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

Respond ONLY with JSON:
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
// Composable
// ---------------------------------------------------------------------------

export function useAiAnalysis() {
  const isAnalyzing = ref(false)
  const analysisResult = ref(null)
  const analysisError = ref(null)
  const currentProvider = ref(null)

  // ---- Shared internal runner ----
  async function runAnalysis(systemPrompt, userContent) {
    isAnalyzing.value = true
    analysisResult.value = null
    analysisError.value = null
    currentProvider.value = null

    try {
      const { text, providerName } = await analyzeWithAI(systemPrompt, userContent, 3000)
      currentProvider.value = providerName

      // Parse JSON — handle markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned)
      analysisResult.value = parsed
    } catch (err) {
      console.error('[useAiAnalysis] Error:', err)
      analysisError.value = err.message ?? 'Unknown error occurred during analysis.'
    } finally {
      isAnalyzing.value = false
    }
  }

  // ---- WAT Analyzer ----
  async function analyzeWAT(responses) {
    const answered = responses.filter((r) => !r.timeOut && r.text)
    const total = responses.length

    const itemsText = responses
      .map(
        (r, i) =>
          `${i + 1}. Word: "${r.word}" | Answer: "${r.timeOut || !r.text ? '[BLANK - NO RESPONSE]' : r.text}"`
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
    const answered = responses.filter((r) => !r.timeOut && r.text && r.text.trim())
    const total = responses.length

    const itemsText = responses
      .map(
        (r, i) =>
          `${i + 1}. Situation: "${r.situation}" | Reaction: "${r.timeOut || !r.text ? '[BLANK - NO RESPONSE]' : r.text}"`
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

  // ---- Reset ----
  function resetAnalysis() {
    isAnalyzing.value = false
    analysisResult.value = null
    analysisError.value = null
    currentProvider.value = null
  }

  return {
    isAnalyzing,
    analysisResult,
    analysisError,
    currentProvider,
    analyzeWAT,
    analyzeSCT,
    analyzeSRT,
    analyzeOPI,
    resetAnalysis,
  }
}
