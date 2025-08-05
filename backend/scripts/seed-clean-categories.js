/**
 * Clean Category Hierarchy Script
 * Creates a comprehensive category structure with:
 * - Electronics, Furniture, Kitchen Essentials
 * - Common fields: Model Number, Price, GST (for ALL products)
 * - Category-specific fields: Unique fields per category
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

// Common brand options for various categories
const ELECTRONICS_BRANDS = [
    { value: 'Samsung', label: 'Samsung' },
    { value: 'LG', label: 'LG' },
    { value: 'Sony', label: 'Sony' },
    { value: 'Panasonic', label: 'Panasonic' },
    { value: 'Whirlpool', label: 'Whirlpool' },
    { value: 'IFB', label: 'IFB' },
    { value: 'Bosch', label: 'Bosch' },
    { value: 'Godrej', label: 'Godrej' },
    { value: 'Haier', label: 'Haier' },
    { value: 'Voltas', label: 'Voltas' },
    { value: 'Blue Star', label: 'Blue Star' },
    { value: 'Carrier', label: 'Carrier' },
    { value: 'Daikin', label: 'Daikin' },
    { value: 'Hitachi', label: 'Hitachi' },
    { value: 'Mitsubishi', label: 'Mitsubishi' },
    { value: 'Lloyd', label: 'Lloyd' },
    { value: 'Other', label: 'Other' }
];

const MOBILE_BRANDS = [
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
    { value: 'Honor', label: 'Honor' },
    { value: 'Other', label: 'Other' }
];

const FURNITURE_BRANDS = [
    { value: 'Godrej Interio', label: 'Godrej Interio' },
    { value: 'Nilkamal', label: 'Nilkamal' },
    { value: 'Durian', label: 'Durian' },
    { value: 'Perfect Homes', label: 'Perfect Homes' },
    { value: 'Urban Ladder', label: 'Urban Ladder' },
    { value: 'Pepperfry', label: 'Pepperfry' },
    { value: 'HomeTown', label: 'HomeTown' },
    { value: 'Kurlon', label: 'Kurlon' },
    { value: 'Sleepwell', label: 'Sleepwell' },
    { value: 'Local', label: 'Local' },
    { value: 'Other', label: 'Other' }
];

const KITCHEN_BRANDS = [
    { value: 'Prestige', label: 'Prestige' },
    { value: 'Hawkins', label: 'Hawkins' },
    { value: 'Pigeon', label: 'Pigeon' },
    { value: 'Butterfly', label: 'Butterfly' },
    { value: 'Glen', label: 'Glen' },
    { value: 'Faber', label: 'Faber' },
    { value: 'Elica', label: 'Elica' },
    { value: 'Hindware', label: 'Hindware' },
    { value: 'Sunflame', label: 'Sunflame' },
    { value: 'Other', label: 'Other' }
];

async function seedCleanCategories() {
    try {
        console.log('🧹 Starting comprehensive category hierarchy seeding...');
        
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB');

        // Clear existing categories
        await Category.deleteMany({});
        console.log('🗑️ Cleared existing categories');

        const createdCategories = {};

        // =================== ELECTRONICS ===================
        console.log('\n🔌 Creating Electronics Categories...');
        
        const electronics = new Category({
            name: 'Electronics',
            parent_id: null,
            is_leaf: false,
            form_schema: [],
            isActive: true
        });
        await electronics.save();
        createdCategories['Electronics'] = electronics._id;
        console.log('✅ Electronics root category');

        // Electronics subcategories with their specific fields
        const electronicsCategories = [
            {
                name: 'Mobile',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: MOBILE_BRANDS },
                    { field_id: 'imei', label: 'IMEI Number', type: 'text', is_required: true, enabled: true, display_order: 2 },
                    { field_id: 'os', label: 'Operating System', type: 'dropdown', is_required: true, enabled: true, display_order: 3, 
                      options: [{ value: 'Android', label: 'Android' }, { value: 'iOS', label: 'iOS' }, { value: 'Other', label: 'Other' }] },
                    { field_id: 'storage', label: 'Storage (GB)', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: '32', label: '32 GB' }, { value: '64', label: '64 GB' }, { value: '128', label: '128 GB' }, { value: '256', label: '256 GB' }, { value: '512', label: '512 GB' }, { value: '1024', label: '1 TB' }] },
                    { field_id: 'ram', label: 'RAM (GB)', type: 'dropdown', is_required: true, enabled: true, display_order: 5,
                      options: [{ value: '2', label: '2 GB' }, { value: '3', label: '3 GB' }, { value: '4', label: '4 GB' }, { value: '6', label: '6 GB' }, { value: '8', label: '8 GB' }, { value: '12', label: '12 GB' }, { value: '16', label: '16 GB' }] }
                ]
            },
            {
                name: 'Washing Machine',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: ELECTRONICS_BRANDS },
                    { field_id: 'capacity', label: 'Capacity (kg)', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: '5', label: '5 kg' }, { value: '6', label: '6 kg' }, { value: '7', label: '7 kg' }, { value: '8', label: '8 kg' }, { value: '9', label: '9 kg' }, { value: '10', label: '10 kg' }] },
                    { field_id: 'type', label: 'Type', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'Top Load', label: 'Top Load' }, { value: 'Front Load', label: 'Front Load' }, { value: 'Semi-Automatic', label: 'Semi-Automatic' }] },
                    { field_id: 'star_rating', label: 'Energy Star Rating', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: '1', label: '1 Star' }, { value: '2', label: '2 Star' }, { value: '3', label: '3 Star' }, { value: '4', label: '4 Star' }, { value: '5', label: '5 Star' }] }
                ]
            },
            {
                name: 'Fridge',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: ELECTRONICS_BRANDS },
                    { field_id: 'capacity', label: 'Capacity (Liters)', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: '180', label: '180L' }, { value: '240', label: '240L' }, { value: '300', label: '300L' }, { value: '350', label: '350L' }, { value: '400', label: '400L' }, { value: '500', label: '500L+' }] },
                    { field_id: 'type', label: 'Type', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'Single Door', label: 'Single Door' }, { value: 'Double Door', label: 'Double Door' }, { value: 'French Door', label: 'French Door' }, { value: 'Side by Side', label: 'Side by Side' }] },
                    { field_id: 'star_rating', label: 'Energy Star Rating', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: '1', label: '1 Star' }, { value: '2', label: '2 Star' }, { value: '3', label: '3 Star' }, { value: '4', label: '4 Star' }, { value: '5', label: '5 Star' }] }
                ]
            },
            {
                name: 'Television',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: ELECTRONICS_BRANDS },
                    { field_id: 'screen_size', label: 'Screen Size (inches)', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: '32', label: '32"' }, { value: '43', label: '43"' }, { value: '50', label: '50"' }, { value: '55', label: '55"' }, { value: '65', label: '65"' }, { value: '75', label: '75"' }] },
                    { field_id: 'resolution', label: 'Resolution', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'HD', label: 'HD (720p)' }, { value: 'Full HD', label: 'Full HD (1080p)' }, { value: '4K', label: '4K UHD' }, { value: '8K', label: '8K' }] },
                    { field_id: 'smart_tv', label: 'Smart TV', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }] }
                ]
            },
            {
                name: 'AC',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: ELECTRONICS_BRANDS },
                    { field_id: 'capacity', label: 'Capacity (Tons)', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: '1', label: '1 Ton' }, { value: '1.5', label: '1.5 Ton' }, { value: '2', label: '2 Ton' }] },
                    { field_id: 'type', label: 'Type', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'Split', label: 'Split AC' }, { value: 'Window', label: 'Window AC' }, { value: 'Cassette', label: 'Cassette AC' }] },
                    { field_id: 'star_rating', label: 'Energy Star Rating', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: '1', label: '1 Star' }, { value: '2', label: '2 Star' }, { value: '3', label: '3 Star' }, { value: '4', label: '4 Star' }, { value: '5', label: '5 Star' }] }
                ]
            },
            {
                name: 'Laptop',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: ELECTRONICS_BRANDS },
                    { field_id: 'processor', label: 'Processor', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: 'Intel i3', label: 'Intel i3' }, { value: 'Intel i5', label: 'Intel i5' }, { value: 'Intel i7', label: 'Intel i7' }, { value: 'Intel i9', label: 'Intel i9' }, { value: 'AMD Ryzen 3', label: 'AMD Ryzen 3' }, { value: 'AMD Ryzen 5', label: 'AMD Ryzen 5' }, { value: 'AMD Ryzen 7', label: 'AMD Ryzen 7' }] },
                    { field_id: 'ram', label: 'RAM (GB)', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: '4', label: '4 GB' }, { value: '8', label: '8 GB' }, { value: '16', label: '16 GB' }, { value: '32', label: '32 GB' }] },
                    { field_id: 'storage', label: 'Storage', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: '256GB SSD', label: '256GB SSD' }, { value: '512GB SSD', label: '512GB SSD' }, { value: '1TB SSD', label: '1TB SSD' }, { value: '1TB HDD', label: '1TB HDD' }] }
                ]
            }
        ];

        // Additional Electronics categories (remaining 27)
        const additionalElectronicsCategories = [
            'Microwave', 'Dishwasher', 'Water Purifier', 'Geyser', 'Mixer Grinder', 'Juicer',
            'Rice Cooker', 'Pressure Cooker', 'Induction Cooktop', 'Gas Stove', 'Oven',
            'Toaster', 'Kettle', 'Coffee Maker', 'Blender', 'Food Processor', 'Air Fryer',
            'Vacuum Cleaner', 'Iron', 'Hair Dryer', 'Trimmer', 'Speaker', 'Headphones',
            'Power Bank', 'Charger', 'Camera', 'Printer'
        ];

        // Create main electronics categories
        for (const cat of electronicsCategories) {
            const category = new Category({
                name: cat.name,
                parent_id: createdCategories['Electronics'],
                is_leaf: true,
                form_schema: [...COMMON_FIELDS, ...ELECTRONICS_ONLY_FIELDS, ...cat.fields],
                isActive: true
            });
            await category.save();
            createdCategories[cat.name] = category._id;
            console.log(`✅ ${cat.name}`);
        }

        // Create additional electronics categories with basic fields
        for (const catName of additionalElectronicsCategories) {
            const category = new Category({
                name: catName,
                parent_id: createdCategories['Electronics'],
                is_leaf: true,
                form_schema: [
                    ...COMMON_FIELDS,
                    ...ELECTRONICS_ONLY_FIELDS,
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: ELECTRONICS_BRANDS }
                ],
                isActive: true
            });
            await category.save();
            createdCategories[catName] = category._id;
            console.log(`✅ ${catName}`);
        }

        // =================== FURNITURE ===================
        console.log('\n🪑 Creating Furniture Categories...');
        
        const furniture = new Category({
            name: 'Furniture',
            parent_id: null,
            is_leaf: false,
            form_schema: [],
            isActive: true
        });
        await furniture.save();
        createdCategories['Furniture'] = furniture._id;
        console.log('✅ Furniture root category');

        const furnitureCategories = [
            {
                name: 'Bed',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: FURNITURE_BRANDS },
                    { field_id: 'size', label: 'Size', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: 'Single', label: 'Single' }, { value: 'Double', label: 'Double' }, { value: 'Queen', label: 'Queen' }, { value: 'King', label: 'King' }] },
                    { field_id: 'material', label: 'Material', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'Wood', label: 'Wood' }, { value: 'Metal', label: 'Metal' }, { value: 'Engineered Wood', label: 'Engineered Wood' }] },
                    { field_id: 'storage', label: 'Storage', type: 'dropdown', is_required: false, enabled: true, display_order: 4,
                      options: [{ value: 'Yes', label: 'With Storage' }, { value: 'No', label: 'Without Storage' }] }
                ]
            },
            {
                name: 'Sofa',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: FURNITURE_BRANDS },
                    { field_id: 'seating_capacity', label: 'Seating Capacity', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: '1', label: '1 Seater' }, { value: '2', label: '2 Seater' }, { value: '3', label: '3 Seater' }, { value: '5', label: '5 Seater' }] },
                    { field_id: 'material', label: 'Material', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'Fabric', label: 'Fabric' }, { value: 'Leather', label: 'Leather' }, { value: 'Leatherette', label: 'Leatherette' }] },
                    { field_id: 'type', label: 'Type', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: 'Regular', label: 'Regular' }, { value: 'Recliner', label: 'Recliner' }, { value: 'L-Shape', label: 'L-Shape' }] }
                ]
            },
            {
                name: 'Almirah',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: FURNITURE_BRANDS },
                    { field_id: 'doors', label: 'Number of Doors', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: '2', label: '2 Door' }, { value: '3', label: '3 Door' }, { value: '4', label: '4 Door' }] },
                    { field_id: 'material', label: 'Material', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'Wood', label: 'Wood' }, { value: 'Engineered Wood', label: 'Engineered Wood' }, { value: 'Plywood', label: 'Plywood' }] }
                ]
            },
            {
                name: 'Dressing Table',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: FURNITURE_BRANDS },
                    { field_id: 'mirror', label: 'Mirror Type', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: 'Fixed', label: 'Fixed Mirror' }, { value: 'Movable', label: 'Movable Mirror' }, { value: 'No Mirror', label: 'No Mirror' }] },
                    { field_id: 'drawers', label: 'Number of Drawers', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: '2', label: '2 Drawers' }, { value: '3', label: '3 Drawers' }, { value: '4', label: '4 Drawers' }] }
                ]
            },
            {
                name: 'Dining Table',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: FURNITURE_BRANDS },
                    { field_id: 'seating_capacity', label: 'Seating Capacity', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: '2', label: '2 Seater' }, { value: '4', label: '4 Seater' }, { value: '6', label: '6 Seater' }, { value: '8', label: '8 Seater' }] },
                    { field_id: 'shape', label: 'Shape', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'Rectangular', label: 'Rectangular' }, { value: 'Round', label: 'Round' }, { value: 'Square', label: 'Square' }] }
                ]
            },
            {
                name: 'Center Table',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: FURNITURE_BRANDS },
                    { field_id: 'shape', label: 'Shape', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: 'Rectangular', label: 'Rectangular' }, { value: 'Round', label: 'Round' }, { value: 'Square', label: 'Square' }, { value: 'Oval', label: 'Oval' }] },
                    { field_id: 'storage', label: 'Storage', type: 'dropdown', is_required: false, enabled: true, display_order: 3,
                      options: [{ value: 'Yes', label: 'With Storage' }, { value: 'No', label: 'Without Storage' }] }
                ]
            },
            {
                name: 'Mattress',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: FURNITURE_BRANDS },
                    { field_id: 'size', label: 'Size', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: 'Single', label: 'Single' }, { value: 'Double', label: 'Double' }, { value: 'Queen', label: 'Queen' }, { value: 'King', label: 'King' }] },
                    { field_id: 'type', label: 'Type', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: 'Memory Foam', label: 'Memory Foam' }, { value: 'Spring', label: 'Spring' }, { value: 'Latex', label: 'Latex' }, { value: 'Coir', label: 'Coir' }] },
                    { field_id: 'thickness', label: 'Thickness (inches)', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: '4', label: '4"' }, { value: '6', label: '6"' }, { value: '8', label: '8"' }, { value: '10', label: '10"' }] }
                ]
            }
        ];

        for (const cat of furnitureCategories) {
            const category = new Category({
                name: cat.name,
                parent_id: createdCategories['Furniture'],
                is_leaf: true,
                form_schema: [...COMMON_FIELDS, ...cat.fields],
                isActive: true
            });
            await category.save();
            createdCategories[cat.name] = category._id;
            console.log(`✅ ${cat.name}`);
        }

        // =================== KITCHEN ESSENTIALS ===================
        console.log('\n🍳 Creating Kitchen Essentials Categories...');
        
        const kitchen = new Category({
            name: 'Kitchen Essentials',
            parent_id: null,
            is_leaf: false,
            form_schema: [],
            isActive: true
        });
        await kitchen.save();
        createdCategories['Kitchen Essentials'] = kitchen._id;
        console.log('✅ Kitchen Essentials root category');

        const kitchenCategories = [
            {
                name: 'Cooktop',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: KITCHEN_BRANDS },
                    { field_id: 'type', label: 'Type', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: 'Gas', label: 'Gas Cooktop' }, { value: 'Induction', label: 'Induction Cooktop' }, { value: 'Electric', label: 'Electric Cooktop' }] },
                    { field_id: 'burners', label: 'Number of Burners', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: '2', label: '2 Burner' }, { value: '3', label: '3 Burner' }, { value: '4', label: '4 Burner' }] },
                    { field_id: 'auto_ignition', label: 'Auto Ignition', type: 'dropdown', is_required: false, enabled: true, display_order: 4,
                      options: [{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }] }
                ]
            },
            {
                name: 'Cutlery',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: KITCHEN_BRANDS },
                    { field_id: 'material', label: 'Material', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: 'Stainless Steel', label: 'Stainless Steel' }, { value: 'Silver', label: 'Silver' }, { value: 'Brass', label: 'Brass' }] },
                    { field_id: 'pieces', label: 'Number of Pieces', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: '24', label: '24 Pieces' }, { value: '36', label: '36 Pieces' }, { value: '48', label: '48 Pieces' }, { value: '72', label: '72 Pieces' }] }
                ]
            },
            {
                name: 'Chimney',
                fields: [
                    { field_id: 'brand', label: 'Brand', type: 'dropdown', is_required: true, enabled: true, display_order: 1, options: KITCHEN_BRANDS },
                    { field_id: 'type', label: 'Type', type: 'dropdown', is_required: true, enabled: true, display_order: 2,
                      options: [{ value: 'Wall Mounted', label: 'Wall Mounted' }, { value: 'Island', label: 'Island' }, { value: 'Built-in', label: 'Built-in' }] },
                    { field_id: 'suction_capacity', label: 'Suction Capacity (m³/hr)', type: 'dropdown', is_required: true, enabled: true, display_order: 3,
                      options: [{ value: '600', label: '600' }, { value: '800', label: '800' }, { value: '1000', label: '1000' }, { value: '1200', label: '1200' }] },
                    { field_id: 'filter_type', label: 'Filter Type', type: 'dropdown', is_required: true, enabled: true, display_order: 4,
                      options: [{ value: 'Baffle', label: 'Baffle Filter' }, { value: 'Mesh', label: 'Mesh Filter' }, { value: 'Charcoal', label: 'Charcoal Filter' }] }
                ]
            }
        ];

        for (const cat of kitchenCategories) {
            const category = new Category({
                name: cat.name,
                parent_id: createdCategories['Kitchen Essentials'],
                is_leaf: true,
                form_schema: [...COMMON_FIELDS, ...cat.fields],
                isActive: true
            });
            await category.save();
            createdCategories[cat.name] = category._id;
            console.log(`✅ ${cat.name}`);
        }
        // Summary
        console.log('\n📊 Category Seeding Summary:');
        console.log(`📦 Total Categories Created: ${Object.keys(createdCategories).length}`);
        console.log(`\n� ELECTRONICS (33 subcategories):`);
        console.log(`  - Mobile, Washing Machine, Fridge, Television, AC, Laptop`);
        console.log(`  - Plus 27 additional electronics items`);
        console.log(`\n🪑 FURNITURE (7 subcategories):`);
        console.log(`  - Bed, Sofa, Almirah, Dressing Table, Dining Table, Center Table, Mattress`);
        console.log(`\n🍳 KITCHEN ESSENTIALS (3 subcategories):`);
        console.log(`  - Cooktop, Cutlery, Chimney`);

        console.log('\n✅ Comprehensive category hierarchy seeded successfully!');
        console.log(`🎯 Ready for product seeding with ${Object.keys(createdCategories).length} categories`);

    } catch (error) {
        console.error('❌ Error seeding categories:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the seeding
seedCleanCategories();
