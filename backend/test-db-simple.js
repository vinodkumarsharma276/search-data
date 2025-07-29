const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/ve_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testConnection() {
    try {
        console.log('🔌 Testing MongoDB connection...');
        
        // Test basic connection
        const connection = mongoose.connection;
        console.log('Connection state:', connection.readyState); // 1 = connected
        
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
        
        console.log('✅ Database connection test completed');
        
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

testConnection();
