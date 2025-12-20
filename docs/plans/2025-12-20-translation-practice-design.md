# Translation Practice Feature - Design Document

**Date:** 2025-12-20
**Feature:** English-Urdu Translation Practice with Gemini AI Integration
**Status:** Design Complete - Ready for Implementation

---

## Executive Summary

This feature adds an AI-powered English-Urdu translation practice mode to the quiz application, allowing students to practice translating Urdu paragraphs to English with real-time AI feedback. Students use their own Gemini API keys, receive structured feedback on their translations, and can track their progress over time.

---

## Design Decisions Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Access Location** | Top-level dashboard section | Equal visibility alongside Published Tests and Practice Quizzes |
| **Content Generation** | AI-generated on-demand | Matches current Gemini workflow, unlimited variety |
| **API Key Management** | Stored encrypted in user profile | One-time setup, best UX |
| **Attempt Tracking** | Full history with all details | Enable progress tracking and mistake review |
| **Feedback Display** | Structured markdown table | Consistency with existing Gemini gem experience |
| **Session Flow** | Sequential multi-paragraph sessions | Mirrors Gemini gem workflow for focused practice |
| **Difficulty Selection** | Select once at session start | Consistent practice, can change in next session |
| **Scoring Method** | AI-generated score (out of 10) | Captures nuances like naturalness and idiom usage |
| **Session Management** | Auto-save entire session | Complete history without user friction |
| **Access Control** | All logged-in users | Learning tool for everyone including instructors |
| **Error Handling** | Clear messaging with setup guidance | Self-serve setup, predictable costs |
| **History Review** | Full review with all details | Learn from past mistakes, track improvement |

---

## 1. Database Schema & Data Models

### New Prisma Models

```prisma
model User {
  // ... existing fields
  geminiApiKey         String?               // Encrypted Gemini API key
  translationSessions  TranslationSession[]
}

model TranslationSession {
  id              String              @id @default(cuid())
  userId          String
  difficultyLevel Int                 // 1, 2, or 3
  startedAt       DateTime            @default(now())
  endedAt         DateTime?
  averageScore    Float?              // Calculated from all attempts
  totalParagraphs Int                 @default(0)
  isActive        Boolean             @default(true)

  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  attempts        TranslationAttempt[]

  @@index([userId])
  @@index([isActive])
}

model TranslationAttempt {
  id               String             @id @default(cuid())
  sessionId        String
  urduParagraph    String             // Original Urdu text
  userTranslation  String             // Student's English translation
  aiFeedback       String             // JSON: structured feedback table
  naturalVersion   String             // Native English version
  score            Float              // Out of 10
  attemptedAt      DateTime           @default(now())

  session          TranslationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}
```

### Data Structure Rationale

- **TranslationSession**: Groups multiple paragraph attempts together, enabling "session-based" practice tracking
- **TranslationAttempt**: Individual paragraph translations with complete feedback preserved
- **geminiApiKey**: Encrypted storage in User model for secure API key management
- Mirrors existing Quiz/QuizAttempt pattern for consistency

---

## 2. API Routes & Backend Logic

### Authentication & Settings

**`GET /api/settings/gemini-key`**
- Returns: `{ hasKey: boolean }` (never returns actual key)
- Purpose: Check if user has configured API key

**`POST /api/settings/gemini-key`**
- Request: `{ apiKey: string }`
- Validates key with test Gemini API call
- Encrypts and stores in User.geminiApiKey
- Returns: `{ success: boolean, message: string }`

### Translation Practice Flow

**`POST /api/translation/session/start`**
- Request: `{ difficultyLevel: 1 | 2 | 3 }`
- Creates TranslationSession with `isActive: true`
- Returns: `{ sessionId: string }`

**`POST /api/translation/generate-paragraph`**
- Request: `{ sessionId: string, difficultyLevel: number }`
- Decrypts user's API key
- Calls Gemini with difficulty-specific prompt
- Returns: `{ urduParagraph: string }`

**`POST /api/translation/submit`**
- Request: `{ sessionId: string, urduParagraph: string, userTranslation: string }`
- Sends to Gemini for structured feedback
- Parses response (table + natural version + score)
- Creates TranslationAttempt record
- Updates session totalParagraphs count
- Returns: `{ feedback: object[], naturalVersion: string, score: number, attemptId: string }`

**`POST /api/translation/session/end`**
- Request: `{ sessionId: string }`
- Sets `isActive: false`, `endedAt: now()`
- Calculates and saves `averageScore` from all attempts
- Returns: `{ sessionSummary: object }`

