export interface VocabularyEntry {
  id: string
  word: string
  meaning: string
  urduTranslation: string
  usageExample: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export type QuestionType = 'word-to-meaning' | 'word-to-urdu' | 'word-to-usage'

export interface VocabularyQuizConfig {
  questionTypes: QuestionType[]
  questionCount: number
}

export interface VocabularyQuizHistory {
  id: string
  title: string
  description: string | null
  totalQuestions: number
  questionTypes: QuestionType[]
  createdAt: string
  updatedAt: string
  totalAttempts: number
  highestScore: number
  latestScore: number | null
  lastAttemptDate: string | null
}
