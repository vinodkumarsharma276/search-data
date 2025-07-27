const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/search-data');

async function checkAllCollections() {
    try {
        console.log('🔍 Checking all collections in the database...\n');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log('📚 Available collections:');
        console.log('='.repeat(50));
        
        for (const collection of collections) {
            const collectionName = collection.name;
            const count = await db.collection(collectionName).countDocuments();
            console.log(`📁 ${collectionName}: ${count} documents`);
            
            // Show sample document structure for products collection
            if (collectionName === 'products' && count > 0) {
                const sample = await db.collection(collectionName).findOne();
                console.log('   Sample document structure:');
                console.log(`   Keys: ${Object.keys(sample).join(', ')}`);
            }
        }
        
        console.log('\n✅ Database inspection complete!');
        
    } catch (error) {
        console.error('❌ Error checking collections:', error.message);
    } finally {
        mongoose.disconnect();
    }
}

checkAllCollections();
