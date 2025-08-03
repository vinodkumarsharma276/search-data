const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function testCategorySearch() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔍 Testing category-based product search...');

        // Test search with Mobile category ID
        const mobileCategory = '68894012aa8db476fee173b0';
        
        console.log('\n📋 Searching for products in Mobile category...');
        const mobileProducts = await Product.find({
            $or: [
                { category: mobileCategory },
                { categoryId: mobileCategory },
                { category: new mongoose.Types.ObjectId(mobileCategory) },
                { categoryId: new mongoose.Types.ObjectId(mobileCategory) }
            ]
        }).lean();
        
        console.log(`Found ${mobileProducts.length} products in Mobile category:`);
        mobileProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.brand || 'No Brand'} ${product.model_number || product.model || 'No Model'}`);
            console.log(`   Category: ${product.category || product.categoryId || 'No Category'}`);
            console.log(`   Serial: ${product.serial_number || 'No Serial'}`);
            console.log('   ---');
        });

        console.log('\n🔍 Testing combined search (Mobile + "Samsung")...');
        const combinedSearch = await Product.find({
            $and: [
                {
                    $or: [
                        { category: mobileCategory },
                        { categoryId: mobileCategory },
                        { category: new mongoose.Types.ObjectId(mobileCategory) },
                        { categoryId: new mongoose.Types.ObjectId(mobileCategory) }
                    ]
                },
                {
                    $or: [
                        { brand: { $regex: 'Samsung', $options: 'i' } },
                        { model_number: { $regex: 'Samsung', $options: 'i' } },
                        { model: { $regex: 'Samsung', $options: 'i' } },
                        { name: { $regex: 'Samsung', $options: 'i' } }
                    ]
                }
            ]
        }).lean();

        console.log(`Found ${combinedSearch.length} Samsung products in Mobile category:`);
        combinedSearch.forEach((product, index) => {
            console.log(`${index + 1}. ${product.brand || 'No Brand'} ${product.model_number || product.model || 'No Model'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📊 Disconnected from MongoDB');
    }
}

testCategorySearch();
