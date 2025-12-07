import { prisma } from "../lib/prisma"

async function testFolders() {
  try {
    console.log("Testing folders...")
    
    // Get all folders
    const folders = await prisma.folder.findMany()
    
    console.log(`Total folders: ${folders.length}`)
    
    folders.forEach((folder, index) => {
      console.log(`${index + 1}. Name: ${folder.name}`)
      console.log(`   ID: ${folder.id}`)
      console.log(`   Is Default: ${folder.isDefault}`)
      console.log(`   User ID: ${folder.userId}`)
      console.log("---")
    })
    
  } catch (error: any) {
    console.error("Error testing folders:")
    console.error("Error message:", error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testFolders()