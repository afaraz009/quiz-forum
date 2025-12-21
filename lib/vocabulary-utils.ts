import { VocabularyEntry, VocabularyQuizConfig, QuestionType } from '@/types/vocabulary'
import { QuizQuestion } from '@/types/quiz'
import { shuffleArrayWithSeed, generateSeed } from './utils'

/**
 * Parse CSV content and validate vocabulary entries
 * Supports both comma and semicolon delimiters
 * Expected format: Word, Meaning/Definition, Urdu Translation, Usage in a Sentence
 */
export function parseVocabularyCSV(content: string): Omit<VocabularyEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] {
  const lines = content.trim().split('\n')

  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row')
  }

  // Remove header row
  const dataLines = lines.slice(1)
  const entries: Omit<VocabularyEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = []
  const errors: string[] = []

  dataLines.forEach((line, index) => {
    if (!line.trim()) return // Skip empty lines

    // Parse CSV line respecting quoted fields
    const fields = parseCSVLine(line)

    if (fields.length < 4) {
      errors.push(`Row ${index + 2}: Expected 4 columns, found ${fields.length}`)
      return
    }

    const [word, meaning, urduTranslation, usageExample] = fields.map(f => f.trim())

    if (!word || !meaning || !urduTranslation || !usageExample) {
      errors.push(`Row ${index + 2}: All fields are required (Word, Meaning, Urdu, Usage)`)
      return
    }

    entries.push({
      word,
      meaning,
      urduTranslation,
      usageExample
    })
  })

  if (errors.length > 0) {
    throw new Error(`CSV validation errors:\n${errors.join('\n')}`)
  }

  if (entries.length === 0) {
    throw new Error('No valid entries found in CSV file')
  }

  return entries
}

/**
 * Parse a single CSV line respecting quoted fields
 * Handles both comma and semicolon delimiters
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let currentField = ''
  let inQuotes = false
  let delimiter = line.includes(';') ? ';' : ','

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        currentField += '"'
        i++
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator
      fields.push(currentField)
      currentField = ''
    } else {
      currentField += char
    }
  }

  // Add the last field
  fields.push(currentField)

  return fields
}

/**
 * Generate vocabulary quiz questions based on configuration
 * Creates MCQ questions with 4 options for each question type
 */
export function generateVocabularyQuiz(
  entries: VocabularyEntry[],
  config: VocabularyQuizConfig,
  userId: string
): QuizQuestion[] {
  if (entries.length < 4) {
    throw new Error('At least 4 vocabulary entries are required to generate quiz with distractors')
  }

  if (entries.length < config.questionCount) {
    throw new Error(`Not enough vocabulary entries. You have ${entries.length} but requested ${config.questionCount} questions`)
  }

  if (config.questionTypes.length === 0) {
    throw new Error('At least one question type must be selected')
  }

  const questions: QuizQuestion[] = []
  const questionsPerType = Math.floor(config.questionCount / config.questionTypes.length)
  const remainder = config.questionCount % config.questionTypes.length

  // Shuffle entries to randomize question selection
  const shuffledEntries = shuffleArrayWithSeed(entries, generateSeed(userId + Date.now().toString()))

  let entryIndex = 0

  config.questionTypes.forEach((type, typeIndex) => {
    const count = questionsPerType + (typeIndex < remainder ? 1 : 0)

    for (let i = 0; i < count; i++) {
      if (entryIndex >= shuffledEntries.length) {
        entryIndex = 0 // Wrap around if needed
      }

      const entry = shuffledEntries[entryIndex]
      const question = createQuestionForType(entry, type, shuffledEntries, userId, entryIndex)
      questions.push(question)

      entryIndex++
    }
  })

  return questions
}

/**
 * Create a single question of the specified type
 */
function createQuestionForType(
  entry: VocabularyEntry,
  type: QuestionType,
  allEntries: VocabularyEntry[],
  userId: string,
  questionIndex: number
): QuizQuestion {
  let questionText: string
  let correctAnswer: string
  let distractorField: keyof VocabularyEntry

  switch (type) {
    case 'word-to-meaning':
      questionText = `What is the meaning of '${entry.word}'?`
      correctAnswer = entry.meaning
      distractorField = 'meaning'
      break
    case 'word-to-urdu':
      questionText = `What is the Urdu translation of '${entry.word}'?`
      correctAnswer = entry.urduTranslation
      distractorField = 'urduTranslation'
      break
    case 'word-to-usage':
      questionText = `Which sentence correctly uses the word '${entry.word}'?`
      correctAnswer = entry.usageExample
      distractorField = 'usageExample'
      break
  }

  // Get 3 random distractors from other entries
  const distractors = getRandomDistractors(entry, allEntries, distractorField, 3)

  // Create options array with correct answer and distractors
  const options = [correctAnswer, ...distractors]

  // Shuffle options using seeded random for consistency
  const seed = generateSeed(userId + questionIndex.toString() + entry.id)
  const shuffledOptions = shuffleArrayWithSeed(options, seed)

  return {
    question: questionText,
    options: shuffledOptions,
    correctAnswer
  }
}

/**
 * Get random distractors from other vocabulary entries
 */
function getRandomDistractors(
  currentEntry: VocabularyEntry,
  allEntries: VocabularyEntry[],
  field: keyof VocabularyEntry,
  count: number
): string[] {
  // Filter out current entry and get all possible distractors
  const possibleDistractors = allEntries
    .filter(e => e.id !== currentEntry.id)
    .map(e => e[field] as string)
    .filter(value => value !== currentEntry[field]) // Avoid duplicates

  if (possibleDistractors.length < count) {
    throw new Error(`Not enough unique entries to generate distractors. Need at least ${count + 1} unique entries.`)
  }

  // Shuffle and take required count
  const seed = generateSeed(currentEntry.id + field)
  const shuffled = shuffleArrayWithSeed(possibleDistractors, seed)

  return shuffled.slice(0, count)
}

/**
 * Find duplicate vocabulary entries (case-insensitive word comparison)
 */
export function findDuplicates(
  entries: VocabularyEntry[],
  newWord: string
): VocabularyEntry | null {
  const normalizedNewWord = newWord.trim().toLowerCase()

  return entries.find(entry =>
    entry.word.trim().toLowerCase() === normalizedNewWord
  ) || null
}
