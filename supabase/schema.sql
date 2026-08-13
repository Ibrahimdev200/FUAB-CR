-- FUAB-CR Supabase PostgreSQL Schema Migration Script
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Faculties
CREATE TABLE IF NOT EXISTS faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, faculty_id)
);

-- 3. Courses
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  unit INT NOT NULL,
  level INT NOT NULL, -- e.g. 100, 200, 300, 400
  semester TEXT NOT NULL, -- "First" or "Second"
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PreloadedMatric (Uploaded by Management BEFORE student registers)
CREATE TABLE IF NOT EXISTS preloaded_matrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matric_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  level INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matric_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  level INT NOT NULL,
  password_hash TEXT,
  is_registered_on_portal BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE, -- Access restriction for results
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Lecturers
CREATE TABLE IF NOT EXISTS lecturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LecturerCourseAssignment
CREATE TABLE IF NOT EXISTS lecturer_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session TEXT NOT NULL, -- e.g. "2025/2026"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lecturer_id, course_id, session)
);

-- 8. CourseRegistration
CREATE TABLE IF NOT EXISTS course_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session TEXT NOT NULL, -- e.g. "2025/2026"
  semester TEXT NOT NULL, -- "First" or "Second"
  status TEXT NOT NULL DEFAULT 'registered', -- 'registered', 'scored', 'approved'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id, session, semester)
);

-- 9. Scores
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_registration_id UUID UNIQUE NOT NULL REFERENCES course_registrations(id) ON DELETE CASCADE,
  ca_score NUMERIC NOT NULL,
  exam_score NUMERIC NOT NULL,
  total_score NUMERIC NOT NULL,
  grade TEXT,
  grade_point NUMERIC,
  entered_by_lecturer_id UUID NOT NULL REFERENCES lecturers(id),
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by_management BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  policy_snapshot JSONB
);

-- 10. GradingPolicy
CREATE TABLE IF NOT EXISTS grading_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session TEXT UNIQUE NOT NULL,
  ca_weight_percent NUMERIC NOT NULL,
  exam_weight_percent NUMERIC NOT NULL,
  grade_boundaries JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ManagementAdmin
CREATE TABLE IF NOT EXISTS management_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
