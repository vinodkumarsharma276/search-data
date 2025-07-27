/**
 * Clean Category Hierarchy Seeding Script
 * Creates categories with proper field separation:
 * - Common fields: Only truly universal fields (Price, Warranty, Color)
 * - Brand: Moved to specific category fields where it belongs
 * - Model & Serial: In specific product fields
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

// Common fields that apply to ALL products (truly universal only)
const COMMON_PRODUCT_FIELDS = [
    {
        field_id: 'common_price',
        label: 'MRP (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 1
    },
    {
        field_id: 'common_warranty_months',
        label: 'Warranty (Months)',
        type: 'number',
        default_value: 12,
        is_required: true,
        enabled: true,
        display_order: 2
    },
    {
        field_id: 'common_color',
        label: 'Color',
        type: 'text',
        is_required: false,
        enabled: true,
        display_order: 3
    }
];

async function seedCategoryHierarchy() {
    try {
        console.log('🌱 Starting clean category hierarchy seeding...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/searchdb');
        console.log('✅ Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('🧹 Cleared existing categories');

        // 1. Create ROOT: Electronics (with only truly common fields)
        const electronics = new Category({
            name: 'Electronics',
            parent_id: null,
            is_leaf: false,
            form_schema: COMMON_PRODUCT_FIELDS,
            description: 'Electronic devices - Universal fields: Price, Warranty, Color',
            isActive: true
        });
        
        await electronics.save();
        console.log(`✅ Created ROOT: Electronics (${COMMON_PRODUCT_FIELDS.length} common fields)`);

        // 2. Create Smartphones category (with smartphone-specific fields including brand)
        const smartphones = new Category({
            name: 'Smartphones',
            parent_id: electronics._id,
            is_leaf: false,
            form_schema: [
                {
                    field_id: 'common_brand',
                    label: 'Brand',
                    type: 'dropdown',
                    options: [
                        { value: 'Samsung', label: 'Samsung' },
                        { value: 'Apple', label: 'Apple' },
                        { value: 'Xiaomi', label: 'Xiaomi' },
                        { value: 'OnePlus', label: 'OnePlus' },
                        { value: 'Realme', label: 'Realme' },
                        { value: 'Vivo', label: 'Vivo' },
                        { value: 'Oppo', label: 'Oppo' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 10
                },
                {
                    field_id: 'common_storage_gb',
                    label: 'Storage (GB)',
                    type: 'dropdown',
                    options: [
                        { value: '32', label: '32 GB' },
                        { value: '64', label: '64 GB' },
                        { value: '128', label: '128 GB' },
                        { value: '256', label: '256 GB' },
                        { value: '512', label: '512 GB' },
                        { value: '1024', label: '1 TB' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 11
                },
                {
                    field_id: 'common_ram_gb',
                    label: 'RAM (GB)',
                    type: 'dropdown',
                    options: [
                        { value: '2', label: '2 GB' },
                        { value: '3', label: '3 GB' },
                        { value: '4', label: '4 GB' },
                        { value: '6', label: '6 GB' },
                        { value: '8', label: '8 GB' },
                        { value: '12', label: '12 GB' },
                        { value: '16', label: '16 GB' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 12
                }
            ],
            description: 'Mobile phones and smartphones',
            isActive: true
        });
        
        await smartphones.save();
        console.log(`✅ Created Smartphones (${smartphones.form_schema.length} fields)`);

        // 3. Create Android Phones (LEAF with model and serial number)
        const androidPhones = new Category({
            name: 'Android Phones',
            parent_id: smartphones._id,
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'specific_model_number',
                    label: 'Model Number',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 20
                },
                {
                    field_id: 'specific_serial_number',
                    label: 'Serial Number',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 21
                },
                {
                    field_id: 'specific_android_version',
                    label: 'Android Version',
                    type: 'dropdown',
                    options: [
                        { value: '11', label: 'Android 11' },
                        { value: '12', label: 'Android 12' },
                        { value: '13', label: 'Android 13' },
                        { value: '14', label: 'Android 14' },
                        { value: '15', label: 'Android 15' }
                    ],
                    is_required: false,
                    enabled: true,
                    display_order: 22
                },
                {
                    field_id: 'specific_network_type',
                    label: 'Network Type',
                    type: 'dropdown',
                    options: [
                        { value: '4G', label: '4G LTE' },
                        { value: '5G', label: '5G' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 23
                }
            ],
            description: 'Android-based smartphones',
            isActive: true
        });
        
        await androidPhones.save();
        console.log(`✅ Created LEAF: Android Phones (${androidPhones.form_schema.length} specific fields)`);

        // 4. Create iPhone (LEAF with model and serial number)
        const iphone = new Category({
            name: 'iPhone',
            parent_id: smartphones._id,
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'specific_model_number',
                    label: 'Model Number',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 20
                },
                {
                    field_id: 'specific_serial_number',
                    label: 'Serial Number',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 21
                },
                {
                    field_id: 'specific_ios_version',
                    label: 'iOS Version',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 22
                },
                {
                    field_id: 'specific_face_id',
                    label: 'Face ID',
                    type: 'boolean',
                    default_value: true,
                    is_required: false,
                    enabled: true,
                    display_order: 23
                }
            ],
            description: 'Apple iPhone devices',
            isActive: true
        });
        
        await iphone.save();
        console.log(`✅ Created LEAF: iPhone (${iphone.form_schema.length} specific fields)`);

        // 5. Create Laptops category (with laptop-specific fields including brand)
        const laptops = new Category({
            name: 'Laptops',
            parent_id: electronics._id,
            is_leaf: false,
            form_schema: [
                {
                    field_id: 'common_brand',
                    label: 'Brand',
                    type: 'dropdown',
                    options: [
                        { value: 'Dell', label: 'Dell' },
                        { value: 'HP', label: 'HP' },
                        { value: 'Lenovo', label: 'Lenovo' },
                        { value: 'Asus', label: 'Asus' },
                        { value: 'Acer', label: 'Acer' },
                        { value: 'Apple', label: 'Apple (MacBook)' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 10
                },
                {
                    field_id: 'common_processor',
                    label: 'Processor',
                    type: 'dropdown',
                    options: [
                        { value: 'Intel i3', label: 'Intel Core i3' },
                        { value: 'Intel i5', label: 'Intel Core i5' },
                        { value: 'Intel i7', label: 'Intel Core i7' },
                        { value: 'AMD Ryzen 5', label: 'AMD Ryzen 5' },
                        { value: 'AMD Ryzen 7', label: 'AMD Ryzen 7' },
                        { value: 'Apple M1', label: 'Apple M1' },
                        { value: 'Apple M2', label: 'Apple M2' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 11
                },
                {
                    field_id: 'common_ram_gb',
                    label: 'RAM (GB)',
                    type: 'dropdown',
                    options: [
                        { value: '4', label: '4 GB' },
                        { value: '8', label: '8 GB' },
                        { value: '16', label: '16 GB' },
                        { value: '32', label: '32 GB' },
                        { value: '64', label: '64 GB' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 12
                },
                {
                    field_id: 'common_storage_gb',
                    label: 'Storage (GB)',
                    type: 'dropdown',
                    options: [
                        { value: '256', label: '256 GB SSD' },
                        { value: '512', label: '512 GB SSD' },
                        { value: '1024', label: '1 TB SSD' },
                        { value: '2048', label: '2 TB SSD' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 13
                }
            ],
            description: 'Laptop computers',
            isActive: true
        });
        
        await laptops.save();
        console.log(`✅ Created Laptops (${laptops.form_schema.length} fields)`);

        // 6. Create Gaming Laptops (LEAF with model and serial number)
        const gamingLaptops = new Category({
            name: 'Gaming Laptops',
            parent_id: laptops._id,
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'specific_model_number',
                    label: 'Model Number',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 20
                },
                {
                    field_id: 'specific_serial_number',
                    label: 'Serial Number',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 21
                },
                {
                    field_id: 'specific_graphics_card',
                    label: 'Graphics Card',
                    type: 'dropdown',
                    options: [
                        { value: 'RTX 3060', label: 'NVIDIA RTX 3060' },
                        { value: 'RTX 3070', label: 'NVIDIA RTX 3070' },
                        { value: 'RTX 4060', label: 'NVIDIA RTX 4060' },
                        { value: 'RTX 4070', label: 'NVIDIA RTX 4070' },
                        { value: 'RTX 4080', label: 'NVIDIA RTX 4080' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 22
                },
                {
                    field_id: 'specific_refresh_rate',
                    label: 'Display Refresh Rate (Hz)',
                    type: 'dropdown',
                    options: [
                        { value: '60', label: '60 Hz' },
                        { value: '120', label: '120 Hz' },
                        { value: '144', label: '144 Hz' },
                        { value: '165', label: '165 Hz' },
                        { value: '240', label: '240 Hz' }
                    ],
                    is_required: false,
                    enabled: true,
                    display_order: 23
                }
            ],
            description: 'High-performance gaming laptops',
            isActive: true
        });
        
        await gamingLaptops.save();
        console.log(`✅ Created LEAF: Gaming Laptops (${gamingLaptops.form_schema.length} specific fields)`);

        // Display complete hierarchy
        console.log('\n📊 Complete Category Hierarchy:');
        const allCategories = await Category.find({}).sort({ name: 1 });
        
        for (const category of allCategories) {
            const path = await category.getCategoryPath();
            const pathString = path.map(p => p.name).join(' > ');
            const leafStatus = category.is_leaf ? '🍃 LEAF' : '📁 PARENT';
            console.log(`   ${leafStatus} ${pathString} (${category.form_schema.length} fields)`);
        }

        // Test form schema compilation for leaf categories
        console.log('\n🔍 Testing Form Schema Compilation:');
        const leafCategories = await Category.find({ is_leaf: true });
        
        for (const leaf of leafCategories) {
            try {
                const fullSchema = await Category.compileFullFormSchema(leaf._id);
                console.log(`\n📋 ${leaf.name} - Complete Form (${fullSchema.length} total fields):`);
                
                // Group by category for better display
                const fieldsByCategory = {};
                fullSchema.forEach(field => {
                    if (!fieldsByCategory[field.categoryName]) {
                        fieldsByCategory[field.categoryName] = [];
                    }
                    fieldsByCategory[field.categoryName].push(field);
                });
                
                Object.keys(fieldsByCategory).forEach(categoryName => {
                    console.log(`   From ${categoryName}:`);
                    fieldsByCategory[categoryName].forEach(field => {
                        const requiredText = field.is_required ? '✅ Required' : '⚪ Optional';
                        const enabledText = field.enabled ? '' : '⚠️ Disabled';
                        console.log(`      ${requiredText} ${field.label} (${field.field_id}) ${enabledText}`);
                    });
                });
                
            } catch (error) {
                console.error(`❌ Error compiling schema for ${leaf.name}:`, error.message);
            }
        }

        console.log('\n🎉 Clean category hierarchy seeded successfully!');
        console.log('\n📝 Summary:');
        console.log(`   - Universal fields: ${COMMON_PRODUCT_FIELDS.length} (Price, Warranty, Color)`);
        console.log('   - Brand: Moved to category-specific fields');
        console.log('   - Model & Serial: In product-specific (leaf) fields');
        console.log(`   - Total categories: ${allCategories.length}`);
        console.log(`   - Leaf categories: ${leafCategories.length}`);
        
    } catch (error) {
        console.error('❌ Error seeding categories:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

// Run the seeding
if (require.main === module) {
    seedCategoryHierarchy();
}

module.exports = seedCategoryHierarchy;
