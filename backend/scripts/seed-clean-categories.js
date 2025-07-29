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
        field_id: 'dealer_price',
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
        display_order: 5,
        default_value: 18
    },
    {
        field_id: 'cgst',
        label: 'CGST (%)', 
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 6,
        default_value: 9
    }
];

async function seedCleanCategories() {
    try {
        console.log('🧹 Starting clean category hierarchy seeding...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
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
        console.log(`✅ Created Mobile category (${mobile.form_schema.length} specific fields)`);

        // 3. Create SMART TV category (leaf with TV-specific fields)
        const smartTV = new Category({
            name: 'Smart TV',
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
                },
                {
                    field_id: 'screen_size',
                    label: 'Screen Size (inches)',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 2,
                    options: [
                        { value: '32', label: '32"' },
                        { value: '40', label: '40"' },
                        { value: '43', label: '43"' },
                        { value: '50', label: '50"' },
                        { value: '55', label: '55"' },
                        { value: '65', label: '65"' },
                        { value: '75', label: '75"' },
                        { value: '85', label: '85"' }
                    ]
                },
                {
                    field_id: 'resolution',
                    label: 'Resolution',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 3,
                    options: [
                        { value: 'HD', label: 'HD (720p)' },
                        { value: 'FHD', label: 'Full HD (1080p)' },
                        { value: '4K', label: '4K UHD (2160p)' },
                        { value: '8K', label: '8K UHD (4320p)' }
                    ]
                },
                {
                    field_id: 'smart_os',
                    label: 'Smart TV OS',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 4,
                    options: [
                        { value: 'Android TV', label: 'Android TV' },
                        { value: 'webOS', label: 'LG webOS' },
                        { value: 'Tizen', label: 'Samsung Tizen' },
                        { value: 'Fire TV', label: 'Amazon Fire TV' },
                        { value: 'Roku TV', label: 'Roku TV' },
                        { value: 'Other', label: 'Other' }
                    ]
                },
                {
                    field_id: 'panel_type',
                    label: 'Panel Type',
                    type: 'dropdown',
                    is_required: false,
                    enabled: true,
                    display_order: 5,
                    options: [
                        { value: 'LED', label: 'LED' },
                        { value: 'OLED', label: 'OLED' },
                        { value: 'QLED', label: 'QLED' },
                        { value: 'LCD', label: 'LCD' },
                        { value: 'Plasma', label: 'Plasma' }
                    ]
                },
                {
                    field_id: 'refresh_rate',
                    label: 'Refresh Rate (Hz)',
                    type: 'dropdown',
                    is_required: false,
                    enabled: true,
                    display_order: 6,
                    options: [
                        { value: '60', label: '60 Hz' },
                        { value: '120', label: '120 Hz' },
                        { value: '144', label: '144 Hz' },
                        { value: '240', label: '240 Hz' }
                    ]
                },
                {
                    field_id: 'hdmi_ports',
                    label: 'HDMI Ports',
                    type: 'number',
                    is_required: false,
                    enabled: true,
                    display_order: 7
                },
                {
                    field_id: 'wifi',
                    label: 'WiFi Support',
                    type: 'boolean',
                    is_required: false,
                    enabled: true,
                    display_order: 8,
                    default_value: true
                }
            ],
            isActive: true
        });
        
        await smartTV.save();
        createdCategories['Smart TV'] = smartTV._id;
        console.log(`✅ Created Smart TV category (${smartTV.form_schema.length} specific fields)`);

        // 4. Create FRIDGE category (leaf with fridge-specific fields)
        const fridge = new Category({
            name: 'Fridge',
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
                    field_id: 'capacity',
                    label: 'Capacity (Liters)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    display_order: 2
                },
                {
                    field_id: 'type',
                    label: 'Fridge Type',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 3,
                    options: [
                        { value: 'Single Door', label: 'Single Door' },
                        { value: 'Double Door', label: 'Double Door' },
                        { value: 'Triple Door', label: 'Triple Door' },
                        { value: 'Side by Side', label: 'Side by Side' },
                        { value: 'French Door', label: 'French Door' },
                        { value: 'Mini Fridge', label: 'Mini Fridge' }
                    ]
                },
                {
                    field_id: 'star_rating',
                    label: 'Energy Star Rating',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 4,
                    options: [
                        { value: '1', label: '1 Star' },
                        { value: '2', label: '2 Star' },
                        { value: '3', label: '3 Star' },
                        { value: '4', label: '4 Star' },
                        { value: '5', label: '5 Star' }
                    ]
                },
                {
                    field_id: 'defrost_type',
                    label: 'Defrost Type',
                    type: 'dropdown',
                    is_required: false,
                    enabled: true,
                    display_order: 5,
                    options: [
                        { value: 'Manual', label: 'Manual Defrost' },
                        { value: 'Auto', label: 'Auto Defrost' },
                        { value: 'Frost Free', label: 'Frost Free' }
                    ]
                },
                {
                    field_id: 'compressor_type',
                    label: 'Compressor Type',
                    type: 'dropdown',
                    is_required: false,
                    enabled: true,
                    display_order: 6,
                    options: [
                        { value: 'Reciprocating', label: 'Reciprocating' },
                        { value: 'Linear', label: 'Linear' },
                        { value: 'Digital Inverter', label: 'Digital Inverter' },
                        { value: 'Smart Inverter', label: 'Smart Inverter' }
                    ]
                },
                {
                    field_id: 'door_finish',
                    label: 'Door Finish',
                    type: 'dropdown',
                    is_required: false,
                    enabled: true,
                    display_order: 7,
                    options: [
                        { value: 'Steel', label: 'Stainless Steel' },
                        { value: 'Glass', label: 'Glass' },
                        { value: 'Plastic', label: 'Plastic' },
                        { value: 'Colored', label: 'Colored Finish' }
                    ]
                },
                {
                    field_id: 'ice_maker',
                    label: 'Ice Maker',
                    type: 'boolean',
                    is_required: false,
                    enabled: true,
                    display_order: 8,
                    default_value: false
                }
            ],
            isActive: true
        });
        
        await fridge.save();
        createdCategories['Fridge'] = fridge._id;
        console.log(`✅ Created Fridge category (${fridge.form_schema.length} specific fields)`);

        // 5. Create AC category (leaf with AC-specific fields)
        const ac = new Category({
            name: 'AC',
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
                    field_id: 'capacity',
                    label: 'Capacity (Tons)',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 2,
                    options: [
                        { value: '0.75', label: '0.75 Ton' },
                        { value: '1', label: '1 Ton' },
                        { value: '1.5', label: '1.5 Ton' },
                        { value: '2', label: '2 Ton' },
                        { value: '2.5', label: '2.5 Ton' },
                        { value: '3', label: '3 Ton' },
                        { value: '4', label: '4 Ton' },
                        { value: '5', label: '5 Ton' }
                    ]
                },
                {
                    field_id: 'type',
                    label: 'AC Type',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 3,
                    options: [
                        { value: 'Split', label: 'Split AC' },
                        { value: 'Window', label: 'Window AC' },
                        { value: 'Cassette', label: 'Cassette AC' },
                        { value: 'Floor Standing', label: 'Floor Standing' },
                        { value: 'Portable', label: 'Portable AC' },
                        { value: 'Central', label: 'Central AC' }
                    ]
                },
                {
                    field_id: 'star_rating',
                    label: 'Energy Star Rating',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    display_order: 4,
                    options: [
                        { value: '1', label: '1 Star' },
                        { value: '2', label: '2 Star' },
                        { value: '3', label: '3 Star' },
                        { value: '4', label: '4 Star' },
                        { value: '5', label: '5 Star' }
                    ]
                },
                {
                    field_id: 'inverter',
                    label: 'Inverter Technology',
                    type: 'boolean',
                    is_required: true,
                    enabled: true,
                    display_order: 5,
                    default_value: true
                },
                {
                    field_id: 'refrigerant',
                    label: 'Refrigerant Type',
                    type: 'dropdown',
                    is_required: false,
                    enabled: true,
                    display_order: 6,
                    options: [
                        { value: 'R32', label: 'R32' },
                        { value: 'R410A', label: 'R410A' },
                        { value: 'R22', label: 'R22' },
                        { value: 'R290', label: 'R290' }
                    ]
                },
                {
                    field_id: 'filter_type',
                    label: 'Filter Type',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 7
                },
                {
                    field_id: 'wifi_enabled',
                    label: 'WiFi Enabled',
                    type: 'boolean',
                    is_required: false,
                    enabled: true,
                    display_order: 8,
                    default_value: false
                },
                {
                    field_id: 'installation_type',
                    label: 'Installation Type',
                    type: 'dropdown',
                    is_required: false,
                    enabled: true,
                    display_order: 9,
                    options: [
                        { value: 'Indoor', label: 'Indoor Unit Only' },
                        { value: 'Outdoor', label: 'Outdoor Unit Only' },
                        { value: 'Complete', label: 'Complete Set' }
                    ]
                }
            ],
            isActive: true
        });
        
        await ac.save();
        createdCategories['AC'] = ac._id;
        console.log(`✅ Created AC category (${ac.form_schema.length} specific fields)`);

        // Summary
        console.log('\n📊 Category Seeding Summary:');
        console.log(`🏠 Root Category: Electronics (${COMMON_FIELDS.length} common fields)`);
        console.log(`📱 Mobile: ${mobile.form_schema.length} specific fields (including Brand)`);
        console.log(`📺 Smart TV: ${smartTV.form_schema.length} specific fields (including Brand)`);
        console.log(`❄️  Fridge: ${fridge.form_schema.length} specific fields (including Brand)`);
        console.log(`🌬️  AC: ${ac.form_schema.length} specific fields (including Brand)`);
        console.log('\n✅ Clean category hierarchy seeded successfully!');
        console.log('\n🏷️  Brand fields now category-specific with dropdown values:');
        console.log('   📱 Mobile: Apple, Samsung, Xiaomi, OnePlus, etc.');
        console.log('   📺 Smart TV: Samsung, LG, Sony, TCL, etc.');
        console.log('   ❄️  Fridge: Samsung, LG, Whirlpool, Haier, etc.');
        console.log('   🌬️  AC: Daikin, LG, Samsung, Voltas, etc.');
        
        // Test compilation for one category
        console.log('\n🔍 Testing form schema compilation for Mobile...');
        const compiledSchema = await Category.compileFullFormSchema(mobile._id);
        console.log(`📋 Compiled Mobile form schema: ${compiledSchema.length} total fields`);
        compiledSchema.forEach((field, index) => {
            console.log(`   ${index + 1}. ${field.label} (${field.field_id}) - From: ${field.categoryName}`);
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
