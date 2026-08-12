import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import apiRouter from '../routes';
import { errorHandler } from '../middleware/error.middleware';
import { User } from '../models/user.model';
import { Shop } from '../models/shop.model';
import { Notification, NotificationType } from '../models/notification.model';
import { NotificationDelivery } from '../models/notification-delivery.model';
import { NotificationPreference } from '../models/notification-preference.model';
import { UserDevice } from '../models/user-device.model';
import { emailChannel, DevelopmentEmailProvider } from '../modules/notifications/channels/email.channel';
import { pushChannel, DevelopmentPushProvider } from '../modules/notifications/channels/push.channel';
import { notificationService } from '../modules/notifications/notification.service';
import { notificationWorker } from '../modules/notifications/workers/notification.worker';
import { InventoryCategory } from '../models/inventory-category.model';
import { InventoryItem } from '../models/inventory-item.model';
import { LeaveRequest } from '../models/leave.model';

const app = express();
app.use(express.json());
app.use('/api/v1', apiRouter);
app.use(errorHandler);

let server: http.Server;
let baseUrl: string;

async function request(
  method: string,
  path: string,
  token?: string,
  body?: any,
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let resBody: any = null;
  const text = await res.text();
  try {
    resBody = JSON.parse(text);
  } catch {
    resBody = text;
  }

  return { status: res.status, body: resBody };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 Starting Notification Service Integration Tests...\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/barbersaas';
  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to MongoDB: ${mongoUri}`);

  // Clean Database Collections
  await Promise.all([
    User.deleteMany({}),
    Shop.deleteMany({}),
    Notification.deleteMany({}),
    NotificationDelivery.deleteMany({}),
    NotificationPreference.deleteMany({}),
    UserDevice.deleteMany({}),
    InventoryCategory.deleteMany({}),
    InventoryItem.deleteMany({}),
    LeaveRequest.deleteMany({}),
  ]);
  console.log('🧹 Cleaned test database');

  // Attach mock providers for testing
  const mockEmailProvider = new DevelopmentEmailProvider();
  const mockPushProvider = new DevelopmentPushProvider();
  emailChannel.setProvider(mockEmailProvider);
  pushChannel.setProvider(mockPushProvider);

  server = app.listen(0);
  const address = server.address() as any;
  baseUrl = `http://localhost:${address.port}/api/v1`;
  console.log(`🚀 Test server listening on ${baseUrl}\n`);

  try {
    // ---------------------------------------------------------
    // SETUP: Register Shop 1 (Owner + Barber) and Shop 2 (Owner)
    // ---------------------------------------------------------
    console.log('▶ Setup: Registering Shops and Users...');

    const timestamp = Date.now();
    const owner1Email = `owner1_${timestamp}@barbhq.com`;
    const barber1Email = `barber1_${timestamp}@barbhq.com`;
    const owner2Email = `owner2_${timestamp}@barbhq.com`;

    const reg1 = await request('POST', '/auth/register', undefined, {
      shopName: 'Elite Grooming Studio',
      shopSlug: `elite-grooming-${timestamp}`,
      ownerFirstName: 'David',
      ownerLastName: 'Owner',
      ownerEmail: owner1Email,
      ownerPassword: 'Password123!',
    });
    if (reg1.status !== 201) throw new Error(`Register shop 1 failed: ${JSON.stringify(reg1.body)}`);

    const loginOwner1 = await request('POST', '/auth/login', undefined, {
      email: owner1Email,
      password: 'Password123!',
    });
    const owner1Token = loginOwner1.body.data.tokens.accessToken;
    const owner1User = loginOwner1.body.data.user;

    const empRes = await request('POST', '/employees', owner1Token, {
      firstName: 'Sam',
      lastName: 'Barber',
      email: barber1Email,
      password: 'Password123!',
      role: 'BARBER',
    });
    if (empRes.status !== 201) throw new Error(`Create employee failed: ${JSON.stringify(empRes.body)}`);

    const loginBarber1 = await request('POST', '/auth/login', undefined, {
      email: barber1Email,
      password: 'Password123!',
    });
    const barber1Token = loginBarber1.body.data.tokens.accessToken;
    const barber1User = loginBarber1.body.data.user;

    const reg2 = await request('POST', '/auth/register', undefined, {
      shopName: 'Metro Barber Shop',
      shopSlug: `metro-barber-${timestamp}`,
      ownerFirstName: 'Sarah',
      ownerLastName: 'Owner',
      ownerEmail: owner2Email,
      ownerPassword: 'Password123!',
    });
    if (reg2.status !== 201) throw new Error(`Register shop 2 failed: ${JSON.stringify(reg2.body)}`);

    const loginOwner2 = await request('POST', '/auth/login', undefined, {
      email: owner2Email,
      password: 'Password123!',
    });
    const owner2Token = loginOwner2.body.data.tokens.accessToken;

    console.log('  ✅ Setup complete\n');

    // ---------------------------------------------------------
    // TEST 1: User Device Push Token Registration API
    // ---------------------------------------------------------
    console.log('▶ Test 1: User Device Token Registration API');

    const devRegRes = await request('POST', '/notifications/devices', barber1Token, {
      platform: 'IOS',
      pushToken: 'ExponentPushToken[mock_token_12345]',
      deviceName: "Sam's iPhone 15 Pro",
    });
    if (devRegRes.status !== 201) {
      throw new Error(`Device registration failed: ${JSON.stringify(devRegRes.body)}`);
    }
    const deviceId = devRegRes.body.data.id;
    console.log('  ✅ Device push token registered successfully');

    const getDevsRes = await request('GET', '/notifications/devices', barber1Token);
    if (getDevsRes.status !== 200 || getDevsRes.body.data.length !== 1) {
      throw new Error(`GET devices failed: ${JSON.stringify(getDevsRes.body)}`);
    }
    console.log('  ✅ Retrieved registered user device tokens');

    const delDevRes = await request('DELETE', `/notifications/devices/${deviceId}`, barber1Token);
    if (delDevRes.status !== 200) {
      throw new Error(`Remove device failed: ${JSON.stringify(delDevRes.body)}`);
    }
    console.log('  ✅ Unregistered user device token');

    // Re-register device for subsequent push tests
    await request('POST', '/notifications/devices', barber1Token, {
      platform: 'IOS',
      pushToken: 'ExponentPushToken[mock_token_12345]',
    });
    console.log('  ✅ Re-registered push token for testing push channel delivery\n');

    // ---------------------------------------------------------
    // TEST 2: Notification Preferences API
    // ---------------------------------------------------------
    console.log('▶ Test 2: Notification Preferences API');

    const getPrefRes = await request('GET', '/notifications/preferences', barber1Token);
    if (getPrefRes.status !== 200 || !getPrefRes.body.data.payroll) {
      throw new Error(`GET preferences failed: ${JSON.stringify(getPrefRes.body)}`);
    }
    console.log('  ✅ Verified default notification preferences matrix');

    const updatePrefRes = await request('PATCH', '/notifications/preferences', barber1Token, {
      inventory: {
        email: false,
      },
    });
    if (updatePrefRes.status !== 200 || updatePrefRes.body.data.inventory.email !== false) {
      throw new Error(`Update preferences failed: ${JSON.stringify(updatePrefRes.body)}`);
    }
    console.log('  ✅ Updated preferences: disabled email channel for inventory notifications\n');

    // ---------------------------------------------------------
    // TEST 3: Template Engine & Internal Event Publishing
    // ---------------------------------------------------------
    console.log('▶ Test 3: Template Engine & Event Publishing');

    mockEmailProvider.clearHistory();
    mockPushProvider.clearHistory();

    await notificationService.publish({
      shopId: owner1User.shopId,
      type: NotificationType.LOW_STOCK,
      recipientIds: [barber1User.id],
      data: {
        itemName: 'Hair Wax',
        quantity: 4,
        unit: 'pieces',
      },
    });

    await sleep(200); // Allow async worker jobs to execute

    // Check rendered notification
    const barberNotifs = await request('GET', '/notifications', barber1Token);
    if (barberNotifs.status !== 200 || barberNotifs.body.data.notifications.length !== 1) {
      throw new Error(`Publish notification failed: ${JSON.stringify(barberNotifs.body)}`);
    }
    const notif = barberNotifs.body.data.notifications[0];
    if (notif.title !== 'Low Stock Alert' || !notif.message.includes('Hair Wax is running low. Only 4 pieces remaining.')) {
      throw new Error(`Template rendering mismatch: ${JSON.stringify(notif)}`);
    }
    console.log(`  ✅ Template rendered message: "${notif.message}"`);

    // Verify channel preferences honored (Email disabled, Push & InApp sent)
    if (mockEmailProvider.sentEmails.length !== 0) {
      throw new Error(`Email sent despite preference being set to false!`);
    }
    if (mockPushProvider.sentPushes.length !== 1) {
      throw new Error(`Expected 1 push message, got ${mockPushProvider.sentPushes.length}`);
    }
    console.log('  ✅ Honored user preference channel overrides (Email skipped, Push & In-App processed)\n');

    // ---------------------------------------------------------
    // TEST 4: User Notification Query & Read State APIs
    // ---------------------------------------------------------
    console.log('▶ Test 4: User Notification Query & Read State APIs');

    const summaryRes = await request('GET', '/notifications/summary', barber1Token);
    if (summaryRes.status !== 200 || summaryRes.body.data.unread !== 1) {
      throw new Error(`GET notification summary failed: ${JSON.stringify(summaryRes.body)}`);
    }
    console.log(`  ✅ Notification summary returned unreadCount = ${summaryRes.body.data.unread}`);

    const singleRes = await request('GET', `/notifications/${notif.id}`, barber1Token);
    if (singleRes.status !== 200 || singleRes.body.data.id !== notif.id) {
      throw new Error(`GET single notification failed: ${JSON.stringify(singleRes.body)}`);
    }

    const readRes = await request('PATCH', `/notifications/${notif.id}/read`, barber1Token);
    if (readRes.status !== 200 || !readRes.body.data.readAt) {
      throw new Error(`Mark as read failed: ${JSON.stringify(readRes.body)}`);
    }
    console.log('  ✅ Marked notification as read');

    // Publish another system notification & test mark-all-read
    await notificationService.publish({
      shopId: owner1User.shopId,
      type: NotificationType.SYSTEM,
      recipientIds: [barber1User.id],
      data: {
        title: 'System Update',
        message: 'System maintenance scheduled.',
      },
    });
    await sleep(200);

    const markAllRes = await request('PATCH', '/notifications/read-all', barber1Token);
    if (markAllRes.status !== 200 || markAllRes.body.data.markedCount < 1) {
      throw new Error(`Mark all read failed: ${JSON.stringify(markAllRes.body)}`);
    }
    console.log('  ✅ Marked all notifications as read successfully\n');

    // ---------------------------------------------------------
    // TEST 5: Idempotency Boundary & Worker Retry Handling
    // ---------------------------------------------------------
    console.log('▶ Test 5: Idempotency Boundary & Worker Retry Handling');

    const testNotif = await Notification.create({
      shopId: owner1User.shopId,
      recipientId: barber1User.id,
      type: NotificationType.SYSTEM,
      title: 'Idempotency Test',
      message: 'Testing idempotency',
      channels: ['IN_APP'],
      status: 'PENDING',
    });

    // Execute delivery worker twice for the same job
    await notificationWorker.processDeliveryJob({
      notificationId: testNotif._id.toString(),
      channel: 'IN_APP' as any,
    });
    await notificationWorker.processDeliveryJob({
      notificationId: testNotif._id.toString(),
      channel: 'IN_APP' as any,
    });

    const deliveries = await NotificationDelivery.find({ notificationId: testNotif._id });
    if (deliveries.length !== 1) {
      throw new Error(`Idempotency broken! Created ${deliveries.length} delivery logs for same job`);
    }
    console.log('  ✅ Idempotency enforced: duplicate job execution ignored duplicate delivery log creation\n');

    // ---------------------------------------------------------
    // TEST 6: Domain Module Event Integration (Leave Request Workflow)
    // ---------------------------------------------------------
    console.log('▶ Test 6: Domain Module Event Integration (Leave Request Workflow)');

    mockEmailProvider.clearHistory();

    // 1. Barber requests leave -> triggers LEAVE_REQUESTED to Owner
    const leaveRes = await request('POST', '/leaves', barber1Token, {
      type: 'ANNUAL',
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      reason: 'Summer break',
    });
    if (leaveRes.status !== 201) throw new Error(`Create leave failed: ${JSON.stringify(leaveRes.body)}`);
    const leaveId = leaveRes.body.data.id;
    await sleep(200);

    const ownerNotifs = await request('GET', '/notifications', owner1Token);
    if (ownerNotifs.body.data.notifications.length < 1 || ownerNotifs.body.data.notifications[0].type !== 'LEAVE_REQUESTED') {
      throw new Error(`Leave request notification trigger failed: ${JSON.stringify(ownerNotifs.body)}`);
    }
    console.log('  ✅ Leave request automatically published LEAVE_REQUESTED event to Shop Owner');

    // 2. Owner approves leave -> triggers LEAVE_APPROVED to Barber
    const approveRes = await request('PATCH', `/leaves/${leaveId}/approve`, owner1Token);
    if (approveRes.status !== 200) throw new Error(`Approve leave failed: ${JSON.stringify(approveRes.body)}`);
    await sleep(200);

    const barberLeaveNotifs = await request('GET', '/notifications?type=LEAVE_APPROVED', barber1Token);
    if (barberLeaveNotifs.body.data.notifications.length < 1) {
      throw new Error(`Leave approval notification trigger failed: ${JSON.stringify(barberLeaveNotifs.body)}`);
    }
    console.log('  ✅ Leave approval automatically published LEAVE_APPROVED event to Employee\n');

    // ---------------------------------------------------------
    // TEST 7: Tenant Isolation Verification
    // ---------------------------------------------------------
    console.log('▶ Test 7: Tenant Isolation Verification');

    const shop2Notifs = await request('GET', '/notifications', owner2Token);
    if (shop2Notifs.status !== 200 || shop2Notifs.body.data.notifications.length !== 0) {
      throw new Error(`Multi-tenant leakage! Shop 2 received notifications: ${JSON.stringify(shop2Notifs.body)}`);
    }
    console.log('  ✅ Multi-tenant isolation verified: Shop 2 cannot access Shop 1 notifications\n');

    console.log('🎉 ALL NOTIFICATION SERVICE INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    console.log('🔌 Server and DB connection closed.');
  }
}

runTests();
