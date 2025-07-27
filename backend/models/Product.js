const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Dynamic Category System (Core Structure)
    category_path: [{
        type: String,
        trim: true,
        required: true
    }],
    category_path_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }],
    selected_category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    
    // Supplier information (Essential for business)
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: true
    },
    
    // Truly Universal Product Fields (Common to ALL products)
    brand: {
        type: String,
        trim: true,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    warrantyMonths: {
        type: Number,
        default: 12,
        min: 0
    },
    
    // Serial number for tracking individual items (Universal for inventory)
    serialNumber: {
        type: String,
        trim: true,
        sparse: true, // Allows null values but enforces uniqueness for non-null values
        unique: true
    },
    
    // Stock management (Universal for inventory)
    currentStock: {
        type: Number,
        default: 1, // Start with 1 when product is added
        min: 0
    },
    
    // Flexible Dynamic Attributes (Category-specific fields)
    common_attributes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    specific_attributes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // System fields
    isActive: {
        type: Boolean,
        default: true
    },
    lastPurchaseDate: {
        type: Date,
        default: Date.now
    },
    lastSaleDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Helper method to get display name
productSchema.methods.getDisplayName = function() {
    // Try to get name from dynamic attributes, fallback to brand + model
    const name = this.common_attributes?.name || 
                 this.specific_attributes?.name || 
                 this.common_attributes?.product_name ||
                 this.specific_attributes?.product_name;
    
    if (name) return name;
    
    // Fallback: brand + model/type
    const model = this.common_attributes?.model || this.specific_attributes?.model || '';
    return model ? `${this.brand} ${model}` : this.brand;
};

// Helper method to get category path string
productSchema.methods.getCategoryPathString = function() {
    if (this.category_path && this.category_path.length > 0) {
        return this.category_path.join(' > ');
    }
    return 'Uncategorized';
};

// Helper method to get all searchable text for search functionality
productSchema.methods.getSearchableText = function() {
    const texts = [
        this.getDisplayName(),
        this.getCategoryPathString(),
        this.brand,
        this.serialNumber || ''
    ];
    
    // Add searchable attributes from dynamic system
    Object.values(this.common_attributes || {}).forEach(value => {
        if (typeof value === 'string' || typeof value === 'number') {
            texts.push(String(value));
        }
    });
    Object.values(this.specific_attributes || {}).forEach(value => {
        if (typeof value === 'string' || typeof value === 'number') {
            texts.push(String(value));
        }
    });
    
    return texts.filter(Boolean).join(' ');
};

// Helper method to get price (with fallbacks)
productSchema.methods.getPrice = function() {
    return this.price || 
           this.common_attributes?.common_price || 
           this.specific_attributes?.price || 
           0;
};

// Helper method to get warranty
productSchema.methods.getWarranty = function() {
    return this.warrantyMonths || 
           this.common_attributes?.common_warranty_months || 
           this.specific_attributes?.warranty_months || 
           12;
};

// Virtual for formatted price with currency
productSchema.virtual('formattedPrice').get(function() {
    const price = this.getPrice();
    return `₹${price.toLocaleString('en-IN')}`;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Essential Indexes for Performance
productSchema.index({ category_path: 1 });
productSchema.index({ selected_category_id: 1 });
productSchema.index({ supplierId: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ serialNumber: 1 }); // For inventory tracking
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 }); // For price-based queries

// Text search index for dynamic attributes
productSchema.index({ 
    'common_attributes.name': 'text',
    'specific_attributes.name': 'text',
    brand: 'text',
    category_path: 'text'
});

module.exports = mongoose.model('Product', productSchema);
