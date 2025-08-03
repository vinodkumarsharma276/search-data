const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');
const Category = require('./models/Category');

async function createTestProduct() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📊 Connected to MongoDB');

        // Find the Mobile category
        const mobileCategory = await Category.findOne({ name: 'Mobile' });
        console.log('📋 Mobile category:', mobileCategory);

        if (!mobileCategory) {
            console.log('❌ Mobile category not found');
            return;
        }

        // Create a test product with proper category ID
        const testProduct = new Product({
            supplierId: '688268ec90258768497829ed', // Ganpati Trader
            brand: 'Samsung',
            model_number: 'Galaxy S24',
            serial_number: 'SMS24001',
            name: 'Samsung Galaxy S24',
            category: mobileCategory._id,
            categoryId: mobileCategory._id,
            price: 999.99,
            status: 'active',
            description: 'Latest Samsung Galaxy smartphone'
        });

        const savedProduct = await testProduct.save();
        console.log('✅ Test product created:', {
            id: savedProduct._id,
            brand: savedProduct.brand,
            model: savedProduct.model_number,
            category: savedProduct.category,
            categoryId: savedProduct.categoryId
        });

        console.log('🔍 Verifying saved product...');
        const verifyProduct = await Product.findById(savedProduct._id);
        console.log('Verified product:', {
            id: verifyProduct._id,
            brand: verifyProduct.brand,
            model: verifyProduct.model_number,
            category: verifyProduct.category,
            categoryId: verifyProduct.categoryId
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📊 Disconnected from MongoDB');
    }
}

createTestProduct();
