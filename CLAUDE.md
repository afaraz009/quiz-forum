# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Your context window will be automatically compacted as it approaches its limit, allowing you to continue working indefinitely from where you left off. Therefore, do not stop tasks early due to token budget concerns. As you approach your token budget limit, save your current progress and state to memory before the context window refreshes. Always be as persistent and autonomous as possible and complete tasks fully, even if the end of your budget is approaching. Never artificially stop any task early regardless of the context remaining.


## Project Overview

This is a Next.js quiz application with dual-mode functionality: **Practice Mode** for students and **Assessment Mode** for instructors. Students can upload JSON files or paste JSON content to create practice quizzes with both multiple-choice questions (MCQs) with exactly 4 options and short-answer text questions. Instructors (users with `isAdmin: true`) can create and publish formal tests that students can attempt only once. The app includes user authentication via NextAuth, quiz/test persistence, attempt tracking, and folder organization for practice quizzes.
This is an inhouse application I built specifically for my 20 students to help them learn, specifically english 

## Development Commands

- **Development server**: `npm run dev` (runs on port 3000)
- **Build**: `npm run build` (runs `prisma generate` automatically before build)
- **Production start**: `npm start`
- **Lint**: `npm run lint`
- **Database client generation**: `npx prisma generate` (auto-runs on `npm install` via postinstall hook)
- **Database migration**: `npx prisma db push` (for PostgreSQL schema sync)
- **Database studio**: `npx prisma studio` (database GUI on port 5555)

## Architecture

### Core Components Structure

