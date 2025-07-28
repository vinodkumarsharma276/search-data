const mongoose = require('mongoose');

async function showLatestProduct() {
    try {
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        const db = mongoose.connection.db;
        const collection = db.collection('products');
        
        // Get the latest product
        const latestProduct = await collection.findOne({}, { sort: { createdAt: -1 } });
        
        if (latestProduct) {
            console.log('🆕 Latest Product in Database:');
            console.log('=' .repeat(50));
            console.log(JSON.stringify(latestProduct, null, 2));
            console.log('=' .repeat(50));
            
            // Show field count
            const fieldCount = Object.keys(latestProduct).length;
            console.log(`📊 Total fields stored: ${fieldCount}`);
            
            // Show field types
            console.log('\n📋 Field breakdown:');
            Object.entries(latestProduct).forEach(([key, value]) => {
                const type = Array.isArray(value) ? 'array' : typeof value;
                console.log(`  ${key}: ${type} = ${JSON.stringify(value)}`);
            });
            
        } else {
            console.log('❌ No products found in database');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

showLatestProduct();
