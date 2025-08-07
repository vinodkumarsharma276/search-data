const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');
const Customer = require('../models/Customer');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');

const seedData = async () => {
    try {
        console.log('🔄 Starting comprehensive data seeding...');

        // Clear existing data
        await Category.deleteMany({});
        await Brand.deleteMany({});
        await Product.deleteMany({});
        await InventoryItem.deleteMany({});
        await Customer.deleteMany({});
        
        console.log('🗑️ Cleared existing data');

        // 1. CREATE CATEGORIES
        const categories = await Category.insertMany([
            { name: 'Mobile Phones', description: 'Smartphones and feature phones' },
            { name: 'Laptops', description: 'Laptops and notebooks' },
            { name: 'Televisions', description: 'Smart TVs and LED TVs' },
            { name: 'Home Appliances', description: 'Refrigerators, washing machines, etc.' },
            { name: 'Audio Devices', description: 'Headphones, speakers, earbuds' },
            { name: 'Gaming', description: 'Gaming consoles and accessories' }
        ]);
        console.log('✅ Categories created:', categories.length);

        // 2. CREATE BRANDS (with categories array)
        const brands = await Brand.insertMany([
            // Mobile brands
            { name: 'Samsung Mobile', categories: [categories[0]._id] },
            { name: 'Apple iPhone', categories: [categories[0]._id] },
            { name: 'OnePlus', categories: [categories[0]._id] },
            { name: 'Xiaomi', categories: [categories[0]._id] },
            
            // Laptop brands
            { name: 'Dell', categories: [categories[1]._id] },
            { name: 'HP', categories: [categories[1]._id] },
            { name: 'Lenovo', categories: [categories[1]._id] },
            { name: 'Apple MacBook', categories: [categories[1]._id] },
            
            // TV brands
            { name: 'Samsung TV', categories: [categories[2]._id] },
            { name: 'LG', categories: [categories[2]._id] },
            { name: 'Sony TV', categories: [categories[2]._id] },
            { name: 'MI TV', categories: [categories[2]._id] },
            
            // Home Appliance brands
            { name: 'Whirlpool', categories: [categories[3]._id] },
            { name: 'LG Appliances', categories: [categories[3]._id] },
            { name: 'Samsung Appliances', categories: [categories[3]._id] },
            { name: 'Godrej', categories: [categories[3]._id] },
            
            // Audio brands
            { name: 'Sony Audio', categories: [categories[4]._id] },
            { name: 'JBL', categories: [categories[4]._id] },
            { name: 'Boat', categories: [categories[4]._id] },
            { name: 'Apple Audio', categories: [categories[4]._id] },
            
            // Gaming brands
            { name: 'Sony PlayStation', categories: [categories[5]._id] },
            { name: 'Microsoft Xbox', categories: [categories[5]._id] },
            { name: 'Nintendo', categories: [categories[5]._id] }
        ]);
        console.log('✅ Brands created:', brands.length);
        
        // Debug: Show created brands
        console.log('📋 Created brands:');
        for (let i = 0; i < brands.length; i++) {
            const brand = brands[i];
            console.log(`  ${i + 1}. ${brand.name} (Categories: ${brand.categories.length})`);
        }

        // Helper function to find brand by name and category
        const findBrand = (name, categoryIndex) => {
            const brand = brands.find(b => b.name === name && b.categories.includes(categories[categoryIndex]._id));
            if (!brand) {
                console.error(`Brand '${name}' not found for category '${categories[categoryIndex].name}'`);
                throw new Error(`Brand '${name}' not found for category '${categories[categoryIndex].name}'`);
            }
            return brand;
        };

        // 3. CREATE PRODUCTS
        const products = [];

        // Mobile Products
        const mobileProducts = [
            { name: 'Galaxy S24 Ultra', modelNumber: 'SM-S928B', brandId: findBrand('Samsung Mobile', 0)._id, categoryId: categories[0]._id, mrp: 134999, sellingPrice: 124999, basePrice: 120000, gstRate: 18 },
            { name: 'Galaxy S24', modelNumber: 'SM-S921B', brandId: findBrand('Samsung Mobile', 0)._id, categoryId: categories[0]._id, mrp: 89999, sellingPrice: 79999, basePrice: 76000, gstRate: 18 },
            { name: 'iPhone 15 Pro Max', modelNumber: 'A3108', brandId: findBrand('Apple iPhone', 0)._id, categoryId: categories[0]._id, mrp: 159900, sellingPrice: 149900, basePrice: 145000, gstRate: 18 },
            { name: 'iPhone 15', modelNumber: 'A3105', brandId: findBrand('Apple iPhone', 0)._id, categoryId: categories[0]._id, mrp: 79900, sellingPrice: 74900, basePrice: 72000, gstRate: 18 },
            { name: 'OnePlus 12', modelNumber: 'CPH2573', brandId: findBrand('OnePlus', 0)._id, categoryId: categories[0]._id, mrp: 64999, sellingPrice: 59999, basePrice: 57000, gstRate: 18 },
            { name: 'Redmi Note 13 Pro', modelNumber: '23124RN87G', brandId: findBrand('Xiaomi', 0)._id, categoryId: categories[0]._id, mrp: 24999, sellingPrice: 22999, basePrice: 21000, gstRate: 18 }
        ];

        // Laptop Products
        const laptopProducts = [
            { name: 'XPS 13', modelNumber: '9340', brandId: findBrand('Dell', 1)._id, categoryId: categories[1]._id, mrp: 124999, sellingPrice: 119999, basePrice: 115000, gstRate: 18 },
            { name: 'Inspiron 15 3000', modelNumber: '3511', brandId: findBrand('Dell', 1)._id, categoryId: categories[1]._id, mrp: 45999, sellingPrice: 42999, basePrice: 40000, gstRate: 18 },
            { name: 'Pavilion x360', modelNumber: '14-ek1013TU', brandId: findBrand('HP', 1)._id, categoryId: categories[1]._id, mrp: 65999, sellingPrice: 62999, basePrice: 60000, gstRate: 18 },
            { name: 'ThinkPad E14', modelNumber: '21E3S0QG00', brandId: findBrand('Lenovo', 1)._id, categoryId: categories[1]._id, mrp: 78999, sellingPrice: 74999, basePrice: 72000, gstRate: 18 },
            { name: 'MacBook Air M2', modelNumber: 'MLXY3HN/A', brandId: findBrand('Apple MacBook', 1)._id, categoryId: categories[1]._id, mrp: 119900, sellingPrice: 114900, basePrice: 110000, gstRate: 18 }
        ];

        // TV Products
        const tvProducts = [
            { name: '55" QLED 4K Smart TV', modelNumber: 'QA55Q70CAKLXL', brandId: findBrand('Samsung TV', 2)._id, categoryId: categories[2]._id, mrp: 89999, sellingPrice: 84999, basePrice: 80000, gstRate: 18 },
            { name: '43" Crystal 4K UHD Smart TV', modelNumber: 'UA43AU7700KLXL', brandId: findBrand('Samsung TV', 2)._id, categoryId: categories[2]._id, mrp: 42999, sellingPrice: 39999, basePrice: 38000, gstRate: 18 },
            { name: '55" OLED C3 Smart TV', modelNumber: 'OLED55C3PSA', brandId: findBrand('LG', 2)._id, categoryId: categories[2]._id, mrp: 134999, sellingPrice: 129999, basePrice: 125000, gstRate: 18 },
            { name: '65" BRAVIA XR OLED', modelNumber: 'XR-65A80L', brandId: findBrand('Sony TV', 2)._id, categoryId: categories[2]._id, mrp: 199999, sellingPrice: 189999, basePrice: 185000, gstRate: 18 },
            { name: '50" 4K Ultra HD Smart TV', modelNumber: 'L50M7-A2IN', brandId: findBrand('MI TV', 2)._id, categoryId: categories[2]._id, mrp: 39999, sellingPrice: 36999, basePrice: 35000, gstRate: 18 }
        ];

        // Home Appliance Products
        const applianceProducts = [
            { name: '242L 3 Star Refrigerator', modelNumber: 'NEO DF258 PRM', brandId: findBrand('Whirlpool', 3)._id, categoryId: categories[3]._id, mrp: 28999, sellingPrice: 26999, basePrice: 25000, gstRate: 18 },
            { name: '7kg Front Load Washing Machine', modelNumber: 'FHM1207ZDL', brandId: findBrand('LG Appliances', 3)._id, categoryId: categories[3]._id, mrp: 42999, sellingPrice: 39999, basePrice: 38000, gstRate: 18 },
            { name: '1.5 Ton 3 Star Split AC', modelNumber: 'AR18AY3YATB', brandId: findBrand('Samsung Appliances', 3)._id, categoryId: categories[3]._id, mrp: 45999, sellingPrice: 42999, basePrice: 40000, gstRate: 18 },
            { name: '190L 4 Star Refrigerator', modelNumber: 'RD1904PT', brandId: findBrand('Godrej', 3)._id, categoryId: categories[3]._id, mrp: 19999, sellingPrice: 18999, basePrice: 17500, gstRate: 18 }
        ];

        // Audio Products
        const audioProducts = [
            { name: 'WH-1000XM5 Headphones', modelNumber: 'WH1000XM5/B', brandId: findBrand('Sony Audio', 4)._id, categoryId: categories[4]._id, mrp: 29990, sellingPrice: 27990, basePrice: 26000, gstRate: 18 },
            { name: 'Charge 5 Bluetooth Speaker', modelNumber: 'JBLCHARGE5BLK', brandId: findBrand('JBL', 4)._id, categoryId: categories[4]._id, mrp: 14999, sellingPrice: 13999, basePrice: 13000, gstRate: 18 },
            { name: 'Airdopes 141 TWS Earbuds', modelNumber: 'AD141', brandId: findBrand('Boat', 4)._id, categoryId: categories[4]._id, mrp: 2999, sellingPrice: 1999, basePrice: 1800, gstRate: 18 },
            { name: 'AirPods Pro 2nd Gen', modelNumber: 'MQD83HN/A', brandId: findBrand('Apple Audio', 4)._id, categoryId: categories[4]._id, mrp: 26900, sellingPrice: 24900, basePrice: 23000, gstRate: 18 }
        ];

        // Gaming Products
        const gamingProducts = [
            { name: 'PlayStation 5', modelNumber: 'CFI-1216A', brandId: findBrand('Sony PlayStation', 5)._id, categoryId: categories[5]._id, mrp: 54999, sellingPrice: 52999, basePrice: 50000, gstRate: 18 },
            { name: 'Xbox Series X', modelNumber: 'RRT-00024', brandId: findBrand('Microsoft Xbox', 5)._id, categoryId: categories[5]._id, mrp: 52999, sellingPrice: 49999, basePrice: 47000, gstRate: 18 },
            { name: 'Nintendo Switch OLED', modelNumber: 'HEG-001(-01)', brandId: findBrand('Nintendo', 5)._id, categoryId: categories[5]._id, mrp: 34999, sellingPrice: 32999, basePrice: 31000, gstRate: 18 }
        ];

        // Insert all products
        const allProducts = [...mobileProducts, ...laptopProducts, ...tvProducts, ...applianceProducts, ...audioProducts, ...gamingProducts];
        const insertedProducts = await Product.insertMany(allProducts);
        console.log('✅ Products created:', insertedProducts.length);

        // 4. CREATE INVENTORY ITEMS WITH SERIAL NUMBERS
        const inventoryItems = [];
        
        // Generate inventory for each product
        for (let i = 0; i < insertedProducts.length; i++) {
            const product = insertedProducts[i];
            const itemCount = Math.floor(Math.random() * 5) + 2; // 2-6 items per product
            
            for (let j = 0; j < itemCount; j++) {
                const serialPrefix = product.modelNumber.substring(0, 4).toUpperCase();
                const serialNumber = `${serialPrefix}${String(i + 1).padStart(3, '0')}${String(j + 1).padStart(2, '0')}`;
                
                const conditions = ['new', 'refurbished', 'used'];
                const condition = conditions[Math.floor(Math.random() * conditions.length)];
                
                const suppliers = ['Direct Import', 'Authorized Dealer', 'Wholesale Market', 'Online Partner'];
                const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
                
                // Calculate purchase price (60-80% of selling price)
                const purchasePrice = Math.floor(product.sellingPrice * (0.6 + Math.random() * 0.2));
                
                // Random purchase date in last 6 months
                const purchaseDate = new Date();
                purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 180));
                
                // Warranty period (1-3 years)
                const warrantyMonths = [12, 24, 36][Math.floor(Math.random() * 3)];
                const warrantyExpiry = new Date(purchaseDate);
                warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);
                
                inventoryItems.push({
                    productId: product._id,
                    serialNumber: serialNumber,
                    condition: condition,
                    status: Math.random() > 0.8 ? 'sold' : 'available', // 20% chance of being sold
                    purchasePrice: purchasePrice,
                    purchaseDate: purchaseDate,
                    supplier: supplier,
                    warrantyExpiry: warrantyExpiry,
                    location: `Rack-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 20) + 1}`,
                    notes: condition === 'refurbished' ? 'Refurbished by manufacturer' : condition === 'used' ? 'Pre-owned, good condition' : 'Brand new sealed'
                });
            }
        }
        
        const insertedInventory = await InventoryItem.insertMany(inventoryItems);
        console.log('✅ Inventory items created:', insertedInventory.length);

        // 5. CREATE SAMPLE CUSTOMERS
        const customers = [
            {
                name: 'Rajesh Kumar',
                phone: '9876543210',
                email: 'rajesh.kumar@email.com',
                address: {
                    street: '123 MG Road',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    pincode: '560001',
                    country: 'India'
                }
            },
            {
                name: 'Priya Sharma',
                phone: '9876543211',
                email: 'priya.sharma@email.com',
                address: {
                    street: '456 Connaught Place',
                    city: 'New Delhi',
                    state: 'Delhi',
                    pincode: '110001',
                    country: 'India'
                }
            },
            {
                name: 'Amit Patel',
                phone: '9876543212',
                email: 'amit.patel@email.com',
                address: {
                    street: '789 SG Highway',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    pincode: '380015',
                    country: 'India'
                }
            },
            {
                name: 'Sneha Reddy',
                phone: '9876543213',
                email: 'sneha.reddy@email.com',
                address: {
                    street: '321 Jubilee Hills',
                    city: 'Hyderabad',
                    state: 'Telangana',
                    pincode: '500033',
                    country: 'India'
                }
            },
            {
                name: 'Vikram Singh',
                phone: '9876543214',
                email: 'vikram.singh@email.com',
                address: {
                    street: '654 Park Street',
                    city: 'Kolkata',
                    state: 'West Bengal',
                    pincode: '700016',
                    country: 'India'
                }
            }
        ];
        
        const insertedCustomers = await Customer.insertMany(customers);
        console.log('✅ Customers created:', insertedCustomers.length);

        // Summary
        console.log('\n🎉 COMPREHENSIVE DATA SEEDING COMPLETED!');
        console.log('=' .repeat(50));
        console.log(`📱 Categories: ${categories.length}`);
        console.log(`🏷️  Brands: ${brands.length}`);
        console.log(`📦 Products: ${insertedProducts.length}`);
        console.log(`🔢 Inventory Items: ${insertedInventory.length}`);
        console.log(`👥 Customers: ${insertedCustomers.length}`);
        console.log('=' .repeat(50));
        
        // Show sample data by category
        console.log('\n📊 SAMPLE DATA BY CATEGORY:');
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            const categoryProducts = insertedProducts.filter(p => p.categoryId.toString() === category._id.toString());
            const categoryInventory = insertedInventory.filter(inv => {
                const product = insertedProducts.find(p => p._id.toString() === inv.productId.toString());
                return product && product.categoryId.toString() === category._id.toString();
            });
            
            console.log(`\n${category.name}:`);
            console.log(`  - Products: ${categoryProducts.length}`);
            console.log(`  - Inventory Items: ${categoryInventory.length}`);
            console.log(`  - Available Items: ${categoryInventory.filter(i => i.status === 'available').length}`);
        }

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        mongoose.disconnect();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the seeding
seedData();
