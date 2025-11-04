const mongoose = require('mongoose');

const profileDashboardSchema = new mongoose.Schema({
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    personalInfo: {
        fullName: String,
        email: String,
        phone: String,
        department: String,
        position: String,
        office: String
    },
    teachingLoad: {
        currentLoad: Number,
        maxLoad: Number,
        subjects: [String]
    },
    quickLinks: [{
        title: String,
        url: String,
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('ProfileDashboard', profileDashboardSchema);