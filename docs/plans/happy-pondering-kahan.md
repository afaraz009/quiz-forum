# Vocabulary Learning Feature - Implementation Plan

## Overview
Add a comprehensive vocabulary learning system that allows students to:
1. Import/manage vocabulary entries via CSV (Word, Meaning, Urdu Translation, Usage)
2. Generate customized quizzes from their vocabulary database
3. Take quizzes with both MCQ and text-based questions
4. Track quiz history and progress in a dedicated dashboard section, similar to the current quiz history system

## Database Schema Changes

### File: `prisma/schema.prisma`

Add three new models following existing patterns:

```prisma
model VocabularyEntry {
  id              String   @id @default(cuid())
  word            String
  meaning         String
  urduTranslation String
  usageExample    String
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([word])
}

model VocabularyQuiz {
  id              String                 @id @default(cuid())
  title           String
  description     String?
  questions       String                 // JSON string of QuizQuestion[]
  totalQuestions  Int
  questionTypes   String                 // JSON array: ["word-to-meaning", "word-to-urdu", "word-to-usage"]
  userId          String
  user            User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  attempts        VocabularyQuizAttempt[]
  createdAt       DateTime               @default(now())
  updatedAt       DateTime               @updatedAt

  @@index([userId])
}

model VocabularyQuizAttempt {
  id              String         @id @default(cuid())
  score           Int
  totalQuestions  Int
  answers         String         // JSON string of user answers
  completedAt     DateTime       @default(now())
  userId          String
  quizId          String
  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz            VocabularyQuiz @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([quizId])
}
```

Update User model to add:
```prisma
vocabularyEntries     VocabularyEntry[]
vocabularyQuizzes     VocabularyQuiz[]
vocabularyQuizAttempts VocabularyQuizAttempt[]
```

**Migration**: Run `npx prisma db push` after schema update

---

## Type Definitions

### File: `types/vocabulary.ts` (NEW)

```typescript
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
```

---

## Utility Functions

### File: `lib/vocabulary-utils.ts` (NEW)

**Functions to implement:**

1. **CSV Parsing & Validation**
   - `parseVocabularyCSV(content: string): VocabularyEntry[]`
   - Validate 4 columns: Word, Meaning, Urdu, Usage
   - Handle both comma and semicolon delimiters
   - Support UTF-8 for Urdu text
   - Return parsed entries or throw validation errors

2. **Quiz Generation**
   - `generateVocabularyQuiz(entries: VocabularyEntry[], config: VocabularyQuizConfig): QuizQuestion[]`
   - For each question type, create questions with format:
     - word-to-meaning: "What is the meaning of '{word}'?" → MCQ with 4 meanings
     - word-to-urdu: "What is the Urdu translation of '{word}'?" → MCQ with 4 Urdu translations
     - word-to-usage: "Which sentence correctly uses '{word}'?" → MCQ with 4 usage examples
   - Pick 3 random distractors from other vocabulary entries (same field type)
   - Use existing `shuffleArrayWithSeed()` for option shuffling
   - Distribute questions evenly across selected types

3. **Duplicate Detection**
   - `findDuplicates(entries: VocabularyEntry[], newWord: string): VocabularyEntry | null`
   - Case-insensitive, trimmed comparison

---

## API Routes

### 1. Vocabulary Entry Management

**File: `app/api/vocabulary/route.ts` (NEW)**

- **GET**: Fetch all user's vocabulary entries
  - Query params: `?search=word&sortBy=word&order=asc&page=1&limit=50`
  - Return: `{ entries: VocabularyEntry[], total: number }`

- **POST**: Add single vocabulary entry
  - Body: `{ word, meaning, urduTranslation, usageExample }`
  - Validate all fields required, check duplicates
  - Return: `{ message, entry: VocabularyEntry }`

**File: `app/api/vocabulary/[id]/route.ts` (NEW)**

- **GET**: Fetch single entry by ID
- **PUT**: Update entry (all fields)
- **DELETE**: Delete entry

**File: `app/api/vocabulary/import/route.ts` (NEW)**

- **POST**: Import CSV file
  - Body: `{ csvContent: string, mode: 'append' | 'replace' }`
  - Parse CSV using `parseVocabularyCSV()`
  - Check duplicates (skip by default)
  - Batch insert using Prisma `createMany()`
  - Return: `{ message, stats: { added: number, skipped: number, errors: string[] } }`

