const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());

// Mock data
let mockUsers = [
    {
        _id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        department: 'Computer Science',
        role: 'faculty',
        status: 'active'
    },
    {
        _id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        department: 'Mathematics',
        role: 'admin',
        status: 'active'
    }
];

// Mock auth middleware
const mockAuth = (req, res, next) => {
    req.user = { id: 'admin', role: 'admin' };
    next();
};

// Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Test server running',
        timestamp: new Date().toISOString()
    });
});

// Get users
app.get('/api/admin/users', mockAuth, (req, res) => {
    res.json(mockUsers);
});

// Create user
app.post('/api/admin/users', mockAuth, async (req, res) => {
    try {
        const { firstName, lastName, email, password, department, role } = req.body;
        
        // Validate required fields
        if (!firstName || !email || !password || !department) {
            return res.status(400).json({ 
                message: 'Missing required fields (firstName, email, password, department)' 
            });
        }

        // Check if email already exists
        const existingUser = mockUsers.find(u => u.email === email);
        if (existingUser) {
            return res.status(409).json({ 
                message: 'Email already exists',
                field: 'email',
                value: email
            });
        }

        // Create new user
        const newUser = {
            _id: Date.now().toString(),
            name: `${firstName} ${lastName}`.trim(),
            email,
            department,
            role: role || 'faculty',
            status: 'active'
        };

        mockUsers.push(newUser);

        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user
app.put('/api/admin/users/:id', mockAuth, (req, res) => {
    try {
        const { name, email, department, role, status } = req.body;
        const userId = req.params.id;
        
        const userIndex = mockUsers.findIndex(u => u._id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = {
            ...mockUsers[userIndex],
            ...(name && { name }),
            ...(email && { email }),
            ...(department && { department }),
            ...(role && { role }),
            ...(status !== undefined && { status })
        };

        mockUsers[userIndex] = updatedUser;

        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const PORT = 5001;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Test server running on port ${PORT}`);
    console.log(`📱 Frontend should connect to http://localhost:${PORT}`);
});
