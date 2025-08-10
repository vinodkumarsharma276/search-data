#!/usr/bin/env node
/**
 * Backfill script to ensure every Product document has a `sold` field.
 * - Finds documents where `sold` does not exist and sets it to false.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Product = require('../models/Product');

(async () => {
  console.log('🔧 Starting backfill: add missing `sold: false` to products without the field');
  try {
    await connectDB();
    const missingCount = await Product.countDocuments({ sold: { $exists: false } });
    console.log(`📊 Products missing sold field: ${missingCount}`);
    if (missingCount === 0) {
      console.log('✅ All products already have `sold` field. Nothing to do.');
      await mongoose.connection.close();
      process.exit(0);
    }
    const result = await Product.updateMany(
      { sold: { $exists: false } },
      { $set: { sold: false } }
    );
    console.log('🛠 Update result modifiedCount:', result.modifiedCount ?? result.nModified);
    const verifyMissing = await Product.countDocuments({ sold: { $exists: false } });
    console.log(`🔍 Remaining without sold field (should be 0): ${verifyMissing}`);
    console.log('✅ Backfill complete.');
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
})();