**File: `app/api/vocabulary/export/route.ts` (NEW)**

- **GET**: Export all vocabulary as CSV
  - Generate CSV with headers
  - Return as downloadable file

### 2. Vocabulary Quiz Management

**File: `app/api/vocabulary-quiz/generate/route.ts` (NEW)**

- **POST**: Generate quiz from vocabulary
  - Body: `{ questionTypes: QuestionType[], questionCount: number }`
  - Fetch user's vocabulary entries
  - Validate: `entries.length >= 4` (minimum for MCQ distractors)
  - Validate: `entries.length >= questionCount`
  - Use `generateVocabularyQuiz()` utility
  - Return: `{ questions: QuizQuestion[] }`

**File: `app/api/vocabulary-quiz/save/route.ts` (NEW)**

- **POST**: Save generated quiz
  - Body: `{ title, description, questions: QuizQuestion[], questionTypes: QuestionType[] }`
  - Validate questions format (same as `/api/quiz/save`)
  - Store questions as JSON string
  - Return: `{ message, quiz: { id, title, ... } }`

**File: `app/api/vocabulary-quiz/submit/route.ts` (NEW)**

- **POST**: Submit quiz attempt
  - Body: `{ quizId, score, totalQuestions, answers: Record<number, string> }`
  - Create VocabularyQuizAttempt record
  - Return: `{ message, attempt: { id, score, ... } }`

**File: `app/api/vocabulary-quiz/history/route.ts` (NEW)**

- **GET**: Fetch vocabulary quiz history with stats
  - Include attempts (same pattern as `/api/quiz/history`)
  - Calculate: highestScore, latestScore, totalAttempts, lastAttemptDate
  - Return: `{ quizzes: VocabularyQuizHistory[] }`

**File: `app/api/vocabulary-quiz/[id]/route.ts` (NEW)**

- **GET**: Fetch specific vocabulary quiz
  - Parse questions from JSON
  - Return: `{ quiz: VocabularyQuiz }`
- **DELETE**: Delete vocabulary quiz

---

## UI Components

### 1. Vocabulary Management Components

**File: `components/vocabulary-csv-uploader.tsx` (NEW)**

Features:
- File upload (drag & drop + file picker)
- CSV content validation preview
- Show first 5 rows as table preview
- Import button with loading state
- Error display for invalid rows
- Success toast with stats (X entries added, Y skipped)

**File: `components/vocabulary-table.tsx` (NEW)**

Features:
- Sortable table columns: Word, Meaning, Urdu, Usage, Actions
- Search input (filters by word)
- Pagination (50 entries per page)
- Inline edit button → opens dialog
- Delete button with confirmation
- "Add Entry" button at top
- Empty state if no entries

**File: `components/vocabulary-entry-dialog.tsx` (NEW)**

Features:
- Form with 4 required fields: word, meaning, urduTranslation, usageExample
- Used for both Add and Edit modes
- Validation (all fields required)
- Save/Cancel buttons
- Toast on success

**File: `components/vocabulary-stats-card.tsx` (NEW)**

Display:
- Total vocabulary entries
- Last updated date
- Quick stats

### 2. Quiz Generation Components

**File: `components/vocabulary-quiz-generator.tsx` (NEW)**

Features:
- Checkbox group for question types (can select multiple):
  - ☐ Word → Definition
  - ☐ Word → Urdu Translation
  - ☐ Word → Usage in Sentence
- Number input: Question count (default: 20, min: 1, max: 100)
- Validation: At least 1 question type selected
- Preview text: "Will generate X questions from Y vocabulary entries"
- "Generate Quiz" button → creates quiz and opens save dialog
- Show error if insufficient vocabulary entries

**File: `components/vocabulary-quiz-save-dialog.tsx` (NEW)**

Features:
- Title and description inputs
- Preview generated questions (first 3)
- Save button → redirects to quiz taking page
- Cancel button → discards quiz

**File: `components/vocabulary-quiz-history-table.tsx` (NEW)**

