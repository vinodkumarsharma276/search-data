const mongoose = require('mongoose');

async function dropOldIndexes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        const db = mongoose.connection.db;
        const collection = db.collection('products');
        
        console.log('Dropping old indexes...');
        
        // Drop the modelNumber unique index as we're not using this field anymore
        try {
            await collection.dropIndex('modelNumber_1');
            console.log('✅ Dropped modelNumber_1 index');
        } catch (error) {
            console.log('❌ Error dropping modelNumber_1 index:', error.message);
        }
        
        // Also drop the old text index that references modelNumber
        try {
            await collection.dropIndex('name_text_modelNumber_text_specifications.storage_text_specifications.color_text');
            console.log('✅ Dropped old text index');
        } catch (error) {
            console.log('❌ Error dropping text index:', error.message);
        }
        
        // Drop the old brandId_categoryId index as we're using different field names
        try {
            await collection.dropIndex('brandId_1_categoryId_1');
            console.log('✅ Dropped brandId_1_categoryId_1 index');
        } catch (error) {
            console.log('❌ Error dropping brandId_1_categoryId_1 index:', error.message);
        }
        
        console.log('\n📋 Remaining indexes:');
        const remainingIndexes = await collection.indexes();
        remainingIndexes.forEach((index, i) => {
            console.log(`${i + 1}. ${index.name}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

dropOldIndexes();
