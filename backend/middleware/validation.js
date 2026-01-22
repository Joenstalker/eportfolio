/**
 * Validation middleware for various input checks
 */

const { body, validationResult } = require('express-validator');

/**
 * Validation middleware that checks for required fields
 * @param {Array} requiredFields - Array of field names that are required
 */
const requireFields = (requiredFields) => {
    return [
        ...requiredFields.map(field => 
            body(field).notEmpty().withMessage(`${field} is required`)
        )
    ];
};

/**
 * Validation middleware for user creation
 */
const validateUserCreation = [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('department').notEmpty().withMessage('Department is required')
];

/**
 * Validation middleware for course creation
 */
const validateCourse = [
    body('courseCode').notEmpty().withMessage('Course code is required'),
    body('courseName').notEmpty().withMessage('Course name is required'),
    body('credits').isNumeric().withMessage('Credits must be a number'),
    body('department').notEmpty().withMessage('Department is required')
];

/**
 * Validation middleware for seminar creation
 */
const validateSeminar = [
    body('title').notEmpty().withMessage('Title is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('organizer').notEmpty().withMessage('Organizer is required')
];

/**
 * Validation middleware for research creation
 */
const validateResearch = [
    body('title').notEmpty().withMessage('Title is required'),
    body('abstract').notEmpty().withMessage('Abstract is required')
];

/**
 * Validation middleware for extension activities
 */
const validateExtension = [
    body('title').notEmpty().withMessage('Title is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('activityType').notEmpty().withMessage('Activity type is required')
];

/**
 * Generic validation result handler
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    requireFields,
    validateUserCreation,
    validateCourse,
    validateSeminar,
    validateResearch,
    validateExtension,
    handleValidationErrors
};