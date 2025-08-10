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
        field_id: 'dealer_price',
        label: 'Dealer Price (₹)',
        type: 'number',
        is_required: false,
        enabled: true,
        display_order: 89 // show before MRP
    },
    {
        field_id: 'mrp', // renamed from price -> mrp
        label: 'MRP (₹)',
        type: 'number',
        is_required: true,
        enabled: true,
        display_order: 90 // moved later so specific fields show first
    },
    {
        field_id: 'model_number',
        label: 'Model Number',
        type: 'text',
        is_required: true,
        enabled: true,
        display_order: 91 // after price
    }
    // Removed Warranty (Months) and Color per request (Color re-added as specific at leaf level)
];

// Helper to build hierarchical metadata
function buildCategoryMeta(level) {
    if (level === 0) return { field_key: 'main_category', field_label: 'Main Category' };
    return { field_key: `sub_category_${level}`, field_label: `Sub Category ${level}` };
}

// NEW: helper to preview a category document before insertion
function previewCategory(cat) {
    const { _id, name, level, field_key, field_label, parent_id, is_leaf, form_schema } = cat;
    console.log(`\n🔍 Preview Insert: ${name}`);
    console.log(JSON.stringify({
        _id,
        name,
        level,
        field_key,
        field_label,
        parent_id,
        is_leaf,
        fields_count: form_schema?.length || 0,
        form_schema: (form_schema || []).map(f => ({
            field_id: f.field_id,
            label: f.label,
            type: f.type,
            display_order: f.display_order,
            required: f.is_required,
            enabled: f.enabled
        }))
    }, null, 2));
}

