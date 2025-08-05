const mongoose = require('mongoose');

/**
 * Final Category Field Cleanup Script
 * 
 * This handles the specific case where both category_id and categoryId exist
 * and removes the legacy category_id field to standardize on categoryId
 */

async function cleanupCategoryFields() {
    console.log('🔧 Starting Category Field Cleanup...');
    
    try {
        // Connect to MongoDB with correct database name
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB');
        
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, timestamps: true }));
        
        // Find products that have both category_id and categoryId
        const productsWithBothFields = await Product.find({
            category_id: { $exists: true },
            categoryId: { $exists: true }
        }).lean();
        
        console.log(`📊 Found ${productsWithBothFields.length} products with both category_id and categoryId`);
        
        let cleaned = 0;
        
        for (const product of productsWithBothFields) {
            // Remove the legacy category_id field since we're standardizing on categoryId
            await Product.updateOne(
                { _id: product._id },
                { $unset: { category_id: 1 } }
            );
            
            console.log(`✅ Removed legacy category_id from product ${product._id}`);
            cleaned++;
        }
        
        console.log('\n🎉 Category field cleanup completed!');
        console.log(`📊 Summary:`);
        console.log(`   - Products cleaned: ${cleaned}`);
        
        // Verification
        const remainingLegacyFields = await Product.countDocuments({ category_id: { $exists: true } });
        console.log(`✅ Verification: ${remainingLegacyFields} products still have legacy category_id field`);
        
        if (remainingLegacyFields === 0) {
            console.log('🎉 All category fields have been standardized to categoryId!');
        } else {
            console.log('⚠️ Some products still have legacy category_id fields');
        }
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    } finally {
        console.log('\n🔚 Closing database connection...');
        await mongoose.connection.close();
    }
}

// Run the cleanup
if (require.main === module) {
    cleanupCategoryFields()
        .then(() => {
            console.log('✅ Category cleanup completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Category cleanup failed:', error);
            process.exit(1);
        });
}

module.exports = { cleanupCategoryFields };
