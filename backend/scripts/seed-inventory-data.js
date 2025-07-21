const mongoose = require('mongoose');
require('../config/database');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');

const sampleInventoryData = async () => {
    try {
        console.log('🏗️ Creating inventory items with serial numbers...');

        // Clear existing inventory
        await InventoryItem.deleteMany({});
        
        // Get all products
        const products = await Product.find({});
        
        const inventoryItems = [];
        
        // Generate serial numbers for each product
        for (const product of products) {
            const baseSerial = product.modelNumber.replace(/[^A-Z0-9]/g, '').toUpperCase();
            const numUnits = Math.floor(Math.random() * 5) + 2; // 2-6 units per product
            
            for (let i = 1; i <= numUnits; i++) {
                const serialNumber = `${baseSerial}${String(i).padStart(3, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
                
                inventoryItems.push({
                    productId: product._id,
                    serialNumber,
                    purchasePrice: product.sellingPrice * 0.7, // 70% of selling price as purchase price
                    purchaseDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
                    condition: 'new',
                    status: 'available',
                    location: 'main-store',
                    warranty: {
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year warranty
                        type: 'manufacturer'
                    }
                });
            }
        }
        
        // Insert inventory items
        const result = await InventoryItem.insertMany(inventoryItems);
        console.log(`✅ Inserted ${result.length} inventory items with serial numbers`);
        
        // Show some examples
        console.log('\n📦 Sample inventory items:');
        const samples = await InventoryItem.find({})
            .populate('productId', 'name modelNumber')
            .limit(10);
        
        samples.forEach(item => {
            console.log(`   ${item.productId.name} (${item.productId.modelNumber}) - Serial: ${item.serialNumber}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating inventory:', error);
        process.exit(1);
    }
};

sampleInventoryData();
