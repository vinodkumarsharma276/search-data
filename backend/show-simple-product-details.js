const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function showProductDetails() {
    try {
        console.log('🔍 Fetching detailed product information...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB\n');

        // Get all products
        const products = await Product.find({}).sort({ createdAt: -1 });

        console.log(`📊 Total products found: ${products.length}\n`);

        if (products.length === 0) {
            console.log('❌ No products found in the database.');
            return;
        }

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            console.log(`🏷️ Product ${i + 1}:`);
            console.log('=' .repeat(50));
            console.log(`📝 ID: ${product._id}`);
            console.log(`🏷️ Brand: ${product.brand || 'N/A'}`);
            console.log(`💰 Price: ₹${product.price || 'N/A'}`);
            console.log(`📦 Model Number: ${product.modelNumber || 'N/A'}`);
            console.log(`🏪 Supplier ID: ${product.supplierId || 'N/A'}`);
            console.log(`🔢 Serial Number: ${product.serialNumber || 'N/A'}`);
            console.log(`📅 Created: ${product.createdAt ? product.createdAt.toLocaleString() : 'N/A'}`);
            console.log(`✅ Active: ${product.isActive ? 'Yes' : 'No'}`);
            console.log(`🛡️ Warranty: ${product.warrantyMonths || 'N/A'} months`);
            console.log(`📊 Current Stock: ${product.currentStock || 0}`);
            
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
            
            // Show all fields as JSON for complete details
            console.log(`\n📋 Complete Product Data:`);
            console.log(JSON.stringify(product.toObject(), null, 2));
            
            console.log('\n' + '─'.repeat(50) + '\n');
        }

    } catch (error) {
        console.error('❌ Error fetching product details:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

showProductDetails();
