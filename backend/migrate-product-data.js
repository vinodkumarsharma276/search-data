const mongoose = require('mongoose');

/**
 * Data Quality Migration Script
 * 
 * Fixes the 5 data quality issues identified:
 * 1. Remove duplicate timestamps (created_at, updated_at)
 * 2. Remove unnecessary stored 'name' field 
 * 3. Standardize category field naming (category_id -> categoryId)
 * 4. Ensure proper soft delete flag exists
 * 5. Clean up any formattedPrice stored data
 */

async function migrateProductData() {
    console.log('🔧 Starting Product Data Quality Migration...');
    
    try {
        // Connect to MongoDB with correct database name
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB');
        
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, timestamps: true }));
        
        // Get all products to inspect and fix
        const products = await Product.find({}).lean();
        console.log(`📊 Found ${products.length} products to inspect`);
        
        let fixed = 0;
        const issues = {
            duplicateTimestamps: 0,
            unnecessaryNameField: 0,
            categoryFieldNaming: 0,
            missingSoftDelete: 0,
            storedFormattedPrice: 0
        };
        
        for (const product of products) {
            const updateData = {};
            const unsetData = {};
            let hasChanges = false;
            
            // Issue 1: Remove duplicate timestamps (created_at, updated_at)
            if (product.created_at || product.updated_at) {
                console.log(`🔧 Product ${product._id}: Removing duplicate timestamps`);
                if (product.created_at) unsetData.created_at = 1;
                if (product.updated_at) unsetData.updated_at = 1;
                issues.duplicateTimestamps++;
                hasChanges = true;
            }
            
            // Issue 2: Remove unnecessary stored 'name' field (should be derived)
            if (product.name) {
                console.log(`🔧 Product ${product._id}: Removing stored name field (will be derived)`);
                unsetData.name = 1;
                issues.unnecessaryNameField++;
                hasChanges = true;
            }
            
            // Issue 3: Standardize category field naming
            if (product.category_id && !product.categoryId) {
                console.log(`🔧 Product ${product._id}: Moving category_id to categoryId`);
                updateData.categoryId = product.category_id;
                unsetData.category_id = 1;
                issues.categoryFieldNaming++;
                hasChanges = true;
            }
            
            // Issue 4: Ensure proper soft delete flag exists
            if (product.deleted === undefined || product.deleted === null) {
                console.log(`🔧 Product ${product._id}: Adding missing soft delete flag`);
                updateData.deleted = false;
                issues.missingSoftDelete++;
                hasChanges = true;
            }
            
            // Issue 5: Remove any stored formattedPrice (should be virtual)
            if (product.formattedPrice) {
                console.log(`🔧 Product ${product._id}: Removing stored formattedPrice (should be virtual)`);
                unsetData.formattedPrice = 1;
                issues.storedFormattedPrice++;
                hasChanges = true;
            }
            
            // Apply changes if needed
            if (hasChanges) {
                const updateQuery = {};
                if (Object.keys(updateData).length > 0) {
                    updateQuery.$set = updateData;
                }
                if (Object.keys(unsetData).length > 0) {
                    updateQuery.$unset = unsetData;
                }
                
                await Product.updateOne({ _id: product._id }, updateQuery);
                fixed++;
                
                console.log(`✅ Fixed product ${product._id}:`, {
                    set: Object.keys(updateData),
                    unset: Object.keys(unsetData)
                });
            }
        }
        
        console.log('\n🎉 Migration completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Total products processed: ${products.length}`);
        console.log(`   - Products fixed: ${fixed}`);
        console.log(`   - Issues found and fixed:`);
        console.log(`     • Duplicate timestamps: ${issues.duplicateTimestamps}`);
        console.log(`     • Unnecessary name fields: ${issues.unnecessaryNameField}`);
        console.log(`     • Category field naming: ${issues.categoryFieldNaming}`);
        console.log(`     • Missing soft delete flags: ${issues.missingSoftDelete}`);
        console.log(`     • Stored formattedPrice: ${issues.storedFormattedPrice}`);
        
        // Verify the cleanup
        console.log('\n🔍 Verification check...');
        const verification = await Product.aggregate([
            {
                $project: {
                    hasCreatedAt: { $type: "$created_at" },
                    hasUpdatedAt: { $type: "$updated_at" },
                    hasName: { $type: "$name" },
                    hasCategoryId: { $type: "$category_id" },
                    hasFormattedPrice: { $type: "$formattedPrice" },
                    hasDeletedFlag: { $type: "$deleted" }
                }
            },
            {
                $group: {
                    _id: null,
                    duplicateCreatedAt: { $sum: { $cond: [{ $ne: ["$hasCreatedAt", "missing"] }, 1, 0] } },
                    duplicateUpdatedAt: { $sum: { $cond: [{ $ne: ["$hasUpdatedAt", "missing"] }, 1, 0] } },
                    storedNames: { $sum: { $cond: [{ $ne: ["$hasName", "missing"] }, 1, 0] } },
                    oldCategoryIds: { $sum: { $cond: [{ $ne: ["$hasCategoryId", "missing"] }, 1, 0] } },
                    storedFormattedPrices: { $sum: { $cond: [{ $ne: ["$hasFormattedPrice", "missing"] }, 1, 0] } },
                    missingDeletedFlags: { $sum: { $cond: [{ $eq: ["$hasDeletedFlag", "missing"] }, 1, 0] } }
                }
            }
        ]);
        
        if (verification.length > 0) {
            const result = verification[0];
            console.log('✅ Verification results:');
            console.log(`   - Remaining duplicate created_at fields: ${result.duplicateCreatedAt}`);
            console.log(`   - Remaining duplicate updated_at fields: ${result.duplicateUpdatedAt}`);
            console.log(`   - Remaining stored name fields: ${result.storedNames}`);
            console.log(`   - Remaining old category_id fields: ${result.oldCategoryIds}`);
            console.log(`   - Remaining stored formattedPrice fields: ${result.storedFormattedPrices}`);
            console.log(`   - Products missing deleted flag: ${result.missingDeletedFlags}`);
            
            const allClean = Object.values(result).every(val => val === 0 || val === null);
            if (allClean) {
                console.log('🎉 All data quality issues have been resolved!');
            } else {
                console.log('⚠️ Some issues may still exist. Review the numbers above.');
            }
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        console.log('🔚 Closing database connection...');
        await mongoose.connection.close();
    }
}

// Run the migration
if (require.main === module) {
    migrateProductData()
        .then(() => {
            console.log('✅ Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateProductData };
