const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function changeUserPassword(email, newPassword) {
  try {
    // Hash the new password with the same salt rounds as registration (12)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword },
    });
    
    console.log(`Password successfully updated for user: ${updatedUser.email}`);
    console.log(`User ID: ${updatedUser.id}`);
    
    // Verify the password was updated
    console.log(`New hashed password: ${hashedPassword}`);
  } catch (error) {
    console.error('Error updating password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node change-password.js <email> <new-password>');
  process.exit(1);
}

changeUserPassword(email, newPassword);