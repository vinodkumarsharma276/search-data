/**
 * Simple Category Seeding Script - Without Compilation Test
 */

const mongoose = require('mongoose');
const Category = require('./models/Category');

// Common fields that apply to ALL products
const COMMON_FIELDS = [
    {
        field_id: 'model_number',
        label: 'Model Number',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 1
    },
    {
        field_id: 'serial_number',
        label: 'Serial Number',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 2
    },
    {
        field_id: 'dp_dealer_price',
        label: 'DP (Dealer Price) (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 3
    },
    {
        field_id: 'mrp',
        label: 'MRP (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 4
    },
    {
        field_id: 'igst',
        label: 'IGST (%)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 5
    },
    {
        field_id: 'cgst',
        label: 'CGST (%)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 6
    }
];

async function seedCleanCategories() {
    try {
        console.log('🧹 Starting simple category seeding...');
        
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/ve_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
        
        // Clear existing categories
        await Category.deleteMany({});
        console.log('🗑️ Cleared existing categories');
        
        const createdCategories = {};

        // 1. Create ROOT category (Electronics) with common fields
        const electronics = new Category({
            name: 'Electronics',
            parent_id: null,
            is_leaf: false,
            form_schema: COMMON_FIELDS,
            isActive: true
        });
        
        await electronics.save();
        createdCategories['Electronics'] = electronics._id;
        console.log(`✅ Created ROOT category: Electronics (${COMMON_FIELDS.length} common fields)`);

        // 2. Create MOBILE category (leaf with mobile-specific fields)
        const mobile = new Category({
            name: 'Mobile',
            parent_id: createdCategories['Electronics'],
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'brand',
                    label: 'Brand',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 1,
                    options: [
                        { value: 'Apple', label: 'Apple' },
                        { value: 'Samsung', label: 'Samsung' },
                        { value: 'Xiaomi', label: 'Xiaomi' },
                        { value: 'OnePlus', label: 'OnePlus' },
                        { value: 'Realme', label: 'Realme' },
                        { value: 'Vivo', label: 'Vivo' },
                        { value: 'Oppo', label: 'Oppo' },
                        { value: 'Google', label: 'Google' },
                        { value: 'Nothing', label: 'Nothing' },
                        { value: 'Nokia', label: 'Nokia' },
                        { value: 'Motorola', label: 'Motorola' },
                        { value: 'Honor', label: 'Honor' },
                        { value: 'Asus', label: 'Asus' },
                        { value: 'Other', label: 'Other' }
                    ]
                },
                {
                    field_id: 'imei',
                    label: 'IMEI Number',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 2
                },
                {
                    field_id: 'os',
                    label: 'Operating System',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 3,
                    options: [
                        { value: 'Android', label: 'Android' },
                        { value: 'iOS', label: 'iOS' },
                        { value: 'Other', label: 'Other' }
                    ]
                },
                {
                    field_id: 'storage',
                    label: 'Storage (GB)',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 4,
                    options: [
                        { value: '32', label: '32 GB' },
                        { value: '64', label: '64 GB' },
                        { value: '128', label: '128 GB' },
                        { value: '256', label: '256 GB' },
                        { value: '512', label: '512 GB' },
                        { value: '1024', label: '1 TB' }
                    ]
                },
                {
                    field_id: 'ram',
                    label: 'RAM (GB)',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 5,
                    options: [
                        { value: '2', label: '2 GB' },
                        { value: '3', label: '3 GB' },
                        { value: '4', label: '4 GB' },
                        { value: '6', label: '6 GB' },
                        { value: '8', label: '8 GB' },
                        { value: '12', label: '12 GB' },
                        { value: '16', label: '16 GB' }
                    ]
                }
            ],
            isActive: true
        });
        
        await mobile.save();
        createdCategories['Mobile'] = mobile._id;
        console.log(`✅ Created Mobile category (${mobile.form_schema.length} specific fields)`);

        console.log('\n📊 Seeding Summary:');
        console.log(`🏠 Root Category: Electronics (${COMMON_FIELDS.length} common fields)`);
        console.log(`📱 Mobile: ${mobile.form_schema.length} specific fields (including Brand)`);
        console.log('\n✅ Clean categories seeded successfully!');
        
        // Verify
        const allCategories = await Category.find({});
        console.log(`\n📊 Verification: ${allCategories.length} categories created`);
        allCategories.forEach(cat => {
            console.log(`  - ${cat.name} (${cat._id}) - Leaf: ${cat.is_leaf}`);
        });

    } catch (error) {
        console.error('❌ Error seeding categories:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the seeding
seedCleanCategories();
