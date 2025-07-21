const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');

// Sample data
const categories = [
    { name: 'Mobile Phones', description: 'Smartphones and feature phones' },
    { name: 'Televisions', description: 'LED, OLED, and Smart TVs' },
    { name: 'Laptops', description: 'Laptops and notebooks' },
    { name: 'Air Conditioners', description: 'Split and window ACs' },
    { name: 'Refrigerators', description: 'Single and double door fridges' },
    { name: 'Washing Machines', description: 'Front and top load washing machines' },
    { name: 'Accessories', description: 'Mobile accessories and electronics' }
];

const brands = [
    { name: 'Samsung', description: 'Korean electronics manufacturer' },
    { name: 'Apple', description: 'American technology company' },
    { name: 'OnePlus', description: 'Chinese smartphone manufacturer' },
    { name: 'Xiaomi', description: 'Chinese electronics company' },
    { name: 'Sony', description: 'Japanese electronics company' },
    { name: 'LG', description: 'Korean electronics company' },
    { name: 'Dell', description: 'American computer technology company' },
    { name: 'HP', description: 'American information technology company' },
    { name: 'Lenovo', description: 'Chinese technology company' },
    { name: 'Whirlpool', description: 'American home appliances manufacturer' },
    { name: 'Godrej', description: 'Indian consumer goods company' },
    { name: 'Haier', description: 'Chinese home appliances company' }
];

async function seedData() {
    try {
        console.log('🌱 Starting database seeding...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await Category.deleteMany({});
        await Brand.deleteMany({});
        await Product.deleteMany({});

        // Insert categories
        console.log('📂 Inserting categories...');
        const insertedCategories = await Category.insertMany(categories);
        console.log(`✅ Inserted ${insertedCategories.length} categories`);

        // Insert brands
        console.log('🏷️ Inserting brands...');
        const insertedBrands = await Brand.insertMany(brands);
        console.log(`✅ Inserted ${insertedBrands.length} brands`);

        // Create products
        console.log('📱 Creating products...');
        const products = [];

        // Mobile Phones
        const mobileCategory = insertedCategories.find(c => c.name === 'Mobile Phones');
        const samsungBrand = insertedBrands.find(b => b.name === 'Samsung');
        const appleBrand = insertedBrands.find(b => b.name === 'Apple');
        const onePlusBrand = insertedBrands.find(b => b.name === 'OnePlus');
        const xiaomiBrand = insertedBrands.find(b => b.name === 'Xiaomi');

        products.push(
            {
                name: 'Galaxy S24 Ultra',
                modelNumber: 'SM-S928B',
                brandId: samsungBrand._id,
                categoryId: mobileCategory._id,
                mrp: 129999,
                sellingPrice: 119999,
                basePrice: 119999,
                gstRate: 18,
                specifications: { storage: '256GB', ram: '12GB', color: 'Titanium Black' }
            },
            {
                name: 'Galaxy A54 5G',
                modelNumber: 'SM-A546B',
                brandId: samsungBrand._id,
                categoryId: mobileCategory._id,
                mrp: 38999,
                sellingPrice: 35999,
                basePrice: 35999,
                gstRate: 18,
                specifications: { storage: '128GB', ram: '8GB', color: 'Awesome Violet' }
            },
            {
                name: 'iPhone 15 Pro',
                modelNumber: 'A3101',
                brandId: appleBrand._id,
                categoryId: mobileCategory._id,
                mrp: 134900,
                sellingPrice: 129900,
                basePrice: 129900,
                gstRate: 18,
                specifications: { storage: '128GB', ram: '8GB', color: 'Natural Titanium' }
            },
            {
                name: 'OnePlus 12',
                modelNumber: 'OP12',
                brandId: onePlusBrand._id,
                categoryId: mobileCategory._id,
                mrp: 64999,
                sellingPrice: 59999,
                basePrice: 59999,
                gstRate: 18,
                specifications: { storage: '256GB', ram: '12GB', color: 'Silky Black' }
            },
            {
                name: 'Redmi Note 13 Pro',
                modelNumber: 'RN13P',
                brandId: xiaomiBrand._id,
                categoryId: mobileCategory._id,
                mrp: 26999,
                sellingPrice: 24999,
                basePrice: 24999,
                gstRate: 18,
                specifications: { storage: '128GB', ram: '8GB', color: 'Midnight Black' }
            }
        );

        // Televisions
        const tvCategory = insertedCategories.find(c => c.name === 'Televisions');
        const sonyBrand = insertedBrands.find(b => b.name === 'Sony');
        const lgBrand = insertedBrands.find(b => b.name === 'LG');

        products.push(
            {
                name: 'Samsung 55" Crystal 4K Smart TV',
                modelNumber: 'UA55AU7700',
                brandId: samsungBrand._id,
                categoryId: tvCategory._id,
                mrp: 54990,
                sellingPrice: 49990,
                basePrice: 49990,
                gstRate: 18,
                specifications: { size: '55 inch', resolution: '4K UHD', smartTV: true, panel: 'Crystal Display' }
            },
            {
                name: 'Sony Bravia 43" Smart TV',
                modelNumber: 'KD-43X75K',
                brandId: sonyBrand._id,
                categoryId: tvCategory._id,
                mrp: 45990,
                sellingPrice: 42990,
                basePrice: 42990,
                gstRate: 18,
                specifications: { size: '43 inch', resolution: '4K UHD', smartTV: true, panel: 'LED' }
            },
            {
                name: 'LG 32" Smart TV',
                modelNumber: 'LG32LQ630',
                brandId: lgBrand._id,
                categoryId: tvCategory._id,
                mrp: 24990,
                sellingPrice: 22990,
                basePrice: 22990,
                gstRate: 18,
                specifications: { size: '32 inch', resolution: 'HD Ready', smartTV: true, panel: 'LED' }
            }
        );

        // Laptops
        const laptopCategory = insertedCategories.find(c => c.name === 'Laptops');
        const dellBrand = insertedBrands.find(b => b.name === 'Dell');
        const hpBrand = insertedBrands.find(b => b.name === 'HP');

        products.push(
            {
                name: 'Dell Inspiron 15 3000',
                modelNumber: 'I3511-3468BLK',
                brandId: dellBrand._id,
                categoryId: laptopCategory._id,
                mrp: 45990,
                sellingPrice: 42990,
                basePrice: 42990,
                gstRate: 18,
                specifications: { processor: 'Intel i3', ram: '8GB', storage: '1TB HDD', screen: '15.6 inch' }
            },
            {
                name: 'HP Pavilion x360',
                modelNumber: 'HP14-DY0001',
                brandId: hpBrand._id,
                categoryId: laptopCategory._id,
                mrp: 65990,
                sellingPrice: 59990,
                basePrice: 59990,
                gstRate: 18,
                specifications: { processor: 'Intel i5', ram: '8GB', storage: '512GB SSD', screen: '14 inch touchscreen' }
            }
        );

        // Insert products
        const insertedProducts = await Product.insertMany(products);
        console.log(`✅ Inserted ${insertedProducts.length} products`);

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Categories: ${insertedCategories.length}`);
        console.log(`- Brands: ${insertedBrands.length}`);
        console.log(`- Products: ${insertedProducts.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    seedData();
}

module.exports = seedData;
