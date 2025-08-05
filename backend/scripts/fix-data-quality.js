const mongoose = require('mongoose');
require('../config/database');
const Product = require('../models/Product');

/**
 * Data Quality Migration Script
 * 
 * Addresses the following issues:
 * 1. Remove duplicate timestamp fields (created_at, updated_at)
 * 2. Remove unnecessary stored 'name' field (use displayName virtual instead)
 * 3. Standardize category reference (category_id -> categoryId)
 * 4. Add soft delete flag (deleted: false)
 * 5. Mark existing data as legacy
 */

async function fixDataQuality() {
    try {
        console.log('🚀 Starting data quality migration...');
        
        // Get all products to process
        const products = await Product.find({}).lean();
        console.log(`📊 Found ${products.length} products to process`);
        
        let fixedCount = 0;
        let errorCount = 0;
        
        for (const product of products) {
            try {
                const updates = {};
                let needsUpdate = false;
                
                // 1. Remove duplicate timestamp fields
                if (product.created_at) {
                    updates.$unset = updates.$unset || {};
                    updates.$unset.created_at = '';
                    needsUpdate = true;
                    console.log(`  🗑️  Removing created_at from product ${product._id}`);
                }
                
                if (product.updated_at) {
                    updates.$unset = updates.$unset || {};
                    updates.$unset.updated_at = '';
                    needsUpdate = true;
                    console.log(`  🗑️  Removing updated_at from product ${product._id}`);
                }
                
                // 2. Remove stored 'name' field (use displayName virtual instead)
                if (product.name) {
                    updates.$unset = updates.$unset || {};
                    updates.$unset.name = '';
                    needsUpdate = true;
                    console.log(`  🗑️  Removing stored name field from product ${product._id}`);
                }
                
                // 3. Standardize category reference (category_id -> categoryId)
                if (product.category_id && !product.categoryId) {
                    updates.$set = updates.$set || {};
                    updates.$set.categoryId = product.category_id;
                    updates.$unset = updates.$unset || {};
                    updates.$unset.category_id = '';
                    needsUpdate = true;
                    console.log(`  🔄 Standardizing category reference for product ${product._id}`);
                }
                
                // 4. Add soft delete flag if missing
                if (product.deleted === undefined) {
                    updates.$set = updates.$set || {};
                    updates.$set.deleted = false;
                    needsUpdate = true;
                    console.log(`  ➕ Adding deleted flag to product ${product._id}`);
                }
                
                // 5. Mark as legacy data
                if (!product.isLegacyData) {
                    updates.$set = updates.$set || {};
                    updates.$set.isLegacyData = true;
                    needsUpdate = true;
                    console.log(`  🏷️  Marking product ${product._id} as legacy data`);
                }
                
                // Apply updates if needed
                if (needsUpdate) {
                    await Product.updateOne({ _id: product._id }, updates);
                    fixedCount++;
                    console.log(`  ✅ Fixed product ${product._id}`);
                } else {
                    console.log(`  ⏭️  Product ${product._id} already clean`);
                }
                
            } catch (error) {
                console.error(`  ❌ Error processing product ${product._id}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('\n📊 Migration Summary:');
        console.log(`  Total products: ${products.length}`);
        console.log(`  Fixed: ${fixedCount}`);
        console.log(`  Errors: ${errorCount}`);
        console.log(`  Skipped (already clean): ${products.length - fixedCount - errorCount}`);
        
        // Verify the cleanup
        console.log('\n🔍 Verification - checking for remaining issues...');
        
        const productsWithDuplicateTimestamps = await Product.find({
            $or: [
                { created_at: { $exists: true } },
                { updated_at: { $exists: true } }
            ]
        }).countDocuments();
        
        const productsWithStoredName = await Product.find({
            name: { $exists: true }
        }).countDocuments();
        
        const productsWithOldCategoryRef = await Product.find({
            category_id: { $exists: true }
        }).countDocuments();
        
        const productsWithoutDeleteFlag = await Product.find({
            deleted: { $exists: false }
        }).countDocuments();
        
        console.log(`  Products with duplicate timestamps: ${productsWithDuplicateTimestamps}`);
        console.log(`  Products with stored name field: ${productsWithStoredName}`);
        console.log(`  Products with old category_id field: ${productsWithOldCategoryRef}`);
        console.log(`  Products without deleted flag: ${productsWithoutDeleteFlag}`);
        
        if (productsWithDuplicateTimestamps === 0 && 
            productsWithStoredName === 0 && 
            productsWithOldCategoryRef === 0 && 
            productsWithoutDeleteFlag === 0) {
            console.log('\n🎉 All data quality issues have been resolved!');
        } else {
            console.log('\n⚠️  Some issues remain - you may need to run the script again');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration
console.log('📋 Product Data Quality Migration Script');
console.log('This script will:');
console.log('1. Remove duplicate timestamp fields (created_at, updated_at)');
console.log('2. Remove unnecessary stored name field');
console.log('3. Standardize category reference (category_id -> categoryId)');
console.log('4. Add soft delete flag (deleted: false)');
console.log('5. Mark existing data as legacy');
console.log('');

setTimeout(fixDataQuality, 1000);
