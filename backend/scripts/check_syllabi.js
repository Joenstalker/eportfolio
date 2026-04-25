const mongoose = require('mongoose');
require('dotenv').config();

const Syllabus = require('../models/Syllabus');
const Course = require('../models/Course');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faculty_portfolio';

const run = async () => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');

    const syllabi = await Syllabus.find().limit(100).lean();
    console.log(`Found ${syllabi.length} syllabus records`);
    syllabi.forEach((s) => {
      console.log('Syllabus:', s._id.toString(), '-', s.subjectCode, '-', s.subjectName, '-', s.semester, '-', s.facultyId?.toString());
    });

    const courses = await Course.find().limit(200).lean();
    console.log(`Found ${courses.length} course records`);
    courses.forEach((c) => {
      console.log('Course:', c._id.toString(), '-', c.courseCode, '-', c.courseName);
    });

    // Try to find matches of syllabus subjectCode to course.courseCode
    for (const s of syllabi) {
      const code = String(s.subjectCode || '').trim();
      if (!code) continue;
      const matched = courses.filter((c) => String(c.courseCode || '').trim().toLowerCase() === code.toLowerCase());
      if (matched.length === 0) {
        console.log(`No exact course match for syllabus code '${code}' (syllabus id ${s._id})`);
      } else {
        console.log(`Syllabus code '${code}' matches course id(s): ${matched.map(m => m._id).join(', ')}`);
      }
    }

    await mongoose.disconnect();
    console.log('Done');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
