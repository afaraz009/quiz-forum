import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function test() {
  // Test if folder model exists
  const folders = await prisma.folder.findMany()
  console.log("Folders:", folders)
  
  // Test if quiz model has folderId
  const quizzes = await prisma.quiz.findMany()
  console.log("Quizzes:", quizzes)
}

test()