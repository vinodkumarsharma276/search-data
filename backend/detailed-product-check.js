const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function detailedProductCheck() {
    try {
        console.log('🔍 Detailed Product Database Check...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('🗄️ Database name:', mongoose.connection.db.databaseName);
        console.log('🔗 Connection URI:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

        // Check all collections in the database
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📂 All collections in database:');
        collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
        });

        // Check Product collection specifically
        console.log('\n🔍 Checking Product collection...');
        const productCount = await Product.countDocuments();
        console.log(`📊 Total products: ${productCount}`);

        if (productCount > 0) {
            console.log('\n📋 Products found:');
            const products = await Product.find().limit(5);
            products.forEach((product, index) => {
                console.log(`   ${index + 1}. ID: ${product._id}`);
                console.log(`      Model: ${product.modelNumber || 'N/A'}`);
                console.log(`      Category: ${product.categoryId || 'N/A'}`);
                console.log(`      Supplier: ${product.supplierId || 'N/A'}`);
                console.log(`      Created: ${product.createdAt || 'N/A'}`);
            });
        }

        // Check for the specific product ID from logs
        const specificProductId = '688921d386b87773b58f2144';
        console.log(`\n🎯 Looking for specific product: ${specificProductId}`);
        
        try {
            const specificProduct = await Product.findById(specificProductId);
            if (specificProduct) {
                console.log('✅ Found the specific product!');
                console.log('📋 Product details:', JSON.stringify(specificProduct, null, 2));
            } else {
                console.log('❌ Specific product not found');
            }
        } catch (error) {
            console.log('⚠️ Error searching for specific product:', error.message);
        }

    } catch (error) {
        console.error('❌ Error in detailed check:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

detailedProductCheck();
