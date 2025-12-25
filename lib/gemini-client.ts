import { GoogleGenerativeAI } from "@google/generative-ai";

const TIMEOUT_MS = 30000; // 30 seconds
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Difficulty level prompts for paragraph generation
 */
const DIFFICULTY_PROMPTS = {
  1: "beginner level (simple vocabulary, short sentences, common topics)",
  2: "intermediate level (moderate vocabulary, medium-length sentences, varied topics)",
  3: "advanced level (complex vocabulary, longer sentences, abstract topics)",
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute a Gemini API call with timeout and retries
 */
async function executeWithRetries<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), TIMEOUT_MS);
      });

      // Race between the API call and timeout
      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      // Don't retry on the last attempt
      if (attempt < retries) {
        // Exponential backoff
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("Request failed after retries");
}

export interface GeminiConfig {
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

/**
 * Generate an Urdu paragraph based on difficulty level
 */
export async function generateUrduParagraph(
  apiKey: string,
  difficultyLevel: 1 | 2 | 3,
  config?: GeminiConfig
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: config?.model || "gemini-2.5-flash",
      generationConfig: {
        temperature: config?.temperature ?? 0.9,
        topP: config?.topP ?? 0.95,
        topK: config?.topK ?? 40,
        maxOutputTokens: config?.maxOutputTokens ?? 8192,
      },
    });

    const difficultyText = DIFFICULTY_PROMPTS[difficultyLevel];

    const prompt = `Generate a single Urdu paragraph (3-5 sentences) at ${difficultyText}.
The paragraph should be about everyday topics, culture, or general knowledge.
Make it suitable for English-Urdu translation practice.
IMPORTANT: Return ONLY the Urdu text, no English translation, no explanations, no extra formatting.`;

    const result = await executeWithRetries(async () => {
      const response = await model.generateContent(prompt);
      return response;
    });

    const text = result.response.text().trim();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    return text;
  } catch (error) {
    console.error("Gemini API error details:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      // Handle specific Gemini errors
      if (error.message.includes("API key")) {
        throw new Error("Invalid Gemini API key");
      }
      if (error.message.includes("quota")) {
        throw new Error("Gemini API quota exceeded. Please try again later.");
      }
      if (error.message.includes("timeout")) {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
    throw new Error("Failed to generate Urdu paragraph");
  }
}

/**
 * Get AI feedback on user's translation
 */
export async function getFeedback(
  apiKey: string,
  urduParagraph: string,
  userTranslation: string,
  config?: GeminiConfig
): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: config?.model || "gemini-2.5-flash",
      generationConfig: {
        temperature: config?.temperature ?? 0.7,
        topP: config?.topP ?? 0.95,
        topK: config?.topK ?? 40,
        maxOutputTokens: config?.maxOutputTokens ?? 8192,
      },
    });

    const prompt = `You are an English-Urdu translation expert. Analyze the following translation:

URDU ORIGINAL:
${urduParagraph}

USER'S ENGLISH TRANSLATION:
${userTranslation}

Provide feedback in the following EXACT format:

## Translation Feedback Table

| Urdu Word/Phrase | Your Translation | Suggested Translation | Explanation |
|-----------------|------------------|---------------------|-------------|
[Add rows here for words/phrases that need improvement. Focus on the most important 5-8 issues.]

## Natural Version
[Provide a natural, fluent English translation of the entire Urdu paragraph]

## Overall Score
[Provide a score out of 10 based on accuracy, naturalness, and grammar]

IMPORTANT INSTRUCTIONS:
1. The table should focus on specific words or phrases that were mistranslated or could be improved
2. Only include rows where there's a meaningful difference between the user's translation and the suggested one
3. The "Natural Version" should be a complete, fluent English translation
4. The score should be a single number from 0-10
5. Be constructive and encouraging in your explanations`;

    const result = await executeWithRetries(async () => {
      const response = await model.generateContent(prompt);
      return response;
    });

    const text = result.response.text().trim();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    return text;
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific Gemini errors
      if (error.message.includes("API key")) {
        throw new Error("Invalid Gemini API key");
      }
      if (error.message.includes("quota")) {
        throw new Error("Gemini API quota exceeded. Please try again later.");
      }
      if (error.message.includes("timeout")) {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
    throw new Error("Failed to get translation feedback");
  }
}

/**
 * Test if an API key is valid
 */
export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    await executeWithRetries(async () => {
      const response = await model.generateContent('Say "OK"');
      return response;
    });

    return true;
  } catch (error) {
    return false;
  }
}
