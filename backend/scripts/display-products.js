/**
 * Display Products Script
 * Shows all created products organized by category
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
require('dotenv').config();

async function displayProducts() {
    try {
        console.log('📋 Displaying all products...\n');
        
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/vinod-electronics');
        
        // Get all products grouped by category
        const categories = await Category.find({ is_leaf: true });
        
        for (const category of categories) {
            const products = await Product.find({ category_id: category._id });
            
            console.log(`📦 ${category.name.toUpperCase()} (${products.length} products)`);
            console.log('='.repeat(50));
            
            if (products.length === 0) {
                console.log('   No products found');
            } else {
                products.forEach((product, index) => {
                    console.log(`\n   ${index + 1}. ${product.name}`);
                    console.log(`      Model: ${product.model_number || 'N/A'}`);
                    console.log(`      Brand: ${product.brand || 'N/A'}`);
                    console.log(`      MRP: ₹${product.mrp || 'N/A'}`);
                    console.log(`      Dealer Price: ₹${product.dealer_price || 'N/A'}`);
                    
                    // Show category-specific fields
                    if (category.name === 'Mobile') {
                        console.log(`      IMEI: ${product.imei || 'N/A'}`);
                        console.log(`      Storage: ${product.storage || 'N/A'} GB`);
                        console.log(`      RAM: ${product.ram || 'N/A'} GB`);
                        console.log(`      OS: ${product.os || 'N/A'}`);
                    } else if (category.name === 'Smart TV' || category.name === 'Fridge' || category.name === 'AC') {
                        console.log(`      Star Rating: ${product.star_rating || 'N/A'} Star`);
                    } else if (category.name === 'Sofa') {
                        console.log(`      Seating Capacity: ${product.seating_capacity || 'N/A'}`);
                    } else if (category.name.includes('Bed') || category.name === 'Dressing Table') {
                        console.log(`      Material: ${product.material || 'N/A'}`);
                        if (product.polish) {
                            console.log(`      Polish: ${product.polish}`);
                        }
                        if (product.board_finish) {
                            console.log(`      Finish: ${product.board_finish}`);
                        }
                        if (product.dimensions) {
                            console.log(`      Dimensions: ${product.dimensions}`);
                        }
                        if (product.color) {
                            console.log(`      Color: ${product.color}`);
                        }
                    }
                });
            }
            console.log('\n');
        }
        
        const totalProducts = await Product.countDocuments();
        console.log(`🎉 Total Products Created: ${totalProducts}`);
        
    } catch (error) {
        console.error('❌ Error displaying products:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 MongoDB connection closed');
    }
}

// Run the display
displayProducts();
