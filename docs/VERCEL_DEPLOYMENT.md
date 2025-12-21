# Vercel Deployment Guide

## Required Environment Variables

Before deploying to Vercel, you need to set up the following environment variables in your Vercel project settings.

### 1. Database Configuration

```
DATABASE_URL=your_postgresql_connection_string
```

Get this from your PostgreSQL provider (Neon, Supabase, etc.)

### 2. NextAuth Configuration

```
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-app-domain.vercel.app
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Gemini API Key Encryption Secret (REQUIRED for Translation Feature)

```
GEMINI_KEY_ENCRYPTION_SECRET=your_64_character_hex_string
```

This is used to encrypt user-provided Gemini API keys before storing them in the database.

**Generate it:**
```bash
node scripts/generate-encryption-key.js
```

Or use this one-liner:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**IMPORTANT:**
- This secret must be set for the translation practice feature to work
- Users will provide their own Gemini API keys through the app settings
- This secret encrypts those keys before storing in the database
- Keep this secret secure and use the same value across all environments
- If you change this secret, all existing encrypted API keys will become unrecoverable

### 4. Optional: Google OAuth (if using social login)

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Setting Environment Variables on Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the following settings:
   - **Environment:** Select all (Production, Preview, Development)
   - **Name:** Variable name (e.g., `GEMINI_KEY_ENCRYPTION_SECRET`)
   - **Value:** The generated/configured value

4. After adding all variables, trigger a new deployment:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

## Deployment Steps

### First Time Deployment

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure environment variables** (as described above)

4. **Deploy!**
   - Click "Deploy"
   - Vercel will build and deploy your app

### Database Setup After First Deployment

After your first deployment, you need to initialize the database:

1. **Run Prisma migrations**

   You have two options:

   **Option A: Using Vercel CLI (Recommended)**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Link to your project
   vercel link

   # Run migration
   vercel env pull .env.local
   npx prisma db push
   ```

   **Option B: Using your database provider's console**
   - Some providers like Neon offer a SQL console
   - You can run `npx prisma db push` locally with production DATABASE_URL
   - **Warning:** Be careful when running commands against production

2. **Verify deployment**
   - Visit your app URL
   - Try creating an account
   - Test the translation practice feature by adding a Gemini API key

## Troubleshooting

### "GEMINI_KEY_ENCRYPTION_SECRET is not set" Error

**Cause:** The encryption secret environment variable is missing.

**Solution:**
1. Generate a secret: `node scripts/generate-encryption-key.js`
2. Add it to Vercel environment variables
3. Redeploy the app

### "Prisma Client not found" Error

**Cause:** Prisma client wasn't generated during build.

**Solution:**
- This should auto-generate via the `postinstall` script in package.json
- If it persists, check Vercel build logs for errors during `npm install`

### Database Connection Issues

**Cause:** Invalid DATABASE_URL or database not accessible.

**Solution:**
1. Verify your DATABASE_URL is correct
2. Check if your database provider allows external connections
3. For Neon/Supabase, ensure you're using the pooled connection string
4. Check if there are any IP restrictions on your database

### Translation Feature Not Working

**Checklist:**
- [ ] `GEMINI_KEY_ENCRYPTION_SECRET` is set in Vercel
- [ ] User has added their Gemini API key in app settings
- [ ] Gemini API key is valid and has credits
- [ ] Check browser console and Vercel logs for errors

## Updating Your Deployment

When you push changes to your main branch, Vercel will automatically:
1. Detect the changes
2. Build your app
3. Deploy the new version

No manual intervention needed for most updates!

## Production Best Practices

1. **Separate environments**: Use different environment variable values for Preview vs Production
2. **Database backups**: Enable automated backups on your database provider
3. **Monitor usage**: Check Vercel analytics and database usage regularly
4. **Secret rotation**: Periodically rotate your NEXTAUTH_SECRET (requires user re-login)
5. **Error tracking**: Consider adding Sentry or similar for production error monitoring

## Need Help?

- Vercel Documentation: https://vercel.com/docs
- Prisma Documentation: https://www.prisma.io/docs
- NextAuth Documentation: https://next-auth.js.org
