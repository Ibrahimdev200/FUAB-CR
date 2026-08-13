export type CourseRegistrationStatus = "registered" | "scored" | "approved";

export interface Faculty {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  faculty_id: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  unit: number;
  level: number; // e.g. 100, 200, 300, 400
  semester: string; // "First" or "Second"
  department_id: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  matric_number: string;
  full_name: string;
  department_id: string;
  level: number;
  password_hash?: string | null;
  is_registered_on_portal: boolean;
  is_locked: boolean; // access restriction flag for results
  created_at: string;
  updated_at: string;
}

export interface PreloadedMatric {
  id: string;
  matric_number: string;
  full_name: string;
  department_id: string;
  level: number;
  created_at: string;
}

export interface Lecturer {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface LecturerCourseAssignment {
  id: string;
  lecturer_id: string;
  course_id: string;
  session: string; // e.g. "2025/2026"
  created_at: string;
}

export interface CourseRegistration {
  id: string;
  student_id: string;
  course_id: string;
  session: string; // e.g. "2025/2026"
  semester: string; // "First" or "Second"
  status: CourseRegistrationStatus;
  created_at: string;
}

export interface Score {
  id: string;
  course_registration_id: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade?: string | null;
  grade_point?: number | null;
  entered_by_lecturer_id: string;
  entered_at: string;
  approved_by_management: boolean;
  approved_at?: string | null;
  policy_snapshot?: Record<string, unknown> | string | null;
}

export interface GradingPolicy {
  id: string;
  session: string;
  ca_weight_percent: number;
  exam_weight_percent: number;
  grade_boundaries: Record<string, [number, number, number]> | string;
  created_at: string;
  updated_at: string;
}

export interface ManagementAdmin {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}
