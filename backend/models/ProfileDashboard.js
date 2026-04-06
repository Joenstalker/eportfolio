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
        phone: {
            type: String,
            required: true,
            validate: {
                validator: function(v) {
                return /^[0-9]+$/.test(v);
                },
            message: props => `${props.value} is not a valid phone number! Numbers only.`
                }
            },
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