Features:
- Similar to EnhancedPracticeQuizzesTable
- Columns: Title, Question Types (badges), Questions, Attempts, Best Score, Last Attempt, Actions
- Question Types badges: color-coded pills (Definition, Urdu, Usage)
- Actions: "Retake" button, Delete button
- Sortable by score, attempts, date
- Empty state if no quizzes

---

## Pages

### File: `app/vocabulary/page.tsx` (NEW)

**Layout:**
- Authenticated route (redirect to /login if not logged in)
- Three card sections:

1. **Quick Actions Card**
   - Import CSV button (opens uploader)
   - Add Entry button (opens dialog)
   - Export CSV button

2. **Vocabulary Statistics Card**
   - VocabularyStatsCard component
   - Generate Quiz button → redirects to `/vocabulary/generate-quiz`

3. **Vocabulary List Card**
   - VocabularyTable component
   - Search and filters

### File: `app/vocabulary/generate-quiz/page.tsx` (NEW)

**Layout:**
- Page title: "Generate Vocabulary Quiz"
- VocabularyQuizGenerator component
- After generation → show save dialog
- After save → redirect to `/vocabulary-quiz/[id]`

### File: `app/vocabulary-quiz/[id]/page.tsx` (NEW)

**Layout:**
- Reuse existing Quiz component from `components/quiz.tsx`
- Fetch vocabulary quiz by ID
- Parse questions from JSON
- Submit to `/api/vocabulary-quiz/submit`
- Show results after completion
- "Retake" button

---

## Navigation Updates

### File: `components/user-nav.tsx`

Add two new dropdown menu items after "Translation History":

```tsx
<DropdownMenuItem className="cursor-pointer rounded-lg p-3 focus:bg-primary/10 focus:text-primary transition-colors duration-200">
  <a href="/vocabulary" className="w-full flex items-center gap-3">
    <span className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
      📚
    </span>
    <div className="flex flex-col">
      <span className="font-medium">Vocabulary Library</span>
      <span className="text-xs text-muted-foreground">
        Manage your vocabulary
      </span>
    </div>
  </a>
</DropdownMenuItem>

<DropdownMenuItem className="cursor-pointer rounded-lg p-3 focus:bg-primary/10 focus:text-primary transition-colors duration-200">
  <a href="/vocabulary/generate-quiz" className="w-full flex items-center gap-3">
    <span className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
      ✨
    </span>
    <div className="flex flex-col">
      <span className="font-medium">Generate Vocab Quiz</span>
      <span className="text-xs text-muted-foreground">
        Create practice quizzes
      </span>
    </div>
  </a>
</DropdownMenuItem>
```

### File: `app/dashboard/page.tsx`

Add new section after "Practice Quizzes" section:

```tsx
{/* Vocabulary Quizzes Section */}
<Card>
  <CardHeader>
    <div className="flex items-center gap-2">
      <BookOpen className="h-5 w-5" />
      <CardTitle>Vocabulary Quizzes</CardTitle>
    </div>
    <CardDescription>
      Practice quizzes generated from your vocabulary database
    </CardDescription>
  </CardHeader>
  <CardContent>
    <VocabularyQuizHistoryTable quizzes={vocabularyQuizHistory} />
  </CardContent>
</Card>
```

---

## Implementation Steps

### Phase 1: Database & Core Infrastructure

1. ✅ Update `prisma/schema.prisma` with new models
2. ✅ Run `npx prisma db push`
3. ✅ Create `types/vocabulary.ts`
4. ✅ Create `lib/vocabulary-utils.ts` with all utility functions

### Phase 2: API Routes (Backend)

5. ✅ Create `app/api/vocabulary/route.ts` (GET, POST)
6. ✅ Create `app/api/vocabulary/[id]/route.ts` (GET, PUT, DELETE)
7. ✅ Create `app/api/vocabulary/import/route.ts` (POST)
8. ✅ Create `app/api/vocabulary/export/route.ts` (GET)
9. ✅ Create `app/api/vocabulary-quiz/generate/route.ts` (POST)
10. ✅ Create `app/api/vocabulary-quiz/save/route.ts` (POST)
11. ✅ Create `app/api/vocabulary-quiz/submit/route.ts` (POST)
12. ✅ Create `app/api/vocabulary-quiz/history/route.ts` (GET)
13. ✅ Create `app/api/vocabulary-quiz/[id]/route.ts` (GET, DELETE)

