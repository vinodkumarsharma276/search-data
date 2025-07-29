const mongoose = require('mongoose');
const Product = require('./models/Product');

async function checkRawProductData() {
    try {
        console.log('🔍 Checking RAW product data in database...');
        
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const products = await Product.find({});
        console.log(`📊 Total products: ${products.length}`);
        
        if (products.length > 0) {
            products.forEach((product, index) => {
                console.log(`\n--- RAW Product ${index + 1} Data ---`);
                console.log('Full product object keys:', Object.keys(product.toObject()));
                
                // Check specific fields
                console.log('Raw document (no virtuals):', JSON.stringify(product.toObject({ virtuals: false }), null, 2));
                
                // Check if these fields exist with different names
                const productObj = product.toObject({ virtuals: false });
                Object.keys(productObj).forEach(key => {
                    if (key.toLowerCase().includes('model') || key.toLowerCase().includes('serial')) {
                        console.log(`🔍 Found field: "${key}" = "${productObj[key]}"`);
                    }
                });
            });
        } else {
            console.log('No products found');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Connection closed');
    }
}

checkRawProductData();
