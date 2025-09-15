const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        isAdmin: true,
        createdAt: true
      }
    });
    
    console.log('Users in the database:');
    console.log('=====================');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name || 'N/A'}`);
      console.log(`Username: ${user.username || 'N/A'}`);
      console.log(`Email: ${user.email || 'N/A'}`);
      console.log(`Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('---------------------');
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();