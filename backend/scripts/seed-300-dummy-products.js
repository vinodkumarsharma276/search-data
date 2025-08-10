/**
 * Seed up to 300 dummy products across ALL current leaf categories while preserving data integrity rules:
 * - dealer_price < mrp
 * - model_number present (6 char upper alphanumeric)
 * - serial_number uppercase & unique (compact, no prefixes)
 * - mobile_imei: array of 1-2 valid (15 digit) numbers for phone categories
 * - Category path fields (main_category / sub_category_n) populated
 * - Category specific fields populated according to existing form_schema definitions
 *
 * Behavior:
 * - Counts existing (non-deleted) products; only creates (TARGET - existing) if existing < TARGET
 * - Even distribution across leaf categories (or as even as possible)
 * - Creates a default distributor if none exist
 *
 * Usage:
 *   node backend/scripts/seed-300-dummy-products.js             # target 300
 *   TARGET=500 node backend/scripts/seed-300-dummy-products.js  # override target
 *   CLEAR=1 node backend/scripts/seed-300-dummy-products.js     # (optional) clear existing products first
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Distributor = require('../models/Distributor');

const TARGET = parseInt(process.env.TARGET || process.env.SEED_TARGET || '300', 10);
const CLEAR = process.env.CLEAR === '1' || process.argv.includes('--clear');

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

// Compact uppercase serial (aim 12-16 chars) - ensures uniqueness with a Set
function generateSerial(counter) {
  return (
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase() +
    counter.toString(36).toUpperCase()
  );
}

// Random model_number (6 uppercase alphanumeric)
function generateModelNumber() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Generate pseudo IMEI (15 digits) with Luhn checksum
function generateIMEI() {
  let base = '';
  for (let i = 0; i < 14; i++) base += rand(0, 9); // first 14 digits
  // Luhn check digit
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(base[i], 10);
    if (i % 2 === 1) { // double every second digit (0-indexed -> odd positions)
      d = d * 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

async function ensureDistributor() {
  let dist = await Distributor.findOne({});
  if (!dist) {
    dist = await Distributor.create({ name: 'Default Distributor', gstNumber: 'GSTDEFAULT' });
    console.log('ℹ️  Created default distributor');
  }
  return dist;
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  if (CLEAR) {
    await Product.deleteMany({});
    console.log('🧹 Cleared existing products (CLEAR=1)');
  }

  const existingCount = await Product.countDocuments({ deleted: { $ne: true } });
  console.log(`ℹ️  Existing products: ${existingCount}`);
  if (existingCount >= TARGET) {
    console.log(`✅ Already have >= target (${TARGET}). Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const toCreate = TARGET - existingCount;
  console.log(`🛠  Will create ${toCreate} products to reach target ${TARGET}`);

  const leafCategories = await Category.find({ is_leaf: true }).lean();
  if (!leafCategories.length) throw new Error('No leaf categories found');
  console.log(`ℹ️  Leaf categories: ${leafCategories.map(c => c.name).join(', ')}`);

  // Build path cache
  const pathCache = {};
  for (const cat of leafCategories) {
    const full = await Category.findById(cat._id); // need instance for method
    const path = await full.getCategoryPath();
    pathCache[cat._id] = path; // ordered root -> leaf
  }

  await ensureDistributor();
  const distributors = await Distributor.find({}).limit(10).lean();

  const perCatBase = Math.floor(toCreate / leafCategories.length);
  let remainder = toCreate % leafCategories.length;

  const serialSet = new Set();
  const docs = [];
  let globalCounter = 0;

  for (const cat of leafCategories) {
    const countForCat = perCatBase + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    if (countForCat === 0) continue;

    const path = pathCache[cat._id];
    for (let i = 0; i < countForCat; i++) {
      const record = { supplierId: pick(distributors)._id, sold: false };
      path.forEach(node => { if (node.field_key) record[node.field_key] = node.name; });

      const mrp = rand(3000, 180000);
      const dealer = mrp - rand(300, Math.min(8000, Math.floor(mrp * 0.35)));
      record.mrp = mrp;
      record.dealer_price = Math.max(1, Math.min(dealer, mrp - 1));
      record.model_number = generateModelNumber();

      let serial;
      do { serial = generateSerial(globalCounter++); } while (serialSet.has(serial));
      serialSet.add(serial);
      record.serial_number = serial.toUpperCase();

      switch (cat.name) {
        case 'Laptops':
          record.brand = pick(['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Apple']);
          break;
        case 'Android Phones':
          record.brand = pick(['Samsung', 'Xiaomi', 'OnePlus', 'Realme', 'Vivo', 'Oppo']);
          record.ram_gb = pick(['4', '6', '8', '12']);
          record.storage_gb = pick(['64', '128', '256', '512']);
          record.color = pick(['black', 'white', 'blue', 'red', 'green', 'gold', 'silver']);
          record.android_version = pick(['11', '12', '13', '14', '15']);
          record.mobile_imei = Array.from({ length: rand(1, 2) }, () => generateIMEI());
          break;
        case 'iPhone':
          record.brand = 'Apple';
          record.ram_gb = pick(['4', '6', '8']);
          record.storage_gb = pick(['128', '256', '512', '1024']);
          record.color = pick(['black', 'white', 'blue', 'red', 'green', 'gold', 'silver']);
          record.ios_version = pick(['16', '17', '18']);
          record.mobile_imei = Array.from({ length: rand(1, 2) }, () => generateIMEI());
          break;
        case 'Refrigerators':
          record.brand = pick(['LG', 'Samsung', 'Whirlpool', 'Bosch']);
          record.capacity_l = rand(180, 650);
          record.door_type = pick(['single_door', 'double_door']);
          break;
        case 'Washing Machines':
          record.brand = pick(['LG', 'Samsung', 'IFB', 'Bosch']);
          record.load_type = pick(['front', 'top']);
          break;
        default:
          record.brand = 'Generic';
      }

      docs.push(record);
    }
  }

  if (!docs.length) {
    console.log('Nothing to insert.');
    await mongoose.disconnect();
    return;
  }

  console.log(`🧪 Prepared ${docs.length} new product documents.`);
  await Product.insertMany(docs, { ordered: false });
  console.log('✅ Inserted new products.');

  const badPrice = await Product.countDocuments({ $expr: { $lte: ['$mrp', '$dealer_price'] } });
  console.log(badPrice ? `⚠️  Pricing violations (dealer>=mrp): ${badPrice}` : '✅ Pricing integrity: all dealer_price < mrp');

  const dupSerials = await Product.aggregate([
    { $group: { _id: '$serial_number', c: { $sum: 1 } } },
    { $match: { c: { $gt: 1 } } },
    { $limit: 5 }
  ]);
  console.log(dupSerials.length ? `⚠️  Duplicate serials detected sample: ${dupSerials.map(d => d._id).join(', ')}` : '✅ Serial numbers unique (sample scan)');

  const phoneMissingIMEI = await Product.countDocuments({ $and: [
    { $or: [ { sub_category_2: 'Android Phones' }, { sub_category_2: 'iPhone' } ] },
    { $or: [ { mobile_imei: { $exists: false } }, { mobile_imei: { $size: 0 } } ] }
  ]});
  console.log(phoneMissingIMEI ? `⚠️  Phone products missing IMEI: ${phoneMissingIMEI}` : '✅ All phone products have IMEI(s)');

  const totalNow = await Product.countDocuments({ deleted: { $ne: true } });
  console.log(`📊 Final product count: ${totalNow}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected.');
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });
}

module.exports = main;
