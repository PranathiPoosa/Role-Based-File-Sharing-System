const mongoose = require('mongoose');
const User = require('./models/User');

const uri = 'mongodb://localhost:27017/role_based_file_sharing';

async function seedUsers() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing users just in case
    await User.deleteMany({});

    const users = [
      {
        name: 'Admin User',
        email: 'admin@aeroshare.com',
        password: 'password123',
        role: 'admin',
      },
      {
        name: 'Manager User',
        email: 'manager@aeroshare.com',
        password: 'password123',
        role: 'manager',
      },
      {
        name: 'Regular User',
        email: 'user@aeroshare.com',
        password: 'password123',
        role: 'user',
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
    }
    console.log('Successfully seeded users');
  } catch (err) {
    console.error('Error seeding users:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedUsers();
