const mongoose = require('mongoose');
const Category = require('./models/Category');

async function testCategoryCreation() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/ve_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
        
        // Clear existing categories
        await Category.deleteMany({});
        console.log('🗑️ Cleared existing categories');
        
        // Create a simple test category
        const testCategory = new Category({
            name: 'Test Category',
            is_leaf: false,
            form_schema: [
                {
                    field_id: 'test_field',
                    label: 'Test Field',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 1
                }
            ],
            isActive: true
        });
        
        console.log('💾 Saving test category...');
        const savedCategory = await testCategory.save();
        console.log('✅ Test category saved:', savedCategory._id);
        
        // Verify it was saved
        const categories = await Category.find({});
        console.log(`📊 Total categories after save: ${categories.length}`);
        
        if (categories.length > 0) {
            console.log('Categories found:');
            categories.forEach(cat => {
                console.log(`  - ${cat.name} (${cat._id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Connection closed');
    }
}

testCategoryCreation();
