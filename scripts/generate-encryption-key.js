/**
 * Generate a secure encryption key for GEMINI_KEY_ENCRYPTION_SECRET
 *
 * Usage:
 *   node scripts/generate-encryption-key.js
 *
 * This will generate a random 32-byte (256-bit) key encoded as hex.
 * Copy the output and set it as GEMINI_KEY_ENCRYPTION_SECRET in your environment variables.
 */

const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');

console.log('\n===========================================');
console.log('Gemini API Key Encryption Secret');
console.log('===========================================\n');
console.log('Add this to your environment variables:\n');
console.log(`GEMINI_KEY_ENCRYPTION_SECRET=${key}\n`);
console.log('===========================================\n');
console.log('IMPORTANT:');
console.log('- Keep this secret secure and never commit it to version control');
console.log('- Use the same key across all environments for the same database');
console.log('- If you change this key, existing encrypted API keys will be unrecoverable');
console.log('===========================================\n');
