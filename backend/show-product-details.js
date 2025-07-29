const mongoose = require('mongoose');
const Product = require('./models/Product');
const Distributor = require('./models/Distributor');
require('dotenv').config();

async function showProductDetails() {
    try {
        console.log('🔍 Fetching detailed product information...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB\n');

        // Get all products without populate first
        const products = await Product.find({}).sort({ createdAt: -1 });

        console.log(`📊 Total products found: ${products.length}\n`);

        if (products.length === 0) {
            console.log('❌ No products found in the database.');
            return;
        }

        products.forEach(async (product, index) => {
            console.log(`🏷️ Product ${index + 1}:`);
            console.log('=' .repeat(50));
            console.log(`📝 ID: ${product._id}`);
            console.log(`🏷️ Brand: ${product.brand || 'N/A'}`);
            console.log(`💰 Price: ₹${product.price || 'N/A'}`);
            console.log(`📦 Model Number: ${product.modelNumber || 'N/A'}`);
            console.log(`🏪 Supplier ID: ${product.supplierId || 'N/A'}`);
            
            // Try to get supplier details
            if (product.supplierId) {
                try {
                    const supplier = await Distributor.findById(product.supplierId);
                    if (supplier) {
                        console.log(`🏢 Supplier Name: ${supplier.name || supplier.companyName || 'N/A'}`);
                        console.log(`� Supplier Phone: ${supplier.phone || 'N/A'}`);
                        console.log(`� Supplier Email: ${supplier.email || 'N/A'}`);
                    }
                } catch (err) {
                    console.log(`⚠️ Could not fetch supplier details: ${err.message}`);
                }
            }
            
            // Category information
            if (product.category_path && product.category_path.length > 0) {
                console.log(`📂 Category Path: ${product.category_path.join(' → ')}`);
            }
            if (product.selected_category_id) {
                console.log(`🎯 Category ID: ${product.selected_category_id}`);
            }
            
            // Common attributes
            if (product.common_attributes && Object.keys(product.common_attributes).length > 0) {
                console.log(`📋 Common Attributes:`);
                Object.entries(product.common_attributes).forEach(([key, value]) => {
                    console.log(`   ${key}: ${value}`);
                });
            }
            
            // Specific attributes
            if (product.specific_attributes && Object.keys(product.specific_attributes).length > 0) {
                console.log(`🔧 Specific Attributes:`);
                Object.entries(product.specific_attributes).forEach(([key, value]) => {
                    console.log(`   ${key}: ${value}`);
                });
            }
            
            // Additional fields (loose schema)
            const standardFields = [
                '_id', 'brand', 'price', 'modelNumber', 'supplierId', 'serialNumber', 
                'createdAt', 'updatedAt', 'isActive', 'warrantyMonths', 'currentStock',
                'category_path', 'selected_category_id', 'common_attributes', 'specific_attributes',
                '__v', 'category_path_ids', 'lastPurchaseDate'
            ];
            
            const additionalFields = Object.keys(product.toObject()).filter(
                key => !standardFields.includes(key)
            );
            
            if (additionalFields.length > 0) {
                console.log(`🔗 Additional Fields:`);
                additionalFields.forEach(key => {
                    console.log(`   ${key}: ${product[key]}`);
                });
            }
            
            console.log('\n' + '─'.repeat(50) + '\n');
        });

    } catch (error) {
        console.error('❌ Error fetching product details:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

showProductDetails();
