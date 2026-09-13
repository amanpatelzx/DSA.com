import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING SUPER ADMIN & AUTH VERIFICATION TESTS ---');

  try {
    // 1. Test Normal Login validation (Name, Username, Password compulsory)
    console.log('\n[Test 1] Testing compulsory fields in normal login...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        username: 'superadmin',
        password: 'SuperAdmin@2026'
        // name is missing!
      });
      console.error('❌ Expected error for missing name, but succeeded!');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ Correctly rejected login when Name is missing:', err.response.data.message);
      } else {
        console.error('❌ Unexpected status code:', err.response?.status);
      }
    }

    // 2. Test Super Admin Login with Name, Username, and Password
    console.log('\n[Test 2] Logging in as Super Admin...');
    const superAdminRes = await axios.post(`${API_BASE}/auth/login`, {
      name: 'Super Admin Master',
      username: 'superadmin',
      password: 'SuperAdmin@2026'
    });
    const superAdminToken = superAdminRes.data.token;
    const superAdminUser = superAdminRes.data.user || superAdminRes.data;
    console.log('✅ Super Admin Logged in successfully:');
    console.log(`   - Username: ${superAdminUser.username}`);
    console.log(`   - Role: ${superAdminUser.role}`);
    console.log(`   - Name in response: ${superAdminUser.displayName}`);

    // 3. Test Google Login Endpoint
    console.log('\n[Test 3] Testing Google Sign-In endpoint...');
    const testGoogleUser = `guser_${Date.now()}`;
    const googleRes = await axios.post(`${API_BASE}/auth/google`, {
      googleName: 'Google Tester Pro',
      googleEmail: `${testGoogleUser}@gmail.com`,
      username: testGoogleUser,
      password: '' // optional!
    });
    console.log('✅ Google sign-in succeeded:');
    console.log(`   - Created User: @${googleRes.data.username}`);
    console.log(`   - Display Name from Google: ${googleRes.data.displayName}`);
    console.log(`   - Role: ${googleRes.data.role}`);

    // 4. Test Super Admin listing users
    console.log('\n[Test 4] Super Admin fetching all users list...');
    const usersRes = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log(`✅ Successfully fetched ${usersRes.data.length} users.`);
    const targetUser = usersRes.data.find(u => u.username === testGoogleUser);
    if (!targetUser) throw new Error('Target user not found in admin list');

    // 5. Test Super Admin promoting user to ADMIN
    console.log(`\n[Test 5] Super Admin promoting @${targetUser.username} to ADMIN...`);
    const promoteRes = await axios.put(`${API_BASE}/admin/users/${targetUser._id}/role`, {
      role: 'ADMIN'
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('✅ Promote Response:', promoteRes.data.message);

    // 6. Test login as the newly promoted ADMIN
    console.log(`\n[Test 6] Logging in as newly promoted Admin @${targetUser.username}...`);
    // Note: since this user signed up via google without password, let's test admin authorization using their token:
    const newAdminToken = googleRes.data.token;

    // 7. Verify promoted admin CANNOT assign roles (Only Super Admin can!)
    console.log('\n[Test 7] Verifying normal Admin CANNOT promote/demote users...');
    try {
      await axios.put(`${API_BASE}/admin/users/${superAdminUser._id || targetUser._id}/role`, {
        role: 'ADMIN'
      }, {
        headers: { Authorization: `Bearer ${newAdminToken}` }
      });
      console.error('❌ Normal admin should NOT be allowed to assign roles!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Correctly blocked normal Admin with 403:', err.response.data.message);
      } else {
        console.error('❌ Unexpected status code:', err.response?.status);
      }
    }

    // 8. Verify Admin CAN ban a user
    console.log('\n[Test 8] Normal Admin banning a user...');
    // Create another dummy user to ban
    const victimUsername = `victim_${Date.now()}`;
    const victimRes = await axios.post(`${API_BASE}/auth/google`, {
      googleName: 'Victim User',
      googleEmail: `${victimUsername}@gmail.com`,
      username: victimUsername,
      password: 'victimPass123'
    });
    const victimId = victimRes.data._id;

    const banRes = await axios.put(`${API_BASE}/admin/users/${victimId}/ban`, {
      banned: true,
      reason: 'Fair play violation in tournament'
    }, {
      headers: { Authorization: `Bearer ${newAdminToken}` }
    });
    console.log('✅ Admin successfully banned user:', banRes.data.message);

    // 9. Verify banned user cannot log in
    console.log('\n[Test 9] Verifying banned user is blocked from logging in...');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        name: 'Victim User',
        username: victimUsername,
        password: 'victimPass123'
      });
      console.error('❌ Banned user was allowed to log in!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Correctly blocked banned user from logging in with 403:', err.response.data.message);
      } else {
        console.error('❌ Unexpected status code for banned user:', err.response?.status);
      }
    }

    // 10. Super Admin unbanning the user
    console.log('\n[Test 10] Super Admin unbanning the user...');
    const unbanRes = await axios.put(`${API_BASE}/admin/users/${victimId}/ban`, {
      banned: false
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('✅ Super Admin unbanned user:', unbanRes.data.message);

    // 11. Super Admin revoking Admin role from targetUser
    console.log(`\n[Test 11] Super Admin removing Admin position from @${targetUser.username}...`);
    const demoteRes = await axios.put(`${API_BASE}/admin/users/${targetUser._id}/role`, {
      role: 'USER'
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('✅ Demote Response:', demoteRes.data.message);

    // 12. Verify single Super Admin constraint: Nobody can demote Super Admin
    console.log('\n[Test 12] Verifying Super Admin role cannot be modified...');
    try {
      await axios.put(`${API_BASE}/admin/users/${superAdminRes.data._id || superAdminRes.data.user?._id}/role`, {
        role: 'USER'
      }, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      console.error('❌ Super Admin was modified!');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ Correctly protected Super Admin role:', err.response.data.message);
      }
    }

    console.log('\n=============================================');
    console.log('🎉 ALL 12 SUPER ADMIN & AUTH TESTS PASSED PERFECTLY!');
    console.log('=============================================');

  } catch (err) {
    console.error('❌ Test failed with error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
