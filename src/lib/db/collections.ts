import { adminDb } from "../firebase-admin";
import {
  Faculty,
  Department,
  Course,
  Student,
  PreloadedMatric,
  Lecturer,
  LecturerCourseAssignment,
  CourseRegistration,
  Score,
  GradingPolicy,
  ManagementAdmin,
} from "@/types/db";

export const COLLECTIONS = {
  FACULTIES: "faculties",
  DEPARTMENTS: "departments",
  COURSES: "courses",
  STUDENTS: "students",
  PRELOADED_MATRICS: "preloadedMatrics",
  LECTURERS: "lecturers",
  LECTURER_COURSE_ASSIGNMENTS: "lecturerCourseAssignments",
  COURSE_REGISTRATIONS: "courseRegistrations",
  SCORES: "scores",
  GRADING_POLICIES: "gradingPolicies",
  MANAGEMENT_ADMINS: "managementAdmins",
} as const;

// Helper to convert Firestore Snapshot to typed object
export function formatDoc<T>(doc: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as T;
}

export function formatQueryDocs<T>(snapshot: FirebaseFirestore.QuerySnapshot): T[] {
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

// Typed Collection Accessors
export const dbService = {
  faculties: adminDb.collection(COLLECTIONS.FACULTIES),
  departments: adminDb.collection(COLLECTIONS.DEPARTMENTS),
  courses: adminDb.collection(COLLECTIONS.COURSES),
  students: adminDb.collection(COLLECTIONS.STUDENTS),
  preloadedMatrics: adminDb.collection(COLLECTIONS.PRELOADED_MATRICS),
  lecturers: adminDb.collection(COLLECTIONS.LECTURERS),
  lecturerCourseAssignments: adminDb.collection(COLLECTIONS.LECTURER_COURSE_ASSIGNMENTS),
  courseRegistrations: adminDb.collection(COLLECTIONS.COURSE_REGISTRATIONS),
  scores: adminDb.collection(COLLECTIONS.SCORES),
  gradingPolicies: adminDb.collection(COLLECTIONS.GRADING_POLICIES),
  managementAdmins: adminDb.collection(COLLECTIONS.MANAGEMENT_ADMINS),
};
