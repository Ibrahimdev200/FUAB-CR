# FUAB-CR: Course Registration & Results Management System

FUAB-CR is an enterprise-grade academic administration, course registration, lecturer scoring, and CGPA calculation portal built with Next.js 15, TypeScript, Tailwind/Custom CSS, and Supabase PostgreSQL.

---

## Portals & Roles

1. **Management Portal (`/mgmt-portal-x9k2/login`)**:
   - Hidden, non-navigable route for university administrators.
   - Student CSV/Excel Data Upload (`preloaded_matrics`).
   - CRUD management for Faculties, Departments, Courses, and Lecturers.
   - Session Grading Policy Configuration.
   - Course Score Approvals & Rejections Queue.
   - Student Access Control (toggle result lock for fee clearance).
   - Registrations Report & Global Academic Settings.
   - Immutable System Audit Trail (`audit_logs`).

2. **Student Portal (`/student/login` & `/student/dashboard`)**:
   - Matric number verification against preloaded data.
   - Self-service first-time password setup & authentication.
   - Profile & Result Access Status Badge (`is_locked`).
   - Course Registration tool for active session/semester.
   - Registered Courses status tracker (`registered`, `scored`, `approved`, `rejected`).
   - Official Results Checker with auto-computed **Session GPA** and **Cumulative CGPA**.

3. **Lecturer Portal (`/lecturer/login` & `/lecturer/dashboard`)**:
   - Management-seeded credentials login (no self-registration).
   - Assigned Courses view for active session.
   - Fast row-by-row score entry table with **Save & Next** auto-focus workflow.
   - Management Rejection Alert Banner & History review.
   - Status badge indicating readiness for management approval.

---

## Production Security & Safeguards

- **Role-Based Edge Middleware**: Next.js Edge Middleware (`src/middleware.ts`) enforces strict JWT session role isolation across student, lecturer, and management routes.
- **IP Rate Limiting**: In-memory rate limiting (`src/lib/rate-limit.ts`) throttles student matric lookups to 10 requests/minute to prevent matric number brute-forcing.
- **Password Security**: Passwords are hashed using `bcryptjs` (salt rounds = 10), never stored in plaintext. Min 8 characters enforced on student registration.
- **Historic Policy Snapshotting**: Approved student score records snapshot the active `grading_policies` at approval time so future policy edits do not retroactively alter historic grades.
- **In-App Notifications**: Real-time notifications for course registration, score submission, result publication, management rejection, and access lock toggles.

---

## Database Backups & Recovery Routine

> [!IMPORTANT]
> A backup strategy is only as good as its last verified restore test. Follow the scheduled routine below to safeguard student records and academic data.

### 1. Scheduled Nightly Backup (`pg_dump`)
Set up a nightly cron job on your backup host to export a timestamped compressed database dump from Supabase PostgreSQL:

```bash
# Nightly Cron Job (Runs every midnight at 00:00)
0 0 * * * /usr/bin/pg_dump -h db.gorqigcafcdguwznglnb.supabase.co -U postgres -d postgres -F c -b -v -f "/var/backups/fuab_cr/fuab_cr_backup_$(date +\%Y\%m\%d_\%H\%M\%S).dump"
```

### 2. Storage Location & Retention Policy
- **Storage Location**: Daily backups must be synced immediately to an off-site, separate storage volume or cloud storage bucket (e.g. AWS S3 Glacier or Google Cloud Storage bucket), **NOT** on the same server disk as the live database.
- **Suggested Retention Policy**:
  - **Daily Backups**: Retain for 30 days.
  - **Weekly Backups**: Retain for 52 weeks (1 year).
  - **Monthly Backups**: Retain indefinitely for academic record compliance.

### 3. Step-by-Step Restoration Procedure
In the event of database failure or disaster recovery, follow these exact steps to restore a backup into a fresh database instance:

```bash
# Step 1: Provision fresh Supabase PostgreSQL database instance or local PostgreSQL DB.
# Step 2: Enable UUID extension
psql -h db.your-new-host.supabase.co -U postgres -d postgres -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Step 3: Restore full schema and data from backup dump
pg_restore -h db.your-new-host.supabase.co -U postgres -d postgres -v --clean --if-exists "/var/backups/fuab_cr/fuab_cr_backup_YYYYMMDD_HHMMSS.dump"

# Step 4: Verify migration integrity
psql -h db.your-new-host.supabase.co -U postgres -d postgres -c "SELECT count(*) FROM students; SELECT count(*) FROM scores;"
```

### 4. Backup Testing Reminder
> [!CAUTION]
> **Test your restore procedure quarterly on a staging/non-production database. An untested backup is NOT a guaranteed backup.**

---

## Pre-Deployment Verification Checklist & Assumptions

Before launching live for students and faculty:

1. **Live Database Migration**: Ensure `supabase/schema.sql` has been executed in your production Supabase SQL Editor.
2. **Environment Variables**: Verify `.env` or production deployment settings contain real secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` (Use a strong random string in production)
3. **First Management Seed Account**: Run CLI seed command to initialize the root management account:
   ```bash
   npx tsx scripts/seed-admin.ts admin@fuab.edu.ng YourSecurePassword123
   ```
4. **Grading Policy Verification**: Create the initial session `GradingPolicy` row in the Management Portal before lecturers begin scoring courses.
