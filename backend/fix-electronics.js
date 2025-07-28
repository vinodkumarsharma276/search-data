/**
 * Fix Electronics Category - Add DP (Dealer Price) and other common fields
 */

const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Updated common fields for Electronics category
const COMMON_FIELDS = [
    {
        field_id: 'common_brand',
        label: 'Brand',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 1
    },
    {
        field_id: 'common_model_number',
        label: 'Model Number',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 2
    },
    {
        field_id: 'common_serial_number',
        label: 'Serial Number',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 3
    },
    {
        field_id: 'common_dp_dealer_price',
        label: 'DP (Dealer Price) (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 4
    },
    {
        field_id: 'common_mrp',
        label: 'MRP (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 5
    },
    {
        field_id: 'common_igst',
        label: 'IGST (%)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 6,
        default_value: 18
    },
    {
        field_id: 'common_gst',
        label: 'GST (%)', 
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 7,
        default_value: 18
    }
];

async function fixElectronicsCategory() {
    try {
        console.log('🔧 Fixing Electronics category...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find and update Electronics category
        const electronics = await Category.findOne({ 
            name: 'Electronics', 
            parent_id: null 
        });
        
        if (!electronics) {
            console.log('❌ Electronics category not found');
            return;
        }
        
        console.log('📋 Current Electronics fields:', electronics.form_schema.length);
        
        // Update the form schema
        electronics.form_schema = COMMON_FIELDS;
        await electronics.save();
        
        console.log('✅ Updated Electronics category with', COMMON_FIELDS.length, 'common fields');
        
        // Verify the update
        const updatedElectronics = await Category.findById(electronics._id);
        console.log('📊 Verification - Electronics now has', updatedElectronics.form_schema.length, 'fields:');
        updatedElectronics.form_schema.forEach((field, index) => {
            console.log(`   ${index + 1}. ${field.label} (${field.field_id})`);
        });

    } catch (error) {
        console.error('❌ Error fixing Electronics category:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the fix
fixElectronicsCategory();
