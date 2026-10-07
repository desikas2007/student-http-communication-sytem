import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB, disconnectDB, withRetry } from '../config/db.js';
import Student from '../models/Student.js';
import Examination from '../models/Examination.js';
import HttpLog from '../models/HttpLog.js';

/** ISO date (YYYY-MM-DD) shifted by a number of days from today. */
const dayOffset = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Demo students - the plain text password is hashed before it is stored. */
const students = [
  {
    name: 'Arul Palanivel',
    registerNumber: '23CSE101',
    email: 'student@college.edu',
    password: 'password',
    department: 'Computer Science and Engineering',
    year: 3,
    section: 'A',
    phone: '9876543210',
    informationSubmitted: true,
    submittedAt: new Date(),
  },
  {
    name: 'Priya Shankar',
    registerNumber: '23CSE102',
    email: 'priya@college.edu',
    password: 'password',
    department: 'Computer Science and Engineering',
    year: 3,
    section: 'B',
    phone: '9876543211',
    informationSubmitted: false,
    submittedAt: null,
  },
  {
    name: 'Karthik Rajan',
    registerNumber: '23ECE204',
    email: 'karthik@college.edu',
    password: 'password',
    department: 'Electronics and Communication Engineering',
    year: 2,
    section: 'A',
    phone: '9876543212',
    informationSubmitted: false,
    submittedAt: null,
  },
];

/** 8 examination records - 4 already conducted, 4 upcoming. */
const examinations = [
  {
    subject: 'Computer Networks',
    subjectCode: 'CS8601',
    examType: 'Internal Assessment',
    date: dayOffset(-42),
    startTime: '10:00',
    endTime: '12:00',
    room: 'Block A - Room 204',
    department: 'CSE',
    year: 3,
    semester: 5,
    instructions:
      'Bring your college ID card. Calculators are not permitted. Reach the hall 15 minutes before the start time.',
  },
  {
    subject: 'Operating Systems',
    subjectCode: 'CS8491',
    examType: 'Internal Assessment',
    date: dayOffset(-28),
    startTime: '10:00',
    endTime: '11:30',
    room: 'Block A - Room 205',
    department: 'CSE',
    year: 3,
    semester: 5,
    instructions: 'Answer all questions. Rough sheets will be provided by the invigilator.',
  },
  {
    subject: 'Database Management Systems',
    subjectCode: 'CS8492',
    examType: 'Unit Test',
    date: dayOffset(-19),
    startTime: '14:00',
    endTime: '15:00',
    room: 'Block B - Lab 3',
    department: 'CSE',
    year: 3,
    semester: 5,
    instructions: 'Write SQL queries clearly. Pen drive usage is strictly prohibited.',
  },
  {
    subject: 'Web Technology',
    subjectCode: 'CS8591',
    examType: 'Quiz',
    date: dayOffset(-8),
    startTime: '11:00',
    endTime: '11:45',
    room: 'Block B - Room 110',
    department: 'CSE',
    year: 3,
    semester: 5,
    instructions: 'Multiple choice questions. No negative marking.',
  },
  {
    subject: 'Software Engineering',
    subjectCode: 'CS8501',
    examType: 'Internal Assessment',
    date: dayOffset(5),
    startTime: '10:00',
    endTime: '12:00',
    room: 'Block A - Room 204',
    department: 'CSE',
    year: 3,
    semester: 5,
    instructions:
      'Bring your college ID card. Mobile phones must be switched off and left outside the hall.',
  },
  {
    subject: 'Compiler Design',
    subjectCode: 'CS8651',
    examType: 'University Exam',
    date: dayOffset(9),
    startTime: '09:30',
    endTime: '12:30',
    room: 'Main Hall - Row 12',
    department: 'CSE',
    year: 3,
    semester: 5,
    instructions:
      'University examination. Report 30 minutes early. Only university supplied answer sheets are accepted.',
  },
  {
    subject: 'Artificial Intelligence',
    subjectCode: 'CS8691',
    examType: 'Internal Assessment',
    date: dayOffset(14),
    startTime: '10:00',
    endTime: '11:30',
    room: 'Block B - Room 112',
    department: 'CSE',
    year: 3,
    semester: 5,
    instructions: 'Bring a non-programmable calculator for numerical problems.',
  },
  {
    subject: 'Cloud Computing',
    subjectCode: 'CS8592',
    examType: 'Seminar Evaluation',
    date: dayOffset(21),
    startTime: '13:00',
    endTime: '14:30',
    room: 'Seminar Hall - Block C',
    department: 'CSE',
    year: 3,
    semester: 5,
    instructions: 'Present the seminar for 12 minutes followed by 3 minutes of questions.',
  },
];

