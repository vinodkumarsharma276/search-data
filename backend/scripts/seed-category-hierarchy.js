/**
 * Seed script to create a hierarchical category system for dynamic product forms
 * This will create Electronics > Smartphones > Android/iPhone categories with form schemas
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

async function seedCategoryHierarchy() {
    try {
        console.log('🌱 Starting category hierarchy seeding...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('🧹 Cleared existing categories');

        // 1. Create Smartphones category (top-level)
        const smartphones = new Category({
            name: 'Smartphones',
            description: 'Mobile phones and smartphones',
            parent_id: null,
            is_leaf: false,
            form_schema: [
                {
                    field_id: 'common_brand',
                    label: 'Brand',
                    type: 'combobox',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: 'Samsung', label: 'Samsung' },
                        { value: 'Apple', label: 'Apple' },
                        { value: 'Xiaomi', label: 'Xiaomi' },
                        { value: 'OnePlus', label: 'OnePlus' },
                        { value: 'Realme', label: 'Realme' }
                    ],
                    display_order: 1
                },
                {
                    field_id: 'common_warranty_months',
                    label: 'Warranty (Months)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    default_value: 12,
                    display_order: 2
                },
                {
                    field_id: 'common_price',
                    label: 'Price (₹)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    display_order: 3
                },
                {
                    field_id: 'common_storage_gb',
                    label: 'Storage (GB)',
                    type: 'dropdown',
                    is_required: true,
                    enabled: false,
                    options: [
                        { value: '64', label: '64 GB' },
                        { value: '128', label: '128 GB' },
                        { value: '256', label: '256 GB' },
                        { value: '512', label: '512 GB' },
                        { value: '1024', label: '1 TB' }
                    ],
                    display_order: 4
                },
                {
                    field_id: 'common_ram_gb',
                    label: 'RAM (GB)',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: '4', label: '4 GB' },
                        { value: '6', label: '6 GB' },
                        { value: '8', label: '8 GB' },
                        { value: '12', label: '12 GB' },
                        { value: '16', label: '16 GB' }
                    ],
                    display_order: 5
                },
                {
                    field_id: 'common_color',
                    label: 'Color',
                    type: 'combobox',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: 'Black', label: 'Black' },
                        { value: 'White', label: 'White' },
                        { value: 'Blue', label: 'Blue' },
                        { value: 'Red', label: 'Red' },
                        { value: 'Gold', label: 'Gold' }
                    ],
                    display_order: 6
                }
            ]
        });
        await smartphones.save();
        console.log('✅ Created Smartphones category');

        // 2. Create Android Phones (leaf category)
        const androidPhones = new Category({
            name: 'Android Phones',
            description: 'Smartphones running Android OS',
            parent_id: smartphones._id,
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'name',
                    label: 'Product Name',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 1
                },
                {
                    field_id: 'specific_model_number',
                    label: 'Model Number',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 2
                },
                {
                    field_id: 'specific_android_version',
                    label: 'Android Version',
                    type: 'combobox',
                    is_required: true,
                    enabled: false,
                    options: [
                        { value: '11', label: 'Android 11' },
                        { value: '12', label: 'Android 12' },
                        { value: '13', label: 'Android 13' },
                        { value: '14', label: 'Android 14' }
                    ],
                    display_order: 7
                },
                {
                    field_id: 'specific_screen_size',
                    label: 'Screen Size (inches)',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 8
                },
                {
                    field_id: 'specific_battery_mah',
                    label: 'Battery (mAh)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    display_order: 9
                },
                {
                    field_id: 'specific_dual_sim',
                    label: 'Dual SIM',
                    type: 'boolean',
                    is_required: false,
                    enabled: true,
                    default_value: true,
                    display_order: 10
                }
            ]
        });
        await androidPhones.save();
        console.log('✅ Created Android Phones category');

        // 3. Create iPhone (leaf category)
        const iPhones = new Category({
            name: 'iPhone',
            description: 'Apple iPhone series',
            parent_id: smartphones._id,
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'name',
                    label: 'Product Name',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 1
                },
                {
                    field_id: 'specific_iphone_series',
                    label: 'iPhone Series',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: 'iPhone 13', label: 'iPhone 13' },
                        { value: 'iPhone 14', label: 'iPhone 14' },
                        { value: 'iPhone 15', label: 'iPhone 15' },
                        { value: 'iPhone 15 Pro', label: 'iPhone 15 Pro' },
                        { value: 'iPhone 15 Pro Max', label: 'iPhone 15 Pro Max' }
                    ],
                    display_order: 2
                },
                {
                    field_id: 'specific_ios_version',
                    label: 'iOS Version',
                    type: 'text',
                    is_required: true,
                    enabled: false,
                    default_value: 'iOS 17',
                    display_order: 7
                },
                {
                    field_id: 'specific_face_id',
                    label: 'Face ID',
                    type: 'boolean',
                    is_required: false,
                    enabled: true,
                    default_value: true,
                    display_order: 8
                },
                {
                    field_id: 'specific_camera_mp',
                    label: 'Main Camera (MP)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    display_order: 9
                }
            ]
        });
        await iPhones.save();
        console.log('✅ Created iPhone category');

        // 4. Create TV category (top-level)
        const televisions = new Category({
            name: 'Televisions',
            description: 'Smart TVs and LED TVs',
            parent_id: null,
            is_leaf: false,
            form_schema: [
                {
                    field_id: 'common_brand',
                    label: 'Brand',
                    type: 'combobox',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: 'Samsung', label: 'Samsung' },
                        { value: 'LG', label: 'LG' },
                        { value: 'Sony', label: 'Sony' },
                        { value: 'Mi', label: 'Mi/Xiaomi' },
                        { value: 'TCL', label: 'TCL' }
                    ],
                    display_order: 1
                },
                {
                    field_id: 'common_warranty_months',
                    label: 'Warranty (Months)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    default_value: 12,
                    display_order: 2
                },
                {
                    field_id: 'common_price',
                    label: 'Price (₹)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    display_order: 3
                },
                {
                    field_id: 'common_screen_size',
                    label: 'Screen Size (inches)',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: '32', label: '32 inch' },
                        { value: '43', label: '43 inch' },
                        { value: '50', label: '50 inch' },
                        { value: '55', label: '55 inch' },
                        { value: '65', label: '65 inch' },
                        { value: '75', label: '75 inch' }
                    ],
                    display_order: 4
                },
                {
                    field_id: 'common_resolution',
                    label: 'Resolution',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: 'HD', label: 'HD (1366x768)' },
                        { value: 'FHD', label: 'Full HD (1920x1080)' },
                        { value: '4K', label: '4K UHD (3840x2160)' }
                    ],
                    display_order: 5
                }
            ]
        });
        await televisions.save();
        console.log('✅ Created Televisions category');

        // 5. Create Smart TV (leaf category)
        const smartTVs = new Category({
            name: 'Smart TV',
            description: 'Internet-connected Smart TVs',
            parent_id: televisions._id,
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'name',
                    label: 'Product Name',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 1
                },
                {
                    field_id: 'specific_model_number',
                    label: 'Model Number',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 2
                },
                {
                    field_id: 'specific_os',
                    label: 'Operating System',
                    type: 'dropdown',
                    is_required: true,
                    enabled: false,
                    options: [
                        { value: 'Android TV', label: 'Android TV' },
                        { value: 'webOS', label: 'webOS' },
                        { value: 'Tizen', label: 'Tizen' },
                        { value: 'Fire TV', label: 'Fire TV' }
                    ],
                    display_order: 6
                },
                {
                    field_id: 'specific_hdr_support',
                    label: 'HDR Support',
                    type: 'boolean',
                    is_required: false,
                    enabled: true,
                    default_value: true,
                    display_order: 7
                }
            ]
        });
        await smartTVs.save();
        console.log('✅ Created Smart TV category');

        // 6. Create Laptops category (top-level)
        const laptops = new Category({
            name: 'Laptops',
            description: 'Laptop computers',
            parent_id: null,
            is_leaf: false,
            form_schema: [
                {
                    field_id: 'common_brand',
                    label: 'Brand',
                    type: 'combobox',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: 'Dell', label: 'Dell' },
                        { value: 'HP', label: 'HP' },
                        { value: 'Lenovo', label: 'Lenovo' },
                        { value: 'Asus', label: 'Asus' },
                        { value: 'Acer', label: 'Acer' }
                    ],
                    display_order: 1
                },
                {
                    field_id: 'common_warranty_months',
                    label: 'Warranty (Months)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    default_value: 12,
                    display_order: 2
                },
                {
                    field_id: 'common_price',
                    label: 'Price (₹)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    display_order: 3
                },
                {
                    field_id: 'common_processor',
                    label: 'Processor',
                    type: 'combobox',
                    is_required: true,
                    enabled: false,
                    options: [
                        { value: 'Intel i3', label: 'Intel Core i3' },
                        { value: 'Intel i5', label: 'Intel Core i5' },
                        { value: 'Intel i7', label: 'Intel Core i7' },
                        { value: 'AMD Ryzen 5', label: 'AMD Ryzen 5' },
                        { value: 'AMD Ryzen 7', label: 'AMD Ryzen 7' }
                    ],
                    display_order: 4
                },
                {
                    field_id: 'common_screen_size',
                    label: 'Screen Size',
                    type: 'dropdown',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: '13.3', label: '13.3 inch' },
                        { value: '14', label: '14 inch' },
                        { value: '15.6', label: '15.6 inch' },
                        { value: '17.3', label: '17.3 inch' }
                    ],
                    display_order: 5
                }
            ]
        });
        await laptops.save();
        console.log('✅ Created Laptops category');

        // 7. Create Gaming Laptops (leaf category)
        const gamingLaptops = new Category({
            name: 'Gaming Laptops',
            description: 'High-performance laptops for gaming',
            parent_id: laptops._id,
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'name',
                    label: 'Product Name',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 1
                },
                {
                    field_id: 'specific_gpu',
                    label: 'Graphics Card',
                    type: 'combobox',
                    is_required: true,
                    enabled: true,
                    options: [
                        { value: 'RTX 3060', label: 'NVIDIA RTX 3060' },
                        { value: 'RTX 3070', label: 'NVIDIA RTX 3070' },
                        { value: 'RTX 4060', label: 'NVIDIA RTX 4060' },
                        { value: 'RTX 4070', label: 'NVIDIA RTX 4070' }
                    ],
                    display_order: 6
                },
                {
                    field_id: 'specific_refresh_rate',
                    label: 'Display Refresh Rate (Hz)',
                    type: 'dropdown',
                    is_required: true,
                    enabled: false,
                    options: [
                        { value: '60', label: '60 Hz' },
                        { value: '120', label: '120 Hz' },
                        { value: '144', label: '144 Hz' },
                        { value: '240', label: '240 Hz' }
                    ],
                    display_order: 7
                },
                {
                    field_id: 'specific_rgb_keyboard',
                    label: 'RGB Keyboard',
                    type: 'boolean',
                    is_required: false,
                    enabled: true,
                    default_value: true,
                    display_order: 8
                }
            ]
        });
        await gamingLaptops.save();
        console.log('✅ Created Gaming Laptops category');

        console.log('\n🎉 Category hierarchy seeding completed!');
        console.log('📊 Categories created:');
        console.log('  ├── Smartphones (top-level)');
        console.log('  │   ├── Android Phones (leaf)');
        console.log('  │   └── iPhone (leaf)');
        console.log('  ├── Televisions (top-level)');
        console.log('  │   └── Smart TV (leaf)');
        console.log('  └── Laptops (top-level)');
        console.log('      └── Gaming Laptops (leaf)');

        console.log('\n✨ You can now test the dynamic form system!');

    } catch (error) {
        console.error('❌ Error seeding categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the seeding
if (require.main === module) {
    seedCategoryHierarchy();
}

module.exports = seedCategoryHierarchy;
