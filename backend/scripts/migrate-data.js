const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('../models/Customer');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { googleSheetsService } = require('../services/googleSheetsService');

dotenv.config();

const migrateData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vinod-electronics');
        console.log('📊 Connected to MongoDB for migration');

        // Step 1: Create basic categories
        console.log('🏗️ Creating categories...');
        const categories = [
            { name: 'Mobile Phones', description: 'Smartphones and feature phones' },
            { name: 'Washing Machines', description: 'Automatic and semi-automatic washing machines' },
            { name: 'Air Conditioners', description: 'Split and window AC units' },
            { name: 'Refrigerators', description: 'Single and double door refrigerators' },
            { name: 'Televisions', description: 'LED, OLED, and Smart TVs' }
        ];

        const createdCategories = [];
        for (const category of categories) {
            const existingCategory = await Category.findOne({ name: category.name });
            if (!existingCategory) {
                const newCategory = await Category.create(category);
                createdCategories.push(newCategory);
                console.log(`✅ Created category: ${category.name}`);
            } else {
                createdCategories.push(existingCategory);
                console.log(`⚡ Category already exists: ${category.name}`);
            }
        }

        // Step 2: Create basic brands
        console.log('🏭 Creating brands...');
        const mobileCategory = createdCategories.find(c => c.name === 'Mobile Phones');
        const washingCategory = createdCategories.find(c => c.name === 'Washing Machines');
        const acCategory = createdCategories.find(c => c.name === 'Air Conditioners');
        const fridgeCategory = createdCategories.find(c => c.name === 'Refrigerators');
        const tvCategory = createdCategories.find(c => c.name === 'Televisions');

        const brands = [
            { name: 'Samsung', categories: [mobileCategory._id, washingCategory._id, acCategory._id, tvCategory._id] },
            { name: 'Vivo', categories: [mobileCategory._id] },
            { name: 'Oppo', categories: [mobileCategory._id] },
            { name: 'Xiaomi', categories: [mobileCategory._id] },
            { name: 'Whirlpool', categories: [washingCategory._id, fridgeCategory._id] },
            { name: 'LG', categories: [washingCategory._id, acCategory._id, tvCategory._id, fridgeCategory._id] },
            { name: 'Sony', categories: [mobileCategory._id, tvCategory._id] }
        ];

        const createdBrands = [];
        for (const brand of brands) {
            const existingBrand = await Brand.findOne({ name: brand.name });
            if (!existingBrand) {
                const newBrand = await Brand.create(brand);
                createdBrands.push(newBrand);
                console.log(`✅ Created brand: ${brand.name}`);
            } else {
                createdBrands.push(existingBrand);
                console.log(`⚡ Brand already exists: ${brand.name}`);
            }
        }

        // Step 3: Fetch data from Google Sheets
        console.log('📥 Fetching data from Google Sheets...');
        const googleData = await googleSheetsService.getAllData();
        
        if (!googleData || googleData.length === 0) {
            console.log('⚠️ No data found in Google Sheets');
            return;
        }

        console.log(`📊 Found ${googleData.length} records in Google Sheets`);

        // Step 4: Transform and migrate data
        let customersCreated = 0;
        let productsCreated = 0;
        
        for (const row of googleData) {
            try {
                // Create/find customer
                const customerData = {
                    name: row.customerName || 'Unknown Customer',
                    phone: row.mobile || row.phone || '',
                    address: {
                        street: row.address || '',
                        area: row.area || ''
                    }
                };

                let customer = await Customer.findOne({ phone: customerData.phone });
                if (!customer && customerData.phone) {
                    customer = await Customer.create(customerData);
                    customersCreated++;
                    console.log(`👤 Created customer: ${customerData.name}`);
                }

                // Create/find brand and product
                if (row.brand && row.product) {
                    let brand = createdBrands.find(b => b.name.toLowerCase() === row.brand.toLowerCase());
                    if (!brand) {
                        // Create new brand if not exists
                        brand = await Brand.create({
                            name: row.brand,
                            categories: [mobileCategory._id] // Default to mobile for now
                        });
                        createdBrands.push(brand);
                        console.log(`🏭 Created new brand: ${row.brand}`);
                    }

                    // Create product if not exists
                    const modelNumber = row.model || `${row.brand}-${row.product}`.replace(/\s+/g, '-');
                    let product = await Product.findOne({ modelNumber });
                    
                    if (!product) {
                        product = await Product.create({
                            name: row.product,
                            modelNumber,
                            brandId: brand._id,
                            categoryId: mobileCategory._id, // Default to mobile for now
                            basePrice: 50000, // Default price
                            specifications: {
                                purchaseDate: row.purchaseDate || new Date(),
                                area: row.area || '',
                                co: row.co || '',
                                coMobile: row.coMobile || ''
                            }
                        });
                        productsCreated++;
                        console.log(`📱 Created product: ${row.product}`);
                    }
                }

            } catch (error) {
                console.error(`❌ Error processing row:`, error.message);
                console.error('Row data:', row);
            }
        }

        console.log('🎉 Migration completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   - Categories: ${createdCategories.length}`);
        console.log(`   - Brands: ${createdBrands.length}`);
        console.log(`   - Customers: ${customersCreated}`);
        console.log(`   - Products: ${productsCreated}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📊 Disconnected from MongoDB');
    }
};

// Run migration if this file is executed directly
if (require.main === module) {
    migrateData();
}

module.exports = { migrateData };
