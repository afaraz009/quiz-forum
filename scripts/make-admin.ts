import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    })
    console.log(`Successfully made ${email} an admin:`, user)
  } catch (error) {
    console.error('Error making user admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]
if (!email) {
  console.error('Please provide an email: npx ts-node scripts/make-admin.ts user@example.com')
  process.exit(1)
}

makeAdmin(email)