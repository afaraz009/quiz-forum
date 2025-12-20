# Translation Practice Feature - Implementation Checklist

**Date:** 2025-12-20
**Feature:** English-Urdu Translation Practice with Gemini AI Integration
**Design Document:** `D:\CODE\quiz-forum\docs\plans\2025-12-20-translation-practice-design.md`

---

## Overview

AI-powered English-Urdu translation practice with real-time Gemini feedback. Follows existing quiz/test patterns. Estimated: 2-3 weeks.

---

## PHASE 1: Database & Environment ⚙️ ✅

### Database Schema
- [x] Add `geminiApiKey String?` and `translationSessions TranslationSession[]` to User model in `prisma/schema.prisma`
- [x] Add `TranslationSession` model with fields: id, userId, difficultyLevel, startedAt, endedAt, averageScore, totalParagraphs, isActive
- [x] Add `TranslationAttempt` model with fields: id, sessionId, urduParagraph, userTranslation, aiFeedback, naturalVersion, score, attemptedAt
- [x] Add indexes on TranslationSession (userId, isActive) and TranslationAttempt (sessionId)
- [x] Run `npx prisma db push` to sync database
- [ ] Verify models in Prisma Studio

### Environment Setup
- [x] Generate encryption secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [x] Add `GEMINI_KEY_ENCRYPTION_SECRET=<generated-value>` to `.env`
- [x] Update `.env.example` with `GEMINI_KEY_ENCRYPTION_SECRET=` and usage documentation

---

## PHASE 2: Core Backend Infrastructure 🔧 ✅

### Encryption & Security
- [x] Create `lib/crypto.ts` with `encryptApiKey()` and `decryptApiKey()` functions using AES-256-GCM
- [x] Add IV + authTag + encrypted data format (similar to bcrypt pattern in `app/api/register/route.ts`)
- [x] Create `lib/rate-limit.ts` with simple in-memory rate limiting (30 requests/hour)

### Gemini API Integration
- [x] Install dependency: `npm install @google/generative-ai`
- [x] Install dependency: `npm install react-markdown`
- [x] Create `lib/gemini-client.ts` with `generateUrduParagraph()` function
- [x] Add `getFeedback()` function in `lib/gemini-client.ts`
- [x] Implement 30-second timeout per API call
- [x] Add 2 retries with exponential backoff
- [x] Add error handling for: invalid keys, quota exceeded, network errors

### Response Parsing
- [x] Create `lib/parse-gemini-feedback.ts` with `FeedbackRow` interface
- [x] Add `parseFeedbackResponse()` function to extract table, natural version, and score from markdown

### Validation
- [x] Create `lib/validation/translation.ts` with Zod schemas
- [x] Add `startSessionSchema` (difficultyLevel: 1-3)
- [x] Add `generateParagraphSchema` (sessionId, difficultyLevel)
- [x] Add `submitTranslationSchema` (sessionId, urduParagraph 10-1000 chars, userTranslation 1-2000 chars)
- [x] Add `endSessionSchema` (sessionId)

---

## PHASE 3: API Routes 🌐 ✅

### Settings API
- [x] Create `app/api/settings/gemini-key/route.ts`
- [x] Add GET handler: check if user has API key (returns `{ hasKey: boolean }`)
- [x] Add POST handler: validate key with test Gemini call, encrypt and store
- [x] Follow auth check pattern from `app/api/quiz/save/route.ts`

### Session Management API
- [x] Create `app/api/translation/session/start/route.ts`
- [x] Add POST handler: create TranslationSession with difficultyLevel (1-3), return sessionId
- [x] Create `app/api/translation/session/end/route.ts`
- [x] Add POST handler: set isActive=false, calculate averageScore, return summary

### Practice Flow API
- [x] Create `app/api/translation/generate-paragraph/route.ts`
- [x] Add POST handler: decrypt API key, call Gemini with difficulty prompt, return urduParagraph
- [x] Create `app/api/translation/submit/route.ts`
- [x] Add POST handler: get AI feedback, create TranslationAttempt record, update session stats
- [x] Implement rate limiting (30 requests/hour) on submit route

