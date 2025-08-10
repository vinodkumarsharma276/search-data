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
        const { page = 1, limit = 20, search, brand, isActive, main_category, sub_category_1, sub_category_2, sub_category_3, sub_category_4 } = req.query; // extended sub categories
        let query = {};
        if (search) {
            query.$or = [
                { product_name: { $regex: search, $options: 'i' } },
                { model_number: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }
        if (brand) query.brand = { $regex: `^${brand}$`, $options: 'i' };
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (main_category) query.main_category = main_category;
        if (sub_category_1) query.sub_category_1 = sub_category_1;
        if (sub_category_2) query.sub_category_2 = sub_category_2;
        if (sub_category_3) query.sub_category_3 = sub_category_3;
        if (sub_category_4) query.sub_category_4 = sub_category_4;
        const products = await Product.find(query)
            .populate('supplierId', 'companyName')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });
        const total = await Product.countDocuments(query);
        res.json({ success: true, data: products, pagination: { current: parseInt(page), pageSize: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while fetching products' });
    }
});

// Removed legacy unauthenticated /global-search test endpoint. Consolidated into protected version below.

// @desc    Search products by category and query (TEST VERSION - NO AUTH)
// @route   GET /api/products/search-test
// @access  Public (for testing only)
router.get('/search-test', async (req, res) => {
    try {
        const { main_category, sub_category_1, sub_category_2, sub_category_3, sub_category_4, searchQuery, page = 1, limit = 1000 } = req.query;
        console.log('🔍 Product search request (TEST):', { main_category, sub_category_1, sub_category_2, sub_category_3, sub_category_4, searchQuery, page, limit });

        if (!main_category && !sub_category_1 && !sub_category_2 && !sub_category_3 && !sub_category_4) {
            return res.status(400).json({ success: false, message: 'At least one category level is required' });
        }
        if (searchQuery && searchQuery.length > 0 && searchQuery.length < 3) {
            return res.status(400).json({ success: false, message: 'Search query must be at least 3 characters long' });
        }

        const baseFilter = { deleted: { $ne: true } };
        if (main_category) baseFilter.main_category = main_category;
        if (sub_category_1) baseFilter.sub_category_1 = sub_category_1;
        if (sub_category_2) baseFilter.sub_category_2 = sub_category_2;
        if (sub_category_3) baseFilter.sub_category_3 = sub_category_3;
        if (sub_category_4) baseFilter.sub_category_4 = sub_category_4;

        let query = baseFilter;
        if (searchQuery) {
            query = { $and: [ baseFilter, { $or: [
                { model_number: { $regex: searchQuery, $options: 'i' } },
                { serial_number: { $regex: searchQuery, $options: 'i' } },
                { brand: { $regex: searchQuery, $options: 'i' } },
                { product_name: { $regex: searchQuery, $options: 'i' } }
            ] } ] };
        }
        console.log('📋 MongoDB query (TEST):', JSON.stringify(query, null, 2));

        const products = await Product.find(query)
            .populate('supplierId', 'name companyName gstNumber')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });
        const total = await Product.countDocuments(query);
        res.json({ success: true, products, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('❌ Product search error (TEST):', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while searching products' });
    }
});

// @desc    Search products by category and query
// @route   GET /api/products/search
// @access  Protected
router.get('/search', protect, async (req, res) => {
    try {
        const { main_category, sub_category_1, sub_category_2, sub_category_3, sub_category_4, searchQuery, page = 1, limit = 50 } = req.query;
        console.log('🔍 Product search request:', { main_category, sub_category_1, sub_category_2, sub_category_3, sub_category_4, searchQuery, page, limit });

        if (!main_category && !sub_category_1 && !sub_category_2 && !sub_category_3 && !sub_category_4) {
            return res.status(400).json({ success: false, message: 'At least one category level is required' });
        }
        if (!searchQuery || searchQuery.length < 3) {
            return res.status(400).json({ success: false, message: 'Search query (min 3 chars) is required' });
        }
        const baseFilter = {};
        if (main_category) baseFilter.main_category = main_category;
        if (sub_category_1) baseFilter.sub_category_1 = sub_category_1;
        if (sub_category_2) baseFilter.sub_category_2 = sub_category_2;
        if (sub_category_3) baseFilter.sub_category_3 = sub_category_3;
        if (sub_category_4) baseFilter.sub_category_4 = sub_category_4;

        const query = { $and: [ baseFilter, { $or: [
            { model_number: { $regex: searchQuery, $options: 'i' } },
            { serial_number: { $regex: searchQuery, $options: 'i' } },
            { brand: { $regex: searchQuery, $options: 'i' } },
            { product_name: { $regex: searchQuery, $options: 'i' } }
        ] } ] };
        console.log('📋 MongoDB query:', JSON.stringify(query, null, 2));

        const products = await Product.find(query)
            .populate('supplierId', 'name companyName')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });
        const total = await Product.countDocuments(query);
        res.json({ success: true, products, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('❌ Product search error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while searching products' });
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

// @desc    Global search across products with optional field filtering
// @route   GET /api/products/global-search?field=brand|model|serial|imei&value=TEXT
//          or legacy fuzzy: /api/products/global-search?q=term
// @access  Protected
router.get('/global-search', protect, async (req, res) => {
    try {
        const { field, value, q, limit = 50 } = req.query;
        const maxLimit = Math.min(parseInt(limit) || 50, 200);

        // Field-based explicit search takes precedence if both provided
        if (field && value) {
            const f = String(field).toLowerCase();
            const rawVal = String(value).trim();
            if (!rawVal) return res.json({ success: true, results: [], total: 0, query: rawVal, mode: 'field' });

            // Mapping
            const fieldMap = {
                brand: 'brand',
                model: 'model_number',
                model_number: 'model_number',
                serial: 'serial_number',
                serial_number: 'serial_number',
                imei: 'mobile_imei',
                mobile_imei: 'mobile_imei'
            };
            const target = fieldMap[f];
            if (!target) {
                return res.status(400).json({ success: false, message: 'Invalid field parameter' });
            }

            let query;
            if (target === 'mobile_imei') {
                // IMEI: exact match if 15 digits, else partial contains
                if (/^\d{15}$/.test(rawVal)) {
                    query = { mobile_imei: rawVal };
                } else {
                    // partial: any element containing substring
                    query = { mobile_imei: { $regex: rawVal, $options: 'i' } };
                }
            } else if (target === 'serial_number' || target === 'model_number') {
                // Normalize to uppercase for exact style, but also allow partial
                const upper = rawVal.toUpperCase();
                // If length >= 3 do partial regex, plus exact equality OR for prioritization later
                query = { $or: [ { [target]: upper }, { [target]: { $regex: rawVal, $options: 'i' } } ] };
            } else { // brand
                query = { brand: { $regex: rawVal, $options: 'i' } };
            }

            // Always exclude soft deleted
            const finalQuery = { deleted: { $ne: true }, ... (query.$or ? {} : query) };
            if (query.$or) finalQuery.$and = [{ deleted: { $ne: true } }, { $or: query.$or }];

            const projection = {
                brand: 1, model_number: 1, serial_number: 1, dealer_price: 1, mrp: 1,
                sold: 1, deleted: 1, updatedAt: 1, category_path: 1, mobile_imei: 1
            };

            const docs = await Product.find(finalQuery, projection)
                .limit(maxLimit)
                .sort({ updatedAt: -1 });

            const results = docs.map(d => {
                const o = d.toObject();
                return {
                    _id: o._id,
                    brand: o.brand || null,
                    model_number: o.model_number || null,
                    serial_number: o.serial_number || o.serialNumber || null,
                    dealer_price: o.dealer_price ?? null,
                    mrp: o.mrp ?? null,
                    sold: o.sold === true,
                    deleted: o.deleted === true,
                    updatedAt: o.updatedAt,
                    category_path: o.category_path || [],
                    mobile_imei: o.mobile_imei || []
                };
            });

            // Prioritize exact matches when applicable
            const upperVal = rawVal.toUpperCase();
            const scored = results.sort((a,b)=> {
                const score = (r)=> {
                    let s=0;
                    if (target==='mobile_imei' && r.mobile_imei.includes(rawVal)) s+=50;
                    if (target==='serial_number' && r.serial_number && r.serial_number.toUpperCase()===upperVal) s+=40;
                    if (target==='model_number' && r.model_number && r.model_number.toUpperCase()===upperVal) s+=30;
                    if (target==='brand' && r.brand && r.brand.toUpperCase()===upperVal) s+=20;
                    return -s;
                };
                return score(a)-score(b);
            });

            return res.json({ success: true, results: scored, total: scored.length, query: rawVal, field: target, mode: 'field' });
        }

        // Legacy fuzzy quick search fallback
        const term = String(q||'').trim();
        if (!term || (term.length < 3 && !/^\d{15}$/.test(term))) {
            return res.json({ success: true, results: [], total: 0, query: term, mode: 'fuzzy' });
        }
        const upper = term.toUpperCase();
        const isImei = /^\d{15}$/.test(term);
        const isLikelySerial = !isImei && /^[A-Z0-9]{8,20}$/.test(upper);
        const exactClauses = [];
        if (isImei) exactClauses.push({ mobile_imei: term });
        if (isLikelySerial) exactClauses.push({ serial_number: upper });
        exactClauses.push({ model_number: upper });
        const safeRegex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const fuzzyClauses = [
            { brand: safeRegex }, { model_number: safeRegex }, { serial_number: safeRegex }, { product_name: safeRegex }, { mobile_imei: term }
        ];
        const query = exactClauses.length ? { $or: [...exactClauses, ...fuzzyClauses] } : { $or: fuzzyClauses };
        const projection = { brand:1, model_number:1, serial_number:1, dealer_price:1, mrp:1, sold:1, deleted:1, updatedAt:1, category_path:1, category_path_ids:1, mobile_imei:1 };
        const docs = await Product.find(query, projection).limit(maxLimit).sort({ updatedAt: -1 });
        const results = docs.map(d=>{
            const o=d.toObject();
            return {
                _id:o._id,
                brand:o.brand||o.mobile_brand||o.tv_brand||o.fridge_brand||o.ac_brand||null,
                model_number:o.model_number||null,
                serial_number:o.serial_number||o.serialNumber||null,
                dealer_price:o.dealer_price??null,
                mrp:o.mrp??null,
                sold:o.sold===true,
                deleted:o.deleted===true,
                updatedAt:o.updatedAt,
                category_path:o.category_path||[],
                mobile_imei:o.mobile_imei||[]
            };
        });
        const score=(r)=>{let s=0; if(isImei&&r.mobile_imei.includes(term))s+=50; if(r.serial_number&&r.serial_number.toUpperCase()===upper)s+=40; if(r.model_number&&r.model_number.toUpperCase()===upper)s+=30; if(r.brand&&r.brand.toUpperCase()===upper)s+=20; return -s;};
        results.sort((a,b)=>score(a)-score(b));
        res.json({ success:true, results, total:results.length, query:term, analysis:{ isImei, isLikelySerial }, mode:'fuzzy' });
    } catch (error) {
        console.error('Global product search error:', error);
        res.status(500).json({ success:false, message:error.message||'Server error running global search' });
    }
});

// @desc    Get deleted (soft-deleted) products
// @route   GET /api/products/deleted
// @access  Protected
router.get('/deleted', protect, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const query = { deleted: true };
        console.log('🔍 Fetching deleted products', { page, limit, query });
        const products = await Product.find(query)
            .populate('supplierId', 'name companyName gstNumber')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ updatedAt: -1 });
        console.log('✅ Deleted products fetched count:', products.length);
        const total = await Product.countDocuments(query);
        res.json({ success: true, products, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('❌ Get deleted products error. Context:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            page: req.query.page,
            limit: req.query.limit
        });
        res.status(500).json({ success: false, message: error.message || 'Server error while fetching deleted products', error: error.name });
    }
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Protected
router.get('/:id', protect, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('supplierId', 'companyName contactPerson phone email'); // removed brandId/categoryId populates

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while fetching product' });
    }
});

