const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requiredEnvAny(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing required environment variable: ${names.join(' or ')}`);
}

async function run() {
  try {
    const MONGODB_URI = requiredEnv('MONGODB_URI');
    const adminPass = requiredEnvAny(['MIGRATE_ADMIN_PASSWORD', 'MIGRATE_ADMIN_PASS']); // set to admin@1234
    const facultyPass = requiredEnvAny(['MIGRATE_FACULTY_PASSWORD', 'MIGRATE_FACULTY_PASS']); // set to faculty@1234

    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

    const adminDupes = await User.find({ email: 'admin@gmail.com' }).sort({ createdAt: 1 });
    const facultyDupes = await User.find({ email: 'faculty@gmail.com' }).sort({ createdAt: 1 });

    if (adminDupes.length < 4) {
      throw new Error(`Expected at least 4 users with email admin@gmail.com, found ${adminDupes.length}`);
    }
    if (facultyDupes.length < 4) {
      throw new Error(`Expected at least 4 users with email faculty@gmail.com, found ${facultyDupes.length}`);
    }

    const adminHash = await bcrypt.hash(adminPass, 12);
    const facultyHash = await bcrypt.hash(facultyPass, 12);

    // Rename first 4 admin duplicates to admin1..4@gmail.com
    for (let i = 0; i < 4; i++) {
      const u = adminDupes[i];
      u.email = `admin${i + 1}@gmail.com`;
      u.role = 'admin';
      u.isActive = true;
      u.password = adminHash;
      await u.save();
    }

    // Rename first 4 faculty duplicates to faculty1..4@gmail.com
    for (let i = 0; i < 4; i++) {
      const u = facultyDupes[i];
      u.email = `faculty${i + 1}@gmail.com`;
      u.role = 'faculty';
      u.isActive = true;
      u.password = facultyHash;
      await u.save();
    }

    // Any remaining duplicates beyond 4 get archived and moved to a unique invalid email to avoid collisions.
    const remainders = [...adminDupes.slice(4), ...facultyDupes.slice(4)];
    for (const u of remainders) {
      const old = u.email;
      u.email = `archived+${old.replace('@', '_at_')}+${String(u._id)}@example.invalid`;
      u.isActive = false;
      await u.save();
    }

    console.log('✅ Migration complete.');
    console.log('Admins:', ['admin1@gmail.com','admin2@gmail.com','admin3@gmail.com','admin4@gmail.com'].join(', '));
    console.log('Faculty:', ['faculty1@gmail.com','faculty2@gmail.com','faculty3@gmail.com','faculty4@gmail.com'].join(', '));
    if (remainders.length) console.log(`Archived extra duplicates: ${remainders.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message || err);
    process.exit(1);
  }
}

run();

