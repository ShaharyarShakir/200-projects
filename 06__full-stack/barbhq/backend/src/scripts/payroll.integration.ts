import mongoose from 'mongoose';
import http from 'http';
import app from '../app';
import { env } from '../config/env';
import { UserRole } from '../models/user.model';
import { SalaryType } from '../models/employee-compensation.model';

const runTests = async () => {
  console.log('🧪 Starting Payroll & Compensation Integration Tests...\n');

  const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/barbersaas_payroll_test';
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
    // Setup: Shop 1 Owner, Barber 1 (Hourly), Barber 2 (Monthly), Shop 2 Owner
    // -------------------------------------------------------------
    console.log('▶ Setup: Registering Shops and Employees...');

    // Shop 1 Owner
    const owner1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Elite Cuts Shop',
        shopSlug: `payroll-shop1-${Date.now()}`,
        ownerFirstName: 'Marcus',
        ownerLastName: 'Vance',
        ownerEmail: `owner1_${Date.now()}@barbhq.com`,
        ownerPassword: 'Password123!',
      }),
    });
    const owner1Data = (await owner1Res.json()) as any;
    const owner1Token = owner1Data.data.tokens.accessToken;

    // Barber 1 (Hourly)
    const b1Res = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        firstName: 'Hourly',
        lastName: 'Barber',
        email: `barber1_${Date.now()}@barbhq.com`,
        password: 'Password123!',
        role: UserRole.BARBER,
      }),
    });
    const b1Data = (await b1Res.json()) as any;
    const barber1Id = b1Data.data.id;

    // Login Barber 1
    const b1LoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: b1Data.data.email, password: 'Password123!' }),
    });
    const barber1Token = ((await b1LoginRes.json()) as any).data.tokens.accessToken;

    // Barber 2 (Monthly)
    const b2Res = await fetch(`${baseUrl}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        firstName: 'Monthly',
        lastName: 'Barber',
        email: `barber2_${Date.now()}@barbhq.com`,
        password: 'Password123!',
        role: UserRole.BARBER,
      }),
    });
    const b2Data = (await b2Res.json()) as any;
    const barber2Id = b2Data.data.id;

    // Shop 2 Owner (Tenant Isolation)
    const owner2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopName: 'Rival Shop',
        shopSlug: `payroll-shop2-${Date.now()}`,
        ownerFirstName: 'Rival',
        ownerLastName: 'Owner',
        ownerEmail: `owner2_${Date.now()}@barbhq.com`,
        ownerPassword: 'Password123!',
      }),
    });
    const owner2Data = (await owner2Res.json()) as any;
    const owner2Token = owner2Data.data.tokens.accessToken;

    console.log('  ✅ Setup complete\n');

    // -------------------------------------------------------------
    // Test 1: Employee Compensation Profiles & History
    // -------------------------------------------------------------
    console.log('▶ Test 1: Employee Compensation Management');

    // Set Barber 1 (Hourly: 500/hr)
    const comp1Res = await fetch(`${baseUrl}/employees/${barber1Id}/compensation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        salaryType: SalaryType.HOURLY,
        hourlyRate: 500,
        overtimeEnabled: true,
        overtimeMultiplier: 1.5,
        effectiveFrom: '2026-01-01',
      }),
    });
    const comp1Data = (await comp1Res.json()) as any;
    if (comp1Res.status !== 201 || comp1Data.data.hourlyRate !== 500) {
      throw new Error(`Set hourly compensation failed: ${JSON.stringify(comp1Data)}`);
    }
    console.log('  ✅ Set hourly compensation profile (500/hr)');

    // Set Barber 2 (Monthly: 50,000/mo)
    const comp2Res = await fetch(`${baseUrl}/employees/${barber2Id}/compensation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        salaryType: SalaryType.MONTHLY,
        baseSalary: 50000,
        commissionEnabled: true,
        commissionRate: 10,
        effectiveFrom: '2026-01-01',
      }),
    });
    const comp2Data = (await comp2Res.json()) as any;
    if (comp2Res.status !== 201 || comp2Data.data.baseSalary !== 50000) {
      throw new Error(`Set monthly compensation failed: ${JSON.stringify(comp2Data)}`);
    }
    console.log('  ✅ Set monthly compensation profile (50,000/mo)');

    // Fetch Barber 1 Active Compensation Profile
    const getCompRes = await fetch(`${baseUrl}/employees/${barber1Id}/compensation`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const getCompData = (await getCompRes.json()) as any;
    if (getCompRes.status !== 200 || getCompData.data.salaryType !== SalaryType.HOURLY) {
      throw new Error(`GET active compensation failed: ${JSON.stringify(getCompData)}`);
    }
    console.log('  ✅ Fetched active employee compensation profile\n');

    // -------------------------------------------------------------
    // Test 2: Payroll Period Creation & Processing
    // -------------------------------------------------------------
    console.log('▶ Test 2: Payroll Period Creation & Processing Engine');

    const startDate = '2026-08-01';
    const endDate = '2026-08-31';

    // Create Payroll Period
    const createPeriodRes = await fetch(`${baseUrl}/payroll/periods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ startDate, endDate, payDate: '2026-09-01' }),
    });
    const createPeriodData = (await createPeriodRes.json()) as any;
    if (createPeriodRes.status !== 201 || createPeriodData.data.status !== 'OPEN') {
      throw new Error(`Create payroll period failed: ${JSON.stringify(createPeriodData)}`);
    }
    const periodId = createPeriodData.data.id;
    console.log('  ✅ Created OPEN payroll period');

    // Reject overlapping payroll period
    const dupPeriodRes = await fetch(`${baseUrl}/payroll/periods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ startDate: '2026-08-15', endDate: '2026-09-15' }),
    });
    if (dupPeriodRes.status !== 400) {
      throw new Error(`Expected 400 for overlapping payroll period, got ${dupPeriodRes.status}`);
    }
    console.log('  ✅ Overlapping payroll period rejected (400)');

    // Process Payroll Period
    const processRes = await fetch(`${baseUrl}/payroll/periods/${periodId}/process`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const processData = (await processRes.json()) as any;
    if (processRes.status !== 200 || processData.data.status !== 'PROCESSING') {
      throw new Error(`Process payroll period failed: ${JSON.stringify(processData)}`);
    }
    console.log('  ✅ Processed payroll period into PROCESSING state');

    // Verify generated records
    const recordsRes = await fetch(`${baseUrl}/payroll/periods/${periodId}/employees`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const recordsData = (await recordsRes.json()) as any;
    if (recordsRes.status !== 200 || recordsData.data.length < 2) {
      throw new Error(`GET period records failed: ${JSON.stringify(recordsData)}`);
    }
    const monthlyRecord = recordsData.data.find(
      (r: any) =>
        (typeof r.employeeId === 'object' ? r.employeeId.id || r.employeeId._id : r.employeeId) === barber2Id,
    );
    if (!monthlyRecord || monthlyRecord.baseSalary !== 50000) {
      throw new Error(`Monthly payroll record incorrect: ${JSON.stringify(monthlyRecord)}`);
    }
    const b2RecordId = monthlyRecord.id;
    console.log('  ✅ Verified generated monthly employee payroll record (Base: 50,000)\n');

    // -------------------------------------------------------------
    // Test 3: Payroll Adjustments (Bonuses & Deductions)
    // -------------------------------------------------------------
    console.log('▶ Test 3: Payroll Adjustments (Bonuses & Deductions)');

    // Add Bonus
    const bonusRes = await fetch(`${baseUrl}/payroll/records/${b2RecordId}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ type: 'BONUS', amount: 5000, reason: 'High performance bonus' }),
    });
    const bonusData = (await bonusRes.json()) as any;
    if (bonusRes.status !== 201 || bonusData.data.amount !== 5000) {
      throw new Error(`Add bonus failed: ${JSON.stringify(bonusData)}`);
    }
    console.log('  ✅ Added bonus adjustment (+5,000)');

    // Add Deduction
    const deductRes = await fetch(`${baseUrl}/payroll/records/${b2RecordId}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ type: 'DEDUCTION', amount: 1500, reason: 'Tool breakage fee' }),
    });
    const deductData = (await deductRes.json()) as any;
    if (deductRes.status !== 201 || deductData.data.amount !== 1500) {
      throw new Error(`Add deduction failed: ${JSON.stringify(deductData)}`);
    }
    console.log('  ✅ Added deduction adjustment (-1,500)');

    // Verify updated record Net Pay: 50,000 + 5,000 - 1,500 = 53,500
    const recCheckRes = await fetch(`${baseUrl}/payroll/periods/${periodId}/employees/${barber2Id}`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const recCheckData = (await recCheckRes.json()) as any;
    if (recCheckRes.status !== 200 || recCheckData.data.netPay !== 53500) {
      throw new Error(`Updated net pay calculation error: expected 53500, got ${recCheckData.data.netPay}`);
    }
    console.log(`  ✅ Net Pay updated correctly with adjustments: ${recCheckData.data.netPay}\n`);

    // -------------------------------------------------------------
    // Test 4: Finalization, Snapshot Lock & Historical Preservation
    // -------------------------------------------------------------
    console.log('▶ Test 4: Finalization, Snapshot Lock & Historical Preservation');

    // Owner Finalizes Payroll Period
    const finalizeRes = await fetch(`${baseUrl}/payroll/periods/${periodId}/finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const finalizeData = (await finalizeRes.json()) as any;
    if (finalizeRes.status !== 200 || finalizeData.data.status !== 'FINALIZED') {
      throw new Error(`Finalize payroll failed: ${JSON.stringify(finalizeData)}`);
    }
    console.log('  ✅ Finalized payroll period');

    // Update Barber 2's salary to 75,000 for upcoming periods
    await fetch(`${baseUrl}/employees/${barber2Id}/compensation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({
        salaryType: SalaryType.MONTHLY,
        baseSalary: 75000,
        effectiveFrom: '2026-09-01',
      }),
    });

    // Verify finalized record STAYS at original snapshot value (50,000 base salary / 53,500 net pay)
    const histCheckRes = await fetch(`${baseUrl}/payroll/periods/${periodId}/employees/${barber2Id}`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const histCheckData = (await histCheckRes.json()) as any;
    if (histCheckData.data.baseSalary !== 50000 || histCheckData.data.netPay !== 53500) {
      throw new Error(`Historical snapshot breached! Expected base 50000, got ${histCheckData.data.baseSalary}`);
    }
    console.log('  ✅ Historical snapshot preserved (baseSalary remained 50,000 despite future salary increase)');

    // Verify finalized period rejects modifications
    const reAdjRes = await fetch(`${baseUrl}/payroll/records/${b2RecordId}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${owner1Token}` },
      body: JSON.stringify({ type: 'BONUS', amount: 1000, reason: 'Late bonus' }),
    });
    if (reAdjRes.status !== 400) {
      throw new Error(`Expected 400 when adding adjustment to finalized period, got ${reAdjRes.status}`);
    }
    console.log('  ✅ Finalized period rejected new adjustments (400)');

    // Mark Payroll Period as PAID
    const paidRes = await fetch(`${baseUrl}/payroll/periods/${periodId}/mark-paid`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const paidData = (await paidRes.json()) as any;
    if (paidRes.status !== 200 || paidData.data.status !== 'PAID') {
      throw new Error(`Mark paid failed: ${JSON.stringify(paidData)}`);
    }
    console.log('  ✅ Marked payroll period as PAID\n');

    // -------------------------------------------------------------
    // Test 5: Dashboard, Role Authorization & Tenant Isolation
    // -------------------------------------------------------------
    console.log('▶ Test 5: Dashboard, Role Authorization & Multi-Tenant Scoping');

    // Payroll Dashboard
    const dashRes = await fetch(`${baseUrl}/payroll/dashboard`, {
      headers: { Authorization: `Bearer ${owner1Token}` },
    });
    const dashData = (await dashRes.json()) as any;
    if (dashRes.status !== 200 || dashData.data.currentPeriod.netPay <= 0) {
      throw new Error(`GET /payroll/dashboard failed: ${JSON.stringify(dashData)}`);
    }
    console.log(`  ✅ Payroll dashboard fetched (current netPay: ${dashData.data.currentPeriod.netPay})`);

    // Barber 1 accesses own paystubs via /payroll/me
    const myPaystubsRes = await fetch(`${baseUrl}/payroll/me`, {
      headers: { Authorization: `Bearer ${barber1Token}` },
    });
    const myPaystubsData = (await myPaystubsRes.json()) as any;
    if (myPaystubsRes.status !== 200 || !Array.isArray(myPaystubsData.data)) {
      throw new Error(`GET /payroll/me failed: ${JSON.stringify(myPaystubsData)}`);
    }
    console.log('  ✅ Barber successfully fetched own paystubs via GET /payroll/me');

    // Barber 1 forbidden from finalizing payroll (403)
    const barberFinalizeRes = await fetch(`${baseUrl}/payroll/periods/${periodId}/finalize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${barber1Token}` },
    });
    if (barberFinalizeRes.status !== 403) {
      throw new Error(`Expected 403 for Barber finalize attempt, got ${barberFinalizeRes.status}`);
    }
    console.log('  ✅ Barber forbidden from finalizing payroll (403)');

    // Tenant Isolation: Owner 2 (Shop 2) fetching Shop 1 periods
    const t2PeriodsRes = await fetch(`${baseUrl}/payroll/periods`, {
      headers: { Authorization: `Bearer ${owner2Token}` },
    });
    const t2PeriodsData = (await t2PeriodsRes.json()) as any;
    if (t2PeriodsRes.status !== 200 || t2PeriodsData.data.length !== 0) {
      throw new Error(`Tenant isolation breach: Owner 2 saw ${t2PeriodsData.data.length} periods!`);
    }
    console.log('  ✅ Multi-tenant isolation verified: Shop 2 cannot view Shop 1 payroll periods\n');

    console.log('🎉 ALL PAYROLL & COMPENSATION INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
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
