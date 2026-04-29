const mongoose = require('mongoose');

const fileUploadSchema = new mongoose.Schema({
    uploaded: {
        type: Boolean,
        default: false
    },
    fileName: {
        type: String,
        default: ''
    },
    fileUrl: {
        type: String,
        default: ''
    }
});

const classPortfolioItemSchema = new mongoose.Schema({
    uploaded: {
        type: Boolean,
        default: false
    },
    fileName: {
        type: String,
        default: ''
    },
    fileUrl: {
        type: String,
        default: ''
    }
});

const subFileUploadSchema = new mongoose.Schema({
    midtermFile: {
        type: fileUploadSchema,
        default: () => ({ uploaded: false, fileName: '', fileUrl: '' })
    },
    finaltermFile: {
        type: fileUploadSchema,
        default: () => ({ uploaded: false, fileName: '', fileUrl: '' })
    }
});

const l1Schema = new mongoose.Schema({
    instruction: {
        type: Map,
        of: {
            type: Map,
            of: fileUploadSchema
        },
        default: new Map()
    },
    sampleOutput: {
        type: Map,
        of: {
            type: Map,
            of: fileUploadSchema
        },
        default: new Map()
    },
    answerKey: {
        type: Map,
        of: {
            type: Map,
            of: fileUploadSchema
        },
        default: new Map()
    },
    returnOutputReceipt: {
        type: fileUploadSchema,
        default: () => ({ uploaded: false, fileName: '', fileUrl: '' })
    }
});

const m1Schema = new mongoose.Schema({
    rawScore: {
        type: Map,
        of: fileUploadSchema,
        default: new Map()
    },
    gradeSheetSigned: {
        type: Map,
        of: fileUploadSchema,
        default: new Map()
    },
    officialGradeSheet: {
        type: Map,
        of: fileUploadSchema,
        default: new Map()
    },
    googleClassroomScore: {
        type: Map,
        of: fileUploadSchema,
        default: new Map()
    }
});

const n1Schema = new mongoose.Schema({
    consultationForms: {
        type: Map,
        of: fileUploadSchema,
        default: new Map()
    },
    consultationScreenshots: {
        type: Map,
        of: fileUploadSchema,
        default: new Map()
    },
    evidenceAddressing: {
        type: Map,
        of: fileUploadSchema,
        default: new Map()
    },
    O1: {
        type: fileUploadSchema,
        default: () => ({ uploaded: false, fileName: '', fileUrl: '' })
    },
    P1: {
        type: fileUploadSchema,
        default: () => ({ uploaded: false, fileName: '', fileUrl: '' })
    },
    Q1: {
        type: fileUploadSchema,
        default: () => ({ uploaded: false, fileName: '', fileUrl: '' })
    },
    R1: {
        type: fileUploadSchema,
        default: () => ({ uploaded: false, fileName: '', fileUrl: '' })
    }
});

const classPortfolioDataSchema = new mongoose.Schema({
    subjectCode: {
        type: String,
        default: ''
    },
    sectionCode: {
        type: String,
        default: ''
    },
    A1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    B1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    C1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    D1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    E1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    F1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    G1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    H1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    I1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    J1: {
        type: Map,
        of: classPortfolioItemSchema,
        default: new Map()
    },
    K1: {
        type: Map,
        of: subFileUploadSchema,
        default: new Map()
    },
    L1_Q: {
        type: Map,
        of: subFileUploadSchema,
        default: new Map()
    }
});

const facultyPortfolioSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    facultyInfo: {
        facultyName: {
            type: String,
            default: ''
        },
        department: {
            type: String,
            default: ''
        },
        date: {
            type: String,
            default: ''
        }
    },
    submittedForReview: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: null
    },
    adminReviewStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not_submitted'],
        default: 'not_submitted'
    },
    adminReviewMessage: {
        type: String,
        default: ''
    },
    adminReviewDate: {
        type: Date,
        default: null
    },
    adminReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    missingDocuments: [{
        type: String
    }],
    subjects: {
        type: Map,
        of: {
            subjectCode: String,
            sectionCode: String,
            facultyPortfolio: {
                type: Map,
                of: fileUploadSchema,
                default: new Map()
            },
            classPortfolio: {
                type: Map,
                of: classPortfolioItemSchema,
                default: new Map()
            },
            L1: {
                type: l1Schema,
                default: () => ({})
            },
            M1: {
                type: m1Schema,
                default: () => ({})
            },
            N1: {
                type: n1Schema,
                default: () => ({})
            },
            ClassPortfolio: {
                type: classPortfolioDataSchema,
                default: () => ({})
            }
        },
        default: new Map()
    }
}, {
    timestamps: true
});

// Index for faster queries
facultyPortfolioSchema.index({ facultyId: 1 });

module.exports = mongoose.model('FacultyPortfolio', facultyPortfolioSchema);
