# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js quiz application that allows users to upload JSON files or paste JSON content to create interactive quizzes. The app supports both multiple-choice questions (MCQs) with exactly 4 options and short-answer text questions.

## Development Commands

- **Development server**: `npm run dev` (runs on port 3000)
- **Build**: `npm run build`
- **Production start**: `npm start`
- **Lint**: `npm run lint`

## Architecture

### Core Components Structure

- **app/page.tsx**: Main page component managing file upload and quiz state
- **components/file-uploader.tsx**: Handles JSON file upload and text input with validation
- **components/quiz.tsx**: Main quiz component managing question display, answers, and scoring
- **components/question-item.tsx**: Individual question rendering for both MCQ and text questions
- **types/quiz.ts**: Core QuizQuestion interface definition

### Key Data Flow

1. User uploads JSON or pastes JSON content via FileUploader
2. JSON is validated against QuizQuestion schema
3. Validated questions are passed to Quiz component
4. Quiz component manages user answers and scoring
5. Results are displayed with option to retry or load new quiz

## Technology Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React hooks (useState)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Toast Notifications**: Sonner
- **Theme**: next-themes for dark mode support

## JSON Quiz Format

Questions must follow this structure:
```json
[
  {
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // MCQ only
    "correctAnswer": "Correct answer"
  }
]
```

- MCQ questions require exactly 4 options
- Text questions omit the options field
- correctAnswer must be included in options array for MCQs

## Deployment

- **Target**: Netlify with Edge functions
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Dev Command**: `npm run dev`

## Build Configuration

- ESLint and TypeScript errors are ignored during builds (next.config.mjs)
- Images are unoptimized for static deployment
- Uses absolute imports with `@/` alias pointing to project root