export type CourseRegistrationStatus = "registered" | "scored" | "approved" | "rejected";

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
  faculty?: Faculty;
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
  department?: Department;
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
  lock_reason?: string | null;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface PreloadedMatric {
  id: string;
  matric_number: string;
  full_name: string;
  department_id: string;
  level: number;
  created_at: string;
  department?: Department;
}

export interface Lecturer {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  assignments?: LecturerCourseAssignment[];
}

export interface LecturerCourseAssignment {
  id: string;
  lecturer_id: string;
  course_id: string;
  session: string; // e.g. "2025/2026"
  created_at: string;
  lecturer?: Lecturer;
  course?: Course;
}

export interface CourseRegistration {
  id: string;
  student_id: string;
  course_id: string;
  session: string; // e.g. "2025/2026"
  semester: string; // "First" or "Second"
  status: CourseRegistrationStatus;
  created_at: string;
  student?: Student;
  course?: Course;
  score?: Score;
}

export interface RejectionHistoryEntry {
  rejectedAt: string;
  rejectedBy: string;
  note: string;
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
  rejection_note?: string | null;
  rejection_history?: RejectionHistoryEntry[] | null;
  policy_snapshot?: Record<string, unknown> | string | null;
  course_registration?: CourseRegistration;
  entered_by_lecturer?: Lecturer;
}

export interface GradeBoundary {
  grade: string;
  minScore: number;
  maxScore: number;
  gradePoint: number;
}

export interface GradingPolicy {
  id: string;
  session: string;
  ca_weight_percent: number;
  exam_weight_percent: number;
  grade_boundaries: GradeBoundary[] | Record<string, unknown> | string;
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

export interface AcademicSettings {
  id: string;
  active_session: string;
  active_semester: string;
  updated_at: string;
}
