export type CourseRegistrationStatus = "registered" | "scored" | "approved";

export interface Faculty {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  facultyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  unit: number;
  level: number; // e.g. 100, 200, 300, 400
  semester: string; // "First" or "Second"
  departmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  matricNumber: string;
  fullName: string;
  departmentId: string;
  level: number;
  passwordHash?: string | null;
  isRegisteredOnPortal: boolean;
  isLocked: boolean; // access restriction flag for results
  createdAt: string;
  updatedAt: string;
}

export interface PreloadedMatric {
  id: string;
  matricNumber: string;
  fullName: string;
  departmentId: string;
  level: number;
  createdAt: string;
}

export interface Lecturer {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface LecturerCourseAssignment {
  id: string;
  lecturerId: string;
  courseId: string;
  session: string; // e.g. "2025/2026"
  createdAt: string;
}

export interface CourseRegistration {
  id: string;
  studentId: string;
  courseId: string;
  session: string; // e.g. "2025/2026"
  semester: string; // "First" or "Second"
  status: CourseRegistrationStatus;
  createdAt: string;
}

export interface Score {
  id: string;
  courseRegistrationId: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade?: string | null; // e.g. "A", "B", "C"
  gradePoint?: number | null; // e.g. 5.0, 4.0
  enteredByLecturerId: string;
  enteredAt: string;
  approvedByManagement: boolean;
  approvedAt?: string | null;
  policySnapshot?: Record<string, unknown> | string | null;
}

export interface GradingPolicy {
  id: string;
  session: string;
  caWeightPercent: number;
  examWeightPercent: number;
  gradeBoundaries: Record<string, [number, number, number]> | string; // e.g. {"A": [70, 100, 5.0]}
  createdAt: string;
  updatedAt: string;
}

export interface ManagementAdmin {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}
