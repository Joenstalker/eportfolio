const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faculty_portfolio';

async function run() {
  try {
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    const usersToCreate = [
      {
        firstName: 'Test',
        lastName: 'Admin',
        email: 'admin@gmail.com',
        role: 'admin',
        department: 'IT',
        password: 'Admin@1234',
      },
      {
        firstName: 'Test',
        lastName: 'Faculty',
        email: 'faculty@gmail.com',
        role: 'faculty',
        department: 'Computer Science',
        password: 'Test@1234',
      },
    ];

    for (const u of usersToCreate) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`ℹ️ User with email ${u.email} already exists, skipping`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(u.password, 12);
      const user = new User({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email.toLowerCase(),
        password: hashedPassword,
        role: u.role,
        department: u.department,
      });

      await user.save();
      console.log(`✅ Created ${u.role} user: ${u.email} / ${u.password}`);
    }

    console.log('🎉 Demo users seeding complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating demo users:', err);
    process.exit(1);
  }
}

run();

