const mongoose = require('mongoose');
const Distributor = require('./models/Distributor');

async function testDatabaseConnection() {
    try {
        console.log('🔍 Attempting to connect to MongoDB...');
        
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Successfully connected to MongoDB');
        console.log('🏢 Database name:', mongoose.connection.db.databaseName);
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📂 Collections in database:');
        collections.forEach(col => {
            console.log('  -', col.name);
        });
        
        // Check distributors collection
        const distributorCount = await Distributor.countDocuments();
        console.log('👥 Total distributors in database:', distributorCount);
        
        // Look for Ganpati Traders specifically
        const ganpatiTrader = await Distributor.findOne({ 
            $or: [
                { name: /Ganpati/i },
                { name: /ganpati/i }
            ]
        });
        
        if (ganpatiTrader) {
            console.log('🎉 Found Ganpati Traders distributor:');
            console.log('🆔 ID:', ganpatiTrader._id);
            console.log('📝 Name:', ganpatiTrader.name);
            console.log('🏢 Company Type:', ganpatiTrader.companyType);
            console.log('📞 Phone:', ganpatiTrader.primaryPhone);
            console.log('📧 Email:', ganpatiTrader.email);
            console.log('🏦 Bank:', ganpatiTrader.bankName);
            console.log('📅 Created:', ganpatiTrader.createdAt);
        } else {
            console.log('❌ Ganpati Traders distributor NOT found in database');
        }
        
        // Show last 5 distributors
        const recentDistributors = await Distributor.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name companyType email createdAt');
        
        console.log('📋 Last 5 distributors in database:');
        recentDistributors.forEach((dist, index) => {
            console.log(`${index + 1}. ${dist.name} (${dist.companyType}) - ${dist.email} - ${dist.createdAt}`);
        });
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
        console.error('❌ Full error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

testDatabaseConnection();
