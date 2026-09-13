import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsa-battle';

async function seedSuperAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    email: String,
    password: { type: String, select: true },
    displayName: String,
    role: String,
    isBanned: Boolean
  }, { strict: false }));

  // Demote any other accounts that might have SUPER_ADMIN to ensure only ONE Super Admin exists
  await User.updateMany(
    { role: 'SUPER_ADMIN', username: { $ne: 'superadmin' } },
    { $set: { role: 'ADMIN' } }
  );

  const existing = await User.findOne({ username: 'superadmin' });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('SuperAdmin@2026', salt);

  if (existing) {
    existing.role = 'SUPER_ADMIN';
    existing.displayName = 'Super Admin';
    existing.email = 'superadmin@dsabattle.com';
    existing.password = hashedPassword;
    existing.isBanned = false;
    await existing.save();
    console.log('Updated existing superadmin account to SUPER_ADMIN with password SuperAdmin@2026');
  } else {
    await User.create({
      username: 'superadmin',
      displayName: 'Super Admin',
      email: 'superadmin@dsabattle.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isBanned: false
    });
    console.log('Created new superadmin account with role SUPER_ADMIN');
  }

  const check = await User.find({ role: 'SUPER_ADMIN' }).lean();
  console.log('Total SUPER_ADMIN accounts in database:', check.length);
  check.forEach(u => console.log(' ->', u.username, 'Role:', u.role, 'Email:', u.email));

  await mongoose.disconnect();
  console.log('Done!');
}

seedSuperAdmin().catch(console.error);