**Main Pages:**
- **app/page.tsx**: Home page with file upload for practice quizzes (logged-in users)
- **app/dashboard/page.tsx**: User dashboard with two sections: Published Tests (assessment mode) and Practice Quizzes (unlimited attempts) with folder organization
- **app/quiz/[id]/page.tsx**: Practice quiz taking interface (unlimited retakes)
- **app/published-test/[id]/page.tsx**: Published test taking interface (single attempt, optional time limit)
- **app/login/page.tsx** & **app/signup/page.tsx**: Authentication pages
- **app/admin/**: Admin-only pages for creating/managing published tests and viewing results

**Key Components:**
- **components/file-uploader.tsx**: JSON file upload and text input with Zod validation
- **components/quiz.tsx**: Quiz/test engine handling question display, answer tracking, and scoring
- **components/question-item.tsx**: Renders individual MCQ or text questions
- **components/quiz-save-dialog.tsx**: Save practice quizzes to database with folder selection
- **components/published-test-save-dialog.tsx**: Save published tests with time limits and passing percentages
- **components/folder-manager.tsx**: Folder CRUD operations
- **components/folder-filter.tsx**: Folder filtering UI for dashboard
- **components/enhanced-practice-quizzes-table.tsx**: Practice quiz list with stats
- **components/published-tests-table.tsx**: Published test list with attempt status

**Core Infrastructure:**
- **types/quiz.ts**: QuizQuestion interface (shared by both practice quizzes and published tests)
- **lib/auth.ts**: NextAuth configuration with credentials provider, auto-creates default "Uncategorized" folder on user login

### Key Data Flow

**Practice Quiz Flow (Student):**
1. User uploads JSON via FileUploader → Zod validation
2. Quiz component loads questions, shuffles MCQ options (tracking original indices)
3. User submits answers → Quiz component scores answers
4. User can optionally save quiz to database with folder selection
5. Saved quizzes appear in dashboard, can be retaken unlimited times
6. Each attempt is tracked in QuizAttempt table

**Published Test Flow (Instructor → Student):**
1. Admin creates test via `/admin/create-test` with time limit and passing percentage
2. Test is published and appears in all users' dashboards
3. Student clicks "Take Test" → TestAttempt record created with `isCompleted: false`
4. Student completes test (optional timer enforced client-side)
5. Test submitted → `isCompleted: true`, score calculated and saved
6. Student can view results but cannot retake (enforced via unique constraint on `userId + publishedTestId`)

**Authentication & Default Setup:**
- NextAuth JWT strategy with credentials provider
- On first login, `lib/auth.ts` JWT callback auto-creates default "Uncategorized" folder for user
- Session callback fetches latest user data to ensure `isAdmin` status is current

## Technology Stack

- **Framework**: Next.js 15 with React 19 (App Router)
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: NextAuth.js v4 with credentials provider (JWT strategy)
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React hooks (useState, useEffect)
- **Validation**: Zod for JSON quiz validation
- **Forms**: React Hook Form with Zod resolvers
- **Icons**: Lucide React
- **Toast Notifications**: Sonner
- **Theme**: next-themes for dark mode support
- **Password Hashing**: bcryptjs
- **Date Formatting**: date-fns
- **Code Highlighting**: react-syntax-highlighter (for displaying code in questions)

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

- MCQ questions can contain any number of options
- If the option array is empty or missing the question becomes a text question
- correctAnswer must be included in options array for MCQs

## Database Schema

The app uses Prisma with PostgreSQL and includes these key models:

**Authentication:**
- **User**: Contains `isAdmin` boolean for role-based access control
- **Account/Session**: NextAuth adapter models for session management
- **VerificationToken**: NextAuth token management

**Practice Quizzes (Student-Created):**
- **Folder**: User-created folders for organizing practice quizzes
- **Quiz**: Practice quizzes with JSON questions, can be retaken unlimited times
- **QuizAttempt**: Tracks each practice quiz attempt with score and answers

**Published Tests (Instructor-Created):**
- **PublishedTest**: Formal tests with `timeLimit`, `passingPercentage`, `isPublished` status
- **TestAttempt**: Single attempt per user per test (enforced by unique constraint on `userId + publishedTestId`)

**Other:**
- **SamplePrompt**: Store reusable prompt templates for AI-assisted quiz generation

## API Routes

**Authentication:**
- `POST /api/register`: User registration with bcrypt password hashing
- `GET/POST /api/auth/[...nextauth]`: NextAuth endpoints

**Practice Quizzes:**
- `POST /api/quiz/save`: Save practice quiz with folder selection
- `POST /api/quiz/submit`: Submit practice quiz attempt
- `GET /api/quiz/history`: Get user's practice quiz history with folder info and stats
- `GET /api/quiz/[id]`: Get specific practice quiz data

**Folders:**
- `GET /api/folders`: Get user's folders
- `POST /api/folders`: Create new folder
- `DELETE /api/folders/[id]`: Delete folder (sets quizzes' folderId to null)
- `POST /api/folders/move-quiz`: Move quiz between folders

**Published Tests (Student View):**
- `GET /api/published-tests`: Get all published tests with user's attempt status
- `GET /api/published-tests/[id]`: Get specific published test
- `POST /api/published-tests/submit`: Submit test attempt
- `GET /api/published-tests/[id]/results`: Get test results after completion
- `POST /api/published-tests/save`: Save published test to practice quizzes

**Admin Routes:**
- `GET /api/admin/published-tests`: Get all tests (published and unpublished)
- `GET /api/admin/analytics/tests`: Get test analytics summary
- `GET /api/admin/analytics/tests/[id]`: Get detailed analytics for specific test
- `GET /api/admin/export/[id]`: Export test results

**Sample Prompts:**
- `GET /api/sample-prompts`: Get all sample prompts
- `POST /api/sample-prompts`: Create sample prompt
- `DELETE /api/sample-prompts/[id]`: Delete sample prompt

## Deployment

- **Target**: Netlify with Edge functions
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Dev Command**: `npm run dev`

## Build Configuration

- ESLint and TypeScript errors are ignored during builds (`next.config.mjs`)
- Images are unoptimized for static deployment
- Uses absolute imports with `@/` alias pointing to project root
- Prisma client generation runs automatically on `npm install` (postinstall hook) and before build

## Important Architectural Notes

**Dual-Mode System:**
- **Practice Mode**: Student-created quizzes, unlimited attempts, folder organization, no time limits
- **Assessment Mode**: Admin-created published tests, single attempt, optional time limits, passing thresholds

**Admin Access Control:**
- Admin pages protected by checking `session.user.isAdmin` in page components
- Admin routes should verify `isAdmin` status server-side in API handlers
- Admin users see additional navigation options and the `/admin` section

**Question Shuffling:**
- MCQ options are shuffled when quiz/test is loaded
- Original correct answer index is tracked via `originalCorrectIndex` and `shuffledCorrectIndex`
- This prevents answer memorization across multiple attempts

**Single Attempt Enforcement for Published Tests:**
- Database constraint: `@@unique([userId, publishedTestId])` on TestAttempt model
- UI prevents retake by checking `hasAttempted` status
- TestAttempt created when test starts (`isCompleted: false`), updated when submitted

**Environment Variables Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Required for NextAuth (validated in `lib/auth.ts`)
- `NEXTAUTH_URL`: Base URL for callbacks (validated in `lib/auth.ts`)