### History & Review

**`GET /api/translation/sessions`**
- Query params: `?page=1&limit=10&sortBy=startedAt&order=desc`
- Returns paginated list of user's sessions
- Returns: `{ sessions: [], total: number, page: number }`

**`GET /api/translation/sessions/[id]`**
- Returns complete session with all attempts
- Returns: `{ session: object, attempts: [] }`

### Security & Validation

- All routes require authenticated session
- Validate user owns session/attempt before operations
- Rate limiting: max 30 paragraph submissions per user per hour
- Zod schemas for request validation
- Server-side difficulty level validation (1-3 only)

---

## 3. Frontend Pages & Routes

### New Pages

**`app/translation-practice/page.tsx`**
- **Purpose**: Main translation practice interface
- **States**:
  1. Setup: Difficulty level selector (Level 1/2/3 with descriptions)
  2. Active Practice: Urdu paragraph display + translation textarea + Submit button
  3. Feedback View: AI feedback table + natural version + score + action buttons
- **Features**:
  - Session stats header: paragraphs completed, level, average score
  - "Next Paragraph" and "End Session" buttons
  - API key setup banner if not configured
  - Auto-save draft to localStorage

**`app/translation-practice/history/page.tsx`**
- **Purpose**: View all past translation sessions
- **Features**:
  - Table: Date, Duration, Level, Paragraphs, Avg Score, Actions
  - Sort by date, level, score
  - Filter by date range and level
  - Pagination (10 per page)
  - Click row to view session details

**`app/translation-practice/history/[id]/page.tsx`**
- **Purpose**: Detailed session review
- **Features**:
  - Session metadata (date, duration, level, average score)
  - List of all paragraphs with individual scores
  - Expandable cards showing: Urdu text, user translation, feedback table, natural version
  - Navigation to previous/next session

**`app/settings/page.tsx`** (new or extend existing)
- **Purpose**: API key configuration
- **Features**:
  - "Gemini API Settings" section
  - Password-type input for API key
  - "Test Connection" button with validation
  - Status indicator: "API Key Configured ✓" or "No API Key"
  - Instructions with external link to get free Gemini API key

### Dashboard Updates

**`app/dashboard/page.tsx`**
- Add "Translation Practice" card/section
- Quick stats: total sessions, recent average score
- "Start Practice" button → navigates to `/translation-practice`
- Recent session previews (last 3)

---

## 4. Core Components

### Practice Interface Components

**`components/translation-practice/difficulty-selector.tsx`**
- Three radio cards for Level 1/2/3
- Descriptions:
  - Level 1: "Daily routine conversations"
  - Level 2: "Intermediate topics"
  - Level 3: "Complex dialogues & informative content"
- "Start Practice" button

**`components/translation-practice/paragraph-display.tsx`**
- Card with Urdu paragraph in large, readable font
- Right-to-left (RTL) text direction
- Copy button for accessibility
- Props: `urduText: string`

**`components/translation-practice/translation-input.tsx`**
- Large textarea (min 4 rows)
- Character count display
- Submit button with loading state
- Auto-save to localStorage every 2 seconds
- Props: `onSubmit: (translation: string) => void, isLoading: boolean`

**`components/translation-practice/feedback-table.tsx`**
- Renders structured feedback as styled table
- Columns: Urdu Phrase | Your Translation | Suggested Fix | Why
- Color coding: green (correct), yellow (minor), red (major issues)
- Responsive: scrollable on mobile
- Props: `feedback: FeedbackRow[]`

**`components/translation-practice/session-summary.tsx`**
- Natural English version in highlighted card
- Score display with visual indicator (progress circle)
- Action buttons: "Next Paragraph" (primary), "End Session" (secondary)
- Props: `naturalVersion: string, score: number, onNext: () => void, onEnd: () => void`

### History Components

**`components/translation-practice/session-history-table.tsx`**
- Table with sorting, filtering, pagination
- Similar pattern to `enhanced-practice-quizzes-table`
- Props: `sessions: Session[], onViewDetails: (id: string) => void`

**`components/translation-practice/session-detail-card.tsx`**
- Expandable card for each attempt in session detail view
- Shows: Urdu paragraph, user translation, feedback table, natural version, score
- Props: `attempt: TranslationAttempt, isExpanded: boolean`

### Utility Components

