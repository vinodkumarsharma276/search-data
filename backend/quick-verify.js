const mongoose = require('mongoose');
const Product = require('./models/Product');

async function quickCheck() {
    try {
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB');
        
        const count = await Product.countDocuments();
        console.log(`📊 Total products: ${count}`);
        
        const product = await Product.findOne();
        if (product) {
            console.log('\n📋 Sample product structure:');
            console.log('Name:', product.name);
            console.log('Brand (root):', product.brand);
            console.log('Model (root):', product.model_number);
            console.log('Category ID:', product.categoryId);
            console.log('Dynamic fields:', Object.keys(product.dynamic_fields || {}));
            
            // Test search
            const searchResult = await Product.find({
                $or: [
                    { name: { $regex: 'samsung', $options: 'i' } },
                    { brand: { $regex: 'samsung', $options: 'i' } }
                ]
            });
            console.log('\n🔍 Samsung search results:', searchResult.length);
        }
        
        await mongoose.disconnect();
        console.log('✅ Check complete');
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

quickCheck();
