const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const InventoryItem = require('../models/InventoryItem');

// @route   GET /api/dropdowns/categories
// @desc    Get all active categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .select('name description')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get categories'
        });
    }
});

// @route   GET /api/dropdowns/all
// @desc    Get all dropdown data (categories and brands)
router.get('/all', async (req, res) => {
    try {
        // Fetch categories and brands in parallel
        const [categories, brands] = await Promise.all([
            Category.find({ isActive: true })
                .select('name description')
                .sort({ name: 1 }),
            Brand.find({ isActive: true })
                .select('name description')
                .sort({ name: 1 })
        ]);
        
        res.json({
            success: true,
            data: {
                categories,
                brands
            }
        });
    } catch (error) {
        console.error('Get all dropdowns error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get dropdown data'
        });
    }
});

// @route   GET /api/dropdowns/brands
// @desc    Get all active brands, optionally filtered by category
router.get('/brands', async (req, res) => {
    try {
        const { categoryId } = req.query;
        let query = { isActive: true };
        
        if (categoryId) {
            // Find products in this category to get associated brands
            const products = await Product.find({ categoryId, isActive: true })
                .select('brandId')
                .populate('brandId', 'name');
            
            const brandIds = [...new Set(products.map(p => p.brandId._id.toString()))];
            query._id = { $in: brandIds };
        }
        
        const brands = await Brand.find(query)
            .select('name description')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            data: brands
        });
    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get brands'
        });
    }
});

// @route   GET /api/dropdowns/products
// @desc    Get products filtered by category and/or brand
router.get('/products', async (req, res) => {
    try {
        const { categoryId, brandId } = req.query;
        let query = { isActive: true };
        
        if (categoryId) query.categoryId = categoryId;
        if (brandId) query.brandId = brandId;
        
        const products = await Product.find(query)
            .populate('brandId', 'name')
            .populate('categoryId', 'name')
            .select('name modelNumber mrp sellingPrice gstRate specifications')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get products'
        });
    }
});

// @route   GET /api/dropdowns/product/:id
// @desc    Get single product with all details
router.get('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findById(id)
            .populate('brandId', 'name')
            .populate('categoryId', 'name');
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get product details'
        });
    }
});

// @route   POST /api/dropdowns/test-inventory
// @desc    Create test inventory items (temporary for testing)
router.post('/test-inventory', async (req, res) => {
    try {
        console.log('Creating test inventory...');
        
        // Clear existing inventory
        await InventoryItem.deleteMany({});
        
        // Get first few products
        const products = await Product.find({}).limit(5);
        
        const inventoryItems = [];
        
        for (const product of products) {
            const baseSerial = product.modelNumber.replace(/[^A-Z0-9]/g, '').toUpperCase();
            const numUnits = 3; // 3 units per product for testing
            
            for (let i = 1; i <= numUnits; i++) {
                const serialNumber = `${baseSerial}${String(i).padStart(3, '0')}`;
                
                inventoryItems.push({
                    productId: product._id,
                    serialNumber,
                    purchasePrice: product.sellingPrice * 0.7,
                    purchaseDate: new Date(),
                    condition: 'new',
                    status: 'available',
                    location: 'main-store'
                });
            }
        }
        
        const result = await InventoryItem.insertMany(inventoryItems);
        
        res.json({
            success: true,
            message: `Created ${result.length} inventory items`,
            data: result
        });
    } catch (error) {
        console.error('Create test inventory error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create test inventory'
        });
    }
});

// @route   GET /api/dropdowns/serial-numbers
// @desc    Get available serial numbers for a specific product
router.get('/serial-numbers', async (req, res) => {
    try {
        const { productId } = req.query;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }
        
        const inventoryItems = await InventoryItem.find({ 
            productId,
            status: 'available'
        })
            .select('serialNumber purchaseDate condition location')
            .sort({ purchaseDate: -1 }); // Latest purchases first
        
        res.json({
            success: true,
            data: inventoryItems
        });
    } catch (error) {
        console.error('Get serial numbers error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get serial numbers'
        });
    }
});

module.exports = router;
