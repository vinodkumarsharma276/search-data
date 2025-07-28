const mongoose = require('mongoose');

async function checkIndexes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        const db = mongoose.connection.db;
        const collection = db.collection('products');
        const indexes = await collection.indexes();
        
        console.log('Product collection indexes:');
        indexes.forEach((index, i) => {
            console.log(`${i + 1}. ${JSON.stringify(index, null, 2)}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkIndexes();
