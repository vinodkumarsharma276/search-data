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
router.post('/', protect, checkPermission('create'), async (req, res) => {
    console.log('📦 POST /api/products - Creating new product');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        // Validate required business fields
        if (!req.body.supplierId) {
            return res.status(400).json({
                success: false,
                message: 'Distributor (supplierId) is required'
            });
        }

        // Validate distributor exists
        const Distributor = require('../models/Distributor');
        const distributor = await Distributor.findById(req.body.supplierId);
        if (!distributor) {
            return res.status(400).json({
                success: false,
                message: 'Invalid distributor ID'
            });
        }

        console.log('✅ Validated distributor:', distributor.name);

        // Create product with all received data (loose schema)
        const product = new Product(req.body);
        
        console.log('💾 Saving product with loose schema...');
        const savedProduct = await product.save();
        
        console.log('✅ Product saved successfully:', savedProduct._id);

        // Populate response 
        await savedProduct.populate('supplierId', 'name gstNumber');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: savedProduct
        });

    } catch (error) {
        console.error('❌ Error creating product:', error);
        
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Product with this ${duplicateField} already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create product'
        });
    }
});

// @desc    Create multiple products (bulk)
// @route   POST /api/products/bulk
// @access  Protected (Admin/Manager only)
router.post('/bulk', protect, checkPermission('create'), async (req, res) => {
    console.log('📦 POST /api/products/bulk - Creating multiple products');
    console.log('📋 Request body contains', req.body.products?.length || 0, 'products');
    
    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Products array is required and cannot be empty'
            });
        }

        if (products.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Cannot create more than 100 products at once'
            });
        }

        const createdProducts = [];
        const errors = [];

        // Process each product
        for (let i = 0; i < products.length; i++) {
            const productData = products[i];
            
            try {
                console.log(`🔄 Processing product ${i + 1}/${products.length}`);
                
                // Use the same validation logic as single product creation
                const {
                    categoryFormData = {},
                    supplierId,
                    categoryId,
                    selected_category_id,
                    condition,
                    sellingPrice,
                    hsnCode
                } = productData;

                const finalCategoryId = selected_category_id || categoryId;

                // Validate required fields for this product
                if (!finalCategoryId) {
                    throw new Error(`Product ${i + 1}: Category selection is required`);
                }

                if (!supplierId) {
                    throw new Error(`Product ${i + 1}: Distributor is required`);
                }

                if (!sellingPrice || sellingPrice <= 0) {
                    throw new Error(`Product ${i + 1}: Valid selling price is required`);
                }

                if (!condition) {
                    throw new Error(`Product ${i + 1}: Product condition is required`);
                }

                // Validate distributor exists
                const Distributor = require('../models/Distributor');
                const distributor = await Distributor.findById(supplierId);
                if (!distributor) {
                    throw new Error(`Product ${i + 1}: Invalid distributor ID`);
                }

                // Validate category exists and is leaf
                const category = await Category.findById(finalCategoryId);
                if (!category) {
                    throw new Error(`Product ${i + 1}: Invalid category ID`);
                }
                
                if (!category.is_leaf) {
                    throw new Error(`Product ${i + 1}: Can only create products for leaf categories`);
                }

                // Build category path
                const pathResult = await category.getCategoryPath();
                const categoryPath = pathResult.map(cat => cat.name);
                const categoryPathIds = pathResult.map(cat => cat.id);

                // Extract brand from dynamic fields
                const brand = categoryFormData.mobile_brand || 
                            categoryFormData.tv_brand || 
                            categoryFormData.fridge_brand || 
                            categoryFormData.ac_brand ||
                            categoryFormData.brand;

                if (!brand) {
                    throw new Error(`Product ${i + 1}: Brand is required`);
                }

                // Extract serial number
                const serialNumber = categoryFormData.common_serial_number || 
                                   categoryFormData.serial_number;

                // Separate common and specific attributes
                const commonAttrs = {};
                const specificAttrs = {};

                Object.keys(categoryFormData).forEach(key => {
                    if (key.startsWith('common_')) {
                        commonAttrs[key] = categoryFormData[key];
                    } else {
                        specificAttrs[key] = categoryFormData[key];
                    }
                });

                // Create the product
                const newProductData = {
                    category_path: categoryPath,
                    category_path_ids: categoryPathIds,
                    selected_category_id: finalCategoryId,
                    supplierId,
                    brand,
                    price: sellingPrice,
                    warrantyMonths: 12,
                    serialNumber: serialNumber || undefined,
                    common_attributes: commonAttrs,
                    specific_attributes: specificAttrs,
                    isActive: true,
                    lastPurchaseDate: new Date()
                };

                // Add any additional fields (loose schema support)
                Object.keys(productData).forEach(key => {
                    if (!newProductData.hasOwnProperty(key) && 
                        !['categoryFormData', 'categoryId', 'sellingPrice'].includes(key)) {
                        newProductData[key] = productData[key];
                    }
                });

                const product = new Product(newProductData);
                await product.save();
                
                // Populate response data
                await product.populate('selected_category_id', 'name');
                await product.populate('supplierId', 'name gstNumber');
                
                createdProducts.push(product);
                console.log(`✅ Product ${i + 1} saved successfully:`, product._id);

            } catch (error) {
                console.error(`❌ Error creating product ${i + 1}:`, error.message);
                errors.push({
                    index: i + 1,
                    message: error.message,
                    productData: productData.categoryFormData?.common_model_number || `Product ${i + 1}`
                });
            }
        }

        // Return results
        const response = {
            success: createdProducts.length > 0,
            message: `Created ${createdProducts.length} of ${products.length} products`,
            data: createdProducts,
            errors: errors.length > 0 ? errors : undefined,
            summary: {
                total: products.length,
                successful: createdProducts.length,
                failed: errors.length
            }
        };

        const statusCode = errors.length === 0 ? 201 : (createdProducts.length > 0 ? 207 : 400);
        res.status(statusCode).json(response);

    } catch (error) {
        console.error('Bulk create products error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating products'
        });
    }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Protected (Admin/Manager only)
router.put('/:id', protect, checkPermission('update'), async (req, res) => {
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
router.delete('/:id', protect, checkPermission('delete'), async (req, res) => {
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
router.patch('/:id/stock', protect, checkPermission('update'), async (req, res) => {
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
