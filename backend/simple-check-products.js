const mongoose = require('mongoose');
const Product = require('./models/Product');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/vinod-electronics', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkProducts() {
    try {
        console.log('🔍 Checking Product collection...');
        
        // Get all products without population
        const products = await Product.find({});
        console.log(`📊 Total products in collection: ${products.length}`);
        
        if (products.length > 0) {
            console.log('\n📦 Products found:');
            products.forEach((product, index) => {
                console.log(`\n--- Product ${index + 1} ---`);
                console.log('ID:', product._id);
                console.log('Brand:', product.brand);
                console.log('Model Number:', product.model_number);
                console.log('Serial Number:', product.serial_number);
                console.log('Supplier ID:', product.supplierId);
                
                // Show dynamic fields (categoryFormData)
                if (product.categoryFormData) {
                    console.log('Category Form Data:', JSON.stringify(product.categoryFormData, null, 2));
                }
                
                // Show any other fields
                const excludeFields = ['_id', 'brand', 'model_number', 'serial_number', 'category_path', 'supplierId', 'price', 'condition', 'hsnCode', 'categoryFormData', '__v', 'createdAt', 'updatedAt'];
                Object.keys(product.toObject()).forEach(key => {
                    if (!excludeFields.includes(key)) {
                        console.log(`${key}:`, product[key]);
                    }
                });
            });
        } else {
            console.log('✅ No products found in the database');
        }
        
    } catch (error) {
        console.error('❌ Error checking products:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

checkProducts();
