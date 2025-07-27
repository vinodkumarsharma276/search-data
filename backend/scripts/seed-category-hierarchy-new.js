/**
 * Comprehensive Category Hierarchy Seeding Script
 * Creates a complete category structure with common fields for all products
 * Includes: Brand, Model, Serial Number, MRP, Warranty, Color as universal fields
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

// Common fields that apply to ALL products (will be in root category)
const COMMON_PRODUCT_FIELDS = [
    {
        field_id: 'common_brand',
        label: 'Brand',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 1
    },
    {
        field_id: 'common_model',
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
        is_required: false,
        enabled: true,
        display_order: 3
    },
    {
        field_id: 'common_price',
        label: 'MRP (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 4
    },
    {
        field_id: 'common_warranty_months',
        label: 'Warranty (Months)',
        type: 'number',
        default_value: 12,
        is_required: true,
        enabled: true,
        display_order: 5
    },
    {
        field_id: 'common_color',
        label: 'Color',
        type: 'text',
        is_required: false,
        enabled: true,
        display_order: 6
    }
];

async function seedCategoryHierarchy() {
    try {
        console.log('🌱 Starting comprehensive category hierarchy seeding...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('🧹 Cleared existing categories');

        // Store created categories for parent references
        const createdCategories = {};
        
        // 1. Create ROOT: Electronics (with all common fields)
        const electronics = new Category({
            name: 'Electronics',
            parent_id: null,
            is_leaf: false,
            form_schema: COMMON_PRODUCT_FIELDS,
            description: 'Electronic devices and gadgets - Contains universal product fields',
            isActive: true
        });
        
        await electronics.save();
        createdCategories['Electronics'] = electronics._id;
        console.log(`✅ Created ROOT category: Electronics (${COMMON_PRODUCT_FIELDS.length} common fields)`);

        // 2. Create LEVEL 1: Smartphones (inherits common fields + smartphone-specific)
        const smartphones = new Category({
            name: 'Smartphones',
            parent_id: createdCategories['Electronics'],
            is_leaf: false,
            form_schema: [
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
                    display_order: 10
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
                    display_order: 11
                },
                {
                    field_id: 'common_screen_size',
                    label: 'Screen Size (inches)',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 12
                }
            ],
            description: 'Mobile phones and smartphones',
            isActive: true
        });
        
        await smartphones.save();
        createdCategories['Smartphones'] = smartphones._id;
        console.log(`✅ Created category: Smartphones (${smartphones.form_schema.length} additional fields)`);

        // 3. Create LEVEL 1: Laptops (inherits common fields + laptop-specific)
        const laptops = new Category({
            name: 'Laptops',
            parent_id: createdCategories['Electronics'],
            is_leaf: false,
            form_schema: [
                {
                    field_id: 'common_processor',
                    label: 'Processor',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 10
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
                    display_order: 11
                },
                {
                    field_id: 'common_storage_type',
                    label: 'Storage Type',
                    type: 'dropdown',
                    options: [
                        { value: 'HDD', label: 'HDD' },
                        { value: 'SSD', label: 'SSD' },
                        { value: 'Hybrid', label: 'Hybrid' }
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
                        { value: '256', label: '256 GB' },
                        { value: '512', label: '512 GB' },
                        { value: '1024', label: '1 TB' },
                        { value: '2048', label: '2 TB' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 13
                },
                {
                    field_id: 'common_screen_size',
                    label: 'Screen Size (inches)',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 14
                }
            ],
            description: 'Laptop computers',
            isActive: true
        });
        
        await laptops.save();
        createdCategories['Laptops'] = laptops._id;
        console.log(`✅ Created category: Laptops (${laptops.form_schema.length} additional fields)`);

        // 4. Create LEAF: Android Phones (inherits all parent fields + specific)
        const androidPhones = new Category({
            name: 'Android Phones',
            parent_id: createdCategories['Smartphones'],
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'specific_android_version',
                    label: 'Android Version',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 20
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
                    display_order: 21
                },
                {
                    field_id: 'specific_dual_sim',
                    label: 'Dual SIM',
                    type: 'boolean',
                    default_value: false,
                    is_required: false,
                    enabled: true,
                    display_order: 22
                }
            ],
            description: 'Android-based smartphones',
            isActive: true
        });
        
        await androidPhones.save();
        createdCategories['Android Phones'] = androidPhones._id;
        console.log(`✅ Created LEAF category: Android Phones (${androidPhones.form_schema.length} specific fields)`);

        // 5. Create LEAF: iPhone (inherits all parent fields + specific)
        const iphone = new Category({
            name: 'iPhone',
            parent_id: createdCategories['Smartphones'],
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'specific_ios_version',
                    label: 'iOS Version',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 20
                },
                {
                    field_id: 'specific_face_id',
                    label: 'Face ID',
                    type: 'boolean',
                    default_value: true,
                    is_required: false,
                    enabled: true,
                    display_order: 21
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
                    display_order: 22
                }
            ],
            description: 'Apple iPhone devices',
            isActive: true
        });
        
        await iphone.save();
        createdCategories['iPhone'] = iphone._id;
        console.log(`✅ Created LEAF category: iPhone (${iphone.form_schema.length} specific fields)`);

        // 6. Create LEAF: Gaming Laptops (inherits all parent fields + specific)
        const gamingLaptops = new Category({
            name: 'Gaming Laptops',
            parent_id: createdCategories['Laptops'],
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'specific_graphics_card',
                    label: 'Graphics Card',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 20
                },
                {
                    field_id: 'specific_cooling_system',
                    label: 'Cooling System',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 21
                },
                {
                    field_id: 'specific_rgb_keyboard',
                    label: 'RGB Keyboard',
                    type: 'boolean',
                    default_value: false,
                    is_required: false,
                    enabled: true,
                    display_order: 22
                }
            ],
            description: 'High-performance gaming laptops',
            isActive: true
        });
        
        await gamingLaptops.save();
        createdCategories['Gaming Laptops'] = gamingLaptops._id;
        console.log(`✅ Created LEAF category: Gaming Laptops (${gamingLaptops.form_schema.length} specific fields)`);

        // 7. Create LEAF: Business Laptops (inherits all parent fields + specific)
        const businessLaptops = new Category({
            name: 'Business Laptops',
            parent_id: createdCategories['Laptops'],
            is_leaf: true,
            form_schema: [
                {
                    field_id: 'specific_fingerprint_reader',
                    label: 'Fingerprint Reader',
                    type: 'boolean',
                    default_value: false,
                    is_required: false,
                    enabled: true,
                    display_order: 20
                },
                {
                    field_id: 'specific_tpm_chip',
                    label: 'TPM Security Chip',
                    type: 'boolean',
                    default_value: false,
                    is_required: false,
                    enabled: true,
                    display_order: 21
                },
                {
                    field_id: 'specific_docking_support',
                    label: 'Docking Station Support',
                    type: 'boolean',
                    default_value: false,
                    is_required: false,
                    enabled: true,
                    display_order: 22
                }
            ],
            description: 'Professional business laptops',
            isActive: true
        });
        
        await businessLaptops.save();
        createdCategories['Business Laptops'] = businessLaptops._id;
        console.log(`✅ Created LEAF category: Business Laptops (${businessLaptops.form_schema.length} specific fields)`);

        // Display category hierarchy
        console.log('\n📊 Category Hierarchy Created:');
        const allCategories = await Category.find({}).sort({ name: 1 });
        
        for (const category of allCategories) {
            const path = await category.getCategoryPath();
            const pathString = path.map(p => p.name).join(' > ');
            console.log(`   ${pathString} (${category.form_schema.length} fields, Leaf: ${category.is_leaf})`);
        }

        // Test form schema compilation for leaf categories
        console.log('\n🔍 Testing Form Schema Compilation for LEAF Categories:');
        const leafCategories = await Category.find({ is_leaf: true });
        
        for (const leaf of leafCategories) {
            try {
                const fullSchema = await Category.compileFullFormSchema(leaf._id);
                console.log(`\n📋 ${leaf.name} - Complete Form Schema (${fullSchema.length} total fields):`);
                
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
                        const requiredText = field.is_required ? '(Required)' : '(Optional)';
                        const enabledText = field.enabled ? '✅' : '⚠️ Disabled';
                        console.log(`      ${enabledText} ${field.label} (${field.field_id}) - ${field.type} ${requiredText}`);
                    });
                });
                
            } catch (error) {
                console.error(`❌ Error compiling schema for ${leaf.name}:`, error.message);
            }
        }

        console.log('\n🎉 Comprehensive category hierarchy with common fields seeded successfully!');
        console.log('\n📝 Summary:');
        console.log(`   - Total categories: ${allCategories.length}`);
        console.log(`   - Leaf categories: ${leafCategories.length}`);
        console.log(`   - Common fields in all products: ${COMMON_PRODUCT_FIELDS.length}`);
        console.log('   - Fields include: Brand, Model, Serial Number, MRP, Warranty, Color');
        
    } catch (error) {
        console.error('❌ Error seeding categories:', error.message);
        console.error(error.stack);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
    }
}

// Run the seeding
seedCategoryHierarchy();