**`components/translation-practice/api-key-setup-banner.tsx`**
- Alert banner with friendly message
- Dismissible (stores in localStorage)
- Link to settings page
- Props: `onDismiss: () => void`

**`components/translation-practice/session-stats-header.tsx`**
- Displays current session progress
- Shows: paragraphs completed, difficulty level, running average
- Props: `totalParagraphs: number, level: number, averageScore: number`

---

## 5. Gemini API Integration & Prompt Engineering

### API Client

**`lib/gemini-client.ts`**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { decryptApiKey } from './crypto';

export async function generateUrduParagraph(
  encryptedApiKey: string,
  difficultyLevel: 1 | 2 | 3
): Promise<string> {
  const apiKey = decryptApiKey(encryptedApiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = getParagraphGenerationPrompt(difficultyLevel);
  const result = await model.generateContent(prompt);
  const response = result.response.text();

  return response.trim();
}

export async function getFeedback(
  encryptedApiKey: string,
  urduParagraph: string,
  userTranslation: string
): Promise<{ feedback: FeedbackRow[], naturalVersion: string, score: number }> {
  const apiKey = decryptApiKey(encryptedApiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = getFeedbackPrompt(urduParagraph, userTranslation);
  const result = await model.generateContent(prompt);
  const response = result.response.text();

  return parseFeedbackResponse(response);
}
```

### Prompt Templates

**Paragraph Generation Prompt:**

```
You are a professional English-Urdu Language Coach. Generate a {difficulty_level} Urdu paragraph for translation practice.

Level 1: 3-4 lines about daily routine (e.g., "Main aj apny dost ko pick karnay ja raha hun")
Level 2: 3-4 lines with moderate difficulty, varied contexts (news, storytelling, anecdotes)
Level 3: 3-4 lines with dialogues or informative content

IMPORTANT REQUIREMENTS:
- Use vocabulary appropriate for English learners
- Avoid overly complex idioms or rare words
- Make it natural and conversational
- The paragraph should be realistic and practical
- Return ONLY the Urdu paragraph with no other text, explanations, or formatting

Example Level 1: "Main subah jaldi uth kar nashta karta hun. Phir main apni bike par college jata hun. Mujhe apne doston se milna acha lagta hai."
```

**Feedback Generation Prompt:**

```
You are a professional English-Urdu Language Coach. A student translated this Urdu paragraph to English. Provide structured feedback.

URDU PARAGRAPH:
{urdu_paragraph}

STUDENT'S TRANSLATION:
{user_translation}

Provide feedback in this EXACT format:

## FEEDBACK TABLE
| Urdu Phrase | Your Translation | Suggested Fix | Why |
|-------------|------------------|---------------|-----|
[Add a row for each mistake or area of improvement. If translation is perfect, add one row saying "Perfect!" in all columns]

## NATURAL VERSION
[Provide how a native English speaker would translate the entire paragraph for maximum flow and natural impact]

## SCORE
[Provide a score out of 10 based on accuracy, grammar, word choice, and naturalness]

IMPORTANT:
- Be encouraging but precise
- Focus on: tense, articles, word choice, grammar, naturalness
- Keep "Why" explanations concise (1 sentence)
- For perfect translations, still provide the natural version for comparison
- Score format: just the number (e.g., "8")
```

### Response Parsing

**`lib/parse-gemini-feedback.ts`**

```typescript
interface FeedbackRow {
  urduPhrase: string;
  yourTranslation: string;
  suggestedFix: string;
  why: string;
}

export function parseFeedbackResponse(response: string): {
  feedback: FeedbackRow[];
  naturalVersion: string;
  score: number;
} {
  // Extract feedback table section
  const tableMatch = response.match(/## FEEDBACK TABLE\s+([\s\S]*?)(?=##|$)/);
  const feedback = parseMarkdownTable(tableMatch?.[1] || '');

  // Extract natural version
  const naturalMatch = response.match(/## NATURAL VERSION\s+([\s\S]*?)(?=##|$)/);
  const naturalVersion = naturalMatch?.[1]?.trim() || '';

  // Extract score
  const scoreMatch = response.match(/## SCORE\s+(\d+)/);
  const score = parseInt(scoreMatch?.[1] || '5', 10);

  return { feedback, naturalVersion, score };
}

function parseMarkdownTable(tableText: string): FeedbackRow[] {
  const rows = tableText.trim().split('\n').slice(2); // Skip header and separator
  return rows.map(row => {
    const cols = row.split('|').map(s => s.trim()).filter(Boolean);
    return {
      urduPhrase: cols[0] || '',
      yourTranslation: cols[1] || '',
      suggestedFix: cols[2] || '',
      why: cols[3] || ''
    };
  });
}
```

### Error Handling

- Timeout: 30 seconds per API call
- Retry logic: 2 retries with exponential backoff
- Error types:
  - Invalid API key → prompt user to update settings
  - Quota exceeded → show friendly quota message
  - Network errors → show retry button
  - Malformed response → log error, show generic feedback unavailable message

---

## 6. Security & Data Protection

### API Key Encryption

**`lib/crypto.ts`**

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.GEMINI_KEY_ENCRYPTION_SECRET!;
const ALGORITHM = 'aes-256-gcm';

export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedKey: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedKey.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Environment Variable:**
- Add `GEMINI_KEY_ENCRYPTION_SECRET` (32-byte hex string) to `.env`
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### API Route Protection

**Middleware Checks:**
1. Authenticate session exists
2. Validate user owns the resource (session/attempt)
3. Rate limiting (using simple in-memory counter or Redis)
4. Input validation with Zod schemas

**Rate Limiting Example:**

```typescript
// lib/rate-limit.ts
const limits = new Map<string, { count: number, resetAt: number }>();

export function checkRateLimit(userId: string, maxRequests = 30): boolean {
  const now = Date.now();
  const hourAgo = now - 3600000;

  const userLimit = limits.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    limits.set(userId, { count: 1, resetAt: now + 3600000 });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}
```

### Input Validation

**Zod Schemas:**

```typescript
// lib/validation/translation.ts
import { z } from 'zod';

export const startSessionSchema = z.object({
  difficultyLevel: z.number().int().min(1).max(3)
});

export const generateParagraphSchema = z.object({
  sessionId: z.string().cuid(),
  difficultyLevel: z.number().int().min(1).max(3)
});

export const submitTranslationSchema = z.object({
  sessionId: z.string().cuid(),
  urduParagraph: z.string().min(10).max(1000),
  userTranslation: z.string().min(1).max(2000)
});

export const endSessionSchema = z.object({
  sessionId: z.string().cuid()
});
```

### Privacy & Data Access

- Students see only their own sessions/attempts
- Admin view (future enhancement) requires explicit permission model
- No cross-user data sharing
- Cascade delete: when user deleted, all sessions/attempts deleted

---

## 7. User Experience Flow & Error States

### First-Time Setup Flow

1. User logs in → sees dashboard
2. Notices new "Translation Practice" card
3. Clicks "Start Practice" → redirected to `/translation-practice`
4. Sees banner: "Setup your Gemini API key to get started" with link
5. Clicks link → redirected to `/settings`
6. Enters API key → clicks "Test Connection"
7. Success toast: "API key saved successfully!"
8. Redirected back to `/translation-practice`
9. Banner dismissed, difficulty selector enabled

### Active Practice Session Flow

1. Selects difficulty level (radio buttons)
2. Clicks "Start Practice"
3. Loading state (skeleton) → Urdu paragraph appears
4. Reads paragraph → types English translation in textarea
5. Clicks "Submit Translation" → button shows spinner + "Analyzing..."
6. After 3-5 seconds → feedback table appears with:
   - Structured corrections table
   - Natural version in highlighted card
   - Score out of 10 with visual indicator
7. Reviews feedback → clicks "Next Paragraph"
8. Cycle repeats (steps 3-7)
9. After completing 3-5 paragraphs → clicks "End Session"
10. Session summary modal appears:
    - Total paragraphs: 5
    - Average score: 7.8/10
    - Time spent: 12 minutes
    - Buttons: "View History" or "Start New Session"

### Error States & Handling

**No API Key Configured:**
- **UI**: Banner at top with warning icon
- **Message**: "To start practicing, please add your Gemini API key in Settings"
- **Action**: Button "Go to Settings"
- **Behavior**: Difficulty selector disabled until key added

**Invalid API Key:**
- **During Setup**: Error toast "Invalid API key. Please check and try again"
- **During Practice**: Modal popup "Your API key appears invalid. Please update it in Settings"
- **Action**: Pause session, redirect to settings

**API Quota Exceeded:**
- **UI**: Alert card with info icon
- **Message**: "Your Gemini API quota is exhausted. Please check your Google Cloud console or try again tomorrow"
- **Behavior**: Disable "Start Practice" and "Next Paragraph" buttons, allow history viewing

**Network/Timeout Errors:**
- **Paragraph Generation Failed**:
  - Show error toast: "Failed to generate paragraph"
  - Button: "Retry" (retry same request)
  - Auto-save session state

- **Feedback Submission Failed**:
  - Show error toast: "Failed to get feedback"
  - Button: "Retry" (resend same translation)
  - User's translation preserved in localStorage

**Malformed AI Response:**
- **UI**: Alert: "Received unexpected feedback format"
- **Fallback**: Show raw response text in code block
- **Action**: Button "Try Again" (generate new paragraph)
- **Backend**: Log error for debugging

### Session Recovery

**Browser Close During Active Session:**
- On return visit to `/translation-practice`:
  - Check localStorage for `activeSessionId`
  - Modal: "You have an incomplete session. Continue where you left off?"
  - Buttons: "Continue" or "Start Fresh"
  - If "Continue": restore session state + last draft translation

**Draft Translation Recovery:**
- Auto-save every 2 seconds to `localStorage`
- Key: `translationDraft_${sessionId}_${attemptNumber}`
- On page reload: restore draft if exists
- Clear draft after successful submission

### Loading States

**Paragraph Generation:**
- Skeleton loader (3 lines, shimmer animation)
- Text: "Generating your practice paragraph..."

**Feedback Processing:**
- Submit button disabled with spinner
- Text changes: "Submit Translation" → "Analyzing..."
- Progress indicator if taking >3 seconds

**Session Stats:**
- Smooth number animations when score updates
- Fade-in transition for new feedback table

---

## 8. Implementation Considerations & Future Enhancements

### Tech Stack Additions

**New Dependencies:**
```json
{
  "@google/generative-ai": "^0.1.3",
  "react-markdown": "^9.0.1"
}
```

**Optional Dependencies (Future):**
```json
{
  "recharts": "^2.10.0"  // For progress charts
}
```

**Reuse Existing:**
- shadcn/ui components (Button, Card, Table, Alert, Dialog, etc.)
- TailwindCSS for styling
- Zod for validation
- Prisma for database
- NextAuth for authentication

### Performance Optimizations

**Frontend:**
- Debounce auto-save (2 second delay)
- Lazy load session detail components
- Virtual scrolling for large history lists (if >100 sessions)
- Memoize difficulty descriptions (static content)

**Backend:**
- Prisma connection pooling (configured in `lib/prisma.ts`)
- Cache user's API key in memory for session duration (decrypt once)
- Paginate history queries (10 sessions per page)
- Index database queries on userId, sessionId

**API Calls:**
- Set reasonable timeouts (30s max)
- Implement exponential backoff for retries
- Consider caching generated paragraphs (optional, but reduces API costs)

### Responsive Design

**Mobile (<768px):**
- Stack layout: Paragraph → Translation → Feedback (vertical)
- Feedback table: horizontal scroll container
- Larger tap targets for buttons (min 44px height)
- Collapsible session stats header

**Tablet (768px-1024px):**
- Side-by-side: Paragraph left, Translation right
- Feedback below in full width

**Desktop (>1024px):**
- Three-column layout option (Paragraph | Translation | Tips)
- Wider feedback table with more breathing room

### Accessibility

**Text & Language:**
- RTL support for Urdu (`dir="rtl"` attribute)
- Font size controls for readability
- High contrast mode support

**Navigation:**
- Keyboard shortcuts:
  - Enter to submit (when in textarea)
  - Ctrl+N for next paragraph
  - Escape to close modals
- Tab navigation through all interactive elements
- Skip links for screen readers

**ARIA Labels:**
- `aria-label` on all icon buttons
- `aria-live` regions for score updates
- `aria-busy` during loading states
- `role="status"` for feedback display

### Testing Strategy

**Unit Tests:**
- `lib/crypto.ts`: encrypt/decrypt functions
- `lib/parse-gemini-feedback.ts`: parsing logic with various response formats
- `lib/gemini-client.ts`: mock Gemini API responses

**Integration Tests:**
- API routes with mocked Prisma and Gemini calls
- Test authentication guards
- Test rate limiting logic
- Test error handling paths

**E2E Tests (Playwright/Cypress):**
- Complete flow: setup API key → start session → submit translation → view feedback
- Error recovery: handle API failures gracefully
- Session recovery: close browser mid-session, reopen and continue

**Manual Testing:**
- Test with actual Gemini API key
- Verify prompt quality across all difficulty levels
- Check feedback accuracy and helpfulness
- Validate RTL text rendering

### Future Enhancements

**Phase 2 - Analytics Dashboard:**
- Progress charts (score over time using recharts)
- Common mistake patterns analysis
- Vocabulary growth tracking
- Time-of-day performance insights

**Phase 3 - Gamification:**
- Daily practice streaks
- Achievement badges (e.g., "10 perfect translations")
- Leaderboard (anonymous, opt-in)
- Level progression system

**Phase 4 - Instructor Features:**
- Admin can create custom translation exercises
- Assign specific paragraphs to students
- View student progress dashboard
- Export student performance reports

**Phase 5 - Advanced Practice Modes:**
- Audio-based practice (listening comprehension)
- Timed challenges
- Peer review (students review each other's translations)
- Spaced repetition (resurface difficult paragraphs)

**Phase 6 - Multi-Language Support:**
- Extend to other language pairs (English-Arabic, English-French, etc.)
- Language selection in user settings
- Different AI models for different languages

### Migration & Deployment Plan

**Database Migration:**
1. Add new models to `schema.prisma`
2. Run `npx prisma db push` to sync database
3. No data migration needed (new feature)

**Environment Variables:**
- Add `GEMINI_KEY_ENCRYPTION_SECRET` to production environment
- Document in `.env.example`

**Feature Flag (Optional):**
- Environment variable: `ENABLE_TRANSLATION_PRACTICE=true`
- Hide feature during testing/staging
- Enable for production when ready

**Rollout Strategy:**
1. Deploy to staging environment
2. Test with small group of beta users
3. Gather feedback on prompt quality and UX
4. Iterate on prompts if needed
5. Deploy to production
6. Monitor API usage and costs
7. Collect user feedback for Phase 2

**Monitoring:**
- Track Gemini API usage per user
- Monitor error rates (invalid keys, quota exceeded)
- Track session completion rates
- Monitor average session duration and paragraphs per session

---

## Success Metrics

**Usage Metrics:**
- Number of active users practicing translation weekly
- Average paragraphs completed per session
- Session completion rate (started vs. ended)
- Return rate (% of users who practice multiple times)

**Quality Metrics:**
- Average score improvement over time (first 5 sessions vs. sessions 20-25)
- Error rate for API calls
- User-reported feedback quality (survey)

**Technical Metrics:**
- API response time (target: <5s for feedback)
- Error rate (target: <2%)
- Database query performance (target: <100ms)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API quota exhaustion | High - users can't practice | Clear messaging, user provides own key |
| Poor AI feedback quality | High - defeats learning purpose | Iterate on prompts, collect user feedback |
| API key security breach | High - user credentials exposed | Strong encryption, never expose keys to frontend |
| Slow API responses | Medium - poor UX | Loading states, timeout handling, retry logic |
| Database storage growth | Low - text is small | Monitor storage, implement archival strategy if needed |

---

## Open Questions

None - all design decisions finalized.

---

## Next Steps

1. **Implementation Planning**: Create detailed task breakdown
2. **Database Setup**: Add Prisma models and run migration
3. **Backend Development**: Implement API routes and Gemini integration
4. **Frontend Development**: Build pages and components
5. **Testing**: Unit, integration, and E2E tests
6. **Deployment**: Staging → Production rollout

**Estimated Implementation Time**: 2-3 weeks for full feature (1 developer)

---

## Appendix: Example Gemini Responses

### Example Level 1 Paragraph
```
Main aj subah jaldi uth gaya kyun ke mujhe apne dost ko airport le jana tha. Hum ne saath mein nashta kiya aur phir meri car mein baith kar nikle. Safar mein hum ne purani yaadon ke baare mein baatein kien.
```

### Example Feedback Response
```markdown
## FEEDBACK TABLE
| Urdu Phrase | Your Translation | Suggested Fix | Why |
|-------------|------------------|---------------|-----|
| aj subah jaldi uth gaya | I waked up early this morning | I woke up early this morning | Past tense of "wake" is "woke", not "waked" |
| le jana tha | to take | to drop off | "Le jana" in this context means to drop someone off, not just take |
| purani yaadon ke baare mein | about old memories | about old times | More natural phrasing in English |

## NATURAL VERSION
I woke up early this morning because I had to drop my friend off at the airport. We had breakfast together and then left in my car. During the journey, we talked about old times.

## SCORE
7
```

---

**End of Design Document**
