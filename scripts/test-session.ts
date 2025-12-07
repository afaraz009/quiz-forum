// We'll need to simulate the JWT token creation to see what's being stored
import { prisma } from "../lib/prisma"

async function testSession() {
  try {
    console.log("Testing session data for user a.faraz009@gmail.com...")
    
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
    
    // Check what would be stored in the JWT token
    console.log("\nJWT token simulation:")
    console.log(`  sub: ${user.id}`)
    console.log(`  isAdmin: ${user.isAdmin}`)
    console.log(`  email: ${user.email}`)
    console.log(`  name: ${user.name}`)
    
  } catch (error: any) {
    console.error("❌ Error testing session:")
    console.error("Error message:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testSession()