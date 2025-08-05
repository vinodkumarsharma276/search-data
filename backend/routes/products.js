const express = require('express');
const mongoose = require('mongoose');
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

// @desc    Global search products by serial number or other fields (TEST VERSION - NO AUTH)
// @route   GET /api/products/global-search
// @access  Public (for testing only)
router.get('/global-search', async (req, res) => {
    try {
        const { searchQuery, page = 1, limit = 1000 } = req.query;
        
        console.log('🔍 Global product search request (TEST):', { searchQuery, page, limit });
        
        if (!searchQuery || searchQuery.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 3 characters long'
            });
        }
        
        // Build global search query across all products (exclude deleted by default)
        let query = {
            deleted: { $ne: true }, // Exclude soft-deleted products
            $or: [
                { 'dynamic_fields.model_number': { $regex: searchQuery, $options: 'i' } },
                { 'dynamic_fields.serial_number': { $regex: searchQuery, $options: 'i' } },
                { 'dynamic_fields.brand': { $regex: searchQuery, $options: 'i' } },
                { product_name: { $regex: searchQuery, $options: 'i' } },
                // Legacy fields (in case some products still have them at root level)
                { model_number: { $regex: searchQuery, $options: 'i' } },
                { modelNumber: { $regex: searchQuery, $options: 'i' } },
                { serial_number: { $regex: searchQuery, $options: 'i' } },
                { serialNumber: { $regex: searchQuery, $options: 'i' } },
                { brand: { $regex: searchQuery, $options: 'i' } }
            ]
        };
        
        console.log('📋 MongoDB global search query (TEST):', JSON.stringify(query, null, 2));
        
        // Execute search with pagination
        const products = await Product.find(query)
            .populate('supplierId', 'name companyName gstNumber')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await Product.countDocuments(query);
        
        console.log('✅ Global search results (TEST):', products.length, 'of', total, 'total');
        
        res.json({
            success: true,
            products: products,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
        
    } catch (error) {
        console.error('❌ Global product search error (TEST):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while searching products'
        });
    }
});

// @desc    Search products by category and query (TEST VERSION - NO AUTH)
// @route   GET /api/products/search-test
// @access  Public (for testing only)
router.get('/search-test', async (req, res) => {
    try {
        const { categoryId, searchQuery, page = 1, limit = 1000 } = req.query;
        
        console.log('🔍 Product search request (TEST):', { categoryId, searchQuery, page, limit });
        
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
        }
        
        // If searchQuery is provided, it must be at least 3 characters
        if (searchQuery && searchQuery.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 3 characters long'
            });
        }
        
        // Get all subcategories for hierarchical search
        const allCategoryIds = [categoryId];
        const subcategories = await Category.find({ parent_id: categoryId }, '_id').lean();
        subcategories.forEach(sub => allCategoryIds.push(sub._id.toString()));
        
        console.log('🔍 Searching in categories (TEST):', allCategoryIds);
        
        // Build search query (exclude deleted products by default)
        let query = {
            deleted: { $ne: true }, // Exclude soft-deleted products
            // Category filter - handle multiple field names and formats, including subcategories
            $or: [
                ...allCategoryIds.flatMap(catId => [
                    { categoryId: catId },
                    { category: catId },
                    { selected_category_id: catId },
                    // Legacy category_id field support
                    { category_id: catId },
                    // Also try ObjectId format for string comparisons
                    { categoryId: new mongoose.Types.ObjectId(catId) },
                    { category: new mongoose.Types.ObjectId(catId) },
                    { selected_category_id: new mongoose.Types.ObjectId(catId) },
                    { category_id: new mongoose.Types.ObjectId(catId) }
                ])
            ]
        };

        // Only add text search if searchQuery is provided
        if (searchQuery) {
            query = {
                $and: [
                    query,
                    // Search in dynamic_fields and name fields
                    {
                        $or: [
                            { 'dynamic_fields.model_number': { $regex: searchQuery, $options: 'i' } },
                            { 'dynamic_fields.serial_number': { $regex: searchQuery, $options: 'i' } },
                            { 'dynamic_fields.brand': { $regex: searchQuery, $options: 'i' } },
                            { product_name: { $regex: searchQuery, $options: 'i' } },
                            // Legacy fields (in case some products still have them at root level)
                            { model_number: { $regex: searchQuery, $options: 'i' } },
                            { modelNumber: { $regex: searchQuery, $options: 'i' } },
                            { serial_number: { $regex: searchQuery, $options: 'i' } },
                            { serialNumber: { $regex: searchQuery, $options: 'i' } },
                            { brand: { $regex: searchQuery, $options: 'i' } }
                        ]
                    }
                ]
            };
        }
        
        console.log('📋 MongoDB query (TEST):', JSON.stringify(query, null, 2));
        
        // Execute search with pagination
        const products = await Product.find(query)
            .populate('supplierId', 'name companyName gstNumber')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await Product.countDocuments(query);
        
        console.log('✅ Search results (TEST):', products.length, 'of', total, 'total');
        
        // Get category information including form schema for dynamic table columns
        let categoryInfo = null;
        if (products.length > 0) {
            try {
                const category = await Category.findById(categoryId);
                if (category) {
                    categoryInfo = {
                        _id: category._id,
                        name: category.name,
                        form_schema: category.form_schema || []
                    };
                }
            } catch (err) {
                console.warn('Failed to fetch category info:', err.message);
            }
        }
        
        res.json({
            success: true,
            products: products,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
            categoryInfo: categoryInfo
        });
        
    } catch (error) {
        console.error('❌ Product search error (TEST):', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while searching products'
        });
    }
});

