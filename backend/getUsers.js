const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/role_based_file_sharing';

async function getUsers() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log("Users in database:");
    users.forEach(user => {
      console.log(`- Email: ${user.email}, Role: ${user.role}, Name: ${user.name}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

getUsers();
