const express = require('express');
const router = express.Router();
const TeachingPortfolio = require('../models/TeachingPortfolio');
const Course = require('../models/Course');
const CourseAssignment = require('../models/CourseAssignment');
const ClassPortfolio = require('../models/ClassPortfolio');
const UserActivity = require('../models/UserActivity');
const auth = require('../middleware/auth');

// Get faculty dashboard stats
router.get('/dashboard-stats', auth, async (req, res) => {
    try {
        const [portfolio, assignments, classPortfolios, activities] = await Promise.all([
            TeachingPortfolio.findOne({ facultyId: req.user.id }),
            CourseAssignment.find({ facultyId: req.user.id, status: 'active' }),
            ClassPortfolio.find({ facultyId: req.user.id }),
            UserActivity.find({ userId: req.user.id })
                .sort({ timestamp: -1 })
                .limit(8)
                .select('timestamp description')
        ]);

        const subjects = portfolio?.subjects || [];

        const uniqueStudents = new Set();
        subjects.forEach((subject) => {
            (subject.classLists || []).forEach((student) => {
                const key = student.email || student.studentId || student.studentName;
                if (key) {
                    uniqueStudents.add(String(key).toLowerCase());
                }
            });
        });

        const totalStudents = uniqueStudents.size;
        const activeCourses = assignments.length;
        const upcomingClasses = subjects.length;

        const totalMaterials = classPortfolios.reduce(
            (count, classPortfolio) => count + (classPortfolio.materials?.length || 0),
            0
        );

        // In the current data model we do not store grade queues or attendance logs,
        // so these are computed from available portfolio data and default safely.
        const pendingGrades = Math.max(0, totalStudents - totalMaterials);
        const averageAttendance = 0;

        const recentActivity = activities.map((activity) => ({
            timestamp: activity.timestamp,
            description: activity.description
        }));

        res.json({
            totalStudents,
            activeCourses,
            pendingGrades,
            upcomingClasses,
            averageAttendance,
            recentActivity
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get teaching portfolio
router.get('/', auth, async (req, res) => {
    try {
        let portfolio = await TeachingPortfolio.findOne({ facultyId: req.user.id });
        
        if (!portfolio) {
            portfolio = new TeachingPortfolio({
                facultyId: req.user.id,
                subjects: []
            });
            await portfolio.save();
        }

        res.json({ subjects: portfolio.subjects });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get assigned courses for faculty
router.get('/courses', auth, async (req, res) => {
    try {
        const assignments = await CourseAssignment.find({ facultyId: req.user.id })
            .populate('courseId')
            .populate('facultyId');
        
        const courses = assignments.map(assignment => ({
            _id: assignment.courseId._id,
            courseCode: assignment.courseId.courseCode,
            courseName: assignment.courseId.courseName,
            description: assignment.courseId.description,
            credits: assignment.courseId.credits,
            department: assignment.courseId.department,
            semester: assignment.semester,
            section: assignment.section,
            maxStudents: assignment.courseId.maxStudents,
            isActive: assignment.courseId.isActive
        }));

        res.json({ courses });
    } catch (error) {
        console.error('Error fetching assigned courses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get class lists summary for a faculty member
router.get('/class-lists', auth, async (req, res) => {
    try {
        const facultyId = req.query.facultyId || req.user.id;
        if (!facultyId) {
            return res.status(400).json({ message: 'facultyId is required' });
        }

        if (String(req.user.id) !== String(facultyId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: cannot access other faculty data' });
        }

        const portfolio = await TeachingPortfolio.findOne({ facultyId });
        const assignments = await CourseAssignment.find({ facultyId }).populate('courseId');

        const classLists = assignments.map((assignment) => {
            const subject = portfolio?.subjects?.find((subject) => 
                subject.subjectCode === assignment.courseId.courseCode &&
                subject.section === assignment.section &&
                subject.semester === assignment.semester
            );

            return {
                assignmentId: assignment._id,
                courseCode: assignment.courseId.courseCode,
                courseName: assignment.courseId.courseName,
                section: assignment.section,
                semester: assignment.semester,
                studentCount: subject?.classLists?.length || 0,
                schedule: 'TBA'
            };
        });

        res.json({ classLists });
    } catch (error) {
        console.error('Error fetching class lists:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add subject
router.post('/subjects', auth, async (req, res) => {
    try {
        const { subjectCode, subjectName, section, semester } = req.body;

        let portfolio = await TeachingPortfolio.findOne({ facultyId: req.user.id });
        if (!portfolio) {
            portfolio = new TeachingPortfolio({ facultyId: req.user.id, subjects: [] });
        }

        portfolio.subjects.push({ subjectCode, subjectName, section, semester });
        await portfolio.save();

        res.json({ 
            message: 'Subject added successfully',
            portfolio: { subjects: portfolio.subjects }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add course outcome
router.post('/subjects/:subjectId/outcomes', auth, async (req, res) => {
    try {
        const { outcomeCode, description } = req.body;
        const portfolio = await TeachingPortfolio.findOne({ facultyId: req.user.id });
        const subject = portfolio.subjects.id(req.params.subjectId);
        
        subject.courseOutcomes.push({ outcomeCode, description });
        await portfolio.save();

        res.json({ message: 'Course outcome added successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add class list
router.post('/subjects/:subjectId/classlist', auth, async (req, res) => {
    try {
        const { studentId, studentName, email } = req.body;
        const portfolio = await TeachingPortfolio.findOne({ facultyId: req.user.id });
        const subject = portfolio.subjects.id(req.params.subjectId);
        
        subject.classLists.push({ studentId, studentName, email });
        await portfolio.save();

        res.json({ message: 'Student added to class list' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete subject
router.delete('/subjects/:subjectId', auth, async (req, res) => {
    try {
        const portfolio = await TeachingPortfolio.findOne({ facultyId: req.user.id });
        if (!portfolio) {
            return res.status(404).json({ message: 'Portfolio not found' });
        }
        
        portfolio.subjects.pull(req.params.subjectId);
        await portfolio.save();

        res.json({ 
            message: 'Subject deleted successfully',
            subjects: portfolio.subjects 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;