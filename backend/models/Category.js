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
            name: current.name
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

module.exports = mongoose.model('Category', categorySchema);