### Phase 3: UI Components

14. ✅ Create `components/vocabulary-csv-uploader.tsx`
15. ✅ Create `components/vocabulary-entry-dialog.tsx`
16. ✅ Create `components/vocabulary-table.tsx`
17. ✅ Create `components/vocabulary-stats-card.tsx`
18. ✅ Create `components/vocabulary-quiz-generator.tsx`
19. ✅ Create `components/vocabulary-quiz-save-dialog.tsx`
20. ✅ Create `components/vocabulary-quiz-history-table.tsx`

### Phase 4: Pages

21. ✅ Create `app/vocabulary/page.tsx`
22. ✅ Create `app/vocabulary/generate-quiz/page.tsx`
23. ✅ Create `app/vocabulary-quiz/[id]/page.tsx`

### Phase 5: Navigation & Integration

24. ✅ Update `components/user-nav.tsx` with vocabulary menu items
25. ✅ Update `app/dashboard/page.tsx` with vocabulary quizzes section

### Phase 6: Testing

26. ✅ Test CSV import (valid/invalid data)
27. ✅ Test vocabulary CRUD operations
28. ✅ Test quiz generation with different question types
29. ✅ Test quiz taking and scoring
30. ✅ Test quiz history and retaking

---

## Key Implementation Details

### CSV Format
```csv
"Word","Meaning/Definition","Urdu Translation","Usage in a Sentence"
"Eventually","After a long time, or in the end.","آخر کار","After months of practice, she eventually learned to play the guitar."
"Incident","An event or occurrence, often one that is unpleasant or unusual.","واقعہ","The police are investigating a strange incident that occurred last night."
```

### Quiz Generation Logic

For each selected question type, generate questions:

**Word → Definition:**
- Question: `"What is the meaning of '{word}'?"`
- Options: [correct meaning, 3 random meanings from other entries]
- Correct: `meaning`

**Word → Urdu:**
- Question: `"What is the Urdu translation of '{word}'?"`
- Options: [correct urdu, 3 random urdu translations from other entries]
- Correct: `urduTranslation`

**Word → Usage:**
- Question: `"Which sentence correctly uses the word '{word}'?"`
- Options: [correct usage, 3 random usages from other entries]
- Correct: `usageExample`

**Distractor selection:**
- Randomly pick 3 different entries (excluding current word)
- Use same field type (meaning/urdu/usage)
- Shuffle options using `shuffleArrayWithSeed()`

### Validation Rules

**CSV Import:**
- All 4 fields required per row
- Skip rows with missing data (log error)
- Duplicate detection: case-insensitive word comparison
- Max 1000 entries per import

**Quiz Generation:**
- Minimum 4 vocabulary entries required
- At least 1 question type must be selected
- Question count ≤ total vocabulary entries
- Distribute questions evenly across selected types

---

## Dependencies & Patterns

**Reused from existing codebase:**
- `QuizQuestion` interface (from `types/quiz.ts`)
- `Quiz` component (from `components/quiz.tsx`)
- Authentication pattern (getServerSession)
- Database patterns (Prisma with cascade deletes)
- Shuffling utilities (`shuffleArrayWithSeed`, `generateSeed`)
- UI components (shadcn/ui Card, Table, Dialog, etc.)

**New dependencies needed:**
- CSV parsing: Use native JavaScript `split()` and regex (no new package needed)

---

## Critical Files

1. **prisma/schema.prisma** - Database schema foundation
2. **lib/vocabulary-utils.ts** - Core business logic (CSV parsing, quiz generation)
3. **app/api/vocabulary-quiz/generate/route.ts** - Quiz generation API
4. **components/vocabulary-table.tsx** - Main vocabulary management UI
5. **app/vocabulary/page.tsx** - Primary entry point for vocabulary feature

---

## Success Criteria

✅ Students can import CSV files to populate vocabulary database
✅ Students can view, edit, add, delete vocabulary entries
✅ Students can generate customized quizzes (select question types & count)
✅ Generated quizzes use MCQ format with distractors from same vocabulary database
✅ Students can take quizzes with both MCQ and text questions
✅ Quiz history tracked in dedicated dashboard section, similar to the current quiz history system
✅ Students can retake quizzes unlimited times
✅ All vocabulary data scoped to individual users (data isolation)
