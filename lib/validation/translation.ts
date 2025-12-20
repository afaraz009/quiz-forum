import { z } from 'zod';

/**
 * Schema for starting a new translation session
 */
export const startSessionSchema = z.object({
  difficultyLevel: z.number().int().min(1).max(3),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

/**
 * Schema for generating a new paragraph
 */
export const generateParagraphSchema = z.object({
  sessionId: z.string().min(1),
  difficultyLevel: z.number().int().min(1).max(3),
});

export type GenerateParagraphInput = z.infer<typeof generateParagraphSchema>;

/**
 * Schema for submitting a translation
 */
export const submitTranslationSchema = z.object({
  sessionId: z.string().min(1),
  urduParagraph: z.string().min(10).max(1000),
  userTranslation: z.string().min(1).max(2000),
});

export type SubmitTranslationInput = z.infer<typeof submitTranslationSchema>;

/**
 * Schema for ending a session
 */
export const endSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export type EndSessionInput = z.infer<typeof endSessionSchema>;

/**
 * Schema for saving/updating Gemini API key
 */
export const saveApiKeySchema = z.object({
  apiKey: z.string().min(20).max(200),
});

export type SaveApiKeyInput = z.infer<typeof saveApiKeySchema>;
