# GEMINI.md

## Project Overview

This is a Next.js web application called "Quiz Forum". It allows users to create, take, and manage quizzes. The application uses NextAuth.js for authentication and Prisma for database access with a PostgreSQL database. The frontend is built with React, TypeScript, and Tailwind CSS.

The core features of the application are:

*   **User Authentication:** Users can register, login, and manage their accounts.
*   **Quiz Creation:** Users can create quizzes by uploading JSON files containing questions and answers.
*   **Quiz Taking:** Users can take quizzes and view their scores.
*   **Quiz Management:** Users can save their quizzes and view their past attempts.
*   **Admin Functionality:** There are admin-specific routes for analytics, exporting data, and managing published tests.

## Building and Running

### Prerequisites

*   Node.js
*   pnpm
*   PostgreSQL

### Installation

1.  Install dependencies:
    ```bash
    pnpm install
    ```
2.  Set up the database:
    *   Create a PostgreSQL database.
    *   Create a `.env` file in the root of the project and add the `DATABASE_URL`:
        ```
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
        ```
3.  Run database migrations:
    ```bash
    pnpm prisma migrate dev
    ```


### Building the application

```bash
pnpm build
```
Dont bother running the app. when you are done ask me to test it

## Development Conventions

*   **Code Style:** The project uses ESLint and Prettier for code formatting and linting.
*   **Type Checking:** The project uses TypeScript for static type checking.
*   **Database:** The project uses Prisma as the ORM for interacting with the PostgreSQL database.
*   **Authentication:** The project uses NextAuth.js for authentication.
*   **UI:** The project uses Tailwind CSS for styling and shadcn/ui for UI components.
