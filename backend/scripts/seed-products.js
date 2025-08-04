/**
 * Product Seeding Script
 * Creates dummy products for testing based on existing categories
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Distributor = require('../models/Distributor');
require('dotenv').config();

async function seedProducts() {
    try {
        console.log('📦 Starting product seeding...');
        
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        console.log('✅ Connected to MongoDB');

        // Get all distributors for random assignment
        const distributors = await Distributor.find();
        if (distributors.length === 0) {
            throw new Error('No distributors found! Please seed distributors first.');
        }
        console.log(`👥 Found ${distributors.length} distributors`);

        // Clear existing products
        await Product.deleteMany({});
        console.log('🗑️ Cleared existing products');

        // Get all leaf categories (only leaf categories can have products)
        const leafCategories = await Category.find({ is_leaf: true });
        console.log(`📋 Found ${leafCategories.length} leaf categories`);

        let totalProducts = 0;

        for (const category of leafCategories) {
            console.log(`\n📱 Creating products for category: ${category.name}`);
            
            // Create 2-3 products per category
            const productsToCreate = Math.floor(Math.random() * 2) + 2; // 2-3 products
            
            for (let i = 1; i <= productsToCreate; i++) {
                const productData = await generateProductData(category, i, distributors);
                const product = new Product(productData);
                await product.save();
                totalProducts++;
                console.log(`  ✅ Created: ${productData.name}`);
            }
        }

        console.log(`\n🎉 Product seeding complete! Created ${totalProducts} products across ${leafCategories.length} categories`);

    } catch (error) {
        console.error('❌ Error seeding products:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

// Generate product data based on category schema
async function generateProductData(category, productIndex, distributors) {
    const categoryName = category.name;
    
    // Pick a random distributor
    const randomDistributor = distributors[Math.floor(Math.random() * distributors.length)];
    
    const productData = {
        name: generateProductName(categoryName, productIndex),
        category_id: category._id,
        categoryId: category._id, // Also add categoryId for search compatibility
        category_name: categoryName,
        supplierId: randomDistributor._id, // Required field
        created_at: new Date(),
        updated_at: new Date()
    };

    // Fill all fields at root level as simple key-value pairs
    for (const field of category.form_schema) {
        const value = generateFieldValue(field, categoryName, productIndex);
        productData[field.field_id] = value;
    }

    return productData;
}

// Generate realistic product names
function generateProductName(categoryName, index) {
    const names = {
        'Mobile': [
            'iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra', 'Xiaomi 14 Pro',
            'OnePlus 12', 'Google Pixel 8 Pro', 'Nothing Phone 2'
        ],
        'Smart TV': [
            'Samsung 55" QLED 4K Smart TV', 'LG 65" OLED Smart TV', 'Sony Bravia 50" 4K LED TV',
            'TCL 43" Android TV', 'Mi TV 5X 55"', 'OnePlus TV Y1S 32"'
        ],
        'Fridge': [
            'Samsung 253L Double Door Refrigerator', 'LG 190L Single Door Fridge', 'Whirlpool 265L Frost Free',
            'Haier 195L Direct Cool', 'Godrej 240L Double Door', 'Bosch 288L Side by Side'
        ],
        'AC': [
            'Daikin 1.5 Ton Split AC', 'LG 1 Ton Window AC', 'Samsung 2 Ton Inverter AC',
            'Voltas 1.5 Ton Split AC', 'Blue Star 1 Ton Split AC', 'Carrier 2 Ton Window AC'
        ],
        'Sofa': [
            '3 Seater Fabric Sofa Set', '5 Seater L-Shape Sofa', '2 Seater Leather Sofa',
            'Recliner Sofa Set', 'Corner Sofa Set', 'Modular Sofa Collection'
        ],
        'Dressing Table': [
            'Wooden Dressing Table with Mirror', 'Modern Dressing Table', 'Compact Dressing Unit',
            'Designer Dressing Table', 'Storage Dressing Table', 'Vintage Style Dressing Table'
        ],
        'Double Bed Headrest': [
            'Queen Size Wooden Bed with Headrest', 'King Size Designer Bed', 'Modern Platform Bed',
            'Classic Wooden Double Bed', 'Upholstered Headboard Bed', 'Storage Bed with Headrest'
        ],
        'Single Bed Headrest': [
            'Single Wooden Bed with Headrest', 'Modern Single Bed', 'Compact Single Bed',
            'Designer Single Bed Frame', 'Kids Single Bed', 'Guest Room Single Bed'
        ],
        'Double Bed w/o Headrest': [
            'Simple Double Bed Frame', 'Minimalist Double Bed', 'Basic Wooden Double Bed',
            'Platform Double Bed', 'Low Profile Double Bed', 'Contemporary Double Bed'
        ],
        'Single Bed w/o Headrest': [
            'Simple Single Bed Frame', 'Basic Single Bed', 'Minimalist Single Bed',
            'Student Single Bed', 'Compact Single Bed Frame', 'Budget Single Bed'
        ]
    };

    const categoryNames = names[categoryName] || [`${categoryName} Product ${index}`];
    return categoryNames[(index - 1) % categoryNames.length];
}

// Generate field values based on field type and category
function generateFieldValue(field, categoryName, productIndex) {
    switch (field.field_id) {
        case 'model_number':
            return `${categoryName.substring(0, 3).toUpperCase()}${String(Math.floor(Math.random() * 9000) + 1000)}`;
        
        case 'serial_number':
            return `SN${String(Math.floor(Math.random() * 900000) + 100000)}`;
        
        case 'dealer_price':
            return getRandomPrice(categoryName, 'dealer');
        
        case 'mrp':
            return getRandomPrice(categoryName, 'mrp');
        
        case 'igst':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : 18;
        
        case 'cgst':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : 9;
        
        case 'brand':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : 'Samsung';
        
        case 'imei':
            return String(Math.floor(Math.random() * 900000000000000) + 100000000000000);
        
        case 'os':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : 'Android';
        
        case 'storage':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : '128';
        
        case 'ram':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : '8';
        
        case 'star_rating':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : '4';
        
        case 'seating_capacity':
            return Math.floor(Math.random() * 6) + 2; // 2-7 seater
        
        case 'material':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : 'Wood';
        
        case 'polish':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : 'PU';
        
        case 'board_finish':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : 'Laminate';
        
        case 'color':
            const colors = ['Brown', 'Black', 'White', 'Walnut', 'Natural', 'Cherry'];
            return colors[Math.floor(Math.random() * colors.length)];
        
        case 'shape':
            return field.options ? field.options[Math.floor(Math.random() * field.options.length)].value : 'Rectangle';
        
        case 'dimensions':
            if (categoryName.includes('Table')) {
                return `${Math.floor(Math.random() * 60) + 90}cm x ${Math.floor(Math.random() * 40) + 60}cm x ${Math.floor(Math.random() * 20) + 70}cm`;
            } else {
                return `${Math.floor(Math.random() * 40) + 180}cm x ${Math.floor(Math.random() * 40) + 90}cm x ${Math.floor(Math.random() * 20) + 80}cm`;
            }
        
        default:
            if (field.type === 'dropdown' && field.options) {
                return field.options[Math.floor(Math.random() * field.options.length)].value;
            } else if (field.type === 'number') {
                return Math.floor(Math.random() * 1000) + 100;
            } else {
                return `Sample ${field.label}`;
            }
    }
}

// Generate realistic prices based on category
function getRandomPrice(categoryName, priceType) {
    const priceRanges = {
        'Mobile': { min: 8000, max: 120000 },
        'Smart TV': { min: 15000, max: 200000 },
        'Fridge': { min: 12000, max: 80000 },
        'AC': { min: 25000, max: 150000 },
        'Sofa': { min: 15000, max: 100000 },
        'Dressing Table': { min: 5000, max: 25000 },
        'Double Bed Headrest': { min: 12000, max: 50000 },
        'Single Bed Headrest': { min: 8000, max: 30000 },
        'Double Bed w/o Headrest': { min: 8000, max: 35000 },
        'Single Bed w/o Headrest': { min: 5000, max: 20000 }
    };

    const range = priceRanges[categoryName] || { min: 5000, max: 50000 };
    const basePrice = Math.floor(Math.random() * (range.max - range.min) + range.min);
    
    if (priceType === 'dealer') {
        // Dealer price is typically 15-25% less than MRP
        return Math.floor(basePrice * 0.8);
    } else {
        // MRP
        return basePrice;
    }
}

// Run the seeding
seedProducts();