// @desc    Search products by category and query
// @route   GET /api/products/search
// @access  Protected
router.get('/search', protect, async (req, res) => {
    try {
        const { categoryId, searchQuery, page = 1, limit = 50 } = req.query;
        
        console.log('🔍 Product search request:', { categoryId, searchQuery, page, limit });
        
        if (!categoryId || !searchQuery) {
            return res.status(400).json({
                success: false,
                message: 'Category ID and search query are required'
            });
        }
        
        if (searchQuery.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 3 characters long'
            });
        }
        
        // Get all subcategories for hierarchical search
        const allCategoryIds = [categoryId];
        const subcategories = await Category.find({ parent_id: categoryId }, '_id').lean();
        subcategories.forEach(sub => allCategoryIds.push(sub._id.toString()));
        
        console.log('🔍 Searching in categories:', allCategoryIds);
        
        // Build search query
        let query = {
            $and: [
                // Category filter - handle multiple field names and formats, including subcategories
                {
                    $or: [
                        ...allCategoryIds.flatMap(catId => [
                            { categoryId: catId },
                            { category: catId },
                            { selected_category_id: catId },
                            { category_id: catId },
                            // Also try ObjectId format for string comparisons
                            { categoryId: new mongoose.Types.ObjectId(catId) },
                            { category: new mongoose.Types.ObjectId(catId) },
                            { selected_category_id: new mongoose.Types.ObjectId(catId) },
                            { category_id: new mongoose.Types.ObjectId(catId) }
                        ])
                    ]
                },
                // Search in model_number, serial_number, brand, or name fields
                {
                    $or: [
                        { model_number: { $regex: searchQuery, $options: 'i' } },
                        { modelNumber: { $regex: searchQuery, $options: 'i' } },
                        { serial_number: { $regex: searchQuery, $options: 'i' } },
                        { serialNumber: { $regex: searchQuery, $options: 'i' } },
                        { brand: { $regex: searchQuery, $options: 'i' } },
                        { name: { $regex: searchQuery, $options: 'i' } },
                        { product_name: { $regex: searchQuery, $options: 'i' } }
                    ]
                }
            ]
        };
        
        console.log('📋 MongoDB query:', JSON.stringify(query, null, 2));
        
        // Execute search with pagination
        const products = await Product.find(query)
            .populate('supplierId', 'name companyName')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await Product.countDocuments(query);
        
        console.log('✅ Search results:', products.length, 'of', total, 'total');
        
        res.json({
            success: true,
            products: products,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
        
    } catch (error) {
        console.error('❌ Product search error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while searching products'
        });
    }
});