// @desc    Create product(s)
// @route   POST /api/products
// @access  Protected (Admin/Manager only)
router.post('/', protect, checkPermission('create'), async (req, res) => {
    console.log('📦 POST /api/products - Creating product(s)');
    console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        let productsArray = [];
        if (req.body.products && Array.isArray(req.body.products)) {
            productsArray = req.body.products;
            console.log(`📦 Processing ${productsArray.length} products from array`);
        } else {
            productsArray = [req.body];
            console.log('📦 Processing single product (converted to array)');
        }

        const createdProducts = [];
        const errors = [];

        for (let i = 0; i < productsArray.length; i++) {
            const productData = productsArray[i];
            try {
                console.log(`🔄 Processing product ${i + 1}/${productsArray.length}`);
                if (!productData.supplierId) throw new Error(`Product ${i + 1}: Distributor (supplierId) is required`);

                // Duplicate serial number check (case-insensitive)
                if (productData.serial_number) {
                    const existingSerial = await Product.findOne({ serial_number: productData.serial_number.toUpperCase() });
                    if (existingSerial) {
                        throw new Error(`Product ${i + 1}: Duplicate serial number '${productData.serial_number}' already exists`);
                    }
                }

                // Duplicate IMEI check (mobile_imei can be string or array)
                if (productData.mobile_imei) {
                    const imeis = Array.isArray(productData.mobile_imei) ? productData.mobile_imei : [productData.mobile_imei];
                    const cleanedImeis = imeis.map(v => String(v).trim()).filter(Boolean);
                    if (cleanedImeis.length) {
                        // Query for each IMEI specifically and gather only duplicates
                        const duplicates = [];
                        for (const imei of cleanedImeis) {
                            const exists = await Product.findOne({ mobile_imei: imei });
                            if (exists) duplicates.push(imei);
                        }
                        if (duplicates.length) {
                            throw new Error(`Product ${i + 1}: IMEI already exists (${duplicates.join(', ')})`);
                        }
                    }
                }

                const Distributor = require('../models/Distributor');
                const distributor = await Distributor.findById(productData.supplierId);
                if (!distributor) throw new Error(`Product ${i + 1}: Invalid distributor ID`);
                console.log(`✅ Product ${i + 1} - Validated distributor:`, distributor.name);

                const cleanProductData = { supplierId: productData.supplierId, sold: false };

                if (productData.categoryId) {
                    try {
                        const leafCategory = await Category.findById(productData.categoryId);
                        if (!leafCategory) throw new Error('Invalid categoryId provided');
                        const path = await leafCategory.getCategoryPath();
                        console.log(`🧭 Category path for product ${i + 1}:`, path.map(p => `${p.level}:${p.field_key}=>${p.name}`).join(' | '));
                        // Store names not ids for hierarchy
                        path.forEach(node => {
                            cleanProductData[node.field_key] = node.name; // human readable
                        });
                        // Do NOT copy categoryId (de-duplicate)
                    } catch (catErr) {
                        console.error('❌ Failed hierarchy build:', catErr.message);
                        throw new Error(`Product ${i + 1}: ${catErr.message}`);
                    }
                }

                Object.keys(productData).forEach(key => {
                    if (['supplierId', 'distributorId', 'categoryId'].includes(key)) return;
                    if (/^[a-z0-9_]+$/.test(key)) cleanProductData[key] = productData[key];
                });

                // Normalize serial number fields to uppercase (both serial_number & serialNumber just in case)
                if (cleanProductData.serial_number && typeof cleanProductData.serial_number === 'string') {
                    cleanProductData.serial_number = cleanProductData.serial_number.toUpperCase();
                }
                // Normalize model_number to uppercase
                if (cleanProductData.model_number && typeof cleanProductData.model_number === 'string') {
                    cleanProductData.model_number = cleanProductData.model_number.toUpperCase();
                }
                if (cleanProductData.serialNumber && typeof cleanProductData.serialNumber === 'string') {
                    cleanProductData.serialNumber = cleanProductData.serialNumber.toUpperCase();
                }

                // Validate pricing rule: dealer_price <= mrp (if both present as numbers)
                if (cleanProductData.dealer_price != null && cleanProductData.mrp != null) {
                    const dp = Number(cleanProductData.dealer_price);
                    const mrpVal = Number(cleanProductData.mrp);
                    if (!isNaN(dp) && !isNaN(mrpVal) && dp > mrpVal) {
                        throw new Error(`Product ${i + 1}: Dealer Price (₹${dp}) cannot exceed MRP (₹${mrpVal})`);
                    }
                }

                console.log(`🧹 Cleaned product data ${i + 1}:`, cleanProductData);
                const product = new Product(cleanProductData);
                const savedProduct = await product.save();
                await savedProduct.populate('supplierId', 'name gstNumber');
                createdProducts.push(savedProduct);
                console.log(`✅ Product ${i + 1} saved:`, savedProduct._id);
            } catch (error) {
                console.error(`❌ Error creating product ${i + 1}:`, error.message);
                errors.push({ index: i + 1, message: error.message, productData: productData.model_number || `Product ${i + 1}` });
            }
        }

        if (createdProducts.length === 0) {
            return res.status(400).json({ success: false, message: 'Failed to create any products', errors });
        }

        const response = {
            success: true,
            message: createdProducts.length === 1 ? 'Product created successfully' : `Created ${createdProducts.length} of ${productsArray.length} products`,
            data: createdProducts.length === 1 ? createdProducts[0] : createdProducts,
            summary: { total: productsArray.length, successful: createdProducts.length, failed: errors.length }
        };
        if (errors.length) response.errors = errors;
        res.status(errors.length ? 207 : 201).json(response);

    } catch (error) {
        console.error('❌ Error in product creation:', error);
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ success: false, message: `Product with this ${duplicateField} already exists` });
        }
        res.status(500).json({ success: false, message: error.message || 'Failed to create product(s)' });
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
                    mrp: sellingPrice, // renamed from price
                    warrantyMonths: 12,
                    serialNumber: serialNumber || undefined,
                    common_attributes: commonAttrs,
                    specific_attributes: specificAttrs,
                    isActive: true,
                    sold: false,
                    lastPurchaseDate: new Date()
                };

                // Normalize serial number to uppercase if present
                if (newProductData.serialNumber && typeof newProductData.serialNumber === 'string') {
                    newProductData.serialNumber = newProductData.serialNumber.toUpperCase();
                }

                // If dealer_price & mrp both present ensure dealer_price <= mrp
                if (productData.dealer_price != null && newProductData.mrp != null) {
                    const dp = Number(productData.dealer_price);
                    const mrpVal = Number(newProductData.mrp);
                    if (!isNaN(dp) && !isNaN(mrpVal) && dp > mrpVal) {
                        throw new Error(`Product ${i + 1}: Dealer Price (₹${dp}) cannot exceed MRP (₹${mrpVal})`);
                    }
                }

                // Add any additional fields (loose schema support)
                Object.keys(productData).forEach(key => {
                    if (!newProductData.hasOwnProperty(key) && 
                        !['categoryFormData', 'categoryId', 'sellingPrice'].includes(key)) {
                        newProductData[key] = productData[key];
                    }
                });

                // Duplicate serial check (case-insensitive) if serial field present either as serial_number or serialNumber
                const candidateSerial = productData.serial_number || productData.serialNumber || newProductData.serial_number || newProductData.serialNumber;
                if (candidateSerial) {
                    const existingSerial = await Product.findOne({ serial_number: candidateSerial.toUpperCase() });
                    if (existingSerial) {
                        throw new Error(`Product ${i + 1}: Duplicate serial number '${candidateSerial}' already exists`);
                    }
                }

                // Duplicate IMEI check if mobile_imei provided in categoryFormData or product root
                const rawImei = categoryFormData.mobile_imei || productData.mobile_imei;
                if (rawImei) {
                    const imeis = Array.isArray(rawImei) ? rawImei : [rawImei];
                    const cleanedImeis = imeis.map(v => String(v).trim()).filter(Boolean);
                    if (cleanedImeis.length) {
                        const duplicates = [];
                        for (const imei of cleanedImeis) {
                            const exists = await Product.findOne({ mobile_imei: imei });
                            if (exists) duplicates.push(imei);
                        }
                        if (duplicates.length) {
                            throw new Error(`Product ${i + 1}: IMEI already exists (${duplicates.join(', ')})`);
                        }
                    }
                    if (!newProductData.mobile_imei) newProductData.mobile_imei = imeis;
                }

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

// @desc    Get deleted (soft-deleted) products
// @route   GET /api/products/deleted
// @access  Protected

// @desc    Restore a soft-deleted product
// @route   PATCH /api/products/:id/restore
// @access  Protected
router.patch('/:id/restore', protect, checkPermission('update'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (!product.deleted) return res.json({ success: true, message: 'Product already active' });
        product.deleted = false;
        product.isActive = true;
        await product.save();
        res.json({ success: true, message: 'Product restored', data: product });
    } catch (error) {
        console.error('Restore product error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error while restoring product' });
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
        .populate('supplierId', 'name') // removed brandId/categoryId populates
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
