# FUAB-CR (Course Registration & Results Management System)

Full-stack school course registration and results management system built with Next.js (App Router), TypeScript, and Prisma ORM.

## Features & Portals
- **Student Portal**: Self-service matric registration, course selection, and locked/unlocked result lookup.
- **Lecturer Portal**: Management-assigned course dashboard, streamlined score entry, and resubmission handler.
- **Management Portal**: Direct-access hidden URL route, student matric bulk pre-loading, CRUD management, grading policy configuration, and multi-stage score approvals.

## Tech Stack
- **Framework**: Next.js (App Router) with TypeScript
- **Database**: PostgreSQL / SQLite via Prisma ORM
- **Authentication**: Role-based JWT session authentication
- **Styling**: Modern Vanilla CSS design system

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Synchronize database schema:
   ```bash
   npx prisma db push
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