async function seedCategoryHierarchy() {
    try {
        console.log('🌱 Starting clean category hierarchy seeding...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('🧹 Cleared existing categories');

        // ROOT level 0
        const rootMeta = buildCategoryMeta(0);
        const electronics = new Category({
            name: 'Electronics',
            parent_id: null,
            is_leaf: false,
            level: 0,
            field_key: rootMeta.field_key,
            field_label: rootMeta.field_label,
            form_schema: COMMON_PRODUCT_FIELDS,
            description: 'Electronic devices - Universal fields: Dealer Price, MRP, Model Number (shown after specific fields)',
            isActive: true
        });
        // PREVIEW before save
        previewCategory(electronics);
        await electronics.save();
        console.log(`✅ Created ROOT: Electronics (${COMMON_PRODUCT_FIELDS.length} common fields)`);

    // Level 1 categories (Electronics)
        const level1Meta = buildCategoryMeta(1);
        const smartphones = new Category({
            name: 'Smartphones',
            parent_id: electronics._id,
            is_leaf: false,
            level: 1,
            field_key: level1Meta.field_key,
            field_label: level1Meta.field_label,
            form_schema: [
                // Brand removed here; brand now defined at leaf categories to avoid incorrect brand options for iPhone
            ],
            description: 'Mobile phones and smartphones (brand selected at leaf)',
            isActive: true
        });
        previewCategory(smartphones);
        await smartphones.save();
        console.log(`✅ Created Smartphones (${smartphones.form_schema.length} fields)`);

        const laptops = new Category({
            name: 'Laptops',
            parent_id: electronics._id,
            is_leaf: true, // changed to leaf (no further sub-category)
            level: 1,
            field_key: level1Meta.field_key,
            field_label: level1Meta.field_label,
            form_schema: [
                {
                    field_id: 'brand',
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
                    field_id: 'serial_number',
                    label: 'Serial Number',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 11
                }
            ],
            description: 'Laptop computers (leaf)',
            isActive: true
        });
        // PREVIEW before save
        previewCategory(laptops);
        await laptops.save();
        console.log(`✅ Created Laptops (${laptops.form_schema.length} fields)`);

        // Level 2 (leaf) categories
        const level2Meta = buildCategoryMeta(2);
        const androidPhones = new Category({
            name: 'Android Phones',
            parent_id: smartphones._id,
            is_leaf: true,
            level: 2,
            field_key: level2Meta.field_key,
            field_label: level2Meta.field_label,
            form_schema: [
                {
                    field_id: 'brand',
                    label: 'Brand',
                    type: 'dropdown',
                    options: [
                        { value: 'Samsung', label: 'Samsung' },
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
                    field_id: 'ram_gb',
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
                    is_required: false,
                    enabled: true,
                    display_order: 11
                },
                {
                    field_id: 'storage_gb',
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
                    is_required: false,
                    enabled: true,
                    display_order: 12
                },
                {
                    field_id: 'color',
                    label: 'Color',
                    type: 'dropdown',
                    options: [
                        { value: 'black', label: 'Black' },
                        { value: 'white', label: 'White' },
                        { value: 'blue', label: 'Blue' },
                        { value: 'red', label: 'Red' },
                        { value: 'green', label: 'Green' },
                        { value: 'gold', label: 'Gold' },
                        { value: 'silver', label: 'Silver' }
                    ],
                    is_required: false,
                    enabled: true,
                    display_order: 13
                },
                {
                    field_id: 'serial_number',
                    label: 'Serial Number',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 14
                },
                {
                    field_id: 'android_version',
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
                    display_order: 15
                },
                {
                    field_id: 'mobile_imei',
                    label: 'IMEI',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 16
                }
            ],
            description: 'Android-based smartphones',
            isActive: true
        });
        previewCategory(androidPhones);
        await androidPhones.save();
        console.log(`✅ Created LEAF: Android Phones (${androidPhones.form_schema.length} specific fields)`);

        const iphone = new Category({
            name: 'iPhone',
            parent_id: smartphones._id,
            is_leaf: true,
            level: 2,
            field_key: level2Meta.field_key,
            field_label: level2Meta.field_label,
            form_schema: [
                {
                    field_id: 'brand',
                    label: 'Brand',
                    type: 'dropdown',
                    options: [
                        { value: 'Apple', label: 'Apple' }
                    ],
                    is_required: true,
                    enabled: true,
                    display_order: 10
                },
                {
                    field_id: 'ram_gb',
                    label: 'RAM (GB)',
                    type: 'dropdown',
                    options: [
                        { value: '4', label: '4 GB' },
                        { value: '6', label: '6 GB' },
                        { value: '8', label: '8 GB' },
                        { value: '12', label: '12 GB' },
                        { value: '16', label: '16 GB' }
                    ],
                    is_required: false,
                    enabled: true,
                    display_order: 11
                },
                {
                    field_id: 'storage_gb',
                    label: 'Storage (GB)',
                    type: 'dropdown',
                    options: [
                        { value: '64', label: '64 GB' },
                        { value: '128', label: '128 GB' },
                        { value: '256', label: '256 GB' },
                        { value: '512', label: '512 GB' },
                        { value: '1024', label: '1 TB' }
                    ],
                    is_required: false,
                    enabled: true,
                    display_order: 12
                },
                {
                    field_id: 'color',
                    label: 'Color',
                    type: 'dropdown',
                    options: [
                        { value: 'black', label: 'Black' },
                        { value: 'white', label: 'White' },
                        { value: 'blue', label: 'Blue' },
                        { value: 'red', label: 'Red' },
                        { value: 'green', label: 'Green' },
                        { value: 'gold', label: 'Gold' },
                        { value: 'silver', label: 'Silver' }
                    ],
                    is_required: false,
                    enabled: true,
                    display_order: 13
                },
                {
                    field_id: 'serial_number',
                    label: 'Serial Number',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 14
                },
                {
                    field_id: 'ios_version',
                    label: 'iOS Version',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 15
                },
                {
                    field_id: 'mobile_imei',
                    label: 'IMEI',
                    type: 'text',
                    is_required: false,
                    enabled: true,
                    display_order: 16
                }
            ],
            description: 'Apple iPhone devices',
            isActive: true
        });
        previewCategory(iphone);
        await iphone.save();
        console.log(`✅ Created LEAF: iPhone (${iphone.form_schema.length} specific fields)`);

        // SECOND ROOT: Appliances (demonstrate multi-root capability)
        const appliances = new Category({
            name: 'Appliances',
            parent_id: null,
            is_leaf: false,
            level: 0,
            field_key: rootMeta.field_key,
            field_label: rootMeta.field_label,
            form_schema: [
                // Common fields for Appliances root
                {
                    field_id: 'dealer_price',
                    label: 'Dealer Price (₹)',
                    type: 'number',
                    is_required: false,
                    enabled: true,
                    display_order: 9 // ensure it appears before MRP but after leaf-specific low numbers
                },
                {
                    field_id: 'mrp',
                    label: 'MRP (₹)',
                    type: 'number',
                    is_required: true,
                    enabled: true,
                    display_order: 10
                },
                {
                    field_id: 'model_number',
                    label: 'Model Number',
                    type: 'text',
                    is_required: true,
                    enabled: true,
                    display_order: 11
                }
            ],
            description: 'Home appliances root',
            isActive: true
        });
        previewCategory(appliances);
        await appliances.save();
        console.log(`✅ Created ROOT: Appliances (${appliances.form_schema.length} common fields)`);

        const appliancesLevel1Meta = buildCategoryMeta(1);
        const refrigerators = new Category({
            name: 'Refrigerators',
            parent_id: appliances._id,
            is_leaf: true,
            level: 1,
            field_key: appliancesLevel1Meta.field_key,
            field_label: appliancesLevel1Meta.field_label,
            form_schema: [
                { field_id: 'brand', label: 'Brand', type: 'dropdown', options: [ { value: 'LG', label: 'LG' }, { value: 'Samsung', label: 'Samsung' }, { value: 'Whirlpool', label: 'Whirlpool' }, { value: 'Bosch', label: 'Bosch' } ], is_required: true, enabled: true, display_order: 1 },
                { field_id: 'capacity_l', label: 'Capacity (L)', type: 'number', is_required: false, enabled: true, display_order: 3 },
                { field_id: 'door_type', label: 'Door Type', type: 'dropdown', options: [ { value: 'single_door', label: 'Single Door' }, { value: 'double_door', label: 'Double Door' } ], is_required: false, enabled: true, display_order: 2 },
                { field_id: 'serial_number', label: 'Serial Number', type: 'text', is_required: false, enabled: true, display_order: 4 }
            ],
            description: 'Home refrigerators',
            isActive: true
        });
        previewCategory(refrigerators);
        await refrigerators.save();
        console.log('✅ Created Refrigerators');

        const washingMachines = new Category({
            name: 'Washing Machines',
            parent_id: appliances._id,
            is_leaf: true,
            level: 1,
            field_key: appliancesLevel1Meta.field_key,
            field_label: appliancesLevel1Meta.field_label,
            form_schema: [
                { field_id: 'brand', label: 'Brand', type: 'dropdown', options: [ { value: 'LG', label: 'LG' }, { value: 'Samsung', label: 'Samsung' }, { value: 'IFB', label: 'IFB' }, { value: 'Bosch', label: 'Bosch' } ], is_required: true, enabled: true, display_order: 1 },
                { field_id: 'load_type', label: 'Load Type', type: 'dropdown', options: [ { value: 'front', label: 'Front Load' }, { value: 'top', label: 'Top Load' } ], is_required: false, enabled: true, display_order: 2 },
                { field_id: 'serial_number', label: 'Serial Number', type: 'text', is_required: false, enabled: true, display_order: 3 }
            ],
            description: 'Washing machines',
            isActive: true
        });
        previewCategory(washingMachines);
        await washingMachines.save();
        console.log('✅ Created Washing Machines');

        // Display complete hierarchy
        console.log('\n📊 Complete Category Hierarchy:');
        const allCategories = await Category.find({}).sort({ level: 1, name: 1 });
        
        for (const category of allCategories) {
            const path = await category.getCategoryPath();
            const pathString = path.map(p => p.name).join(' > ');
            const leafStatus = category.is_leaf ? '🍃 LEAF' : '📁 PARENT';
            console.log(`   ${leafStatus} [L${category.level}] ${pathString} (${category.form_schema.length} fields) key=${category.field_key}`);
        }
        // Rebuild materialized trees for both roots
        for (const root of [electronics, appliances]) {
            try {
                const rebuild = await Category.rebuildRootTree(root._id);
                console.log(`\n🛠 Rebuilt materialized tree for root '${root.name}' with ${rebuild.count} nodes.`);
            } catch (reErr) {
                console.error(`⚠️ Failed to rebuild materialized tree for root ${root.name}:`, reErr.message);
            }
        }

        console.log('\n🎉 Clean category hierarchy seeded successfully with hierarchical metadata & materialized tree!');
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
