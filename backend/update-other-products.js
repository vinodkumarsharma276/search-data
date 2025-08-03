const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function updateOtherProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Update Vivo Y70
        const vivo = await Product.findOne({ brand: 'Vivo', model_number: 'Y70' });
        if (vivo) {
            vivo.mrp = 18999;
            vivo.dealer_price = 15999;
            vivo.currentStock = 12;
            vivo.condition = 'New';
            await vivo.save();
            console.log('✅ Updated Vivo Y70');
        }
        
        // Update LG product
        const lg = await Product.findOne({ brand: 'LG', model_number: 'LG54L' });
        if (lg) {
            lg.mrp = 65999;
            lg.dealer_price = 58999;
            lg.currentStock = 3;
            lg.condition = 'New';
            await lg.save();
            console.log('✅ Updated LG LG54L');
        }
        
        console.log('✅ All products updated successfully');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

updateOtherProducts();
