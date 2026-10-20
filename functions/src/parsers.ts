// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

export interface Flashcard {
  term: string
  definition: string
}

// ─── Quiz Parser ──────────────────────────────────────────────────────────────

export function parseQuiz(response: string): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  const lines = response.split('\n')
  let current: QuizQuestion | null = null

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    // Match: "Question 1:", "Q1:", "1.", "1)"  ← added "1)"
    if (/^(?:Question\s*\d+[:.)]|Q\d+[:.)]|\d+[.):])\s*(.+)$/i.test(line)) {
      if (current && current.options.length > 0) questions.push(current)
      const match = line.match(/^(?:Question\s*\d+[:.)]|Q\d+[:.)]|\d+[.):])\s*(.+)$/i)!
      current = { question: match[1].trim(), options: [], answer: '' }
      continue
    }

    // Match: "A) ...", "A. ...", "A: ...", "(A) ..."  ← added "(A)"
    if (current && /^[(]?[A-D][).:]\s*.+$/i.test(line)) {
      const match = line.match(/^[(]?[A-D][).:]?\s*(.+)$/i)!
      current.options.push(match[1].trim())
      continue
    }

    // Match: "Answer: B", "Correct: B", "Correct Answer: B", "Answer: B)"  ← added trailing paren
    if (current && /^(?:Answer|Correct(?:\s+Answer)?):\s*([A-D])[).]?/i.test(line)) {
      const match = line.match(/^(?:Answer|Correct(?:\s+Answer)?):\s*([A-D])/i)!
      current.answer = match[1].toUpperCase()
      continue
    }
  }

  if (current && current.options.length > 0) questions.push(current)
  return questions
}
// ─── Flashcard Parser ─────────────────────────────────────────────────────────

export function parseFlashcards(response: string): Flashcard[] {
  const flashcards: Flashcard[] = []
  const lines = response.split('\n')
  let current: Partial<Flashcard> = {}

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    if (/^Card\s*\d+\s*Front:\s*(.+)$/i.test(line)) {
      if (current.term && current.definition) flashcards.push(current as Flashcard)
      const match = line.match(/^Card\s*\d+\s*Front:\s*(.+)$/i)!
      current = { term: match[1].trim(), definition: '' }
      continue
    }

    if (/^Card\s*\d+\s*Back:\s*(.+)$/i.test(line)) {
      const match = line.match(/^Card\s*\d+\s*Back:\s*(.+)$/i)!
      current.definition = match[1].trim()
      continue
    }
  }

  if (current.term && current.definition) flashcards.push(current as Flashcard)

  // ── NEW: fallback for plain "term\ndefinition" format ──────────────────
  if (flashcards.length === 0) {
    const plainLines = response.split('\n').map(l => l.trim()).filter(Boolean)
    for (let i = 0; i + 1 < plainLines.length; i += 2) {
      const term = plainLines[i]
      const definition = plainLines[i + 1]
      if (term && definition) flashcards.push({ term, definition })
    }
  }
  // ───────────────────────────────────────────────────────────────────────

  return flashcards
}