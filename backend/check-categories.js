const mongoose = require('mongoose');
const Category = require('./models/Category');

// Database configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/searchdb';

async function checkCategories() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Connected to MongoDB');
        
        // Get all categories
        const categories = await Category.find({});
        console.log(`📊 Total categories: ${categories.length}`);
        console.log('');
        
        categories.forEach((category, index) => {
            console.log(`${index + 1}. Category: ${category.name}`);
            console.log(`   ID: ${category._id}`);
            console.log(`   Parent ID: ${category.parent_id || 'ROOT'}`);
            console.log(`   Is Leaf: ${category.is_leaf}`);
            console.log(`   Form Schema Fields: ${category.form_schema ? category.form_schema.length : 0}`);
            
            if (category.form_schema && category.form_schema.length > 0) {
                console.log('   📝 Form Fields:');
                category.form_schema.forEach((field, fieldIndex) => {
                    console.log(`      ${fieldIndex + 1}. ${field.label} (${field.field_id}) - Type: ${field.type}, Required: ${field.is_required}, Enabled: ${field.enabled}`);
                });
            }
            console.log('   ---');
        });
        
        // Check for any leaf categories
        const leafCategories = await Category.find({ is_leaf: true });
        console.log(`\n🍃 Leaf categories: ${leafCategories.length}`);
        
        if (leafCategories.length > 0) {
            console.log('\n🔍 Checking first leaf category form schema compilation...');
            try {
                const fullSchema = await Category.compileFullFormSchema(leafCategories[0]._id);
                console.log(`📋 Compiled form schema has ${fullSchema.length} fields:`);
                fullSchema.forEach((field, index) => {
                    console.log(`   ${index + 1}. ${field.label} (${field.field_id}) - Category: ${field.categoryName}`);
                });
            } catch (error) {
                console.error('❌ Error compiling form schema:', error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

// Run the check
checkCategories();
