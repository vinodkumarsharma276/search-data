const mongoose = require('mongoose');
const Category = require('./models/Category');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/ve_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkCategories() {
    try {
        console.log('🗂️ Checking Category collection...');
        
        // Get all leaf categories (where products can be created)
        const leafCategories = await Category.find({ is_leaf: true });
        console.log(`📊 Total leaf categories: ${leafCategories.length}`);
        
        if (leafCategories.length > 0) {
            console.log('\n📋 Leaf categories with form schemas:');
            leafCategories.forEach((category, index) => {
                console.log(`\n--- Category ${index + 1}: ${category.name} ---`);
                console.log('ID:', category._id);
                console.log('Is Leaf:', category.is_leaf);
                
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
            console.log('❌ No leaf categories found');
        }
        
    } catch (error) {
        console.error('❌ Error checking categories:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

checkCategories();
