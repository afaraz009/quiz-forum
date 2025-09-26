import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSamplePrompts() {
  try {
    console.log('🌱 Seeding sample prompts...')

    // Check if sample prompts already exist
    const existingPrompts = await prisma.samplePrompt.count()
    if (existingPrompts > 0) {
      console.log('✅ Sample prompts already exist. Skipping seed.')
      return
    }

    const samplePrompts = [
      {
        title: "Urdu to English Translation Quiz",
        description: "Generate quiz questions for translating Urdu sentences to English focusing on verb tenses",
        prompt: `You are a quiz generator. Create a JSON array of multiple-choice quiz questions about translating Urdu sentences to English, focusing on verb tenses.

Each element in the array must follow this format:

{
  "question": "ترجمہ کریں: '<Urdu sentence here>'",
  "options": ["<English translation 1>", "<English translation 2>", "<English translation 3>", "<English translation 4>"],
  "correctAnswer": "<The correct English translation (must exactly match one from options)>"
}
- Guidelines:
-Generate 20 multiple-choice questions.
-Write each question in Urdu, starting with "ترجمہ کریں:" followed by a short, everyday Urdu sentence.
-Use ONLY the English tenses [Past Simple, Past Continuous, Past Perfect, Past Perfect Continuous] in the translation options.
-Provide four unique English translation options for each question, each reflecting a different tense from the specified list, with only one being the correct translation of the Urdu sentence.
-Add negative and interrogative forms in some questions.
-Shuffle the order of questions to avoid patterns (e.g., not grouping by tense).
-Shuffle the position of the correct answer in the options for each question.
-Shuffle the position of tenses in the options 
-Ensure the correct answer exactly matches one of the options.
-Output a valid JSON array containing the requested number of questions.
-Do not include explanations, comments, or extra text outside the JSON.
-Use clear, everyday Urdu sentences that are grammatically correct and natural.
-Ensure translations in the options are accurate and reflect the appropriate tense`
      },
      {
        title: "Mathematics Quiz Generator",
        description: "Create mathematical word problems and equation-based questions",
        prompt: `Create a JSON array of 15 multiple-choice mathematics questions covering basic arithmetic and algebra.

Each question should follow this format:
{
  "question": "<Math problem or word problem>",
  "options": ["<option 1>", "<option 2>", "<option 3>", "<option 4>"],
  "correctAnswer": "<correct answer that matches one option exactly>"
}

Requirements:
- Include word problems and direct calculations
- Cover addition, subtraction, multiplication, division, and basic algebra
- Vary difficulty from elementary to middle school level
- Include decimal and fraction problems
- Make sure each question has exactly 4 unique options
- One option must be correct, three must be plausible but wrong
- Output only valid JSON, no explanations or comments`
      },
      {
        title: "Science Knowledge Quiz",
        description: "Generate general science questions covering biology, chemistry, and physics",
        prompt: `Generate a JSON array of 20 science multiple-choice questions covering basic concepts in biology, chemistry, and physics.

Format for each question:
{
  "question": "<Science question>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "correctAnswer": "<correct answer matching one option exactly>"
}

Guidelines:
- Mix questions from all three sciences (biology, chemistry, physics)
- Target middle school to early high school level
- Include questions about scientific methods, basic laws, and common phenomena
- Avoid overly technical terms or advanced concepts
- Make incorrect options plausible but clearly wrong
- Ensure variety in question types (facts, applications, principles)
- Output clean JSON only, no extra text or explanations`
      },
      {
        title: "English Grammar Quiz",
        description: "Create English grammar and language arts questions",
        prompt: `Create a JSON array of 18 English grammar and language arts questions.

Question format:
{
  "question": "<Grammar question or sentence to analyze>",
  "options": ["<choice 1>", "<choice 2>", "<choice 3>", "<choice 4>"],
  "correctAnswer": "<correct answer exactly matching one option>"
}

Content areas to cover:
- Parts of speech (nouns, verbs, adjectives, adverbs)
- Sentence structure and types
- Punctuation rules
- Subject-verb agreement
- Verb tenses and forms
- Common grammar mistakes
- Vocabulary and word usage

Requirements:
- Mix theoretical questions with practical applications
- Include "choose the correct sentence" type questions
- Add "identify the error" questions
- Ensure options are clearly distinct
- Target intermediate English proficiency level
- Return only valid JSON format`
      }
    ]

    // Insert sample prompts
    for (const promptData of samplePrompts) {
      await prisma.samplePrompt.create({
        data: promptData
      })
      console.log(`✅ Created prompt: ${promptData.title}`)
    }

    console.log('🎉 Sample prompts seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding sample prompts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (import.meta.url === new URL(import.meta.url).href) {
  seedSamplePrompts()
}

export { seedSamplePrompts }