const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function run() {
  try {
    const MONGODB_URI = requiredEnv('MONGODB_URI');
    const email = requiredEnv('SEED_ADMIN_EMAIL').toLowerCase().trim();
    const password = requiredEnv('SEED_ADMIN_PASSWORD');
    const firstName = (process.env.SEED_ADMIN_FIRST_NAME || 'System').trim();
    const lastName = (process.env.SEED_ADMIN_LAST_NAME || 'Admin').trim();
    const department = (process.env.SEED_ADMIN_DEPARTMENT || 'IT').trim();

    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

    const hashedPassword = await bcrypt.hash(password, 12);

    const existing = await User.findOne({ email });
    if (existing) {
      existing.firstName = firstName;
      existing.lastName = lastName;
      existing.department = department;
      existing.role = 'admin';
      existing.isActive = true;
      existing.password = hashedPassword; // rotate/update password to the env value
      await existing.save();
      console.log(`✅ Updated existing admin user: ${email}`);
    } else {
      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'admin',
        department,
        isActive: true,
      });
      await user.save();
      console.log(`✅ Created admin user: ${email}`);
    }

    console.log('🎉 Admin seeding complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Admin seeding failed:', err.message || err);
    process.exit(1);
  }
}

run();