### History API
- [x] Create `app/api/translation/sessions/route.ts`
- [x] Add GET handler: return paginated sessions (page, limit, sortBy, order query params)
- [x] Create `app/api/translation/sessions/[id]/route.ts`
- [x] Add GET handler: return session with all attempts

### Security & Validation
- [x] Add session validation to all routes (similar to `app/api/quiz/save/route.ts`)
- [x] Verify user owns session before any operations
- [x] Add Zod schema validation on all POST routes
- [x] Add try-catch error handling with appropriate status codes

---

## PHASE 4: Frontend Pages 📱 ✅

### Main Practice Interface
- [x] Create `app/translation-practice/page.tsx`
- [x] Add three states: Setup (difficulty selector), Practice (paragraph + input), Feedback (AI response)
- [x] Add session stats header component (paragraphs, level, average)
- [x] Add API key setup banner (shows if no key configured)
- [x] Implement auto-save draft to localStorage (every 2 seconds)
- [x] Add skeleton loaders for paragraph generation
- [x] Add error handling with retry buttons
- [x] Follow pattern from `app/quiz/[id]/page.tsx`

### History Pages
- [x] Create `app/translation-practice/history/page.tsx`
- [x] Add table: Date, Duration, Level, Paragraphs, Avg Score, Actions columns
- [ ] Implement sorting (date, level, score)
- [ ] Add date range and level filtering
- [ ] Add pagination (10 sessions per page)
- [x] Follow pattern from `components/enhanced-practice-quizzes-table.tsx`
- [x] Create `app/translation-practice/history/[id]/page.tsx` for session detail
- [x] Add session metadata display
- [x] Add expandable cards for each attempt
- [ ] Add previous/next session navigation

### Settings Page
- [x] Create `app/settings/page.tsx` (or extend if exists)
- [x] Add "Gemini API Settings" section
- [x] Add password-type input field for API key
- [ ] Add "Test Connection" button with loading state
- [x] Add status indicator (Configured ✓ / No API Key)
- [x] Add instructions with external link to get Gemini API key
- [x] Follow pattern from `components/quiz-save-dialog.tsx`

### Dashboard Integration
- [ ] Update `app/dashboard/page.tsx`
- [ ] Add "Translation Practice" section (third section)
- [ ] Add quick stats display (total sessions, recent avg score)
- [ ] Add "Start Practice" button → link to `/translation-practice`
- [ ] Add recent session previews (last 3 sessions)

---

## PHASE 5: UI Components 🎨 ✅

### Practice Interface Components (in `components/translation-practice/`)
- [x] Create `difficulty-selector.tsx`: Three radio cards (Level 1/2/3), descriptions, "Start Practice" button
- [x] Create `paragraph-display.tsx`: Urdu text card with RTL (`dir="rtl"`), copy button, large readable font
- [x] Create `translation-input.tsx`: Large textarea (4+ rows), character count, submit with loading state
- [x] Implement auto-save to localStorage every 2 seconds in `translation-input.tsx`
- [x] Create `feedback-table.tsx`: Styled table (Urdu | Your Translation | Suggested | Why columns)
- [x] Add color coding to feedback table: green (correct), yellow (minor), red (major)
- [x] Make feedback table responsive with horizontal scroll on mobile
- [x] Create `session-summary.tsx`: Natural version card, score with progress circle, action buttons

### History Components
- [ ] Create `session-history-table.tsx` with sorting, filtering, pagination
- [ ] Follow pattern from `components/enhanced-practice-quizzes-table.tsx`
- [ ] Create `session-detail-card.tsx` as expandable card using shadcn Accordion
- [ ] Show: Urdu paragraph, user translation, feedback table, natural version, score

### Utility Components
- [x] Create `api-key-setup-banner.tsx` using shadcn Alert
- [x] Make banner dismissible (store dismiss in localStorage)
- [x] Add link to settings page in banner
- [x] Create `session-stats-header.tsx`: paragraphs, level, running average
- [ ] Add smooth number animations for score updates

---

## PHASE 6: Testing & Quality ✅

