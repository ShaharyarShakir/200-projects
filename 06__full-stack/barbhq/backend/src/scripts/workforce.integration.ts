import mongoose from 'mongoose';
import http from 'http';
import app from '../app';
import { env } from '../config/env';
import { UserRole } from '../models/user.model';

const runTests = async () => {
  console.log('🧪 Starting Workforce Management Integration Tests...\n');

  const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/barbersaas_workforce_test';
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

  try {
    // -------------------------------------------------------------
    // Setup: Shop 1 Owner, Barber 1, Inactive Barber 2, Shop 2 Owner
    // -------------------------------------------------------------
    console.log('▶ Setup: Registering Shops and Users...');
    
    // Register Shop 1 (Owner)
    const owner1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Elite Cuts Barber',
        shopSlug: `elite-${Date.now()}`,
        ownerFirstName: 'Edward',
        ownerLastName: 'Elric',
        ownerEmail: `owner1_${Date.now()}@barbhq.com`,
        ownerPassword: 'Password123!',
      }),
    });
    const owner1Data = (await owner1Res.json()) as any;
    const owner1Token = owner1Data.data.tokens.accessToken;

    // Create Active Barber 1 in Shop 1 via Employee API
    const barber1Res = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        firstName: 'Alphonse',
        lastName: 'Elric',
        email: `barber1_${Date.now()}@barbhq.com`,
        password: 'Password123!',
        role: UserRole.BARBER,
      }),
    });
    const barber1Data = (await barber1Res.json()) as any;
    const barber1Id = barber1Data.data.id;

    // Login Barber 1
    const b1LoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: barber1Data.data.email, password: 'Password123!' }),
    });
    const barber1Token = ((await b1LoginRes.json()) as any).data.tokens.accessToken;

    // Create Inactive Barber 2 in Shop 1
    const barber2Res = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        firstName: 'Inactive',
        lastName: 'Barber',
        email: `barber2_${Date.now()}@barbhq.com`,
        password: 'Password123!',
        role: UserRole.BARBER,
      }),
    });
    const barber2Data = (await barber2Res.json()) as any;
    const barber2Id = barber2Data.data.id;

    // Deactivate Barber 2
    await fetch(`${baseUrl}/employees/${barber2Id}/toggle-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ isActive: false }),
    });

    // Register Shop 2 (Owner) for Tenant Isolation testing
    const owner2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Rival Blade',
        shopSlug: `rival-${Date.now()}`,
        ownerFirstName: 'Roy',
        ownerLastName: 'Mustang',
        ownerEmail: `owner2_${Date.now()}@barbhq.com`,
        ownerPassword: 'Password123!',
      }),
    });
    const owner2Data = (await owner2Res.json()) as any;
    const owner2Token = owner2Data.data.tokens.accessToken;

    console.log('  ✅ Setup complete\n');

    // -------------------------------------------------------------
    // Test 1: Shift Management
    // -------------------------------------------------------------
    console.log('▶ Test 1: Employee Shifts & Exceptions');

    const dayOfWeek = new Date().getUTCDay();

    // Reject invalid shift time (startTime >= endTime)
    const invalidShiftRes = await fetch(`${baseUrl}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        employeeId: barber1Id,
        dayOfWeek,
        startTime: '18:00',
        endTime: '09:00',
      }),
    });
    if (invalidShiftRes.status !== 400) {
      throw new Error(`Expected 400 for startTime >= endTime, got ${invalidShiftRes.status}`);
    }
    console.log('  ✅ Invalid shift time (startTime >= endTime) rejected (400)');

    // Create valid recurring shift
    const createShiftRes = await fetch(`${baseUrl}/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        employeeId: barber1Id,
        dayOfWeek,
        startTime: '09:00',
        endTime: '18:00',
        breakDurationMinutes: 60,
      }),
    });
    const createShiftData = (await createShiftRes.json()) as any;
    if (createShiftRes.status !== 201 || createShiftData.data.startTime !== '09:00') {
      throw new Error(`Create shift failed: ${JSON.stringify(createShiftData)}`);
    }
    console.log('  ✅ Recurring shift created successfully');

    // Create shift exception
    const todayStr = new Date().toISOString().split('T')[0];
    const exceptionRes = await fetch(`${baseUrl}/shifts/exceptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        employeeId: barber1Id,
        date: todayStr,
        startTime: '08:00',
        endTime: '17:00',
        type: 'CUSTOM_SHIFT',
        reason: 'Early bird shift',
      }),
    });
    const exceptionData = (await exceptionRes.json()) as any;
    if (exceptionRes.status !== 201 || exceptionData.data.type !== 'CUSTOM_SHIFT') {
      throw new Error(`Create shift exception failed: ${JSON.stringify(exceptionData)}`);
    }
    console.log('  ✅ Shift exception created successfully\n');

    // -------------------------------------------------------------
    // Test 2: Smart Clock In / Out & Break State Machine
    // -------------------------------------------------------------
    console.log('▶ Test 2: Attendance & Break State Machine');

    // Barber 1 Clock In
    const clockInRes = await fetch(`${baseUrl}/attendance/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${barber1Token}` },
      body: JSON.stringify({ notes: 'Arrived early' }),
    });
    const clockInData = (await clockInRes.json()) as any;
    if (clockInRes.status !== 200 || !clockInData.data.clockIn) {
      throw new Error(`Clock in failed: ${JSON.stringify(clockInData)}`);
    }
    console.log('  ✅ Barber 1 clocked in successfully');

    // Reject double clock-in
    const dupClockInRes = await fetch(`${baseUrl}/attendance/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${barber1Token}` },
      body: JSON.stringify({}),
    });
    if (dupClockInRes.status !== 400) {
      throw new Error(`Expected 400 for double clock-in, got ${dupClockInRes.status}`);
    }
    console.log('  ✅ Double clock-in rejected (400)');

    // Start Break
    const breakStartRes = await fetch(`${baseUrl}/attendance/break/start`, {
      headers: { Authorization: `Bearer ${barber1Token}` },
      method: 'POST',
    });
    const breakStartData = (await breakStartRes.json()) as any;
    if (breakStartRes.status !== 200 || !breakStartData.data.breakStart) {
      throw new Error(`Start break failed: ${JSON.stringify(breakStartData)}`);
    }
    console.log('  ✅ Break started successfully');

    // Reject starting second break while on break
    const dupBreakRes = await fetch(`${baseUrl}/attendance/break/start`, {
      headers: { Authorization: `Bearer ${barber1Token}` },
      method: 'POST',
    });
    if (dupBreakRes.status !== 400) {
      throw new Error(`Expected 400 for duplicate break start, got ${dupBreakRes.status}`);
    }
    console.log('  ✅ Starting concurrent break rejected (400)');

    // End Break
    const breakEndRes = await fetch(`${baseUrl}/attendance/break/end`, {
      headers: { Authorization: `Bearer ${barber1Token}` },
      method: 'POST',
    });
    const breakEndData = (await breakEndRes.json()) as any;
    if (breakEndRes.status !== 200 || !breakEndData.data.breakEnd) {
      throw new Error(`End break failed: ${JSON.stringify(breakEndData)}`);
    }
    console.log('  ✅ Break ended successfully');

    // Reject ending non-existent break
    const dupBreakEndRes = await fetch(`${baseUrl}/attendance/break/end`, {
      headers: { Authorization: `Bearer ${barber1Token}` },
      method: 'POST',
    });
    if (dupBreakEndRes.status !== 400) {
      throw new Error(`Expected 400 for ending nonexistent break, got ${dupBreakEndRes.status}`);
    }
    console.log('  ✅ Ending nonexistent break rejected (400)');

    // Clock Out
    const clockOutRes = await fetch(`${baseUrl}/attendance/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${barber1Token}` },
      body: JSON.stringify({ notes: 'Finished day' }),
    });
    const clockOutData = (await clockOutRes.json()) as any;
    if (clockOutRes.status !== 200 || !clockOutData.data.clockOut) {
      throw new Error(`Clock out failed: ${JSON.stringify(clockOutData)}`);
    }
    console.log(`  ✅ Clocked out successfully (workedMinutes: ${clockOutData.data.workedMinutes})`);

    // Reject clocking out twice
    const dupClockOutRes = await fetch(`${baseUrl}/attendance/clock-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${barber1Token}` },
      body: JSON.stringify({}),
    });
    if (dupClockOutRes.status !== 400) {
      throw new Error(`Expected 400 for double clock-out, got ${dupClockOutRes.status}`);
    }
    console.log('  ✅ Double clock-out rejected (400)\n');

    // -------------------------------------------------------------
    // Test 3: Leave Management
    // -------------------------------------------------------------
    console.log('▶ Test 3: Leave Request, Approval, Overlap & Inactive Validation');

    // Barber 1 submits Leave Request
    const leaveRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${barber1Token}` },
      body: JSON.stringify({
        type: 'ANNUAL',
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        reason: 'Vacation',
      }),
    });
    const leaveData = (await leaveRes.json()) as any;
    if (leaveRes.status !== 201 || leaveData.data.status !== 'PENDING') {
      throw new Error(`Leave request failed: ${JSON.stringify(leaveData)}`);
    }
    const leaveId = leaveData.data.id;
    console.log('  ✅ Leave request submitted (PENDING)');

    // Reject overlapping leave request
    const overlapLeaveRes = await fetch(`${baseUrl}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${barber1Token}` },
      body: JSON.stringify({
        type: 'SICK',
        startDate: '2026-09-03',
        endDate: '2026-09-07',
      }),
    });
    if (overlapLeaveRes.status !== 400) {
      throw new Error(`Expected 400 for overlapping leave, got ${overlapLeaveRes.status}`);
    }
    console.log('  ✅ Overlapping leave request rejected (400)');

    // Manager/Owner Approves Leave
    const approveLeaveRes = await fetch(`${baseUrl}/leaves/${leaveId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const approveLeaveData = (await approveLeaveRes.json()) as any;
    if (approveLeaveRes.status !== 200 || approveLeaveData.data.status !== 'APPROVED') {
      throw new Error(`Approve leave failed: ${JSON.stringify(approveLeaveData)}`);
    }
    console.log('  ✅ Leave request approved successfully\n');

    // -------------------------------------------------------------
    // Test 4: Dashboards & Audit Logs
    // -------------------------------------------------------------
    console.log('▶ Test 4: Dashboards & Audit Logs');

    // Employee Dashboard
    const empDashRes = await fetch(`${baseUrl}/employees/me/dashboard`, {
      headers: { Authorization: `Bearer ${barber1Token}` },
    });
    const empDashData = (await empDashRes.json()) as any;
    if (empDashRes.status !== 200 || !empDashData.data.today) {
      throw new Error(`GET /employees/me/dashboard failed: ${JSON.stringify(empDashData)}`);
    }
    console.log('  ✅ Employee Dashboard data fetched successfully');

    // Shop Workforce Dashboard
    const shopDashRes = await fetch(`${baseUrl}/shop/dashboard/workforce`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const shopDashData = (await shopDashRes.json()) as any;
    if (shopDashRes.status !== 200 || shopDashData.data.employees.total < 3) {
      throw new Error(`GET /shop/dashboard/workforce failed: ${JSON.stringify(shopDashData)}`);
    }
    console.log(`  ✅ Shop Workforce Dashboard fetched (total: ${shopDashData.data.employees.total}, active: ${shopDashData.data.employees.active})`);

    // Audit Logs
    const auditLogsRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const auditLogsData = (await auditLogsRes.json()) as any;
    if (auditLogsRes.status !== 200 || auditLogsData.data.length === 0) {
      throw new Error(`GET /audit-logs failed: ${JSON.stringify(auditLogsData)}`);
    }
    console.log(`  ✅ Audit logs recorded ${auditLogsData.data.length} actions\n`);

    // -------------------------------------------------------------
    // Test 5: Tenant Isolation
    // -------------------------------------------------------------
    console.log('▶ Test 5: Multi-Tenant Data Scoping');

    const t2AuditLogsRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    const t2AuditLogsData = (await t2AuditLogsRes.json()) as any;
    if (t2AuditLogsRes.status !== 200 || t2AuditLogsData.data.length !== 0) {
      throw new Error(`Tenant isolation breach: Owner 2 saw ${t2AuditLogsData.data.length} audit logs!`);
    }
    console.log('  ✅ Tenant isolation verified: Tenant 2 cannot see Tenant 1 audit logs\n');

    console.log('🎉 ALL WORKFORCE MANAGEMENT INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
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
