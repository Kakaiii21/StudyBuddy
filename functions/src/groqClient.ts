import axios from 'axios'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'openai/gpt-oss-20b'

export interface GroqUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface GroqResult {
  text: string
  usage: GroqUsage
  remainingTokens: number
}

async function postToGroq(prompt: string, apiKey: string) {
  return axios.post(
    GROQ_API_URL,
    {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'Be concise. Output only the requested format with no extra explanation or commentary.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 6000,
      reasoning_effort: 'low',
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    }
  )
}

// NOTE: concurrency is controlled by the queue (queue.ts: one job at a time,
// paced by MIN_GAP_MS), so no extra slot-locking is needed here.
export async function callGroq(prompt: string, apiKey: string): Promise<GroqResult> {
  let response
  const maxRetries = 2
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      response = await postToGroq(prompt, apiKey)
      break
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 429 && attempt < maxRetries) {
        const retryAfter = Number(err.response.headers['retry-after'] ?? 2)
        await new Promise((r) => setTimeout(r, retryAfter * 1000))
        continue
      }
      if (status === 429) throw new Error('Rate limit reached. Please try again shortly.')
      throw err
    }
  }

  const choice = response!.data?.choices?.[0]
  const content = choice?.message?.content
  const finishReason = choice?.finish_reason

  if (!content) {
    if (finishReason === 'length') {
      throw new Error('GROQ_TRUNCATED: Response was cut off before any output was generated. Try fewer items.')
    }
    throw new Error('GROQ_EMPTY: Empty response from Groq API')
  }

  const usage: GroqUsage = {
    prompt_tokens: response!.data?.usage?.prompt_tokens ?? 0,
    completion_tokens: response!.data?.usage?.completion_tokens ?? 0,
    total_tokens: response!.data?.usage?.total_tokens ?? 0,
  }
  const remainingTokens = parseInt(response!.headers['x-ratelimit-remaining-tokens'] ?? '6000')

  return { text: content, usage, remainingTokens }
}
