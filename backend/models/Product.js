const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Core system fields
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: true
    },
    
    // Soft delete flag
    deleted: {
        type: Boolean,
        default: false
    },
    // Sold flag
    sold: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true, // This provides createdAt and updatedAt
    strict: false // Allow any additional fields for dynamic schema
});

// Helper method to get display name (derived, not stored)
productSchema.methods.getDisplayName = function() {
    // Try to get name from dynamic fields - DO NOT store as 'name' field
    return this.product_name ||
           this.model_number ||
           this.brand ||
           this.mobile_brand ||
           this.tv_brand ||
           this.model ||
           'Unknown Product';
};

// Helper method to get price (derived, not stored)
productSchema.methods.getPrice = function() {
    return this.price || 
           this.sellingPrice ||
           this.dealer_price ||
           this.mrp ||
           this.common_purchase_price ||
           this.purchase_price ||
           0;
};

// Virtual for formatted price (only for API responses, not stored)
productSchema.virtual('displayName').get(function() {
    return this.getDisplayName();
});

// Remove formattedPrice virtual to prevent confusion in API responses
// Clients should format prices on their end

// Ensure virtual fields are serialized, but exclude system virtuals
productSchema.set('toJSON', { 
    virtuals: ['displayName'], // Only include displayName virtual
    transform: function(doc, ret) {
        // Remove confusing virtual fields from JSON output
        delete ret.formattedPrice;
        return ret;
    }
});
productSchema.set('toObject', { virtuals: true });

// Essential Indexes for Performance
productSchema.index({ supplierId: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ deleted: 1 });

// Compound index for non-deleted active products
productSchema.index({ deleted: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
