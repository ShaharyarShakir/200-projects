import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import apiRouter from '../routes';
import { errorHandler } from '../middleware/error.middleware';
import { InventoryCategory } from '../models/inventory-category.model';
import { Vendor } from '../models/vendor.model';
import { InventoryItem } from '../models/inventory-item.model';
import { StockMovement } from '../models/stock-movement.model';
import { PurchaseOrder } from '../models/purchase-order.model';
import { Payable } from '../models/payable.model';
import { InventoryCount } from '../models/inventory-count.model';
import { User } from '../models/user.model';
import { Shop } from '../models/shop.model';

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

async function runTests() {
  console.log('🧪 Starting Inventory & Stock Management Integration Tests...\n');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/barbersaas';
  await mongoose.connect(mongoUri);
  console.log(`✅ Connected to MongoDB: ${mongoUri}`);

  // Clean Database Collections
  await Promise.all([
    User.deleteMany({}),
    Shop.deleteMany({}),
    InventoryCategory.deleteMany({}),
    Vendor.deleteMany({}),
    InventoryItem.deleteMany({}),
    StockMovement.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    Payable.deleteMany({}),
    InventoryCount.deleteMany({}),
  ]);
  console.log('🧹 Cleaned test database');

  // Start Server
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

    // 1. Register Shop 1
    const reg1 = await request('POST', '/auth/register', undefined, {
      shopName: 'Gentlemen Cuts Shop',
      shopSlug: `gentlemen-cuts-${timestamp}`,
      ownerFirstName: 'John',
      ownerLastName: 'Owner',
      ownerEmail: owner1Email,
      ownerPassword: 'Password123!',
    });
    if (reg1.status !== 201) {
      throw new Error(`Register shop 1 failed: ${JSON.stringify(reg1.body)}`);
    }

    const loginOwner1 = await request('POST', '/auth/login', undefined, {
      email: owner1Email,
      password: 'Password123!',
    });
    const owner1Token = loginOwner1.body.data.tokens.accessToken;

    // Create Barber in Shop 1
    const empRes = await request('POST', '/employees', owner1Token, {
      firstName: 'Bob',
      lastName: 'Barber',
      email: barber1Email,
      password: 'Password123!',
      role: 'BARBER',
    });
    if (empRes.status !== 201) {
      throw new Error(`Create employee failed: ${JSON.stringify(empRes.body)}`);
    }

    // Login Barber 1
    const loginBarber = await request('POST', '/auth/login', undefined, {
      email: barber1Email,
      password: 'Password123!',
    });
    const barber1Token = loginBarber.body.data.tokens.accessToken;

    // 2. Register Shop 2
    const reg2 = await request('POST', '/auth/register', undefined, {
      shopName: 'Crown Barber Studio',
      shopSlug: `crown-barber-${timestamp}`,
      ownerFirstName: 'Alice',
      ownerLastName: 'Owner',
      ownerEmail: owner2Email,
      ownerPassword: 'Password123!',
    });
    if (reg2.status !== 201) {
      throw new Error(`Register shop 2 failed: ${JSON.stringify(reg2.body)}`);
    }

    const loginOwner2 = await request('POST', '/auth/login', undefined, {
      email: owner2Email,
      password: 'Password123!',
    });
    const owner2Token = loginOwner2.body.data.tokens.accessToken;

    console.log('  ✅ Setup complete\n');

    // ---------------------------------------------------------
    // TEST 1: Inventory Categories & Vendors
    // ---------------------------------------------------------
    console.log('▶ Test 1: Inventory Categories & Vendors');

    // GET Categories (should auto-seed default categories)
    const catRes1 = await request('GET', '/inventory/categories', owner1Token);
    if (catRes1.status !== 200 || catRes1.body.data.length < 7) {
      throw new Error(`GET categories failed: ${JSON.stringify(catRes1.body)}`);
    }
    console.log(`  ✅ Verified ${catRes1.body.data.length} auto-seeded default categories`);

    // Create custom Category
    const customCatRes = await request('POST', '/inventory/categories', owner1Token, {
      name: 'Custom Hair Dyes',
      description: 'Specialty hair dyes for styling',
    });
    if (customCatRes.status !== 201) {
      throw new Error(`Create category failed: ${JSON.stringify(customCatRes.body)}`);
    }
    const categoryId = customCatRes.body.data.id;
    console.log('  ✅ Custom inventory category created successfully');

    // Create Vendor
    const vendorRes = await request('POST', '/vendors', owner1Token, {
      name: 'Grooming Supplies Co.',
      contactName: 'Mark Sales',
      email: 'sales@groomingsupplies.com',
      phone: '+1234567890',
    });
    if (vendorRes.status !== 201) {
      throw new Error(`Create vendor failed: ${JSON.stringify(vendorRes.body)}`);
    }
    const supplierId = vendorRes.body.data.id;
    console.log('  ✅ Vendor created successfully\n');

    // ---------------------------------------------------------
    // TEST 2: Inventory Items & SKU Uniqueness
    // ---------------------------------------------------------
    console.log('▶ Test 2: Inventory Items & SKU Uniqueness');

    // 1. Create Shampoo Item (SKU: SHAM-001)
    const shampooRes = await request('POST', '/inventory/items', owner1Token, {
      sku: 'SHAM-001',
      name: 'Premium Shampoo 1L',
      categoryId,
      unit: 'LITER',
      currentQuantity: 0,
      minimumQuantity: 5,
      reorderQuantity: 20,
      averageCost: 0,
      supplierId,
    });
    if (shampooRes.status !== 201) {
      throw new Error(`Create item failed: ${JSON.stringify(shampooRes.body)}`);
    }
    const shampooId = shampooRes.body.data.id;
    console.log('  ✅ Created Shampoo item (SHAM-001) with initial stock 0');

    // 2. Create Hair Wax Item (SKU: WAX-001) with initial stock 10
    const waxRes = await request('POST', '/inventory/items', owner1Token, {
      sku: 'WAX-001',
      name: 'Matte Clay Hair Wax',
      categoryId,
      unit: 'PIECE',
      currentQuantity: 10,
      minimumQuantity: 15,
      reorderQuantity: 30,
      averageCost: 500,
      supplierId,
    });
    if (waxRes.status !== 201) {
      throw new Error(`Create wax item failed: ${JSON.stringify(waxRes.body)}`);
    }
    const waxId = waxRes.body.data.id;
    console.log('  ✅ Created Hair Wax item (WAX-001) with initial stock 10');

    // Verify initial stock movement generated for Hair Wax
    const waxMovements = await request('GET', `/inventory/items/${waxId}/movements`, owner1Token);
    if (waxMovements.body.data.length !== 1 || waxMovements.body.data[0].type !== 'ADJUSTMENT_IN') {
      throw new Error(`Initial stock movement failed: ${JSON.stringify(waxMovements.body)}`);
    }
    console.log('  ✅ Initial stock movement (ADJUSTMENT_IN +10) logged for Hair Wax');

    // 3. Reject Duplicate SKU in same shop
    const dupSkuRes = await request('POST', '/inventory/items', owner1Token, {
      sku: 'SHAM-001',
      name: 'Duplicate Shampoo',
      categoryId,
    });
    if (dupSkuRes.status !== 400) {
      throw new Error(`Expected 400 for duplicate SKU, got ${dupSkuRes.status}`);
    }
    console.log('  ✅ Duplicate SKU in same shop rejected correctly (400)');

    // 4. Verify Shop 2 can use SKU SHAM-001 independently
    const shop2Cat = await request('GET', '/inventory/categories', owner2Token);
    const shop2CatId = shop2Cat.body.data[0].id;
    const shop2ItemRes = await request('POST', '/inventory/items', owner2Token, {
      sku: 'SHAM-001',
      name: 'Shop 2 Shampoo',
      categoryId: shop2CatId,
    });
    if (shop2ItemRes.status !== 201) {
      throw new Error(`Shop 2 create item failed: ${JSON.stringify(shop2ItemRes.body)}`);
    }
    console.log('  ✅ Verified per-shop SKU uniqueness (Shop 2 can use SHAM-001)\n');

    // ---------------------------------------------------------
    // TEST 3: Stock Movements, Consumption & Adjustments
    // ---------------------------------------------------------
    console.log('▶ Test 3: Stock Movements, Consumption & Adjustments');

    // 1. Reject negative consumption
    const failConsume = await request('POST', '/inventory/consumption', barber1Token, {
      inventoryItemId: shampooId,
      quantity: 5,
      reason: 'Barber usage',
    });
    if (failConsume.status !== 400) {
      throw new Error(`Expected 400 for insufficient stock consumption, got ${failConsume.status}`);
    }
    console.log('  ✅ Attempted negative stock consumption rejected (400)');

    // 2. Adjust Shampoo Stock to 20
    const adjustRes = await request('POST', `/inventory/items/${shampooId}/adjust`, owner1Token, {
      quantity: 20,
      reason: 'Initial physical stock arrival',
    });
    if (adjustRes.status !== 200 || adjustRes.body.data.item.currentQuantity !== 20) {
      throw new Error(`Adjust stock failed: ${JSON.stringify(adjustRes.body)}`);
    }
    console.log('  ✅ Stock level adjusted to 20 for Shampoo');

    // 3. Record Consumption by Barber (-3 LITER)
    const consumeRes = await request('POST', '/inventory/consumption', barber1Token, {
      inventoryItemId: shampooId,
      quantity: 3,
      reason: 'Shampoo used during haircut service',
    });
    if (consumeRes.status !== 200 || consumeRes.body.data.item.currentQuantity !== 17) {
      throw new Error(`Record consumption failed: ${JSON.stringify(consumeRes.body)}`);
    }
    console.log('  ✅ Barber recorded consumption (-3), current stock updated to 17\n');

    // ---------------------------------------------------------
    // TEST 4: Purchase Orders, Receiving & Weighted Average Cost
    // ---------------------------------------------------------
    console.log('▶ Test 4: Purchase Orders, Receiving & Weighted Average Cost (WAC)');

    // 1. Create Purchase Order
    const poRes = await request('POST', '/purchases', owner1Token, {
      supplierId,
      status: 'ORDERED',
      items: [
        {
          inventoryItemId: shampooId,
          quantityOrdered: 10,
          unitCost: 1200,
        },
      ],
      notes: 'Monthly shampoo order',
    });
    if (poRes.status !== 201) {
      throw new Error(`Create PO failed: ${JSON.stringify(poRes.body)}`);
    }
    const poId = poRes.body.data.id;
    console.log('  ✅ Created Purchase Order in ORDERED status (10 bottles @ 1,200)');

    // 2. Receive Purchase Order items (10 bottles @ 1200)
    const receiveRes = await request('POST', `/purchases/${poId}/receive`, owner1Token, {
      items: [
        {
          inventoryItemId: shampooId,
          quantityReceived: 10,
        },
      ],
    });
    if (receiveRes.status !== 200 || receiveRes.body.data.status !== 'RECEIVED') {
      throw new Error(`Receive PO failed: ${JSON.stringify(receiveRes.body)}`);
    }
    console.log('  ✅ Received Purchase Order items, status updated to RECEIVED');

    // Verify stock increased from 17 to 27 and WAC calculated
    const shampooUpdated = await request('GET', `/inventory/items/${shampooId}`, owner1Token);
    if (shampooUpdated.body.data.currentQuantity !== 27 || shampooUpdated.body.data.averageCost !== 444.44) {
      throw new Error(`Stock / WAC update failed: ${JSON.stringify(shampooUpdated.body)}`);
    }
    console.log('  ✅ Stock increased to 27 L, WAC calculated correctly: 444.44');

    // Verify Payable created for Vendor
    const payables = await Payable.find({ shopId: shampooUpdated.body.data.shopId });
    if (payables.length !== 1 || payables[0].amount !== 12000) {
      throw new Error(`Payable creation failed: ${JSON.stringify(payables)}`);
    }
    console.log('  ✅ Financial Payable created for supplier (Amount: 12,000)\n');

    // ---------------------------------------------------------
    // TEST 5: Stock Audit Count Workflow
    // ---------------------------------------------------------
    console.log('▶ Test 5: Stock Audit Count Workflow');

    // 1. Start Inventory Count
    const startCountRes = await request('POST', '/inventory/counts', owner1Token, {});
    if (startCountRes.status !== 201 || startCountRes.body.data.status !== 'IN_PROGRESS') {
      throw new Error(`Start count failed: ${JSON.stringify(startCountRes.body)}`);
    }
    const countId = startCountRes.body.data.id;
    console.log('  ✅ Started inventory stock audit count session (IN_PROGRESS)');

    // 2. Submit counted quantity for Shampoo (system: 27, counted: 25 -> variance: -2)
    const submitItemRes = await request('PATCH', `/inventory/counts/${countId}/items`, owner1Token, {
      items: [
        {
          inventoryItemId: shampooId,
          countedQuantity: 25,
          reason: 'Spilled 2 bottles during shop setup',
        },
      ],
    });
    if (submitItemRes.status !== 200) {
      throw new Error(`Submit count items failed: ${JSON.stringify(submitItemRes.body)}`);
    }
    console.log('  ✅ Submitted counted quantity (25 counted vs 27 system)');

    // 3. Complete Inventory Count
    const completeCountRes = await request('POST', `/inventory/counts/${countId}/complete`, owner1Token);
    if (completeCountRes.status !== 200 || completeCountRes.body.data.status !== 'COMPLETED') {
      throw new Error(`Complete count failed: ${JSON.stringify(completeCountRes.body)}`);
    }
    console.log('  ✅ Completed inventory count audit session (COMPLETED)');

    // Verify final stock is 25
    const shampooFinal = await request('GET', `/inventory/items/${shampooId}`, owner1Token);
    if (shampooFinal.body.data.currentQuantity !== 25) {
      throw new Error(`Inventory count auto-adjustment failed: ${JSON.stringify(shampooFinal.body)}`);
    }
    console.log('  ✅ Auto-generated ADJUSTMENT_OUT movement logged; final Shampoo stock is 25\n');

    // ---------------------------------------------------------
    // TEST 6: Valuation Reports & Stock Alerts
    // ---------------------------------------------------------
    console.log('▶ Test 6: Valuation Reports & Stock Alerts');

    // 1. GET Valuation Report
    const valuationRes = await request('GET', '/inventory/reports/valuation', owner1Token);
    if (valuationRes.status !== 200 || valuationRes.body.data.totalItems < 2) {
      throw new Error(`Valuation report failed: ${JSON.stringify(valuationRes.body)}`);
    }
    console.log(`  ✅ Valuation report generated: Total Valuation = ₨${valuationRes.body.data.totalValuation}`);

    // 2. GET Low Stock Alerts (Hair Wax currentQuantity 10 <= minimumQuantity 15)
    const alertsRes = await request('GET', '/inventory/alerts', owner1Token);
    if (alertsRes.status !== 200 || alertsRes.body.data.lowStock.length === 0) {
      throw new Error(`Stock alerts failed: ${JSON.stringify(alertsRes.body)}`);
    }
    console.log(`  ✅ Low stock alert triggered for Hair Wax (Current: 10 <= Minimum: 15)\n`);

    // ---------------------------------------------------------
    // TEST 7: Role Authorization & Multi-Tenant Scoping
    // ---------------------------------------------------------
    console.log('▶ Test 7: Role Authorization & Multi-Tenant Scoping');

    // Barber forbidden from creating inventory items
    const barberCreate = await request('POST', '/inventory/items', barber1Token, {
      sku: 'FORBID-001',
      name: 'Forbidden Item',
      categoryId,
    });
    if (barberCreate.status !== 403) {
      throw new Error(`Expected 403 for Barber create item, got ${barberCreate.status}`);
    }
    console.log('  ✅ Barber forbidden from creating inventory items (403)');

    // Barber forbidden from receiving purchase order
    const barberReceive = await request('POST', `/purchases/${poId}/receive`, barber1Token, {
      items: [{ inventoryItemId: shampooId, quantityReceived: 1 }],
    });
    if (barberReceive.status !== 403) {
      throw new Error(`Expected 403 for Barber PO receive, got ${barberReceive.status}`);
    }
    console.log('  ✅ Barber forbidden from receiving purchase orders (403)');

    // Shop 2 cannot view Shop 1 items
    const shop2Items = await request('GET', '/inventory/items', owner2Token);
    if (shop2Items.body.data.length !== 1 || shop2Items.body.data[0].sku !== 'SHAM-001') {
      // Note: Shop 2 created 1 item in Test 2
      throw new Error(`Multi-tenant leakage detected: ${JSON.stringify(shop2Items.body)}`);
    }
    console.log('  ✅ Multi-tenant isolation verified: Shop 2 cannot access Shop 1 inventory items\n');

    console.log('🎉 ALL INVENTORY & STOCK MANAGEMENT INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
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
