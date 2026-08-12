import mongoose from 'mongoose';
import http from 'http';
import app from '../app';
import { env } from '../config/env';

const runTests = async () => {
  console.log('🧪 Starting Auth Integration Tests...\n');

  const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/barbersaas_auth_test';
  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to MongoDB: ${mongoUri}`);

  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
    console.log('🧹 Cleaned test database');
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}/api/v1`;
  console.log(`🚀 Test server listening on ${baseUrl}\n`);

  let accessToken: string;
  let refreshToken: string;
  const ownerEmail = `testowner_${Date.now()}@barbhq.com`;

  try {
    // Test 1: Register Shop & Owner Account
    console.log('▶ Test 1: POST /auth/register (Owner Registration)');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Elite Cuts Shop',
        shopSlug: `elite-cuts-${Date.now()}`,
        ownerFirstName: 'Marcus',
        ownerLastName: 'Vance',
        ownerEmail,
        ownerPassword: 'Password123!',
      }),
    });

    const regData = (await regRes.json()) as any;
    console.log(`  Response Status: ${regRes.status}`);
    if (regRes.status !== 201 || !regData.success) {
      throw new Error(`Register failed: ${JSON.stringify(regData)}`);
    }

    console.log(`  Shop ID: ${regData.data.shop.id}`);
    console.log(`  Owner ID: ${regData.data.user.id}`);
    console.log(`  Owner Role: ${regData.data.user.role}`);
    if (regData.data.user.role !== 'OWNER') {
      throw new Error(`Expected OWNER role, got ${regData.data.user.role}`);
    }
    console.log('  ✅ Test 1 Passed: Shop & Owner registered successfully\n');

    // Test 2: Reject Duplicate Email Registration
    console.log('▶ Test 2: Reject Duplicate Email Registration');
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Another Shop',
        ownerFirstName: 'Clone',
        ownerLastName: 'User',
        ownerEmail,
        ownerPassword: 'Password123!',
      }),
    });

    const dupData = (await dupRes.json()) as any;
    console.log(`  Response Status: ${dupRes.status}`);
    if (dupRes.status !== 400 || dupData.success) {
      throw new Error(`Expected 400 for duplicate email, got ${dupRes.status}`);
    }
    console.log('  ✅ Test 2 Passed: Duplicate email rejected correctly\n');

    // Test 3: Login with Invalid Credentials
    console.log('▶ Test 3: POST /auth/login (Invalid Password)');
    const invalidLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: 'WrongPassword!',
      }),
    });

    const invalidLoginData = (await invalidLoginRes.json()) as any;
    console.log(`  Response Status: ${invalidLoginRes.status}`);
    if (invalidLoginRes.status !== 401 || invalidLoginData.success) {
      throw new Error(`Expected 401 for invalid password, got ${invalidLoginRes.status}`);
    }
    console.log('  ✅ Test 3 Passed: Invalid credentials rejected\n');

    // Test 4: Login with Valid Credentials
    console.log('▶ Test 4: POST /auth/login (Valid Credentials)');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: 'Password123!',
      }),
    });

    const loginData = (await loginRes.json()) as any;
    console.log(`  Response Status: ${loginRes.status}`);
    if (loginRes.status !== 200 || !loginData.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    accessToken = loginData.data.tokens.accessToken;
    refreshToken = loginData.data.tokens.refreshToken;
    if (!accessToken || !refreshToken) {
      throw new Error('Access or refresh token missing from login response');
    }
    console.log('  ✅ Test 4 Passed: Login successful with JWT tokens\n');

    // Test 5: GET /auth/me
    console.log('▶ Test 5: GET /auth/me (Authenticated Profile)');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const meData = (await meRes.json()) as any;
    console.log(`  Response Status: ${meRes.status}`);
    if (meRes.status !== 200 || !meData.success) {
      throw new Error(`GET /auth/me failed: ${JSON.stringify(meData)}`);
    }

    if (meData.data.user.email !== ownerEmail) {
      throw new Error(`Expected email ${ownerEmail}, got ${meData.data.user.email}`);
    }
    console.log(`  User Email: ${meData.data.user.email}`);
    console.log(`  Shop Name: ${meData.data.shop.name}`);
    console.log('  ✅ Test 5 Passed: Profile & shop context returned\n');

    // Test 6: POST /auth/refresh
    console.log('▶ Test 6: POST /auth/refresh');
    const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const refreshData = (await refreshRes.json()) as any;
    console.log(`  Response Status: ${refreshRes.status}`);
    if (refreshRes.status !== 200 || !refreshData.success) {
      throw new Error(`Refresh failed: ${JSON.stringify(refreshData)}`);
    }

    const newAccessToken = refreshData.data.accessToken;
    const newRefreshToken = refreshData.data.refreshToken;
    if (!newAccessToken || !newRefreshToken) {
      throw new Error('New access or refresh token missing');
    }

    accessToken = newAccessToken;
    refreshToken = newRefreshToken;
    console.log('  ✅ Test 6 Passed: Token rotation successful\n');

    // Test 7: PATCH /auth/change-password
    console.log('▶ Test 7: PATCH /auth/change-password');
    const changePassRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        currentPassword: 'Password123!',
        newPassword: 'NewSuperPassword456!',
      }),
    });

    const changePassData = (await changePassRes.json()) as any;
    console.log(`  Response Status: ${changePassRes.status}`);
    if (changePassRes.status !== 200 || !changePassData.success) {
      throw new Error(`Change password failed: ${JSON.stringify(changePassData)}`);
    }
    console.log('  ✅ Test 7 Passed: Password updated successfully\n');

    // Verify login with new password
    const newPassLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: 'NewSuperPassword456!',
      }),
    });
    if (newPassLoginRes.status !== 200) {
      throw new Error('Failed to login with newly updated password');
    }
    console.log('  ✅ Verified login with new password\n');

    // Test 8: POST /auth/logout
    console.log('▶ Test 8: POST /auth/logout');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const logoutData = (await logoutRes.json()) as any;
    console.log(`  Response Status: ${logoutRes.status}`);
    if (logoutRes.status !== 200 || !logoutData.success) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
    }
    console.log('  ✅ Test 8 Passed: Logged out successfully\n');

    const revokedRefreshRes = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (revokedRefreshRes.status !== 401) {
      throw new Error(`Expected 401 for revoked refresh token, got ${revokedRefreshRes.status}`);
    }
    console.log('  ✅ Verified revoked refresh token rejected (401)\n');

    // Test 9: Protected Route Token Rejection
    console.log('▶ Test 9: Protected Route Token Rejection');
    const noTokenRes = await fetch(`${baseUrl}/auth/me`, { method: 'GET' });
    if (noTokenRes.status !== 401) {
      throw new Error(`Expected 401 when Authorization header missing, got ${noTokenRes.status}`);
    }
    console.log('  ✅ Test 9 Passed: Protected routes reject requests without valid token\n');

    console.log('🎉 ALL AUTH INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('🔌 Server and DB connection closed.');
  }
};

runTests();
