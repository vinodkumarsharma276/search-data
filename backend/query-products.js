const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ve-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.once('open', async () => {
    try {
        console.log('🔍 Querying Products Collection...');
        console.log('='.repeat(60));
        
        // Get total count
        const totalCount = await Product.countDocuments();
        console.log(`📊 Total products in collection: ${totalCount}`);
        console.log('');
        
        if (totalCount === 0) {
            console.log('❌ No products found in the collection.');
            console.log('💡 The database is empty - no products have been added yet.');
        } else {
            // Get all products
            const products = await Product.find({}).sort({ createdAt: -1 }).limit(20);
            
            console.log(`📦 Showing ${Math.min(products.length, 20)} most recent products:`);
            console.log('='.repeat(60));
            
            products.forEach((product, index) => {
                console.log(`\n🏷️  Product ${index + 1}:`);
                console.log(`   ID: ${product._id}`);
                console.log(`   Created: ${product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}`);
                
                // Get all fields except internal MongoDB fields
                const productObj = product.toObject();
                const filteredFields = Object.keys(productObj).filter(key => 
                    !['_id', '__v', 'createdAt', 'updatedAt'].includes(key)
                );
                
                console.log(`   Fields: ${filteredFields.length} field(s)`);
                
                // Show first 10 fields with their values
                filteredFields.slice(0, 10).forEach(key => {
                    const value = productObj[key];
                    if (value !== undefined && value !== null && value !== '') {
                        const displayValue = typeof value === 'object' 
                            ? JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
                            : String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '');
                        console.log(`   ${key}: ${displayValue}`);
                    }
                });
                
                if (filteredFields.length > 10) {
                    console.log(`   ... and ${filteredFields.length - 10} more fields`);
                }
                
                console.log('-'.repeat(40));
            });
            
            if (totalCount > 20) {
                console.log(`\n📝 Note: Showing first 20 of ${totalCount} total products`);
            }
        }
        
        console.log('\n✅ Query completed successfully');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error querying products:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
});

mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('❌ Connection timeout - MongoDB might not be running');
    process.exit(1);
}, 10000);
