/**
 * Clean Category Hierarchy Script
 * Creates a proper category structure with:
 * - Common fields: Brand, MRP, IGST, GST (for ALL products)
 * - Category-specific fields: Only unique fields per category
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

// Common fields that apply to ALL products
const COMMON_FIELDS = [
    {
        field_id: 'model_number',
        label: 'Model Number',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 20
    },
    {
        field_id: 'dealer_price',
        label: 'DP (Dealer Price) (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 21
    },
    {
        field_id: 'mrp',
        label: 'MRP (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 22
    },
    {
        field_id: 'igst',
        label: 'IGST (%)',
        type: 'dropdown',
        is_required: true,
        enabled: true,
        display_order: 23,
        default_value: 18,
        options: [
            { value: 0, label: '0%' },
            { value: 0.25, label: '0.25%' },
            { value: 3, label: '3%' },
            { value: 5, label: '5%' },
            { value: 12, label: '12%' },
            { value: 18, label: '18%' },
            { value: 28, label: '28%' }
        ]
    },
    {
        field_id: 'cgst',
        label: 'CGST (%)',
        type: 'dropdown',
        is_required: true,
        enabled: true,
        display_order: 24,
        default_value: 9,
        options: [
            { value: 0, label: '0%' },
            { value: 0.125, label: '0.125%' },
            { value: 1.5, label: '1.5%' },
            { value: 2.5, label: '2.5%' },
            { value: 6, label: '6%' },
            { value: 9, label: '9%' },
            { value: 14, label: '14%' }
        ]
    }
];

// Fields specific to Electronics
const ELECTRONICS_ONLY_FIELDS = [
    {
        field_id: 'serial_number',
        label: 'Serial Number',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 11
    }
];

async function seedCleanCategories() {
    try {
        console.log('🧹 Starting clean category hierarchy seeding...');
        
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('🗑️ Cleared existing categories');

        // Store created categories for parent references
        const createdCategories = {};
        
        // 1. Create ROOT: Electronics (with common fields only)
        const electronics = new Category({
            name: 'Electronics',
            parent_id: null,
            is_leaf: false,
            form_schema: [], // Common fields are now on leaf nodes
            isActive: true
        });
        
        await electronics.save();
        createdCategories['Electronics'] = electronics._id;
        console.log(`✅ Created ROOT category: Electronics`);

        // 2. Create MOBILE category (leaf with mobile-specific fields + common)
        const mobile = new Category({
            name: 'Mobile',
            parent_id: createdCategories['Electronics'],
            is_leaf: true,
            form_schema: [
                ...COMMON_FIELDS,
                ...ELECTRONICS_ONLY_FIELDS,
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
                        { value: 'Oppo', label: 'Oppo' },
                        { value: 'Vivo', label: 'Vivo' },
                        { value: 'Realme', label: 'Realme' },
                        { value: 'Google', label: 'Google' },
                        { value: 'Nothing', label: 'Nothing' },
                        { value: 'Motorola', label: 'Motorola' },
                        { value: 'Nokia', label: 'Nokia' },
                        { value: 'Huawei', label: 'Huawei' },
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
        console.log(`✅ Created Mobile category (${mobile.form_schema.length} total fields)`);

        // 3. Create SMART TV category (leaf with TV-specific fields + common)
        const smartTV = new Category({
            name: 'Smart TV',
            parent_id: createdCategories['Electronics'],
            is_leaf: true,
            form_schema: [
                ...COMMON_FIELDS,
                ...ELECTRONICS_ONLY_FIELDS,
                {
                    field_id: 'brand',
                    label: 'Brand',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 1,
                    options: [
                        { value: 'Samsung', label: 'Samsung' },
                        { value: 'LG', label: 'LG' },
                        { value: 'Sony', label: 'Sony' },
                        { value: 'TCL', label: 'TCL' },
                        { value: 'Hisense', label: 'Hisense' },
                        { value: 'Panasonic', label: 'Panasonic' },
                        { value: 'Philips', label: 'Philips' },
                        { value: 'Xiaomi', label: 'Xiaomi' },
                        { value: 'OnePlus', label: 'OnePlus' },
                        { value: 'Realme', label: 'Realme' },
                        { value: 'VU', label: 'VU' },
                        { value: 'Power Guard', label: 'Power Guard' },
                        { value: 'Toshiba', label: 'Toshiba' },
                        { value: 'Other', label: 'Other' }
                    ]
                }
            ],
            isActive: true
        });
        
        await smartTV.save();
        createdCategories['Smart TV'] = smartTV._id;
        console.log(`✅ Created Smart TV category (${smartTV.form_schema.length} total fields)`);

        // 4. Create FRIDGE category (leaf with fridge-specific fields + common)
        const fridge = new Category({
            name: 'Fridge',
            parent_id: createdCategories['Electronics'],
            is_leaf: true,
            form_schema: [
                ...COMMON_FIELDS,
                ...ELECTRONICS_ONLY_FIELDS,
                {
                    field_id: 'brand',
                    label: 'Brand',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 1,
                    options: [
                        { value: 'Samsung', label: 'Samsung' },
                        { value: 'LG', label: 'LG' },
                        { value: 'Whirlpool', label: 'Whirlpool' },
                        { value: 'Haier', label: 'Haier' },
                        { value: 'Godrej', label: 'Godrej' },
                        { value: 'Bosch', label: 'Bosch' },
                        { value: 'IFB', label: 'IFB' },
                        { value: 'Panasonic', label: 'Panasonic' },
                        { value: 'Videocon', label: 'Videocon' },
                        { value: 'Electrolux', label: 'Electrolux' },
                        { value: 'Voltas', label: 'Voltas' },
                        { value: 'Hitachi', label: 'Hitachi' },
                        { value: 'Other', label: 'Other' }
                    ]
                },
                {
                    field_id: 'star_rating',
                    label: 'Energy Star Rating',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 2,
                    options: [
                        { value: '1', label: '1 Star' },
                        { value: '2', label: '2 Star' },
                        { value: '3', label: '3 Star' },
                        { value: '4', label: '4 Star' },
                        { value: '5', label: '5 Star' }
                    ]
                }
            ],
            isActive: true
        });
        
        await fridge.save();
        createdCategories['Fridge'] = fridge._id;
        console.log(`✅ Created Fridge category (${fridge.form_schema.length} total fields)`);

        // 5. Create AC category (leaf with AC-specific fields + common)
        const ac = new Category({
            name: 'AC',
            parent_id: createdCategories['Electronics'],
            is_leaf: true,
            form_schema: [
                ...COMMON_FIELDS,
                ...ELECTRONICS_ONLY_FIELDS,
                {
                    field_id: 'brand',
                    label: 'Brand',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 1,
                    options: [
                        { value: 'Daikin', label: 'Daikin' },
                        { value: 'LG', label: 'LG' },
                        { value: 'Samsung', label: 'Samsung' },
                        { value: 'Voltas', label: 'Voltas' },
                        { value: 'Blue Star', label: 'Blue Star' },
                        { value: 'Carrier', label: 'Carrier' },
                        { value: 'Hitachi', label: 'Hitachi' },
                        { value: 'Panasonic', label: 'Panasonic' },
                        { value: 'Whirlpool', label: 'Whirlpool' },
                        { value: 'Godrej', label: 'Godrej' },
                        { value: 'Haier', label: 'Haier' },
                        { value: 'Lloyd', label: 'Lloyd' },
                        { value: 'O General', label: 'O General' },
                        { value: 'Mitsubishi', label: 'Mitsubishi' },
                        { value: 'Other', label: 'Other' }
                    ]
                },
                {
                    field_id: 'star_rating',
                    label: 'Energy Star Rating',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 2,
                    options: [
                        { value: '1', label: '1 Star' },
                        { value: '2', label: '2 Star' },
                        { value: '3', label: '3 Star' },
                        { value: '4', label: '4 Star' },
                        { value: '5', label: '5 Star' }
                    ]
                }
            ],
            isActive: true
        });
        
        await ac.save();
        createdCategories['AC'] = ac._id;
        console.log(`✅ Created AC category (${ac.form_schema.length} total fields)`);

        // 6. Create ROOT: Furniture (with common fields only)
        const furniture = new Category({
            name: 'Furniture',
            parent_id: null,
            is_leaf: false,
            form_schema: [], // No common fields at the root, they are added to leaf nodes
            isActive: true
        });

        await furniture.save();
        createdCategories['Furniture'] = furniture._id;
        console.log(`✅ Created ROOT category: Furniture`);

        // 7. Create subcategories for Furniture
        const sofa = new Category({
            name: 'Sofa',
            parent_id: createdCategories['Furniture'],
            is_leaf: true,
            form_schema: [
                ...COMMON_FIELDS,
                {
                    field_id: 'seating_capacity',
                    label: 'Seating Capacity',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 7,
                    options: Array.from({ length: 20 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))
                }
            ],
            isActive: true
        });
        await sofa.save();
        createdCategories['Sofa'] = sofa._id;
        console.log('✅ Created Sofa category');

        const dressingTable = new Category({
            name: 'Dressing Table',
            parent_id: createdCategories['Furniture'],
            is_leaf: true,
            form_schema: COMMON_FIELDS, // Dressing Tables get common fields
            isActive: true
        });
        await dressingTable.save();
        createdCategories['Dressing Table'] = dressingTable._id;
        console.log('✅ Created Dressing Table category');

        // 8. Create Bed as a non-leaf category
        const bed = new Category({
            name: 'Bed',
            parent_id: createdCategories['Furniture'],
            is_leaf: false,
            form_schema: [], // This is a container, no fields here
            isActive: true
        });
        await bed.save();
        createdCategories['Bed'] = bed._id;
        console.log('✅ Created Bed (non-leaf) category');

        // 9. Define bed-specific fields with conditional visibility
        const bedSpecificFields = [
            {
                field_id: 'material',
                label: 'Material',
                type: 'dropdown',
                is_required: true,
                enabled: true,
                display_order: 10,
                options: [
                    { value: 'Shesham', label: 'Shesham' },
                    { value: 'Board', label: 'Board' },
                    { value: 'Teak', label: 'Teak' }
                ]
            },
            {
                field_id: 'polish',
                label: 'Polish',
                type: 'dropdown',
                is_required: true,
                enabled: true,
                display_order: 11,
                options: [
                    { value: 'PU', label: 'PU' },
                    { value: 'Melamine', label: 'Melamine' }
                ],
                visibility_rules: [{
                    field: 'material',
                    operator: 'equals',
                    value: 'Shesham'
                }, {
                    field: 'material',
                    operator: 'equals',
                    value: 'Teak'
                }]
            },
            {
                field_id: 'board_finish',
                label: 'Finish',
                type: 'dropdown',
                is_required: true,
                enabled: true,
                display_order: 12,
                options: [
                    { value: 'Laminate', label: 'Laminate' },
                    { value: 'Acrylic', label: 'Acrylic' }
                ],
                visibility_rules: [{
                    field: 'material',
                    operator: 'equals',
                    value: 'Board'
                }]
            }
        ];

        // 10. Create leaf categories for Bed
        const bedTypes = [
            'Double Bed Headrest',
            'Single Bed Headrest',
            'Double Bed w/o Headrest',
            'Single Bed w/o Headrest'
        ];

        for (const bedTypeName of bedTypes) {
            const bedTypeCategory = new Category({
                name: bedTypeName,
                parent_id: createdCategories['Bed'],
                is_leaf: true,
                // Combine common fields with bed-specific fields
                form_schema: [...COMMON_FIELDS, ...bedSpecificFields],
                isActive: true
            });
            await bedTypeCategory.save();
            createdCategories[bedTypeName] = bedTypeCategory._id;
            console.log(`✅ Created ${bedTypeName} category`);
        }

        // Summary
        console.log('\n📊 Category Seeding Summary:');
        console.log(`� Root Categories: Electronics, Furniture`);
        console.log(`\nELECTRONICS:`);
        console.log(`  - Mobile: ${mobile.form_schema.length} specific fields`);
        console.log(`  - Smart TV: ${smartTV.form_schema.length} specific fields`);
        console.log(`  - Fridge: ${fridge.form_schema.length} specific fields`);
        console.log(`  - AC: ${ac.form_schema.length} specific fields`);
        console.log(`\nFURNITURE:`);
        console.log(`  - Sofa (Leaf)`);
        console.log(`  - Dressing Table (Leaf)`);
        console.log(`  - Bed (Container) -> 4 Leaf sub-categories with specific fields`);

        console.log('\n✅ Clean category hierarchy seeded successfully!');
        
        // Test compilation for one category from each tree
        console.log('\n🔍 Testing form schema compilation for Mobile...');
        const compiledMobileSchema = await Category.compileFullFormSchema(mobile._id);
        console.log(`📋 Compiled Mobile form schema: ${compiledMobileSchema.length} total fields`);
        
        console.log('\n🔍 Testing form schema compilation for Double Bed Headrest...');
        const compiledBedSchema = await Category.compileFullFormSchema(createdCategories['Double Bed Headrest']);
        console.log(`📋 Compiled Bed form schema: ${compiledBedSchema.length} total fields`);
        compiledBedSchema.forEach((field, index) => {
            console.log(`   ${index + 1}. ${field.label} (${field.field_id})`);
        });

    } catch (error) {
        console.error('❌ Error seeding categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the seeding
seedCleanCategories();
