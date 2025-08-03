const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vinod-electronics', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testProductSearch() {
    try {
        console.log('🔍 Testing product search functionality...\n');
        
        // First, let's see what products we have
        const allProducts = await Product.find({});
        console.log(`📊 Total products in database: ${allProducts.length}\n`);
        
        if (allProducts.length > 0) {
            console.log('📋 Available products:');
            allProducts.forEach((product, index) => {
                console.log(`${index + 1}. Product ID: ${product._id}`);
                console.log(`   Brand: ${product.brand || 'N/A'}`);
                console.log(`   Model: ${product.model_number || 'N/A'}`);
                console.log(`   Serial: ${product.serial_number || 'N/A'}`);
                console.log(`   Name: ${product.name || 'N/A'}`);
                console.log('   ---');
            });
            
            // Now test different search queries
            const testQueries = ['vivo', 'y70', 'vi873r', 'android'];
            
            for (const searchQuery of testQueries) {
                console.log(`\n🔍 Testing search for: "${searchQuery}"`);
                
                const searchResults = await Product.find({
                    $or: [
                        { model_number: { $regex: searchQuery, $options: 'i' } },
                        { modelNumber: { $regex: searchQuery, $options: 'i' } },
                        { serial_number: { $regex: searchQuery, $options: 'i' } },
                        { serialNumber: { $regex: searchQuery, $options: 'i' } },
                        { brand: { $regex: searchQuery, $options: 'i' } },
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { product_name: { $regex: searchQuery, $options: 'i' } }
                    ]
                });
                
                console.log(`   Found ${searchResults.length} results`);
                searchResults.forEach((product, index) => {
                    console.log(`   ${index + 1}. ${product.brand} ${product.model_number} (${product.serial_number})`);
                });
            }
            
        } else {
            console.log('❌ No products found in database');
        }
        
    } catch (error) {
        console.error('❌ Error testing search:', error);
    } finally {
        mongoose.connection.close();
    }
}

testProductSearch();
