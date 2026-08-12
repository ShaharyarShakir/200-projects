import mongoose from 'mongoose';
import http from 'http';
import app from '../app';
import { env } from '../config/env';
import { UserRole } from '../models/user.model';
import { User } from '../models/user.model';

const runTests = async () => {
  console.log('🧪 Starting Shop & Branch Integration Tests...\n');

  const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/barbersaas_shop_branch_test';
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB: ${mongoUri}`);

  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
    console.log('🧹 Cleaned test database');
  }

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}/api/v1`;
  console.log(` Test server listening on ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------
    // Setup: Register Shop 1 (Owner) and Shop 2 (Owner)
    // Create Manager and Barber users for Shop 1
    // -------------------------------------------------------------
    console.log('▶ Setup: Registering Shops and Users...');
    
    // Shop 1 Owner Registration
    const shop1Email = `owner1_${Date.now()}@barbhq.com`;
    const reg1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Kingsmen Barber HQ',
        shopSlug: `kingsmen-${Date.now()}`,
        ownerFirstName: 'Arthur',
        ownerLastName: 'Pendelton',
        ownerEmail: shop1Email,
        ownerPassword: 'Password123!',
      }),
    });
    const reg1Data = (await reg1Res.json()) as any;
    const owner1Token = reg1Data.data.tokens.accessToken;
    const shop1Id = reg1Data.data.shop.id;

    // Create Manager user in Shop 1 directly in DB for testing RBAC
    const managerUser = new User({
      shopId: shop1Id,
      firstName: 'Michael',
      lastName: 'Manager',
      email: `manager1_${Date.now()}@barbhq.com`,
      password: 'Password123!',
      role: UserRole.MANAGER,
    });
    await managerUser.save();
    
    // Create Barber user in Shop 1
    const barberUser = new User({
      shopId: shop1Id,
      firstName: 'Bobby',
      lastName: 'Barber',
      email: `barber1_${Date.now()}@barbhq.com`,
      password: 'Password123!',
      role: UserRole.BARBER,
    });
    await barberUser.save();

    // Login Manager and Barber to get access tokens
    const mgrLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: managerUser.email, password: 'Password123!' }),
    });
    const mgrToken = ((await mgrLogin.json()) as any).data.tokens.accessToken;

    const barberLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: barberUser.email, password: 'Password123!' }),
    });
    const barberToken = ((await barberLogin.json()) as any).data.tokens.accessToken;

    // Shop 2 Owner Registration (Tenant 2)
    const shop2Email = `owner2_${Date.now()}@barbhq.com`;
    const reg2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Rival Cuts Shop',
        shopSlug: `rival-${Date.now()}`,
        ownerFirstName: 'Victor',
        ownerLastName: 'Vance',
        ownerEmail: shop2Email,
        ownerPassword: 'Password123!',
      }),
    });
    const reg2Data = (await reg2Res.json()) as any;
    const owner2Token = reg2Data.data.tokens.accessToken;

    console.log('  ✅ Setup complete\n');

    // -------------------------------------------------------------
    // Test 1: Shop Profile Management & Authorization
    // -------------------------------------------------------------
    console.log('▶ Test 1: GET & PATCH /shop (Shop Profile)');

    // All roles can view shop
    const getShopRes = await fetch(`${baseUrl}/shop`, {
      headers: { Authorization: `Bearer ${barberToken}` },
    });
    const getShopData = (await getShopRes.json()) as any;
    if (getShopRes.status !== 200 || getShopData.data.name !== 'Kingsmen Barber HQ') {
      throw new Error(`GET /shop failed: ${JSON.stringify(getShopData)}`);
    }
    console.log('  ✅ Barber can view shop profile');

    // Barber attempt to update shop should be forbidden (403)
    const barberUpdateRes = await fetch(`${baseUrl}/shop`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${barberToken}` },
      body: JSON.stringify({ name: 'Hacked Shop Name' }),
    });
    if (barberUpdateRes.status !== 403) {
      throw new Error(`Expected 403 for Barber shop update, got ${barberUpdateRes.status}`);
    }
    console.log('  ✅ Barber forbidden from updating shop (403)');

    // Manager update shop profile
    const mgrUpdateRes = await fetch(`${baseUrl}/shop`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({ description: 'Premium Barber Experience', phone: '+15550199' }),
    });
    const mgrUpdateData = (await mgrUpdateRes.json()) as any;
    if (mgrUpdateRes.status !== 200 || mgrUpdateData.data.description !== 'Premium Barber Experience') {
      throw new Error(`Manager PATCH /shop failed: ${JSON.stringify(mgrUpdateData)}`);
    }
    console.log('  ✅ Manager successfully updated shop profile');

    // Owner update shop profile
    const ownerUpdateRes = await fetch(`${baseUrl}/shop`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ name: 'Kingsmen Luxury Barber HQ' }),
    });
    const ownerUpdateData = (await ownerUpdateRes.json()) as any;
    if (ownerUpdateRes.status !== 200 || ownerUpdateData.data.name !== 'Kingsmen Luxury Barber HQ') {
      throw new Error(`Owner PATCH /shop failed: ${JSON.stringify(ownerUpdateData)}`);
    }
    console.log('  ✅ Owner successfully updated shop profile\n');

    // -------------------------------------------------------------
    // Test 2: Shop Settings
    // -------------------------------------------------------------
    console.log('▶ Test 2: GET & PATCH /shop/settings');

    const getSettingsRes = await fetch(`${baseUrl}/shop/settings`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const getSettingsData = (await getSettingsRes.json()) as any;
    if (getSettingsRes.status !== 200 || getSettingsData.data.cancellationWindowMinutes !== 120) {
      throw new Error(`GET /shop/settings failed: ${JSON.stringify(getSettingsData)}`);
    }
    console.log('  ✅ Shop settings auto-initialized with default values');

    // Update settings
    const patchSettingsRes = await fetch(`${baseUrl}/shop/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({ cancellationWindowMinutes: 60, taxEnabled: true, taxRate: 8.5 }),
    });
    const patchSettingsData = (await patchSettingsRes.json()) as any;
    if (patchSettingsRes.status !== 200 || patchSettingsData.data.taxRate !== 8.5) {
      throw new Error(`PATCH /shop/settings failed: ${JSON.stringify(patchSettingsData)}`);
    }
    console.log('  ✅ Shop settings updated successfully\n');

    // -------------------------------------------------------------
    // Test 3: Business Hours & Schedule Validation
    // -------------------------------------------------------------
    console.log('▶ Test 3: GET & PATCH /shop/business-hours');

    const getHoursRes = await fetch(`${baseUrl}/shop/business-hours`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const getHoursData = (await getHoursRes.json()) as any;
    if (getHoursRes.status !== 200 || !getHoursData.data.monday.enabled) {
      throw new Error(`GET /shop/business-hours failed: ${JSON.stringify(getHoursData)}`);
    }
    console.log('  ✅ Business hours auto-initialized');

    // Reject invalid hours (open >= close)
    const invalidHoursRes = await fetch(`${baseUrl}/shop/business-hours`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        monday: { enabled: true, open: '21:00', close: '09:00' },
      }),
    });
    if (invalidHoursRes.status !== 400) {
      throw new Error(`Expected 400 for open >= close hours, got ${invalidHoursRes.status}`);
    }
    console.log('  ✅ Invalid business hours (open >= close) rejected correctly (400)');

    // Update valid hours
    const validHoursRes = await fetch(`${baseUrl}/shop/business-hours`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        sunday: { enabled: true, open: '10:00', close: '16:00' },
      }),
    });
    const validHoursData = (await validHoursRes.json()) as any;
    if (validHoursRes.status !== 200 || validHoursData.data.sunday.close !== '16:00') {
      throw new Error(`PATCH /shop/business-hours failed: ${JSON.stringify(validHoursData)}`);
    }
    console.log('  ✅ Business hours updated successfully\n');

    // -------------------------------------------------------------
    // Test 4: Shop Holidays & Duplicate Prevention
    // -------------------------------------------------------------
    console.log('▶ Test 4: GET, POST, PATCH, DELETE /shop/holidays');

    // Create Holiday
    const createHolRes = await fetch(`${baseUrl}/shop/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ date: '2026-12-25', name: 'Christmas Day' }),
    });
    const createHolData = (await createHolRes.json()) as any;
    if (createHolRes.status !== 201 || createHolData.data.name !== 'Christmas Day') {
      throw new Error(`POST /shop/holidays failed: ${JSON.stringify(createHolData)}`);
    }
    const holidayId = createHolData.data.id;
    console.log('  ✅ Holiday created successfully');

    // Reject Duplicate Holiday Date
    const dupHolRes = await fetch(`${baseUrl}/shop/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ date: '2026-12-25', name: 'Xmas Duplicate' }),
    });
    if (dupHolRes.status !== 400) {
      throw new Error(`Expected 400 for duplicate holiday date, got ${dupHolRes.status}`);
    }
    console.log('  ✅ Duplicate holiday date rejected (400)');

    // Delete Holiday
    const deleteHolRes = await fetch(`${baseUrl}/shop/holidays/${holidayId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    if (deleteHolRes.status !== 200) {
      throw new Error(`DELETE /shop/holidays failed with status ${deleteHolRes.status}`);
    }
    console.log('  ✅ Holiday deleted successfully\n');

    // -------------------------------------------------------------
    // Test 5: Branch Management & Role Restrictions
    // -------------------------------------------------------------
    console.log('▶ Test 5: Branch Management (/branches)');

    // Auto-created main branch should be present
    const getBranchesRes = await fetch(`${baseUrl}/branches`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const getBranchesData = (await getBranchesRes.json()) as any;
    if (getBranchesRes.status !== 200 || getBranchesData.data.length === 0) {
      throw new Error(`GET /branches failed: ${JSON.stringify(getBranchesData)}`);
    }
    console.log(`  ✅ Found ${getBranchesData.data.length} branch(es) (Main branch auto-created)`);

    // Manager forbidden from creating branch (403)
    const mgrCreateBranchRes = await fetch(`${baseUrl}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({ name: 'Manager Attempt Branch' }),
    });
    if (mgrCreateBranchRes.status !== 403) {
      throw new Error(`Expected 403 for Manager branch creation, got ${mgrCreateBranchRes.status}`);
    }
    console.log('  ✅ Manager forbidden from creating branch (403)');

    // Owner creates new branch
    const createBranchRes = await fetch(`${baseUrl}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        name: 'Downtown Location',
        phone: '+15550200',
        email: 'downtown@kingsmen.com',
      }),
    });
    const createBranchData = (await createBranchRes.json()) as any;
    if (createBranchRes.status !== 201 || createBranchData.data.name !== 'Downtown Location') {
      throw new Error(`POST /branches failed: ${JSON.stringify(createBranchData)}`);
    }
    const branch2Id = createBranchData.data.id;
    console.log('  ✅ Owner created new branch');

    // Reject duplicate branch name in same shop
    const dupBranchRes = await fetch(`${baseUrl}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ name: 'Downtown Location' }),
    });
    if (dupBranchRes.status !== 400) {
      throw new Error(`Expected 400 for duplicate branch name, got ${dupBranchRes.status}`);
    }
    console.log('  ✅ Duplicate branch name in same shop rejected (400)');

    // Tenant 2 owner listing branches should NOT see Tenant 1 branches (Tenant Isolation)
    const t2BranchesRes = await fetch(`${baseUrl}/branches`, {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    const t2BranchesData = (await t2BranchesRes.json()) as any;
    const t2BranchNames = t2BranchesData.data.map((b: any) => b.name);
    if (t2BranchNames.includes('Downtown Location')) {
      throw new Error('Tenant isolation breach: Tenant 2 saw Tenant 1 branch!');
    }
    console.log('  ✅ Tenant isolation verified: Tenant 2 cannot see Tenant 1 branches');

    // Delete Branch by Owner
    const deleteBranchRes = await fetch(`${baseUrl}/branches/${branch2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    if (deleteBranchRes.status !== 200) {
      throw new Error(`DELETE /branches failed with status ${deleteBranchRes.status}`);
    }
    console.log('  ✅ Owner deleted branch successfully\n');

    console.log('🎉 ALL SHOP & BRANCH INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
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