// @desc    Get all distributors for dropdown
// @route   GET /api/products/distributors
// @access  Public (for testing only)
router.get('/distributors', async (req, res) => {
    try {
        const Distributor = require('../models/Distributor');
        const distributors = await Distributor.find({ isActive: { $ne: false } }, 'name companyName gstNumber')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: distributors
        });
    } catch (error) {
        console.error('Get distributors error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while fetching distributors'
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

// @desc    Create product(s)
// @route   POST /api/products
// @access  Protected (Admin/Manager only)
router.post('/', protect, checkPermission('create'), async (req, res) => {
    console.log('📦 POST /api/products - Creating product(s)');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        // Handle both single product and array of products
        let productsArray = [];
        
        if (req.body.products && Array.isArray(req.body.products)) {
            // Multiple products sent as array
            productsArray = req.body.products;
            console.log(`📦 Processing ${productsArray.length} products from array`);
        } else {
            // Single product - convert to array for consistent processing
            productsArray = [req.body];
            console.log('📦 Processing single product (converted to array)');
        }

        const createdProducts = [];
        const errors = [];

        // Process each product in the array
        for (let i = 0; i < productsArray.length; i++) {
            const productData = productsArray[i];
            
            try {
                console.log(`🔄 Processing product ${i + 1}/${productsArray.length}`);
                
                // Validate required business fields for this product
                if (!productData.supplierId) {
                    throw new Error(`Product ${i + 1}: Distributor (supplierId) is required`);
                }

                // Validate distributor exists
                const Distributor = require('../models/Distributor');
                const distributor = await Distributor.findById(productData.supplierId);
                if (!distributor) {
                    throw new Error(`Product ${i + 1}: Invalid distributor ID`);
                }

                console.log(`✅ Product ${i + 1} - Validated distributor:`, distributor.name);

                // Process and clean the product data - only keep field_id based fields
                const cleanProductData = {
                    supplierId: productData.supplierId
                };

                // Map common fields and category-specific fields using field_id values
                Object.keys(productData).forEach(key => {
                    // Skip system fields that aren't in form schema
                    if (['supplierId', 'distributorId'].includes(key)) {
                        return;
                    }
                    
                    // Only keep fields that have valid field_id patterns
                    // field_id values should be clean names like: model_number, serial_number, brand, imei, etc.
                    if (key.match(/^[a-z_]+$/)) {
                        cleanProductData[key] = productData[key];
                    }
                });

                console.log(`🧹 Cleaned product data for product ${i + 1}:`, cleanProductData);

                // Create product with the clean data
                const product = new Product(cleanProductData);
                
                console.log(`💾 Saving product ${i + 1} with clean schema...`);
                const savedProduct = await product.save();
                
                console.log(`✅ Product ${i + 1} saved successfully:`, savedProduct._id);

                // Populate response 
                await savedProduct.populate('supplierId', 'name gstNumber');
                createdProducts.push(savedProduct);

            } catch (error) {
                console.error(`❌ Error creating product ${i + 1}:`, error.message);
                errors.push({
                    index: i + 1,
                    message: error.message,
                    productData: productData.model_number || `Product ${i + 1}`
                });
            }
        }

        // Return appropriate response based on results
        if (createdProducts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Failed to create any products',
                errors: errors
            });
        }

        const response = {
            success: true,
            message: createdProducts.length === 1 
                ? 'Product created successfully' 
                : `Created ${createdProducts.length} of ${productsArray.length} products`,
            data: createdProducts.length === 1 ? createdProducts[0] : createdProducts,
            summary: {
                total: productsArray.length,
                successful: createdProducts.length,
                failed: errors.length
            }
        };

        if (errors.length > 0) {
            response.errors = errors;
        }

        const statusCode = errors.length === 0 ? 201 : 207; // 207 = Multi-Status
        res.status(statusCode).json(response);

    } catch (error) {
        console.error('❌ Error in product creation:', error);
        
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Product with this ${duplicateField} already exists`
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create product(s)'
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
                const brand = categoryFormData.brand ||
                            categoryFormData.mobile_brand || 
                            categoryFormData.tv_brand || 
                            categoryFormData.fridge_brand || 
                            categoryFormData.ac_brand;

                if (!brand) {
                    throw new Error(`Product ${i + 1}: Brand is required`);
                }

                // Extract serial number
                const serialNumber = categoryFormData.serial_number || 
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
                    productData: productData.categoryFormData?.model_number || `Product ${i + 1}`
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

// @desc    Update product (for dynamic schema products)
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

        console.log('🔄 Updating product:', req.params.id);
        console.log('📋 Update data received:', JSON.stringify(req.body, null, 2));

        // For our dynamic schema, we'll update the fields directly
        const updateData = { ...req.body };
        
        // Remove any undefined or null values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
                delete updateData[key];
            }
        });

        // Validate distributor if provided
        if (updateData.supplierId) {
            const Distributor = require('../models/Distributor');
            const distributor = await Distributor.findById(updateData.supplierId);
            if (!distributor) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid distributor ID'
                });
            }
        }

        console.log('🧹 Cleaned update data:', JSON.stringify(updateData, null, 2));

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: false } // Disable validators for dynamic schema
        ).populate('supplierId', 'name companyName gstNumber');

        console.log('✅ Product updated successfully:', updatedProduct._id);

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: updatedProduct
        });
    } catch (error) {
        console.error('❌ Update product error:', error);
        
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Product with this ${duplicateField} already exists`
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
        product.deleted = true; // Also mark with our standardized soft delete flag
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

// @desc    Soft delete product (mark as deleted)
// @route   PATCH /api/products/:id/soft-delete
// @access  Public (for testing only)
router.patch('/:id/soft-delete', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Mark as deleted
        product.deleted = true;
        await product.save();

        res.json({
            success: true,
            message: 'Product marked as deleted successfully'
        });
    } catch (error) {
        console.error('Soft delete product error:', error);
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
