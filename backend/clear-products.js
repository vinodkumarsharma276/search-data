const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Use the same URI as other scripts
async function clearProducts() {
    try {
        // Determine URI with fallback
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics';
        await mongoose.connect(uri);
        console.log('🔗 Connected to MongoDB');
        console.log('🗄️ Database name:', mongoose.connection.db.databaseName);
        console.log('🌐 Using URI:', uri);
        
        // Count current products
        const currentCount = await Product.countDocuments();
        console.log(`📊 Current products in collection: ${currentCount}`);
        
        if (currentCount === 0) {
            console.log('✅ Product collection is already empty');
            return;
        }
        
        // Clear all products
        const result = await Product.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} products from collection`);
        
        // Verify collection is empty
        const finalCount = await Product.countDocuments();
        console.log(`📊 Final products in collection: ${finalCount}`);
        
        if (finalCount === 0) {
            console.log('✅ Product collection successfully cleared!');
        } else {
            console.log('⚠️ Warning: Some products may still remain');
        }
        
    } catch (error) {
        console.error('❌ Error clearing products:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the clear operation
clearProducts();
