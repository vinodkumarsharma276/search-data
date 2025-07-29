const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        
        // Wait for connection
        await mongoose.connect('mongodb://localhost:27017/ve_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        console.log('Connection state:', mongoose.connection.readyState);
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📋 Available collections:');
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
        
        // Count documents in each collection
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`📊 ${col.name}: ${count} documents`);
        }
        
        console.log('✅ Database test completed');
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed');
    }
}

testConnection();