### Manual Testing - Setup Flow
- [ ] Save API key in settings
- [ ] Test connection button validates key
- [ ] Invalid API key shows error
- [ ] API key status displays correctly on practice page

### Manual Testing - Practice Flow
- [ ] Start session with difficulty selection
- [ ] Urdu paragraph generates
- [ ] Translation submission works
- [ ] Feedback displays in structured format
- [ ] Score calculation accurate
- [ ] "Next Paragraph" generates new content
- [ ] "End Session" saves session correctly

### Manual Testing - History Flow
- [ ] Sessions list displays with stats
- [ ] Pagination works
- [ ] Session detail shows all attempts
- [ ] Expandable cards function properly

### Error Handling Tests
- [ ] No API key banner displays
- [ ] Invalid API key handled gracefully
- [ ] Quota exceeded shows friendly message
- [ ] Network errors have retry option
- [ ] Malformed AI response handled

### Responsive Design Tests
- [ ] Mobile layout (<768px)
- [ ] Tablet layout (768px-1024px)
- [ ] Desktop layout (>1024px)
- [ ] Feedback table scrolls on mobile

### Accessibility Tests
- [ ] RTL text displays correctly for Urdu
- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] High contrast mode supported

### Browser Tests
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Data Validation
- [ ] Session recovery after browser close
- [ ] Draft translation recovery
- [ ] Auto-save to localStorage
- [ ] Database cascade deletes (user deletion)

---

## PHASE 7: Deployment 🚀

### Pre-deployment
- [ ] Run `npx prisma db push` for database migration
- [ ] Add `GEMINI_KEY_ENCRYPTION_SECRET` to production environment
- [ ] Update `.env.example` with documentation
- [ ] Run `npm run build` successfully
- [ ] Verify no TypeScript errors
- [ ] Verify no console errors

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Test with real Gemini API key
- [ ] Verify encryption/decryption works
- [ ] Test complete user flow

### Beta Testing
- [ ] Small group (5-10 users)
- [ ] Gather feedback on prompt quality
- [ ] Monitor API usage and costs
- [ ] Iterate on prompts if needed

### Production Deployment
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Track user adoption
- [ ] Collect user feedback

### Monitoring Setup
- [ ] Active users practicing weekly
- [ ] Average paragraphs per session
- [ ] Session completion rate
- [ ] API response times
- [ ] Error rates by type
- [ ] API usage costs

---

## 📋 Quick Reference: Files to Create

**Backend (lib/):**
- `lib/crypto.ts` - API key encryption
- `lib/gemini-client.ts` - Gemini API wrapper
- `lib/parse-gemini-feedback.ts` - Response parser
- `lib/validation/translation.ts` - Zod schemas
- `lib/rate-limit.ts` - Rate limiting

**API Routes (app/api/):**
- `app/api/settings/gemini-key/route.ts`
- `app/api/translation/session/start/route.ts`
- `app/api/translation/session/end/route.ts`
- `app/api/translation/generate-paragraph/route.ts`
- `app/api/translation/submit/route.ts`
- `app/api/translation/sessions/route.ts`
- `app/api/translation/sessions/[id]/route.ts`

**Pages (app/):**
- `app/translation-practice/page.tsx`
- `app/translation-practice/history/page.tsx`
- `app/translation-practice/history/[id]/page.tsx`
- `app/settings/page.tsx`

**Components (components/translation-practice/):**
- `difficulty-selector.tsx`
- `paragraph-display.tsx`
- `translation-input.tsx`
- `feedback-table.tsx`
- `session-summary.tsx`
- `session-history-table.tsx`
- `session-detail-card.tsx`
- `api-key-setup-banner.tsx`
- `session-stats-header.tsx`

**Files to Modify:**
- `prisma/schema.prisma` - Add 3 models
- `app/dashboard/page.tsx` - Add Translation section
- `.env` & `.env.example` - Add encryption secret

---

## 🎯 Implementation Timeline

**Week 1:** Database + Backend (Phases 1-3)
**Week 2:** Frontend Pages + Components (Phases 4-5)
**Week 3:** Testing + Deployment (Phases 6-7)

**Total:** ~2-3 weeks (single developer)

---

**END OF CHECKLIST**
