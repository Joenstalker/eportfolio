const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Course = require('../models/Course');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function run() {
  try {
    const MONGODB_URI = requiredEnv('MONGODB_URI');
    
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

    const courses = [
      {
        courseCode: 'IAS',
        courseName: 'Information Assurance and Security',
        description: 'Study of security principles, policies, and practices for protecting information systems',
        credits: 3,
        department: 'Information Technology',
        semester: 'First Semester',
        maxStudents: 30,
        prerequisites: [],
        status: 'active'
      },
      {
        courseCode: 'CPR',
        courseName: 'Capstone Project and Research',
        description: 'Integration of knowledge and skills through a comprehensive research project',
        credits: 6,
        department: 'Information Technology',
        semester: 'Second Semester',
        maxStudents: 25,
        prerequisites: ['IAS', 'SIA', 'WST', 'ADET'],
        status: 'active'
      },
      {
        courseCode: 'SIA',
        courseName: 'Systems Integration and Architecture',
        description: 'Design and implementation of enterprise system architectures and integration patterns',
        credits: 3,
        department: 'Information Technology',
        semester: 'First Semester',
        maxStudents: 30,
        prerequisites: [],
        status: 'active'
      },
      {
        courseCode: 'WST',
        courseName: 'Web Systems and Technologies',
        description: 'Modern web development frameworks, responsive design, and full-stack application development',
        credits: 3,
        department: 'Information Technology',
        semester: 'First Semester',
        maxStudents: 35,
        prerequisites: [],
        status: 'active'
      },
      {
        courseCode: 'ADET',
        courseName: 'Application Development and Emerging Technologies',
        description: 'Advanced application development using cutting-edge technologies and frameworks',
        credits: 3,
        department: 'Information Technology',
        semester: 'Second Semester',
        maxStudents: 30,
        prerequisites: ['WST'],
        status: 'active'
      },
      {
        courseCode: 'MMS',
        courseName: 'Multimedia Systems',
        description: 'Design and development of interactive multimedia applications and systems',
        credits: 3,
        department: 'Information Technology',
        semester: 'Second Semester',
        maxStudents: 25,
        prerequisites: [],
        status: 'active'
      }
    ];

    console.log('📚 Seeding courses...');
    
    for (const courseData of courses) {
      const existing = await Course.findOne({ courseCode: courseData.courseCode });
      
      if (existing) {
        existing.courseName = courseData.courseName;
        existing.description = courseData.description;
        existing.credits = courseData.credits;
        existing.department = courseData.department;
        existing.semester = courseData.semester;
        existing.maxStudents = courseData.maxStudents;
        existing.prerequisites = courseData.prerequisites;
        existing.status = courseData.status;
        await existing.save();
        console.log(`✅ Updated existing course: ${courseData.courseCode} - ${courseData.courseName}`);
      } else {
        const course = new Course(courseData);
        await course.save();
        console.log(`✅ Created new course: ${courseData.courseCode} - ${courseData.courseName}`);
      }
    }

    console.log('🎉 Course seeding complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Course seeding failed:', err.message || err);
    process.exit(1);
  }
}

run();
