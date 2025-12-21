/**
 * Migration script to transform TranslationSession-based data to TranslationPassage-based data
 * Run this BEFORE running prisma db push
 *
 * This script:
 * 1. Creates a TranslationPassage for each unique urduParagraph in TranslationAttempt
 * 2. Updates TranslationAttempt records to reference the new passages
 * 3. Preserves all historical data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting migration of translation data...\n');

  try {
    // Get all existing sessions with their attempts
    const sessions = await prisma.translationSession.findMany({
      include: {
        attempts: true,
        user: true,
      },
    });

    console.log(`Found ${sessions.length} sessions to migrate`);

    let passagesCreated = 0;
    let attemptsProcessed = 0;

    // Group attempts by unique urduParagraph
    const passageMap = new Map<string, {
      urduParagraph: string;
      difficultyLevel: number;
      userId: string;
      attemptIds: string[];
    }>();

    // First pass: collect all unique passages
    for (const session of sessions) {
      for (const attempt of session.attempts) {
        const key = `${attempt.urduParagraph}_${session.userId}`;

        if (!passageMap.has(key)) {
          passageMap.set(key, {
            urduParagraph: attempt.urduParagraph,
            difficultyLevel: session.difficultyLevel,
            userId: session.userId,
            attemptIds: [attempt.id],
          });
        } else {
          passageMap.get(key)!.attemptIds.push(attempt.id);
        }
      }
    }

    console.log(`\nFound ${passageMap.size} unique passages to create\n`);

    // Note: This script prepares the data mapping but cannot execute the actual migration
    // because the schema hasn't been updated yet. We'll save the mapping to a JSON file
    // and create a post-migration script to update the attempts.

    const migrationData = Array.from(passageMap.entries()).map(([key, data]) => ({
      key,
      ...data,
    }));

    // Save migration mapping
    const fs = require('fs');
    fs.writeFileSync(
      'migration-data.json',
      JSON.stringify(migrationData, null, 2)
    );

    console.log(`Migration data saved to migration-data.json`);
    console.log(`\nNext steps:`);
    console.log(`1. Run: npx prisma db push --accept-data-loss`);
    console.log(`2. Run: npx tsx scripts/complete-migration.ts`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
