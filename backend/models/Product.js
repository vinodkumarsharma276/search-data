const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Dynamic Category System
    category_path: [{
        type: String,
        trim: true
    }],
    category_path_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    selected_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    
    // Dynamic attributes based on category schema
    common_attributes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    specific_attributes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Legacy System Fields (for backward compatibility)
    name: {
        type: String,
        trim: true
    },
    modelNumber: {
        type: String,
        trim: true
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    
    // Pricing fields (common to both systems)
    purchasePrice: {
        type: Number,
        min: 0
    },
    mrp: {
        type: Number,
        min: 0
    },
    sellingPrice: {
        type: Number,
        min: 0
    },
    basePrice: { // Keep for backward compatibility
        type: Number,
        min: 0
    },
    
    // Stock management
    currentStock: {
        type: Number,
        default: 0,
        min: 0
    },
    minimumStock: {
        type: Number,
        default: 5,
        min: 0
    },
    maximumStock: {
        type: Number,
        default: 100,
        min: 0
    },
    
    // Tax information
    gstRate: {
        type: Number,
        default: 18,
        min: 0,
        max: 50
    },
    hsnCode: {
        type: String,
        trim: true
    },
    
    // Product details
    description: {
        type: String,
        trim: true
    },
    features: [{
        type: String,
        trim: true
    }],
    warrantyPeriod: {
        type: Number, // in months
        default: 12,
        min: 0
    },
    
    // Storage and shipping
    weight: {
        type: Number, // in kg
        min: 0
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },
    
    // Images
    images: [{
        type: String, // URLs or file paths
        trim: true
    }],
    specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Supplier information - unified field
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: true // Required for both systems
    },
    lastPurchaseDate: {
        type: Date
    },
    lastSaleDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Helper method to get display name (supports both systems)
productSchema.methods.getDisplayName = function() {
    // Try dynamic attributes first, then legacy name
    return this.common_attributes?.name || 
           this.specific_attributes?.name || 
           this.common_attributes?.product_name ||
           this.specific_attributes?.product_name ||
           this.name || 
           'Unnamed Product';
};

// Helper method to get category path string (supports both systems)
productSchema.methods.getCategoryPathString = function() {
    if (this.category_path && this.category_path.length > 0) {
        return this.category_path.join(' > ');
    }
    return 'Uncategorized';
};

// Helper method to determine if this is a dynamic product
productSchema.methods.isDynamicProduct = function() {
    return !!(this.selected_category_id && (this.common_attributes || this.specific_attributes));
};

// Helper method to get all searchable text
productSchema.methods.getSearchableText = function() {
    const texts = [
        this.getDisplayName(),
        this.getCategoryPathString(),
        this.description || '',
        this.modelNumber || ''
    ];
    
    // Add searchable attributes from dynamic system
    Object.values(this.common_attributes || {}).forEach(value => {
        if (typeof value === 'string') texts.push(value);
    });
    Object.values(this.specific_attributes || {}).forEach(value => {
        if (typeof value === 'string') texts.push(value);
    });
    
    return texts.filter(Boolean).join(' ');
};

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    const mrp = this.mrp || this.common_attributes?.mrp || this.specific_attributes?.mrp;
    const selling = this.sellingPrice || this.common_attributes?.selling_price || this.specific_attributes?.selling_price;
    
    if (mrp > 0 && selling) {
        return ((mrp - selling) / mrp * 100).toFixed(2);
    }
    return 0;
});

// Virtual for IGST (for interstate sales)
productSchema.virtual('igst').get(function() {
    return this.gstRate || this.common_attributes?.gst_rate || this.specific_attributes?.gst_rate || 18;
});

// Virtual for CGST (for intrastate sales) 
productSchema.virtual('cgst').get(function() {
    const gst = this.gstRate || this.common_attributes?.gst_rate || this.specific_attributes?.gst_rate || 18;
    return gst / 2;
});

// Virtual for SGST (for intrastate sales)
productSchema.virtual('sgst').get(function() {
    const gst = this.gstRate || this.common_attributes?.gst_rate || this.specific_attributes?.gst_rate || 18;
    return gst / 2;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Indexes for Dynamic System
productSchema.index({ category_path: 1 });
productSchema.index({ selected_category_id: 1 });
productSchema.index({ 'common_attributes.name': 'text', 'specific_attributes.name': 'text' });

// Indexes for Legacy System
productSchema.index({ 
    name: 'text', 
    modelNumber: 'text',
    'specifications.storage': 'text',
    'specifications.color': 'text'
});

// Common indexes
productSchema.index({ supplierId: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ brandId: 1, categoryId: 1 }); // Legacy
productSchema.index({ modelNumber: 1 }); // Legacy, can be used for SKU too

module.exports = mongoose.model('Product', productSchema);
