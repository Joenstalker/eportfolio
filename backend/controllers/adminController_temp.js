const bcrypt = require('bcryptjs');

const User = require('../models/User');
const InstructionalMaterial = require('../models/InstructionalMaterial');
const Syllabus = require('../models/Syllabus');
const SeminarCertificate = require('../models/SeminarCertificate');
const ClassPortfolio = require('../models/ClassPortfolio');
const Research = require('../models/Research');
const Course = require('../models/Course');
const CourseAssignment = require('../models/CourseAssignment');

const LockService = require('../services/lockService');
const path = require('path');
