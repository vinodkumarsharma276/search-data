const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vinod-electronics', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}); // ...existing code...

async function checkProducts() {
    try {
        console.log('🔍 Checking Product collection...\n');
        
        // Count total products
        const totalCount = await Product.countDocuments();
        console.log(`📊 Total products in collection: ${totalCount}\n`);
        
        if (totalCount === 0) {
            console.log('❌ No products found in the collection.');
            console.log('💡 You may need to seed some data first.');
            return;
        }
        
        // Get all products with basic info
        const products = await Product.find({})
            .populate('selected_category_id', 'name')
            .populate('supplierId', 'name')
            .limit(10) // Limit to first 10 for readability
            .sort({ createdAt: -1 });
        
        console.log('📦 Recent Products:');
        console.log('='.repeat(80));
        
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.getDisplayName()}`);
            console.log(`   Brand: ${product.brand}`);
            console.log(`   Price: ₹${product.price}`);
            console.log(`   Category: ${product.getCategoryPathString()}`);
            console.log(`   Serial: ${product.serialNumber || 'Not assigned'}`);
            console.log(`   Supplier: ${product.supplierId?.name || 'Unknown'}`);
            console.log(`   Stock: ${product.currentStock}`);
            console.log(`   Created: ${product.createdAt.toLocaleDateString()}`);
            
            // Show some dynamic attributes
            if (Object.keys(product.common_attributes).length > 0) {
                console.log(`   Common Attrs: ${JSON.stringify(product.common_attributes, null, 2)}`);
            }
            if (Object.keys(product.specific_attributes).length > 0) {
                console.log(`   Specific Attrs: ${JSON.stringify(product.specific_attributes, null, 2)}`);
            }
            console.log('-'.repeat(80));
        });
        
        if (totalCount > 10) {
            console.log(`\n... and ${totalCount - 10} more products`);
        }
        
    } catch (error) {
        console.error('❌ Error checking products:', error.message);
    } finally {
        mongoose.disconnect();
    }
}

checkProducts();
