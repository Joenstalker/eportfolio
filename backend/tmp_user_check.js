const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/faculty_portfolio', { useNewUrlParser: true, useUnifiedTopology: true });
    const email = 'faculty1@gmail.com';
    const user = await User.findOne({ email }).lean();
    if (!user) {
      console.log('User not found:', email);
      return;
    }
    console.log('user found:', {
      email: user.email,
      password: user.password,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('db error', err);
  } finally {
    await mongoose.disconnect();
  }
})();
