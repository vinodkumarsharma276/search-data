const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function updateSamsungProduct() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const product = await Product.findOne({ brand: 'Samsung', model_number: 'Galaxy S24' });
        
        if (product) {
            product.mrp = 119999;
            product.dealer_price = 89999;
            product.igst = 18;
            product.cgst = 9;
            product.currentStock = 5;
            product.condition = 'New';
            
            await product.save();
            
            console.log('✅ Updated Samsung product with:');
            console.log('- MRP: ₹' + product.mrp.toLocaleString('en-IN'));
            console.log('- Dealer Price: ₹' + product.dealer_price.toLocaleString('en-IN'));
            console.log('- Stock:', product.currentStock);
            console.log('- Condition:', product.condition);
        } else {
            console.log('❌ Samsung product not found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

updateSamsungProduct();
