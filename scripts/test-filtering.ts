import { prisma } from "../lib/prisma";

async function testFiltering() {
  try {
    // Get all folders
    const folders = await prisma.folder.findMany({
      include: {
        quizzes: true
      }
    });
    
    console.log("=== FOLDERS ===");
    folders.forEach(folder => {
      console.log(`Folder: ${folder.name} (ID: ${folder.id}, Default: ${folder.isDefault})`);
      console.log(`  Quizzes: ${folder.quizzes.length}`);
      folder.quizzes.forEach(quiz => {
        console.log(`    - ${quiz.title} (ID: ${quiz.id})`);
      });
    });
    
    // Get all quizzes with their folders
    const quizzes = await prisma.quiz.findMany({
      include: {
        folder: true
      }
    });
    
    console.log("\n=== QUIZZES ===");
    quizzes.forEach(quiz => {
      console.log(`Quiz: ${quiz.title} (ID: ${quiz.id})`);
      if (quiz.folder) {
        console.log(`  Folder: ${quiz.folder.name} (ID: ${quiz.folder.id})`);
      } else {
        console.log(`  Folder: None (Uncategorized)`);
      }
    });
    
    // Check specifically for quizzes in "Uncategorized" folder
    const uncategorizedFolderQuizzes = await prisma.quiz.findMany({
      where: {
        folder: {
          name: "Uncategorized"
        }
      },
      include: {
        folder: true
      }
    });
    
    console.log("\n=== QUIZZES IN 'Uncategorized' FOLDER ===");
    console.log(`Count: ${uncategorizedFolderQuizzes.length}`);
    uncategorizedFolderQuizzes.forEach(quiz => {
      console.log(`- ${quiz.title} (ID: ${quiz.id}) in folder ${quiz.folder?.name} (ID: ${quiz.folder?.id})`);
    });
    
    // Check for truly uncategorized quizzes (no folder)
    const trulyUncategorizedQuizzes = await prisma.quiz.findMany({
      where: {
        folderId: null
      }
    });
    
    console.log("\n=== TRULY UNCATEGORIZED QUIZZES (folderId = null) ===");
    console.log(`Count: ${trulyUncategorizedQuizzes.length}`);
    trulyUncategorizedQuizzes.forEach(quiz => {
      console.log(`- ${quiz.title} (ID: ${quiz.id})`);
    });
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFiltering();