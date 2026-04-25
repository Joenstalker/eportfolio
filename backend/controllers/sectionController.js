const Section = require('../models/Section');
const Course = require('../models/Course');
const CourseAssignment = require('../models/CourseAssignment');
const ClassPortfolio = require('../models/ClassPortfolio');
const Syllabus = require('../models/Syllabus');
const SectionPortfolio = require('../models/SectionPortfolio');
const mongoose = require('mongoose');

const VALID_SEMESTERS = ['First Semester', 'Second Semester'];

exports.createSection = async (req, res) => {
  try {
    const { courseId, name, semester } = req.body;
    const facultyId = req.user?.id;

    if (!courseId || !name || !semester) {
      return res.status(400).json({ message: 'courseId, name, and semester are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid courseId' });
    }

    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(401).json({ message: 'Invalid faculty token context' });
    }

    const normalizedName = String(name).trim();
    if (!normalizedName) {
      return res.status(400).json({ message: 'Section name is required' });
    }

    if (!VALID_SEMESTERS.includes(semester)) {
      return res.status(400).json({ message: 'Semester must be First Semester or Second Semester' });
    }

    const course = await Course.findById(courseId).select('_id');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user?.role !== 'admin') {
      // Development override: allow faculty to create sections without assignment
      // when the env var ALLOW_FACULTY_CREATE_SECTION_WITHOUT_ASSIGNMENT is set to 'true'.
      const allowUnassigned = String(process.env.ALLOW_FACULTY_CREATE_SECTION_WITHOUT_ASSIGNMENT || '').toLowerCase() === 'true';
      if (!allowUnassigned) {
        const assignment = await CourseAssignment.findOne({
          facultyId,
          courseId,
          semester,
          status: 'active'
        }).select('_id');

        let hasClassPortfolioForCourse = false;
        if (!assignment) {
          const courseRef = await Course.findById(courseId).select('courseCode courseName');
          if (courseRef) {
            const normalizedCode = String(courseRef.courseCode || '').trim();
            const normalizedName = String(courseRef.courseName || '').trim();

            const classPortfolio = await ClassPortfolio.findOne({
              facultyId,
              $or: [
                { subjectCode: { $regex: new RegExp(`^${normalizedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                { subjectName: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
              ]
            }).select('_id');

            hasClassPortfolioForCourse = Boolean(classPortfolio);

            // Fallback: if no ClassPortfolio exists, allow creating sections when
            // the faculty has previously uploaded a matching syllabus. This helps
            // workflows where a syllabus was uploaded (which may have created a
            // Course record) but no class portfolio was created yet.
            if (!hasClassPortfolioForCourse) {
              try {
                const syllabusMatch = await Syllabus.findOne({
                  facultyId,
                  $or: [
                    { subjectCode: { $regex: new RegExp(`^${normalizedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                    { subjectName: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
                  ]
                }).select('_id');

                if (syllabusMatch) {
                  hasClassPortfolioForCourse = true;
                }
              } catch (e) {
                // Non-fatal: log and continue (fallback only helps permissiveness)
                console.error('Error checking syllabus fallback for section creation:', e?.message || e);
              }
            }
          }
        }

        if (!assignment && !hasClassPortfolioForCourse) {
          return res.status(403).json({ message: 'Not assigned to this course/semester and no matching class portfolio subject found' });
        }
      }
    }

    const section = new Section({
      courseId,
      name: normalizedName,
      facultyId,
      semester
    });

    await section.save();
    // Ensure a SectionPortfolio with 4 standard slots exists for this section
    try {
      const defaultSlots = [1, 2, 3, 4].map((n) => ({
        slotNumber: n,
        courseOutcomeNumber: n,
        activityNumber: n,
        title: `Course Outcome ${n} / Activity ${n}`,
        notes: '',
        instructions: null,
        studentOutputs: [],
        ratedRubrics: [],
        status: 'not_started',
        updatedAt: new Date()
      }));

      const existingPortfolio = await SectionPortfolio.findOne({ sectionId: section._id });
      if (!existingPortfolio) {
        const portfolio = new SectionPortfolio({
          facultyId,
          courseId,
          sectionId: section._id,
          semester,
          slots: defaultSlots
        });
        await portfolio.save();
      }
    } catch (e) {
      // Non-fatal: portfolio creation failure should not block section creation
      console.error('Error ensuring SectionPortfolio for new section:', e?.message || e);
    }
    res.status(201).json(section);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Section already exists for this course and semester' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.getSectionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid courseId' });
    }

    const query = { courseId };
    if (req.user?.role !== 'admin') {
      query.facultyId = req.user.id;
    }

    const sections = await Section.find(query).sort({ name: 1, createdAt: -1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