/** Sample HTTP traffic so the monitor has data before the first interaction. */
const sampleLogs = [
  { method: 'POST', endpoint: '/api/auth/login', statusCode: 200, duration: 124, minutesAgo: 46 },
  { method: 'GET', endpoint: '/api/auth/me', statusCode: 200, duration: 61, minutesAgo: 46 },
  { method: 'GET', endpoint: '/api/exams', statusCode: 200, duration: 87, minutesAgo: 45 },
  { method: 'GET', endpoint: '/api/exams', statusCode: 200, duration: 74, minutesAgo: 42 },
  { method: 'POST', endpoint: '/api/students/information', statusCode: 201, duration: 143, minutesAgo: 40 },
  { method: 'GET', endpoint: '/api/students/profile', statusCode: 200, duration: 66, minutesAgo: 39 },
  { method: 'GET', endpoint: '/api/http-logs', statusCode: 200, duration: 98, minutesAgo: 35 },
  { method: 'GET', endpoint: '/api/http-logs/statistics', statusCode: 200, duration: 112, minutesAgo: 35 },
  { method: 'POST', endpoint: '/api/auth/login', statusCode: 401, duration: 92, minutesAgo: 30 },
  { method: 'GET', endpoint: '/api/invalid', statusCode: 404, duration: 7, minutesAgo: 26 },
  { method: 'GET', endpoint: '/api/exams', statusCode: 401, duration: 12, minutesAgo: 21 },
  { method: 'POST', endpoint: '/api/students/information', statusCode: 400, duration: 84, minutesAgo: 18 },
  { method: 'POST', endpoint: '/api/auth/login', statusCode: 429, duration: 3, minutesAgo: 12 },
  { method: 'GET', endpoint: '/api/demo/server-error', statusCode: 500, duration: 231, minutesAgo: 8 },
  { method: 'GET', endpoint: '/api/exams', statusCode: 200, duration: 79, minutesAgo: 4 },
  { method: 'GET', endpoint: '/api/health', statusCode: 200, duration: 5, minutesAgo: 1 },
];

const seed = async () => {
  console.log('Seeding database...');

  await connectDB();

  // All writes are retried so a single dropped Atlas socket does not abort the run.
  await withRetry(
    async () => {
      // Reset collections so the script is idempotent.
      await Promise.all([
        Student.deleteMany({}),
        Examination.deleteMany({}),
        HttpLog.deleteMany({}),
      ]);

      // Passwords are hashed with bcrypt - plain text never reaches MongoDB.
      const passwordHashes = await Promise.all(students.map((s) => bcrypt.hash(s.password, 12)));

      const studentDocs = await Student.insertMany(
        students.map((student, index) => ({
          name: student.name,
          registerNumber: student.registerNumber,
          email: student.email,
          passwordHash: passwordHashes[index],
          department: student.department,
          year: student.year,
          section: student.section,
          phone: student.phone,
          informationSubmitted: student.informationSubmitted,
          submittedAt: student.submittedAt,
        }))
      );

      await Examination.insertMany(examinations);

      const now = Date.now();
      await HttpLog.insertMany(
        sampleLogs.map((log, index) => ({
          method: log.method,
          endpoint: log.endpoint,
          statusCode: log.statusCode,
          duration: log.duration,
          timestamp: new Date(now - log.minutesAgo * 60 * 1000),
          studentId: studentDocs[0]._id,
          requestId: `seed${index}`,
          requestHeaders:
            log.method === 'POST'
              ? { 'content-type': 'application/json', authorization: 'Bearer ********' }
              : { accept: 'application/json', authorization: 'Bearer ********' },
          requestBody:
            log.endpoint === '/api/auth/login'
              ? { email: 'student@college.edu', password: '********' }
              : log.endpoint === '/api/students/information'
                ? { name: 'Arul Palanivel', registerNumber: '23CSE101', phone: '9876543210' }
                : null,
          responseHeaders: { 'content-type': 'application/json; charset=utf-8' },
          responseBody: {
            success: log.statusCode < 400,
            message:
              log.statusCode < 400
                ? 'Request completed successfully'
                : log.statusCode === 401
                  ? 'Invalid email or password'
                  : log.statusCode === 404
                    ? 'Route not found'
                    : 'Request could not be completed',
          },
        }))
      );

      return studentDocs;
    },
    { retries: 4, delayMs: 4000, label: 'seed writes' }
  );

  console.log('---------------------------------------------');
  console.log(`  Students inserted     : ${students.length}`);
  console.log(`  Examinations inserted : ${examinations.length}`);
  console.log(`  HTTP logs inserted    : ${sampleLogs.length}`);
  console.log('---------------------------------------------');
  console.log('Demo credentials:');
  console.log('  student@college.edu / password  (23CSE101)');
  console.log('  priya@college.edu   / password  (23CSE102)');
  console.log('  karthik@college.edu / password  (23ECE204)');
  console.log('---------------------------------------------');

  await disconnectDB();
  process.exit(0);
};

seed().catch(async (error) => {
  console.error(`Seeding failed: ${error.message}`);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
