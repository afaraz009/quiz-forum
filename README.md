# Quiz Forum - Practice & Assessment Platform

A Next.js application for quiz practice and formal assessments with Urdu-English translation practice powered by AI.

## Features

### For Students
- **Practice Mode**: Create unlimited practice quizzes from JSON, retake anytime
- **Assessment Mode**: Take formal tests created by instructors (single attempt)
- **Translation Practice**: AI-powered Urdu to English translation practice with detailed feedback
- **Folder Organization**: Organize practice quizzes into custom folders
- **Attempt History**: Track all quiz attempts with scores and detailed results

### For Instructors (Admin Users)
- **Create Published Tests**: Create formal assessments with time limits and passing thresholds
- **View Analytics**: See detailed test performance analytics and student results
- **Export Results**: Export test results for grading and analysis

### Translation Practice Features
- **Multiple Difficulty Levels**: Beginner, Intermediate, Advanced
- **AI Feedback**: Detailed word-by-word feedback using Gemini AI
- **Passage Tracking**: Each passage can be attempted multiple times
- **Score Tracking**: Highest score and recent score for each passage
- **Full History**: View all attempts with detailed feedback for any passage

## Tech Stack

- **Framework**: Next.js 15 with React 19 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v4
- **Styling**: TailwindCSS + shadcn/ui
- **AI**: Google Gemini API for translation feedback
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- (Optional) Gemini API key for translation practice

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd quiz-forum
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Fill in the required values:
   ```env
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your_secret_here
   NEXTAUTH_URL=http://localhost:3000
   GEMINI_KEY_ENCRYPTION_SECRET=generate_using_script
   ```

   **Generate the encryption secret:**
   ```bash
   node scripts/generate-encryption-key.js
   ```

   Copy the output and set it as `GEMINI_KEY_ENCRYPTION_SECRET` in your `.env` file.

4. **Initialize the database**
   ```bash
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

See the detailed [Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md) for complete instructions.

### Quick Steps:

1. Push your code to GitHub
2. Import project to Vercel
3. Set required environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GEMINI_KEY_ENCRYPTION_SECRET` ← **Required for translation feature!**
4. Deploy!

**Important:** The `GEMINI_KEY_ENCRYPTION_SECRET` must be set on Vercel for the translation practice feature to work. This secret encrypts user-provided Gemini API keys before storing them in the database.

## Project Structure

```
quiz-forum/
├── app/                          # Next.js app router pages
│   ├── api/                      # API routes
│   │   ├── quiz/                 # Practice quiz endpoints
│   │   ├── published-tests/      # Assessment endpoints
│   │   ├── translation/          # Translation practice endpoints
│   │   └── settings/             # User settings endpoints
│   ├── dashboard/                # Student dashboard
│   ├── quiz/[id]/                # Practice quiz taking
│   ├── published-test/[id]/      # Test taking
│   ├── translation-practice/     # Translation practice
│   └── admin/                    # Admin pages
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── translation-practice/     # Translation-specific components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   ├── crypto.ts                 # Encryption utilities
│   └── gemini-client.ts          # Gemini AI integration
├── prisma/
│   └── schema.prisma             # Database schema
└── scripts/
    └── generate-encryption-key.js # Generate encryption secret
```

## Usage

### Creating a Practice Quiz

1. Log in to the app
2. Click "Upload Quiz" on the home page
3. Upload a JSON file or paste JSON content with this format:
   ```json
   [
     {
       "question": "What is 2 + 2?",
       "options": ["1", "2", "3", "4"],
       "correctAnswer": "4"
     }
   ]
   ```
4. Save to a folder for organization
5. Practice unlimited times!

### Using Translation Practice

1. Go to Settings → Gemini API Key
2. Add your personal Gemini API key
3. Navigate to Translation Practice
4. Select difficulty level
5. Translate Urdu passages to English
6. Get detailed AI feedback on your translations
7. Retake passages to improve your score

### Creating Published Tests (Admin Only)

1. Navigate to Admin → Create Test
2. Upload test questions (same JSON format as quizzes)
3. Set time limit and passing percentage
4. Publish the test
5. Students can now take the test (once only)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Secret for session encryption |
| `NEXTAUTH_URL` | Yes | Base URL of your app |
| `GEMINI_KEY_ENCRYPTION_SECRET` | Yes* | Secret for encrypting user API keys |

*Required if you want to enable the translation practice feature

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Your License Here]

## Support

For issues or questions:
- Check the [Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md)
- Review the [CLAUDE.md](./CLAUDE.md) project documentation
- Open an issue on GitHub
