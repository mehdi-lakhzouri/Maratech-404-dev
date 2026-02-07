/**
 * Seed Script - Create Test User
 * Run with: npx ts-node scripts/seed-user.ts
 */

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tili';
const BCRYPT_ROUNDS = 12;

interface UserDoc {
  fullName: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

async function seedUser() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  const usersCollection = db.collection<UserDoc>('users');

  const testEmail = 'medmahdilakhzouri07@gmail.com';
  const testPassword = 'password123'; // At least 8 characters

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email: testEmail.toLowerCase() });
  
  if (existingUser) {
    console.log(`User ${testEmail} already exists.`);
    console.log('Updating password and role...');
    
    const passwordHash = await bcrypt.hash(testPassword, BCRYPT_ROUNDS);
    await usersCollection.updateOne(
      { email: testEmail.toLowerCase() },
      { 
        $set: { 
          passwordHash,
          role: 'RESPONSABLE',
          isActive: true,
          updatedAt: new Date() 
        } 
      }
    );
    console.log('Password and role updated successfully!');
  } else {
    console.log(`Creating user ${testEmail}...`);
    
    const passwordHash = await bcrypt.hash(testPassword, BCRYPT_ROUNDS);
    
    await usersCollection.insertOne({
      fullName: 'Med Mahdi Lakhzouri',
      email: testEmail.toLowerCase(),
      passwordHash,
      role: 'RESPONSABLE',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('User created successfully!');
  }

  console.log('\n==============================');
  console.log('Test Credentials:');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log('==============================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seedUser()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
