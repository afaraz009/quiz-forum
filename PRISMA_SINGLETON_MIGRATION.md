# PrismaClient Singleton Pattern Migration

## Problem Identified

The codebase was creating new `PrismaClient` instances in every API route and utility file (~32 files), which causes:

1. **Connection Pool Exhaustion**: Each instance creates its own connection pool
2. **Development Hot Reload Issues**: Next.js dev server creates multiple instances on file changes
3. **Performance Overhead**: Unnecessary client initialization on every API request
4. **Memory Leaks**: Potential connection leaks in development

## Solution Implemented

Created a **singleton pattern** for PrismaClient to ensure only one instance exists across the application.

### Files Changed

#### 1. Created New File: `lib/prisma.ts`
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Key Features:**
- Single instance across the entire application
- Prevents hot-reload duplication in development
- Optional query logging in development mode
- Proper TypeScript typing

#### 2. Updated 20 API Route Files

**Files Updated:**
- `app/api/folders/[id]/route.ts`
- `app/api/folders/route.ts`
- `app/api/folders/move-quiz/route.ts`
- `app/api/quiz/[id]/route.ts`
- `app/api/quiz/history/route.ts`
- `app/api/quiz/save/route.ts`
- `app/api/quiz/submit/route.ts`
- `app/api/published-tests/route.ts`
- `app/api/published-tests/[id]/route.ts`
- `app/api/published-tests/[id]/results/route.ts`
- `app/api/published-tests/save/route.ts`
- `app/api/published-tests/submit/route.ts`
- `app/api/register/route.ts`
- `app/api/sample-prompts/route.ts`
- `app/api/sample-prompts/[id]/route.ts`
- `app/api/admin/published-tests/route.ts`
- `app/api/admin/analytics/tests/route.ts`
- `app/api/admin/analytics/tests/[id]/route.ts`
- `app/api/admin/export/[id]/route.ts`

**Change Pattern:**
```diff
- import { PrismaClient } from "@prisma/client"
- const prisma = new PrismaClient()
+ import { prisma } from "@/lib/prisma"
```

#### 3. Updated Core Library: `lib/auth.ts`

NextAuth configuration now uses the singleton instance:

```diff
- import { PrismaClient } from "@prisma/client"
- const prisma = new PrismaClient()
+ import { prisma } from "@/lib/prisma"
```

#### 4. Updated 8 TypeScript Utility Scripts

**Scripts Updated:**
- `scripts/make-admin.ts`
- `scripts/initialize-folders.ts`
- `scripts/check-admin-status.ts`
- `scripts/seed-sample-prompts.ts`
- `scripts/test-folders.ts`
- `scripts/test-filtering.ts`
- `scripts/test-new-models.ts`
- `scripts/test-session.ts`
- `test-prisma.ts`

**Change Pattern:**
```diff
- import { PrismaClient } from "@prisma/client"
- const prisma = new PrismaClient()
+ import { prisma } from "../lib/prisma"
```

#### 5. Documented 3 JavaScript Utility Files

**Files Documented:**
- `change-password.js`
- `list-users.js`
- `verify-password.js`

These files use CommonJS (`require()`) and cannot easily use the ES module singleton. Added documentation comments explaining this limitation:

```javascript
// Note: This file uses CommonJS. For production, consider converting to ES modules
// For now, we'll keep the direct instantiation since require() doesn't work well with singleton pattern
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

## Benefits Achieved

✅ **Single Database Connection Pool**: All API routes share one PrismaClient instance
✅ **Better Development Experience**: No more duplicate clients during hot reload
✅ **Improved Performance**: Reduced memory usage and connection overhead
✅ **Production-Ready**: Proper singleton pattern prevents connection exhaustion
✅ **Better Logging**: Centralized query logging in development mode

## Verification

### Build Test
```bash
npm run build
```
**Result:** ✅ Build successful with no errors

### File Count Verification
- **API Routes using singleton:** 20 files
- **TypeScript scripts using singleton:** 9 files
- **CommonJS scripts (documented):** 3 files
- **Core library files:** 1 file (lib/auth.ts)

### No Remaining Direct Instantiations
```bash
grep -r "new PrismaClient()" app/api --include="*.ts" | wc -l
```
**Result:** 0 (all API routes migrated)

## Migration Checklist

- [x] Create lib/prisma.ts with singleton pattern
- [x] Update all API routes (20 files)
- [x] Update lib/auth.ts
- [x] Update TypeScript utility scripts (9 files)
- [x] Document CommonJS utility scripts (3 files)
- [x] Test build process
- [x] Verify no direct instantiations remain in API routes

## Best Practices Applied

1. **Global Singleton Pattern**: Prevents multiple instances in dev and prod
2. **TypeScript Safety**: Proper typing for the singleton instance
3. **Environment-Aware Logging**: Query logs only in development
4. **Import Path Consistency**: Used `@/lib/prisma` for all imports
5. **Documentation**: Clear comments in files that couldn't be migrated

## Future Recommendations

1. **Convert CommonJS scripts to ES modules** for full singleton pattern adoption
2. **Add connection pool monitoring** in production
3. **Consider Prisma middleware** for centralized error handling and logging
4. **Add database health check endpoint** using the singleton instance

## References

- [Prisma Best Practices - Instantiation](https://www.prisma.io/docs/guides/database/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices)
- [Next.js + Prisma](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices)
