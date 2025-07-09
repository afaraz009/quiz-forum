# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js quiz application with user authentication that allows users to create, save, and take interactive quizzes. Users can upload JSON files or paste JSON content to create quizzes with both multiple-choice questions (MCQs) with exactly 4 options and short-answer text questions. The app includes user registration/login, quiz persistence, and attempt tracking.

## Development Commands

- **Development server**: `npm run dev` (runs on port 3000)
- **Build**: `npm run build`
- **Production start**: `npm start`
- **Lint**: `npm run lint`
- **Database setup**: `npx prisma generate` (generate Prisma client)
- **Database migration**: `npx prisma db push` (for SQLite development)
- **Database studio**: `npx prisma studio` (database GUI on port 5555)

## Architecture

### Core Components Structure

- **app/page.tsx**: Main page component managing file upload and quiz state
- **app/dashboard/page.tsx**: User dashboard showing saved quizzes and attempt history
- **app/quiz/[id]/page.tsx**: Individual quiz taking page with dynamic routing
- **app/login/page.tsx** & **app/signup/page.tsx**: Authentication pages
- **components/file-uploader.tsx**: Handles JSON file upload and text input with validation
- **components/quiz.tsx**: Main quiz component managing question display, answers, and scoring
- **components/question-item.tsx**: Individual question rendering for both MCQ and text questions
- **components/quiz-save-dialog.tsx**: Dialog for saving quizzes to database
- **components/auth/**: Authentication-related components
- **types/quiz.ts**: Core QuizQuestion interface definition
- **lib/auth.ts**: NextAuth configuration with credentials provider

### Key Data Flow

1. **Authentication**: Users register/login via NextAuth with credentials
2. **Quiz Creation**: User uploads JSON or pastes JSON content via FileUploader
3. **Validation**: JSON is validated against QuizQuestion schema using Zod
4. **Quiz Taking**: Validated questions are passed to Quiz component
5. **Answer Management**: Quiz component manages user answers and scoring
6. **Persistence**: Quizzes can be saved to database with user association
7. **Results & History**: Results are displayed with quiz attempts tracked in database

## Technology Stack

- **Framework**: Next.js 15 with React 19
- **Database**: Prisma ORM with SQLite (development)
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React hooks (useState)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Toast Notifications**: Sonner
- **Theme**: next-themes for dark mode support
- **Password Hashing**: bcryptjs

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

## Database Schema

The app uses Prisma with SQLite and includes these key models:
- **User**: Authentication and user management
- **Quiz**: Saved quizzes with JSON question data
- **QuizAttempt**: User quiz attempts with scores and answers
- **Account/Session**: NextAuth session management

## API Routes

- **POST /api/register**: User registration
- **GET/POST /api/auth/[...nextauth]**: NextAuth authentication
- **POST /api/quiz/save**: Save quiz to database
- **POST /api/quiz/submit**: Submit quiz attempt
- **GET /api/quiz/history**: Get user's quiz history
- **GET /api/quiz/[id]**: Get specific quiz data

## Deployment

- **Target**: Netlify with Edge functions
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Dev Command**: `npm run dev`

## Build Configuration

- ESLint and TypeScript errors are ignored during builds (next.config.mjs)
- Images are unoptimized for static deployment
- Uses absolute imports with `@/` alias pointing to project root