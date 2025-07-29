const mongoose = require('mongoose');
const Category = require('./models/Category');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/vinod-electronics', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkAllCategories() {
    try {
        console.log('🗂️ Checking all categories...');
        
        // Get all categories
        const allCategories = await Category.find({});
        console.log(`📊 Total categories: ${allCategories.length}`);
        
        if (allCategories.length > 0) {
            console.log('\n📋 All categories:');
            allCategories.forEach((category, index) => {
                console.log(`\n--- Category ${index + 1}: ${category.name} ---`);
                console.log('ID:', category._id);
                console.log('Is Leaf:', category.is_leaf);
                console.log('Parent ID:', category.parent_id);
                
                if (category.form_schema && category.form_schema.length > 0) {
                    console.log('Form Fields:');
                    category.form_schema.forEach(field => {
                        console.log(`  - ${field.label} (${field.id}): ${field.type}`);
                    });
                } else {
                    console.log('No form schema defined');
                }
            });
        } else {
            console.log('❌ No categories found');
        }
        
    } catch (error) {
        console.error('❌ Error checking categories:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

checkAllCategories();
