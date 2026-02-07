/**
 * Seed Script - Create Multiple Test Users
 * Run with: npx ts-node scripts/seed-multiple-users.ts
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

const testUsers = [
  {
    fullName: 'Med Mahdi Lakhzouri',
    email: 'medmahdilakhzouri07@gmail.com',
    password: 'password123',
    role: 'RESPONSABLE',
    isActive: true,
  },
  {
    fullName: 'Alice Project Manager',
    email: 'alice@example.com',
    password: 'password123',
    role: 'CHEF_DE_PROJET',
    isActive: true,
  },
  {
    fullName: 'Bob Consultant Active',
    email: 'bob@example.com',
    password: 'password123',
    role: 'CONSULTANT',
    isActive: true,
  },
  {
    fullName: 'Charlie Consultant',
    email: 'charlie@example.com',
    password: 'password123',
    role: 'CONSULTANT',
    isActive: true,
  },
  {
    fullName: 'Diana Inactive',
    email: 'diana@example.com',
    password: 'password123',
    role: 'CONSULTANT',
    isActive: false,
  },
  {
    fullName: 'Eve Manager',
    email: 'eve@example.com',
    password: 'password123',
    role: 'CHEF_DE_PROJET',
    isActive: true,
  },
  {
    fullName: 'Frank Consultant',
    email: 'frank@example.com',
    password: 'password123',
    role: 'CONSULTANT',
    isActive: true,
  },
  {
    fullName: 'Grace Admin',
    email: 'grace@example.com',
    password: 'password123',
    role: 'RESPONSABLE',
    isActive: true,
  },
];

async function seedUsers() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  const usersCollection = db.collection<UserDoc>('users');

  console.log(`\nSeeding ${testUsers.length} users...\n`);

  for (const user of testUsers) {
    const existingUser = await usersCollection.findOne({ 
      email: user.email.toLowerCase() 
    });

    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

    if (existingUser) {
      await usersCollection.updateOne(
        { email: user.email.toLowerCase() },
        {
          $set: {
            fullName: user.fullName,
            passwordHash,
            role: user.role,
            isActive: user.isActive,
            updatedAt: new Date(),
          },
        }
      );
      console.log(`✅ Updated: ${user.email} (${user.role})`);
    } else {
      await usersCollection.insertOne({
        fullName: user.fullName,
        email: user.email.toLowerCase(),
        passwordHash,
        role: user.role,
        isActive: user.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✨ Created: ${user.email} (${user.role})`);
    }
  }

  console.log('\n==============================');
  console.log('✅ Seeding completed!');
  console.log('==============================');
  console.log('\nTest Credentials (all users):');
  console.log('Password: password123');
  console.log('\nAdmin Users (RESPONSABLE):');
  testUsers
    .filter(u => u.role === 'RESPONSABLE')
    .forEach(u => console.log(`  - ${u.email}`));
  console.log('\nProject Managers (CHEF_DE_PROJET):');
  testUsers
    .filter(u => u.role === 'CHEF_DE_PROJET')
    .forEach(u => console.log(`  - ${u.email}`));
  console.log('\nConsultants (CONSULTANT):');
  testUsers
    .filter(u => u.role === 'CONSULTANT')
    .forEach(u => console.log(`  - ${u.email} ${!u.isActive ? '(inactive)' : ''}`));
  console.log('==============================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seedUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
