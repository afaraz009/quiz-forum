# Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Generate Encryption Secret
Run this command locally:
```bash
node scripts/generate-encryption-key.js
```
Copy the generated key - you'll need it for Vercel.

### 2. Prepare Environment Variables
You'll need these values ready:

- [ ] `DATABASE_URL` - Your PostgreSQL connection string (from Neon/Supabase/etc.)
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)
- [ ] `GEMINI_KEY_ENCRYPTION_SECRET` - The key you generated in step 1

### 3. Code Ready
- [ ] All changes committed to git
- [ ] Pushed to GitHub main branch
- [ ] No build errors locally (`npm run build` succeeds)

## 🚀 Deployment Steps

### Step 1: Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel auto-detects Next.js settings ✅

### Step 2: Add Environment Variables
In Vercel project settings:

1. Go to **Settings** → **Environment Variables**

2. Add each variable:

   **DATABASE_URL**
   - Value: `postgresql://user:pass@host/db`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **NEXTAUTH_SECRET**
   - Value: (generated secret)
   - Environments: ✅ Production ✅ Preview ✅ Development

   **NEXTAUTH_URL**
   - Value: `https://your-app.vercel.app`
   - Environments: ✅ Production

   **GEMINI_KEY_ENCRYPTION_SECRET** ← **MOST IMPORTANT**
   - Value: (from step 1)
   - Environments: ✅ Production ✅ Preview ✅ Development

3. Click "Save" for each

### Step 3: Deploy
1. Click "Deploy" button
2. Wait for build to complete
3. Vercel will give you a URL

### Step 4: Initialize Database
After first deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Pull env vars
vercel env pull .env.local

# Run migration
npx prisma db push
```

### Step 5: Verify Deployment
- [ ] Visit your Vercel URL
- [ ] Create a test account
- [ ] Try creating a practice quiz
- [ ] Go to Settings → Add Gemini API key
- [ ] **If no errors, translation feature is working! ✅**

## 🐛 Troubleshooting

### Error: "GEMINI_KEY_ENCRYPTION_SECRET is not set"

**This happens when:**
- You forgot to add the environment variable to Vercel
- You added it but didn't redeploy

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Verify `GEMINI_KEY_ENCRYPTION_SECRET` exists
3. If missing, add it now
4. Go to Deployments tab
5. Click ⋮ on latest deployment → "Redeploy"

### Error: Database connection failed

**Fix:**
1. Check `DATABASE_URL` is correct
2. Verify database accepts external connections
3. Use pooled connection string (for Neon/Supabase)

### Error: "Prisma Client not found"

**Fix:**
- Should auto-fix via `postinstall` script
- Check Vercel build logs for errors during `npm install`
- Verify `package.json` has: `"postinstall": "prisma generate"`

## 📝 After Deployment

### For Your Users
Tell them:
1. Visit your app URL
2. Create an account
3. For translation practice:
   - Go to Settings
   - Click "Gemini API Key"
   - Add their personal Gemini API key
   - Start practicing!

### Maintaining the App
- Push to `main` branch → auto-deploys
- Monitor Vercel logs for errors
- Check database usage on your provider
- Rotate `NEXTAUTH_SECRET` periodically (users must re-login)

## 🎉 You're Done!

Your quiz app is now live with:
- ✅ Practice quizzes with unlimited attempts
- ✅ Published tests for formal assessment
- ✅ AI-powered translation practice
- ✅ Secure user authentication
- ✅ Encrypted API key storage

Need help? Check [VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) for detailed docs.
