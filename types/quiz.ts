export interface QuizQuestion {
  question: string
  options?: string[]
  correctAnswer: string
  // For internal use - tracks shuffled options and maintains mapping to original
  shuffledOptions?: string[]
  originalCorrectIndex?: number
  shuffledCorrectIndex?: number
}
