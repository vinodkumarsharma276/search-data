#!/usr/bin/env node
/**
 * Backfill script to ensure every Product document has a `deleted` field.
 * - Finds documents where `deleted` does not exist and sets it to false.
 * - Reports counts before and after.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Product = require('../models/Product');

(async () => {
  console.log('🔧 Starting backfill: add missing `deleted: false` to products without the field');
  try {
    await connectDB();

    const missingCount = await Product.countDocuments({ deleted: { $exists: false } });
    console.log(`📊 Products missing deleted field: ${missingCount}`);

    if (missingCount === 0) {
      console.log('✅ All products already have `deleted` field. Nothing to do.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const result = await Product.updateMany(
      { deleted: { $exists: false } },
      { $set: { deleted: false } }
    );

    console.log('🛠 Update result:', result.modifiedCount !== undefined ? result.modifiedCount : result.nModified);

    const verifyMissing = await Product.countDocuments({ deleted: { $exists: false } });
    console.log(`🔍 Remaining without deleted field (should be 0): ${verifyMissing}`);

    if (verifyMissing === 0) {
      console.log('✅ Backfill complete. All products now have a `deleted` field.');
    } else {
      console.log('⚠️ Some documents still missing `deleted` field. Investigate manually.');
    }
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
})();
