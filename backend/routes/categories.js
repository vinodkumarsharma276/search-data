const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const CategoryRoot = require('../models/CategoryRoot');
const { protect, checkPermission } = require('../middleware/auth');

// @route   GET /api/categories/top-level
// @desc    Get all top-level categories (parent_id: null)
// @access  Protected
router.get('/top-level', protect, async (req, res) => {
    try {
        console.log('📋 GET /api/categories/top-level - Fetching top-level categories');
        
        const categories = await Category.find({ 
            parent_id: null, 
            isActive: true 
        })
        .select('_id name is_leaf')
        .sort({ name: 1 });

        console.log('✅ Found top-level categories:', categories.length);

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('❌ Error fetching top-level categories:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch top-level categories'
        });
    }
});

// @route GET /api/categories/roots
// @desc  List root categories (materialized summary)
router.get('/roots', protect, async (req, res) => {
    try {
        const roots = await Category.find({ parent_id: null, isActive: true }).select('_id name').sort({ name: 1 });
        res.json({ success: true, data: roots.map(r => ({ root_id: r._id, root_key: r.name, name: r.name })) });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// @route GET /api/categories/tree/:rootKey
// @desc  Get materialized tree for a root (fallback rebuild if absent)
router.get('/tree/:rootKey', protect, async (req, res) => {
    try {
        let rootDoc = await CategoryRoot.findOne({ root_key: req.params.rootKey });
        if (!rootDoc) {
            // Attempt rebuild
            const rootCat = await Category.findOne({ name: req.params.rootKey, parent_id: null });
            if (!rootCat) return res.status(404).json({ success: false, message: 'Root not found' });
            await Category.rebuildRootTree(rootCat._id);
            rootDoc = await CategoryRoot.findOne({ root_key: req.params.rootKey });
        }
        res.json({ success: true, data: rootDoc });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// @route POST /api/categories
// @desc  Create a new category (root or child)
router.post('/', protect, checkPermission(['create']), async (req, res) => {
    try {
        const { name, parent_id, is_leaf, form_schema } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name required' });

        let level = 0; let field_key = 'main_category'; let field_label = 'Main Category';
        if (parent_id) {
            const parent = await Category.findById(parent_id);
            if (!parent) return res.status(404).json({ success: false, message: 'Parent not found' });
            level = parent.level + 1;
            field_key = `sub_category_${level}`;
            field_label = `Sub Category ${level}`;
        }
        const cat = new Category({ name, parent_id: parent_id || null, is_leaf: !!is_leaf, level, field_key, field_label, form_schema: Array.isArray(form_schema)?form_schema:[] });
        await cat.save();
        // Rebuild materialized tree for affected root
        await Category.rebuildRootTree(cat.root_id || cat._id);
        res.status(201).json({ success: true, data: cat });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(409).json({ success: false, message: 'Duplicate category name under same parent' });
        }
        res.status(500).json({ success: false, message: e.message });
    }
});

// @route POST /api/categories/rebuild/:rootId
// @desc  Force rebuild of a root materialized tree
router.post('/rebuild/:rootId', protect, checkPermission(['update']), async (req, res) => {
    try {
        const result = await Category.rebuildRootTree(req.params.rootId);
        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// @route   GET /api/categories/common-fields
// @desc    Get common fields from Electronics category (root category with common fields)
// @access  Protected
router.get('/common-fields', protect, async (req, res) => {
    try {
        console.log('📋 GET /api/categories/common-fields - Fetching common fields');
        
        // Find Electronics category (root category with common fields)
        const electronicsCategory = await Category.findOne({ 
            name: 'Electronics', 
            parent_id: null 
        });
        
        if (!electronicsCategory) {
            return res.status(404).json({
                success: false,
                message: 'Electronics category not found'
            });
        }

        const commonFields = electronicsCategory.form_schema || [];
        
        console.log('✅ Common fields found:', commonFields.length);

        res.json({
            success: true,
            data: commonFields
        });
    } catch (error) {
        console.error('❌ Error fetching common fields:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch common fields'
        });
    }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID with full details
// @access  Protected
router.get('/:id', protect, async (req, res) => {
    try {
        console.log('📋 GET /api/categories/:id - Fetching category:', req.params.id);
        
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        console.log('✅ Found category:', category.name);

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('❌ Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch category'
        });
    }
});

// @route   GET /api/categories/:id/children
// @desc    Get direct children of a category
// @access  Protected
router.get('/:id/children', protect, async (req, res) => {
    try {
        console.log('📋 GET /api/categories/:id/children - Fetching children for:', req.params.id);
        
        const children = await Category.find({ 
            parent_id: req.params.id, 
            isActive: true 
        })
        .select('_id name is_leaf')
        .sort({ name: 1 });

        console.log('✅ Found children:', children.length);

        res.json({
            success: true,
            data: children
        });
    } catch (error) {
        console.error('❌ Error fetching category children:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch category children'
        });
    }
});

// @route   GET /api/categories/:id/full-schema
// @desc    Get compiled form schema for a leaf category
// @access  Protected
router.get('/:id/full-schema', protect, async (req, res) => {
    try {
        console.log('📋 GET /api/categories/:id/full-schema - Compiling schema for:', req.params.id);
        
        const fullSchema = await Category.compileFullFormSchema(req.params.id);
        
        console.log('✅ Compiled schema with fields:', fullSchema.length);

        res.json({
            success: true,
            data: fullSchema
        });
    } catch (error) {
        console.error('❌ Error compiling form schema:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to compile form schema'
        });
    }
});

// @route   PUT /api/categories/:id/update-field-options
// @desc    Add new option to a combobox field
// @access  Protected
router.put('/:id/update-field-options', protect, checkPermission(['update']), async (req, res) => {
    try {
        const { field_id, new_option_value, new_option_label } = req.body;
        
        console.log('📋 PUT /api/categories/:id/update-field-options');
        console.log('   Category ID:', req.params.id);
        console.log('   Field ID:', field_id);
        console.log('   New Option:', { value: new_option_value, label: new_option_label });

        if (!field_id || !new_option_value || !new_option_label) {
            return res.status(400).json({
                success: false,
                message: 'field_id, new_option_value, and new_option_label are required'
            });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Find the field in form_schema
        const fieldIndex = category.form_schema.findIndex(field => field.field_id === field_id);
        if (fieldIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Field not found in category schema'
            });
        }

        const field = category.form_schema[fieldIndex];
        if (field.type !== 'combobox' && field.type !== 'dropdown') {
            return res.status(400).json({
                success: false,
                message: 'Field is not a combobox or dropdown'
            });
        }

        // Check if option already exists
        const existingOption = field.options.find(opt => opt.value === new_option_value);
        if (existingOption) {
            return res.status(400).json({
                success: false,
                message: 'Option already exists'
            });
        }

        // Add new option
        category.form_schema[fieldIndex].options.push({
            value: new_option_value,
            label: new_option_label
        });

        await category.save();

        console.log('✅ Added new option to field:', field_id);

        res.json({
            success: true,
            message: 'Option added successfully',
            data: category.form_schema[fieldIndex]
        });

    } catch (error) {
        console.error('❌ Error updating field options:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update field options'
        });
    }
});

// @route   GET /api/categories/:id/path
// @desc    Get full category path from root to specified category
// @access  Protected
router.get('/:id/path', protect, async (req, res) => {
    try {
        console.log('📋 GET /api/categories/:id/path - Getting path for:', req.params.id);
        
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const path = await category.getCategoryPath();

        console.log('✅ Category path:', path.map(p => p.name).join(' > '));

        res.json({
            success: true,
            data: path
        });
    } catch (error) {
        console.error('❌ Error getting category path:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get category path'
        });
    }
});

module.exports = router;
