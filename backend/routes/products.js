const express = require('express');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all products
// @route   GET /api/products
// @access  Protected
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, search, category, brand, isActive } = req.query;
        
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { modelNumber: { $regex: search, $options: 'i' } },
                    { hsnCode: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        if (category) query.categoryId = category;
        if (brand) query.brandId = brand;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const products = await Product.find(query)
            .populate('brandId', 'name')
            .populate('categoryId', 'name')
            .populate('supplierId', 'companyName')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: products,
            pagination: {
                current: parseInt(page),
                pageSize: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while fetching products'
        });
    }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Protected
router.get('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('brandId', 'name')
            .populate('categoryId', 'name')
            .populate('supplierId', 'companyName contactPerson phone email');

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
            message: error.message || 'Server error while fetching product'
        });
    }
});

// @desc    Create product
// @route   POST /api/products
// @access  Protected (Admin/Manager only)
router.post('/', protect, checkPermission(['create']), async (req, res) => {
    try {
        const {
            name,
            modelNumber,
            brandId,
            categoryId,
            purchasePrice,
            mrp,
            sellingPrice,
            currentStock,
            minimumStock,
            maximumStock,
            gstRate,
            hsnCode,
            description,
            features,
            warrantyPeriod,
            weight,
            dimensions,
            images,
            specifications,
            supplierId
        } = req.body;

        // Validate required fields
        if (!name || !modelNumber || !brandId || !categoryId || !purchasePrice || !mrp || !sellingPrice) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name, modelNumber, brandId, categoryId, purchasePrice, mrp, sellingPrice'
            });
        }

        // Validate brand and category exist
        const brand = await Brand.findById(brandId);
        if (!brand) {
            return res.status(400).json({
                success: false,
                message: 'Invalid brand ID'
            });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        // Validate pricing logic
        if (sellingPrice > mrp) {
            return res.status(400).json({
                success: false,
                message: 'Selling price cannot be greater than MRP'
            });
        }

        if (purchasePrice >= sellingPrice) {
            return res.status(400).json({
                success: false,
                message: 'Purchase price should be less than selling price'
            });
        }

        const product = new Product({
            name,
            modelNumber,
            brandId,
            categoryId,
            purchasePrice,
            mrp,
            sellingPrice,
            currentStock: currentStock || 0,
            minimumStock: minimumStock || 5,
            maximumStock: maximumStock || 100,
            gstRate: gstRate || 18,
            hsnCode,
            description,
            features,
            warrantyPeriod: warrantyPeriod || 12,
            weight,
            dimensions,
            images,
            specifications,
            basePrice: purchasePrice, // Set basePrice for backward compatibility
            supplierId
        });

        await product.save();
        
        // Populate the response
        await product.populate('brandId', 'name');
        await product.populate('categoryId', 'name');
        if (supplierId) {
            await product.populate('supplierId', 'companyName');
        }

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this model number already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating product'
        });
    }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Protected (Admin/Manager only)
router.put('/:id', protect, checkPermission(['update']), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const {
            name,
            modelNumber,
            brandId,
            categoryId,
            purchasePrice,
            mrp,
            sellingPrice,
            currentStock,
            minimumStock,
            maximumStock,
            gstRate,
            hsnCode,
            description,
            features,
            warrantyPeriod,
            weight,
            dimensions,
            images,
            specifications,
            supplierId,
            isActive
        } = req.body;

        // Validate brand and category if provided
        if (brandId && brandId !== product.brandId.toString()) {
            const brand = await Brand.findById(brandId);
            if (!brand) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid brand ID'
                });
            }
        }

        if (categoryId && categoryId !== product.categoryId.toString()) {
            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID'
                });
            }
        }

        // Validate pricing logic if prices are being updated
        const newMrp = mrp || product.mrp;
        const newSellingPrice = sellingPrice || product.sellingPrice;
        const newPurchasePrice = purchasePrice || product.purchasePrice;

        if (newSellingPrice > newMrp) {
            return res.status(400).json({
                success: false,
                message: 'Selling price cannot be greater than MRP'
            });
        }

        if (newPurchasePrice >= newSellingPrice) {
            return res.status(400).json({
                success: false,
                message: 'Purchase price should be less than selling price'
            });
        }

        // Update fields
        const updateFields = {
            name,
            modelNumber,
            brandId,
            categoryId,
            purchasePrice,
            mrp,
            sellingPrice,
            currentStock,
            minimumStock,
            maximumStock,
            gstRate,
            hsnCode,
            description,
            features,
            warrantyPeriod,
            weight,
            dimensions,
            images,
            specifications,
            supplierId,
            isActive
        };

        // Remove undefined fields
        Object.keys(updateFields).forEach(key => 
            updateFields[key] === undefined && delete updateFields[key]
        );

        // Update basePrice if purchasePrice is updated
        if (purchasePrice) {
            updateFields.basePrice = purchasePrice;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('brandId', 'name')
         .populate('categoryId', 'name')
         .populate('supplierId', 'companyName');

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this model number already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating product'
        });
    }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Protected (Admin only)
router.delete('/:id', protect, checkPermission(['delete']), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Soft delete - mark as inactive instead of removing
        product.isActive = false;
        await product.save();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while deleting product'
        });
    }
});

// @desc    Update stock
// @route   PATCH /api/products/:id/stock
// @access  Protected
router.patch('/:id/stock', protect, checkPermission(['update']), async (req, res) => {
    try {
        const { currentStock, operation } = req.body; // operation: 'set', 'add', 'subtract'
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        let newStock = product.currentStock;
        
        switch (operation) {
            case 'set':
                newStock = currentStock;
                break;
            case 'add':
                newStock = product.currentStock + currentStock;
                break;
            case 'subtract':
                newStock = product.currentStock - currentStock;
                break;
            default:
                newStock = currentStock;
        }

        if (newStock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock cannot be negative'
            });
        }

        product.currentStock = newStock;
        await product.save();

        res.json({
            success: true,
            message: 'Stock updated successfully',
            data: { currentStock: product.currentStock }
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating stock'
        });
    }
});

// @desc    Get low stock products
// @route   GET /api/products/reports/low-stock
// @access  Protected
router.get('/reports/low-stock', protect, async (req, res) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ['$currentStock', '$minimumStock'] },
            isActive: true
        })
        .populate('brandId', 'name')
        .populate('categoryId', 'name')
        .sort({ currentStock: 1 });

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Low stock report error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while generating low stock report'
        });
    }
});

module.exports = router;
