import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function initializeFolders() {
  try {
    // Get all users
    const users = await prisma.user.findMany()
    
    console.log(`Found ${users.length} users`)
    
    // For each user, create a default folder if they don't have one
    for (const user of users) {
      const existingDefaultFolder = await prisma.folder.findFirst({
        where: {
          userId: user.id,
          isDefault: true
        }
      })
      
      if (!existingDefaultFolder) {
        await prisma.folder.create({
          data: {
            name: "Uncategorized",
            isDefault: true,
            userId: user.id
          }
        })
        console.log(`Created default folder for user ${user.id}`)
      } else {
        console.log(`User ${user.id} already has a default folder`)
      }
    }
    
    console.log("Folder initialization complete!")
  } catch (error) {
    console.error("Error initializing folders:", error)
  } finally {
    await prisma.$disconnect()
  }
}

initializeFolders()