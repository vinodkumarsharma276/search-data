const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

async function testCommonFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const electronicsCategory = await Category.findOne({ 
            name: 'Electronics', 
            parent_id: null 
        });
        
        if (!electronicsCategory) {
            console.log('❌ Electronics category not found');
            return;
        }

        const commonFields = electronicsCategory.form_schema || [];
        
        console.log('✅ Common fields API test successful');
        console.log('📋 Common fields found:', commonFields.length);
        commonFields.forEach((field, index) => {
            console.log(`   ${index + 1}. ${field.label} (${field.field_id}) - Required: ${field.is_required}`);
        });
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testCommonFields();
