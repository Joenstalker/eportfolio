/**
 * Validation utility for form completion checking
 * Prevents navigation when required fields are incomplete
 */

export const validateProfileCompletion = (user) => {
    const requiredFields = [
        { field: 'firstName', label: 'First Name' },
        { field: 'lastName', label: 'Last Name' },
        { field: 'email', label: 'Email' },
        { field: 'department', label: 'Department' },
        { field: 'position', label: 'Position' }
    ];

    const missingFields = requiredFields.filter(({ field }) => 
        !user[field] || user[field].trim() === ''
    );

    return {
        isValid: missingFields.length === 0,
        missingFields,
        message: missingFields.length > 0 
            ? `Please complete the following required fields before navigating: ${missingFields.map(f => f.label).join(', ')}`
            : 'Profile is complete'
    };
};

export const validateTeachingPortfolio = (subjects) => {
    if (!subjects || subjects.length === 0) {
        return {
            isValid: false,
            missingFields: ['subjects'],
            message: 'Please add at least one subject to your Teaching Portfolio'
        };
    }

    const invalidSubjects = subjects.filter(subject => 
        !subject.subjectCode || !subject.subjectName || !subject.semester
    );

    return {
        isValid: invalidSubjects.length === 0,
        missingFields: invalidSubjects.length > 0 ? ['subject details'] : [],
        message: invalidSubjects.length > 0 
            ? 'Please complete all subject details (code, name, semester)'
            : 'Teaching Portfolio is complete'
    };
};

export const validateResearchPortfolio = (research) => {
    if (!research || research.length === 0) {
        return {
            isValid: false,
            missingFields: ['research'],
            message: 'Please add at least one research entry to your Research Portfolio'
        };
    }

    const invalidResearch = research.filter(item => 
        !item.title || !item.description
    );

    return {
        isValid: invalidResearch.length === 0,
        missingFields: invalidResearch.length > 0 ? ['research details'] : [],
        message: invalidResearch.length > 0 
            ? 'Please complete all research details (title, description)'
            : 'Research Portfolio is complete'
    };
};

export const validateSeminars = (seminars) => {
    if (!seminars || seminars.length === 0) {
        return {
            isValid: false,
            missingFields: ['seminars'],
            message: 'Please add at least one seminar to your Seminars & Certificates'
        };
    }

    const invalidSeminars = seminars.filter(seminar => 
        !seminar.title || !seminar.date || !seminar.venue || !seminar.organizer
    );

    return {
        isValid: invalidSeminars.length === 0,
        missingFields: invalidSeminars.length > 0 ? ['seminar details'] : [],
        message: invalidSeminars.length > 0 
            ? 'Please complete all seminar details (title, date, venue, organizer)'
            : 'Seminars & Certificates is complete'
    };
};

export const validateExtension = (extension) => {
    if (!extension || extension.length === 0) {
        return {
            isValid: false,
            missingFields: ['extension'],
            message: 'Please add at least one extension activity to your Extension Portfolio'
        };
    }

    const invalidExtension = extension.filter(item => 
        !item.title || !item.description || !item.duration
    );

    return {
        isValid: invalidExtension.length === 0,
        missingFields: invalidExtension.length > 0 ? ['extension details'] : [],
        message: invalidExtension.length > 0 
            ? 'Please complete all extension details (title, description, duration)'
            : 'Extension Portfolio is complete'
    };
};

export const validateInstructionalMaterials = (materials) => {
    if (!materials || materials.length === 0) {
        return {
            isValid: false,
            missingFields: ['materials'],
            message: 'Please add at least one instructional material'
        };
    }

    const invalidMaterials = materials.filter(material => 
        !material.title || !material.description
    );

    return {
        isValid: invalidMaterials.length === 0,
        missingFields: invalidMaterials.length > 0 ? ['material details'] : [],
        message: invalidMaterials.length > 0 
            ? 'Please complete all material details (title, description)'
            : 'Instructional Materials is complete'
    };
};

export const validateClassPortfolio = (classes) => {
    if (!classes || classes.length === 0) {
        return {
            isValid: false,
            missingFields: ['classes'],
            message: 'Please add at least one class to your Class Portfolio'
        };
    }

    const invalidClasses = classes.filter(cls => 
        !cls.className || !cls.schedule || !cls.students
    );

    return {
        isValid: invalidClasses.length === 0,
        missingFields: invalidClasses.length > 0 ? ['class details'] : [],
        message: invalidClasses.length > 0 
            ? 'Please complete all class details (name, schedule, students)'
            : 'Class Portfolio is complete'
    };
};

/**
 * Comprehensive validation for all portfolio sections
 */
export const validateAllPortfolios = (portfolioData) => {
    const validations = [
        validateProfileCompletion(portfolioData.user),
        validateTeachingPortfolio(portfolioData.teaching),
        validateResearchPortfolio(portfolioData.research),
        validateSeminars(portfolioData.seminars),
        validateExtension(portfolioData.extension),
        validateInstructionalMaterials(portfolioData.materials),
        validateClassPortfolio(portfolioData.classes)
    ];

    const overallValid = validations.every(v => v.isValid);
    const allMissingFields = validations.flatMap(v => v.missingFields);
    const invalidSections = validations.filter(v => !v.isValid).map(v => v.message);

    return {
        isValid: overallValid,
        missingFields: [...new Set(allMissingFields)],
        invalidSections,
        message: overallValid 
            ? 'All portfolio sections are complete' 
            : `Incomplete sections: ${invalidSections.join('; ')}`
    };
};

/**
 * Navigation guard function
 */
export const checkNavigationPermission = (validation, targetPath) => {
    if (!validation.isValid) {
        return {
            canNavigate: false,
            warningMessage: validation.message,
            suggestion: 'Please complete required fields before navigating to other pages.'
        };
    }

    return {
        canNavigate: true,
        warningMessage: null,
        suggestion: null
    };
};
