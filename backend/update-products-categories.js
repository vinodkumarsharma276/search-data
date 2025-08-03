const mongoose = require('mongoose');
const Product = require('./models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vinod-electronics', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function updateProductsWithCategories() {
    try {
        console.log('🔄 Updating existing products with category IDs...\n');
        
        // Android Phones category ID (for mobile products)
        const androidCategoryId = '6885c70a831541cbf9fdc9e9';
        
        // Update the Vivo product
        const vivoProduct = await Product.findOne({ brand: 'Vivo' });
        if (vivoProduct) {
            vivoProduct.categoryId = androidCategoryId;
            await vivoProduct.save();
            console.log('✅ Updated Vivo product with Android category');
        }
        
        // Update the LG product - assuming it might be a laptop or different category
        const lgProduct = await Product.findOne({ brand: 'LG' });
        if (lgProduct) {
            // For now, also assign to Android category for testing
            lgProduct.categoryId = androidCategoryId;
            await lgProduct.save();
            console.log('✅ Updated LG product with Android category');
        }
        
        // Verify the updates
        console.log('\n📋 Verifying updates:');
        const allProducts = await Product.find({});
        allProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.brand} ${product.model_number}`);
            console.log(`   Category ID: ${product.categoryId}`);
            console.log(`   Serial: ${product.serial_number}`);
            console.log('   ---');
        });
        
    } catch (error) {
        console.error('❌ Error updating products:', error);
    } finally {
        mongoose.connection.close();
    }
}

updateProductsWithCategories();
