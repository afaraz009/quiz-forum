import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkAdminStatus() {
  try {
    console.log("Checking admin status for user a.faraz009@gmail.com...")
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email: "a.faraz009@gmail.com"
      }
    })
    
    if (!user) {
      console.log("❌ User not found!")
      return
    }
    
    console.log(`User found:`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Name: ${user.name}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Is Admin: ${user.isAdmin}`)
    console.log(`  Created At: ${user.createdAt}`)
    
    // If user is not admin, make them admin
    if (!user.isAdmin) {
      console.log("\nUpdating user to admin...")
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          isAdmin: true
        }
      })
      
      console.log(`✅ User updated. Is Admin: ${updatedUser.isAdmin}`)
    } else {
      console.log("✅ User is already an admin!")
    }
    
  } catch (error: any) {
    console.error("❌ Error checking admin status:")
    console.error("Error message:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminStatus()