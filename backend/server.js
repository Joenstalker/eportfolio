const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Request logging middleware (before routes)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    next();
});

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teaching', require('./routes/teaching'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/seminars', require('./routes/seminars'));
app.use('/api/research', require('./routes/research'));
app.use('/api/extension', require('./routes/extension')); // Add extension route
app.use('/api/syllabus', require('./routes/syllabus'));
app.use('/api/materials', require('./routes/instructionalMaterials'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/class-portfolio', require('./routes/classPortfolio'));
app.use('/api/courses', require('./routes/course'));
app.use('/api/venues', require('./routes/venues'));
// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faculty_portfolio', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.log('❌ MongoDB Error:', err);
        console.log('⚠️ Server continuing without MongoDB connection...');
    }
};

connectDB();

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Handle server errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

app.listen(PORT, '127.0.0.1', () => console.log(`🚀 Server running on port ${PORT}`));