const mongoose = require('mongoose');
const Customer = require('./models/Customer');

async function checkCustomers() {
    try {
        // Connect to MongoDB - adjust connection string if needed
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/search-data';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        
        // Count total customers
        const totalCustomers = await Customer.countDocuments();
        console.log('👥 Total customers in collection:', totalCustomers);
        
        if (totalCustomers > 0) {
            // Show first 5 customers
            const customers = await Customer.find({})
                .limit(5)
                .select('name email phone address createdAt')
                .sort({ createdAt: -1 });
            
            console.log('\n📋 Recent customers:');
            customers.forEach((customer, index) => {
                console.log(`${index + 1}. Name: ${customer.name}`);
                console.log(`   Email: ${customer.email || 'No email'}`);
                console.log(`   Phone: ${customer.phone || 'No phone'}`);
                console.log(`   Created: ${customer.createdAt}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ No customers found in the collection');
            console.log('💡 You may need to create some customers first before adding sales');
        }
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        
    } catch (error) {
        console.error('❌ Error checking customers:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkCustomers();
