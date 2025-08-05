const mongoose = require('mongoose');

/**
 * Simple Data Quality Check Script
 * Shows current state of data quality issues without making changes
 */

async function checkDataQuality() {
    console.log('🔍 Checking Product Data Quality...');
    
    try {
        // Connect to MongoDB with correct database name
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
        
        const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, timestamps: true }));
        
        // Get a sample product to inspect
        const sampleProduct = await Product.findOne().lean();
        
        if (!sampleProduct) {
            console.log('❌ No products found in database');
            return;
        }
        
        console.log('\n📊 Sample Product Structure:');
        console.log('Fields found:', Object.keys(sampleProduct));
        
        // Check for specific issues
        const issues = {
            duplicateTimestamps: 0,
            unnecessaryNameField: 0,
            categoryFieldNaming: 0,
            missingSoftDelete: 0,
            storedFormattedPrice: 0
        };
        
        console.log('\n🔍 Data Quality Issues Found:');
        
        if (sampleProduct.created_at || sampleProduct.updated_at) {
            console.log('⚠️ Issue 1: Duplicate timestamps found');
            console.log('   - has created_at:', !!sampleProduct.created_at);
            console.log('   - has updated_at:', !!sampleProduct.updated_at);
            console.log('   - has createdAt:', !!sampleProduct.createdAt);
            console.log('   - has updatedAt:', !!sampleProduct.updatedAt);
        }
        
        if (sampleProduct.name) {
            console.log('⚠️ Issue 2: Unnecessary stored name field found');
            console.log('   - stored name:', sampleProduct.name);
        }
        
        if (sampleProduct.category_id && sampleProduct.categoryId) {
            console.log('⚠️ Issue 3: Both category_id and categoryId found');
            console.log('   - category_id:', sampleProduct.category_id);
            console.log('   - categoryId:', sampleProduct.categoryId);
        } else if (sampleProduct.category_id && !sampleProduct.categoryId) {
            console.log('⚠️ Issue 3: Using old category_id field');
            console.log('   - category_id:', sampleProduct.category_id);
        }
        
        if (sampleProduct.deleted === undefined) {
            console.log('⚠️ Issue 4: Missing soft delete flag');
        } else {
            console.log('✅ Issue 4: Soft delete flag exists:', sampleProduct.deleted);
        }
        
        if (sampleProduct.formattedPrice) {
            console.log('⚠️ Issue 5: Stored formattedPrice found');
            console.log('   - formattedPrice:', sampleProduct.formattedPrice);
        }
        
        console.log('\n📋 Complete Sample Product Data:');
        console.log(JSON.stringify(sampleProduct, null, 2));
        
    } catch (error) {
        console.error('❌ Check failed:', error);
        throw error;
    } finally {
        console.log('\n🔚 Closing database connection...');
        await mongoose.connection.close();
    }
}

// Run the check
if (require.main === module) {
    checkDataQuality()
        .then(() => {
            console.log('✅ Check completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Check failed:', error);
            process.exit(1);
        });
}
