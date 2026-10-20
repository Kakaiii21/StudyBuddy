export function estimateMaxItems(text: string, mode: 'quiz' | 'flashcard'): number {
  const wordCount = text.trim().split(/\s+/).length
  const wordsPerItem = mode === 'quiz' ? 80 : 40
  return Math.max(10, Math.floor(wordCount / wordsPerItem))
}

export function getTextSample(rawText: string): string {
  const words = rawText.trim().split(/\s+/)
  const start = Math.floor(words.length * 0.05) // skip first 5% (TOC/headers)
  return words.slice(start).join(' ').slice(0, 3000)
}

export function detectSourceLang(textSample: string): string {
  const sampleWords = textSample.toLowerCase()
  const tagalogMatches = (sampleWords.match(/\b(ang|mga|ay|ito|niya|hindi|kung|pero|kaya|dahil|siya|namin|tayo)\b/g) || []).length
  return tagalogMatches >= 3 ? 'Filipino/Tagalog' : 'English'
}

// Rough token estimate: ~4 chars per token is a reasonable approximation for English/Filipino text.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function buildPrompt(mode: 'quiz' | 'flashcard', numItems: number, textSample: string, sourceLang: string): string {
  if (mode === 'quiz') {
    return `You are a quiz generator. Use ONLY the text below to create ${numItems} multiple choice questions.

RULES:
- Test understanding, not just memorization
- 4 options per question (A, B, C, D)
- Only ONE correct answer
- Wrong options must be related but clearly incorrect
- IMPORTANT: Spread correct answers across A, B, C, D evenly — do NOT put correct answer in A every time
- No repeated concepts
- ${sourceLang} only, keep format keywords in English
- Do NOT add any intro, outro, or explanations

FORMAT — follow exactly:
Question 1: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Correct: B

Question 2: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Correct: D

TEXT:
${textSample}`
  }

return `You are a flashcard generator. Use ONLY the text below to create ${numItems} flashcards.

RULES:
- Each card must cover a unique concept — no repeats
- Front: the term, name, or concept itself ONLY — a word or short noun phrase (max 6 words). NEVER phrase it as a question. NEVER start with "What", "Who", "Why", "How", "Define", etc.
- Back: clear concise definition or explanation of that term (1-2 sentences)
- ${sourceLang} only, keep format keywords in English
- Do NOT add any intro, outro, or explanations

EXAMPLE (follow this pattern exactly):
Card 1 Front: System Integrator
Card 1 Back: A specialist who connects disparate applications, systems, cloud solutions, and data storage into a unified solution.

FORMAT — follow exactly:
Card 1 Front: [term]
Card 1 Back: [definition]

Card 2 Front: [term]
Card 2 Back: [definition]

TEXT:
${textSample}`
}

export function shuffleQuizOptions(items: any[]): any[] {
  const letters = ['A', 'B', 'C', 'D']
  return items.map((item) => {
    const options = [item.a, item.b, item.c, item.d]
    const correctIndex = letters.indexOf(item.correct?.toUpperCase())
    if (correctIndex === -1) return item

    const indices = [0, 1, 2, 3]
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }

    const shuffled = indices.map((i) => options[i])
    const newCorrectLetter = letters[indices.indexOf(correctIndex)]

    return { ...item, a: shuffled[0], b: shuffled[1], c: shuffled[2], d: shuffled[3], correct: newCorrectLetter }
  })
}