const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
        
        // Create indexes after connection
        await createIndexes();
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

const createIndexes = async () => {
    try {
        console.log('🔍 Creating database indexes...');
        
        // Customer indexes
        await mongoose.connection.db.collection('customers').createIndex({ phone: 1 });
        await mongoose.connection.db.collection('customers').createIndex({ name: "text" });
        
        // Inventory indexes
        await mongoose.connection.db.collection('inventories').createIndex({ serialNumber: 1 }, { unique: true });
        await mongoose.connection.db.collection('inventories').createIndex({ status: 1 });
        await mongoose.connection.db.collection('inventories').createIndex({ productId: 1 });
        
        // Sales indexes
        await mongoose.connection.db.collection('sales').createIndex({ customerId: 1 });
        await mongoose.connection.db.collection('sales').createIndex({ createdAt: -1 });
        await mongoose.connection.db.collection('sales').createIndex({ saleNumber: 1 }, { unique: true });
        
        // Installments indexes
        await mongoose.connection.db.collection('installments').createIndex({ saleId: 1 });
        await mongoose.connection.db.collection('installments').createIndex({ dueDate: 1 });
        await mongoose.connection.db.collection('installments').createIndex({ status: 1 });
        
        console.log('✅ Database indexes created successfully');
    } catch (error) {
        console.log('⚠️ Some indexes may already exist:', error.message);
    }
};

module.exports = connectDB;
