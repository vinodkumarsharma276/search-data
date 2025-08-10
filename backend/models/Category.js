const mongoose = require('mongoose');

// Schema for form field definitions
const formFieldSchema = new mongoose.Schema({
    field_id: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'number', 'boolean', 'dropdown', 'combobox'],
        required: true
    },
    default_value: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    is_required: {
        type: Boolean,
        default: false
    },
    enabled: {
        type: Boolean,
        default: true
    },
    options: [{
        value: String,
        label: String
    }],
    display_order: {
        type: Number,
        default: 0
    },
    visibility_rules: [{
        field: String,
        operator: {
            type: String,
            enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains']
        },
        value: mongoose.Schema.Types.Mixed
    }]
}, { _id: false });

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    is_leaf: {
        type: Boolean,
        default: false
    },
    level: {
        type: Number,
        default: 0,
        index: true
    },
    field_key: {
        type: String,
        required: true,
        index: true
    },
    field_label: {
        type: String,
        required: true
    },
    // Root category ancestor id (top-level category); equals _id for level 0
    root_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true
    },
    // Cached path arrays (root -> this)
    path_ids: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
        index: true
    },
    path_keys: {
        type: [String],
        default: []
    },
    form_schema: [formFieldSchema],
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Create indexes for performance
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ parent_id: 1 });
categorySchema.index({ is_leaf: 1 });
categorySchema.index({ 'form_schema.field_id': 1 });
categorySchema.index({ root_id: 1, level: 1 });
categorySchema.index({ parent_id: 1, name: 1 }, { unique: true });

// Virtual for getting children
categorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent_id'
});

// Method to get full category path
categorySchema.methods.getCategoryPath = async function() {
    const path = [];
    let current = this;
    
    while (current) {
        path.unshift({
            id: current._id,
            name: current.name,
            field_key: current.field_key,
            field_label: current.field_label,
            level: current.level
        });
        
        if (current.parent_id) {
            current = await this.constructor.findById(current.parent_id);
        } else {
            current = null;
        }
    }
    
    return path;
};

// Static method to compile full form schema
categorySchema.statics.compileFullFormSchema = async function(leafCategoryId) {
    const category = await this.findById(leafCategoryId);
    if (!category || !category.is_leaf) {
        throw new Error('Invalid leaf category: ' + leafCategoryId);
    }
    
    const schemas = [];
    let current = category;
    
    // 1. Collect all form schemas from the current category's tree (leaf to root)
    while (current) {
        if (current.form_schema && current.form_schema.length > 0) {
            schemas.push({
                categoryId: current._id,
                categoryName: current.name,
                fields: current.form_schema
            });
        }
        
        if (current.parent_id) {
            current = await this.findById(current.parent_id);
        } else {
            current = null;
        }
    }

    // 3. Merge schemas (child/specific overrides parent/common)
    const fieldMap = new Map();
    
    // Process from parent to child (reverse order of collection)
    schemas.reverse().forEach(schema => {
        schema.fields.forEach(field => {
            fieldMap.set(field.field_id, {
                ...field.toObject(),
                categoryId: schema.categoryId,
                categoryName: schema.categoryName
            });
        });
    });
    
    // Convert to array and sort by display_order
    const mergedSchema = Array.from(fieldMap.values()).sort((a, b) => a.display_order - b.display_order);
    
    return mergedSchema;
};

// Pre-save hook to populate root_id and path arrays if not already set
categorySchema.pre('save', async function(next) {
    if (!this.isModified('parent_id') && this.root_id && this.path_ids && this.path_ids.length) {
        return next();
    }
    if (!this.parent_id) {
        // Root category
        this.root_id = this._id; // will be available post-save; keep self for consistency
        this.path_ids = [this._id];
        this.path_keys = [this.field_key];
    } else {
        const parent = await this.constructor.findById(this.parent_id).lean();
        if (parent) {
            this.root_id = parent.root_id || parent._id;
            this.path_ids = [...(parent.path_ids || [parent._id]), this._id];
            this.path_keys = [...(parent.path_keys || [parent.field_key]), this.field_key];
        }
    }
    next();
});

// Static to rebuild materialized root tree document
categorySchema.statics.rebuildRootTree = async function(rootId) {
    const CategoryRoot = require('./CategoryRoot');
    const rootCat = await this.findById(rootId);
    if (!rootCat) throw new Error('Root category not found: ' + rootId);
    const nodes = await this.find({ root_id: rootCat._id }).lean();
    await CategoryRoot.findOneAndUpdate(
        { root_key: rootCat.name },
        { root_key: rootCat.name, root_id: rootCat._id, nodes, updatedAt: new Date() },
        { upsert: true }
    );
    return { count: nodes.length };
};

module.exports = mongoose.model('Category', categorySchema);
