import { prisma } from '../lib/prisma'

async function testNewModels() {
  try {
    console.log('🧪 Testing new database models...')
    
    // Test 1: Verify existing models still work
    console.log('\n1. Testing existing User model...')
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} existing users`)

    // Test 2: Test PublishedTest model
    console.log('\n2. Testing PublishedTest model...')
    
    // Find an admin user or create one for testing
    let adminUser = await prisma.user.findFirst({
      where: { isAdmin: true }
    })
    
    if (!adminUser) {
      // Create a test admin user if none exists
      adminUser = await prisma.user.create({
        data: {
          email: 'test-admin@example.com',
          name: 'Test Admin',
          username: 'testadmin',
          password: 'hashedpassword',
          isAdmin: true
        }
      })
      console.log('✅ Created test admin user')
    } else {
      console.log('✅ Found existing admin user')
    }

    // Create a test PublishedTest
    const testPublishedTest = await prisma.publishedTest.create({
      data: {
        title: 'Test Published Quiz',
        description: 'A test quiz to verify the database schema',
        questions: JSON.stringify([
          {
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4'
          }
        ]),
        totalQuestions: 1,
        timeLimit: 10,
        isPublished: true,
        publishedAt: new Date(),
        createdByUserId: adminUser.id
      }
    })
    console.log('✅ Created test PublishedTest:', testPublishedTest.title)

    // Test 3: Test TestAttempt model
    console.log('\n3. Testing TestAttempt model...')
    
    // Find a regular user or create one
    let studentUser = await prisma.user.findFirst({
      where: { isAdmin: false }
    })
    
    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          email: 'test-student@example.com',
          name: 'Test Student',
          username: 'teststudent',
          password: 'hashedpassword',
          isAdmin: false
        }
      })
      console.log('✅ Created test student user')
    } else {
      console.log('✅ Found existing student user')
    }

    // Create a test TestAttempt
    const testAttempt = await prisma.testAttempt.create({
      data: {
        score: 100,
        totalQuestions: 1,
        answers: JSON.stringify([{ questionIndex: 0, answer: '4' }]),
        isCompleted: true,
        completedAt: new Date(),
        userId: studentUser.id,
        publishedTestId: testPublishedTest.id
      }
    })
    console.log('✅ Created test TestAttempt with score:', testAttempt.score)

    // Test 4: Test unique constraint (one attempt per user per test)
    console.log('\n4. Testing unique constraint...')
    try {
      await prisma.testAttempt.create({
        data: {
          score: 50,
          totalQuestions: 1,
          answers: JSON.stringify([{ questionIndex: 0, answer: '3' }]),
          userId: studentUser.id,
          publishedTestId: testPublishedTest.id
        }
      })
      console.log('❌ Unique constraint failed - this should not happen!')
    } catch (error) {
      console.log('✅ Unique constraint working correctly - prevented duplicate attempt')
    }

    // Test 5: Test relationships
    console.log('\n5. Testing relationships...')
    const publishedTestWithAttempts = await prisma.publishedTest.findUnique({
      where: { id: testPublishedTest.id },
      include: {
        createdBy: true,
        testAttempts: {
          include: {
            user: true
          }
        }
      }
    })
    
    console.log('✅ PublishedTest with relationships loaded:')
    console.log(`  - Created by: ${publishedTestWithAttempts?.createdBy.name}`)
    console.log(`  - Attempts: ${publishedTestWithAttempts?.testAttempts.length}`)
    console.log(`  - Student who attempted: ${publishedTestWithAttempts?.testAttempts[0]?.user.name}`)

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    await prisma.testAttempt.delete({ where: { id: testAttempt.id } })
    await prisma.publishedTest.delete({ where: { id: testPublishedTest.id } })
    
    // Only delete test users if they were created in this script
    if (adminUser.email === 'test-admin@example.com') {
      await prisma.user.delete({ where: { id: adminUser.id } })
    }
    if (studentUser.email === 'test-student@example.com') {
      await prisma.user.delete({ where: { id: studentUser.id } })
    }

    console.log('✅ All tests passed! New database models are working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNewModels()