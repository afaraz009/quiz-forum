const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyPassword(email, passwordToCheck) {
  try {
    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    
    if (!user || !user.password) {
      console.log(`User with email ${email} not found or has no password set`);
      return;
    }
    
    console.log(`User found: ${user.email}`);
    console.log(`Stored hashed password: ${user.password}`);
    
    // Check if the provided password matches the stored hash
    const isMatch = await bcrypt.compare(passwordToCheck, user.password);
    
    if (isMatch) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }
  } catch (error) {
    console.error('Error verifying password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const email = process.argv[2];
const passwordToCheck = process.argv[3];

if (!email || !passwordToCheck) {
  console.log('Usage: node verify-password.js <email> <password-to-check>');
  process.exit(1);
}

verifyPassword(email, passwordToCheck);