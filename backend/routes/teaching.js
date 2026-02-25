const express = require('express');
const router = express.Router();
const TeachingPortfolio = require('../models/TeachingPortfolio');
const Course = require('../models/Course');
const CourseAssignment = require('../models/CourseAssignment');
const auth = require('../middleware/auth');

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