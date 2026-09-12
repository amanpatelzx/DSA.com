import { connectDB } from '../apps/api/src/config/db.js';
import User from '../apps/api/src/models/User.js';
import jwt from 'jsonwebtoken';

async function testDraftEndpoints() {
  await connectDB();
  const user = await User.findOne({ username: 'aman patel' });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }

  const token = jwt.sign({ id: user._id }, 'super_secret_jwt_key_123');

  // 1. Post draft
  const postRes = await fetch('http://localhost:5000/api/problems/two-sum/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      language: 'cpp',
      code: '// Test auto-saved C++ solution\n#include <vector>\nclass Solution {};',
      problemTitle: 'Two Sum',
      problemDifficulty: 'Easy',
      tags: ['Array', 'Hash Table']
    })
  });
  const postData = await postRes.json();
  console.log('Post draft response:', postData);

  // 2. Get draft
  const getRes = await fetch('http://localhost:5000/api/problems/two-sum/draft?lang=cpp', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const getData = await getRes.json();
  console.log('Get draft response:', getData);

  // 3. Get last active practice
  const lastActiveRes = await fetch('http://localhost:5000/api/problems/practice/last-active', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const lastActiveData = await lastActiveRes.json();
  console.log('Last active response:', lastActiveData);

  process.exit(0);
}

testDraftEndpoints();
