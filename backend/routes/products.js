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
    console.log('📦 POST /api/products - Creating new product');
    console.log('📋 Request body:', req.body);
    
    try {
        const {
            // Dynamic System Fields (Required)
            category_path,
            category_path_ids,
            selected_category_id,
            common_attributes,
            specific_attributes,
            supplierId
        } = req.body;

        console.log('🏷️ Processing dynamic product creation for:', {
            category_path,
            selected_category_id,
            supplierId,
            hasCommonAttrs: !!common_attributes,
            hasSpecificAttrs: !!specific_attributes
        });

        // Validate required fields
        if (!selected_category_id) {
            return res.status(400).json({
                success: false,
                message: 'Category selection is required'
            });
        }

        if (!supplierId) {
            return res.status(400).json({
                success: false,
                message: 'Distributor is required'
            });
        }

        // Validate distributor exists
        const Distributor = require('../models/Distributor');
        const distributor = await Distributor.findById(supplierId);
        if (!distributor) {
            return res.status(400).json({
                success: false,
                message: 'Invalid distributor ID'
            });
        }

        // Extract universal required fields from attributes
        const brand = common_attributes?.common_brand || specific_attributes?.brand;
        const price = common_attributes?.common_price || specific_attributes?.price;
        const warrantyMonths = common_attributes?.common_warranty_months || specific_attributes?.warranty_months || 12;
        const serialNumber = common_attributes?.common_serial_number || specific_attributes?.serial_number;

        if (!brand) {
            return res.status(400).json({
                success: false,
                message: 'Brand is required'
            });
        }

        if (!price || price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid price is required'
            });
        }

        // Validate dynamic category
        const category = await Category.findById(selected_category_id);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        
        if (!category.is_leaf) {
            return res.status(400).json({
                success: false,
                message: 'Can only create products for leaf categories'
            });
        }

        // Create the product with simplified model
        const product = new Product({
            // Core required fields
            category_path: category_path || [],
            category_path_ids: category_path_ids || [],
            selected_category_id,
            supplierId,
            
            // Universal required fields extracted from attributes
            brand,
            price,
            warrantyMonths,
            serialNumber: serialNumber || undefined,
            
            // Dynamic attributes (can contain any fields)
            common_attributes: common_attributes || {},
            specific_attributes: specific_attributes || {},
            
            // System fields
            isActive: true,
            lastPurchaseDate: new Date()
        });

        console.log('💾 Saving product:', {
            brand,
            price,
            serialNumber,
            categoryPath: category_path
        });

        await product.save();
        console.log('✅ Product saved successfully:', product._id);
        
        // Populate response 
        await product.populate('selected_category_id', 'name');
        await product.populate('supplierId', 'name gstNumber');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Product with this ${duplicateField} already exists`
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
