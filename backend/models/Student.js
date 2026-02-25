const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    required: true,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  grades: [{
    assessmentType: {
      type: String,
      enum: ['Quiz', 'Exam', 'Assignment', 'Project', 'Participation', 'Final']
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    maxScore: {
      type: Number,
      min: 0,
      default: 100
    },
    date: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  attendance: [{
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  outcomes: [{
    outcomeType: {
      type: String,
      enum: ['Knowledge', 'Skills', 'Attitude', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking']
    },
    achieved: {
      type: Number,
      min: 0,
      max: 5,
      required: true
    },
    target: {
      type: Number,
      min: 0,
      max: 5,
      default: 3
    },
    semester: {
      type: String,
      enum: ['Fall 2024', 'Spring 2025', 'Summer 2025', 'Fall 2025'],
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
studentSchema.index({ courseId: 1, studentId: 1 });
studentSchema.index({ facultyId: 1, year: 1 });
studentSchema.index({ 'attendance.date': -1 });
studentSchema.index({ 'grades.date': -1 });

// Virtual for full name
studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for average grade
studentSchema.virtual('averageGrade').get(function() {
  if (this.grades.length === 0) return 0;
  const total = this.grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0);
  return Math.round(total / this.grades.length);
});

// Virtual for attendance rate
studentSchema.virtual('attendanceRate').get(function() {
  if (this.attendance.length === 0) return 0;
  const presentCount = this.attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  return Math.round((presentCount / this.attendance.length) * 100);
});

// Virtual for overall outcome achievement
studentSchema.virtual('overallOutcome').get(function() {
  if (this.outcomes.length === 0) return 0;
  const total = this.outcomes.reduce((sum, outcome) => sum + outcome.achieved, 0);
  const targetTotal = this.outcomes.reduce((sum, outcome) => sum + outcome.target, 0);
  return Math.round((total / targetTotal) * 100);
});

// Ensure virtuals are included in JSON
studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
