import { prisma } from "./prisma";

async function verifyDatabase() {
  console.log("Verifying data layer & Prisma models...");

  const counts = {
    faculty: await prisma.faculty.count(),
    department: await prisma.department.count(),
    course: await prisma.course.count(),
    student: await prisma.student.count(),
    preloadedMatric: await prisma.preloadedMatric.count(),
    lecturer: await prisma.lecturer.count(),
    lecturerCourseAssignment: await prisma.lecturerCourseAssignment.count(),
    courseRegistration: await prisma.courseRegistration.count(),
    score: await prisma.score.count(),
    gradingPolicy: await prisma.gradingPolicy.count(),
    managementAdmin: await prisma.managementAdmin.count(),
  };

  console.log("All 11 models verified successfully:", counts);
}

verifyDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Database verification failed:", err);
    process.exit(1);
  });
