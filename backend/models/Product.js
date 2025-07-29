const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Minimal required system fields - everything else is flexible
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: true
    }
}, {
    timestamps: true,
    strict: false // Allow any additional fields
});

// Helper method to get display name
productSchema.methods.getDisplayName = function() {
    // Try to get name from any field that might contain a product name
    return this.name || 
           this.product_name ||
           this.model_number ||
           this.brand ||
           this.mobile_brand ||
           this.tv_brand ||
           this.model ||
           'Unknown Product';
};

// Helper method to get price
productSchema.methods.getPrice = function() {
    return this.price || 
           this.sellingPrice ||
           this.common_purchase_price ||
           this.purchase_price ||
           0;
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
productSchema.index({ supplierId: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
