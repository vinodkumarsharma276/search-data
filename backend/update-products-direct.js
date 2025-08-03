const mongoose = require('mongoose');
require('dotenv').config();

async function updateProductsDirectly() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        
        // Update Samsung product
        const samsungResult = await db.collection('products').updateOne(
            { brand: 'Samsung', model_number: 'Galaxy S24' },
            {
                $set: {
                    mrp: 119999,
                    dealer_price: 89999,
                    igst: 18,
                    cgst: 9,
                    currentStock: 5,
                    condition: 'New'
                }
            }
        );
        
        // Update Vivo product
        const vivoResult = await db.collection('products').updateOne(
            { brand: 'Vivo', model_number: 'Y70' },
            {
                $set: {
                    mrp: 18999,
                    dealer_price: 15999,
                    currentStock: 12,
                    condition: 'New'
                }
            }
        );
        
        // Update LG product
        const lgResult = await db.collection('products').updateOne(
            { brand: 'LG', model_number: 'LG54L' },
            {
                $set: {
                    mrp: 65999,
                    dealer_price: 58999,
                    currentStock: 3,
                    condition: 'New'
                }
            }
        );
        
        console.log('✅ Samsung update result:', samsungResult.modifiedCount);
        console.log('✅ Vivo update result:', vivoResult.modifiedCount);
        console.log('✅ LG update result:', lgResult.modifiedCount);
        
        // Verify updates
        const samsung = await db.collection('products').findOne({ brand: 'Samsung' });
        console.log('\n📱 Samsung product now has:');
        console.log('- MRP:', samsung.mrp);
        console.log('- Dealer Price:', samsung.dealer_price);
        console.log('- Stock:', samsung.currentStock);
        console.log('- Condition:', samsung.condition);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

updateProductsDirectly();
