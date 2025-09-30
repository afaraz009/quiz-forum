import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Seeded random number generator for consistent shuffling
 * Uses a simple LCG (Linear Congruential Generator) algorithm
 */
function seededRandom(seed: number) {
  let state = seed
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/**
 * Shuffle an array using Fisher-Yates algorithm with a seeded random generator
 * This ensures consistent shuffling for the same seed
 */
export function shuffleArrayWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]
  const random = seededRandom(seed)
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

/**
 * Generate a seed based on a string (like user ID + question index)
 * This creates a unique but deterministic seed for each user-question combination
 */
export function generateSeed(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
