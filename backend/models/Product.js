const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    modelNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    // Pricing fields
    purchasePrice: {
        type: Number,
        required: true,
        min: 0
    },
    mrp: {
        type: Number,
        required: true,
        min: 0
    },
    sellingPrice: {
        type: Number,
        required: true,
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
        required: true,
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
    basePrice: { // Keep for backward compatibility
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Supplier information
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor' // Assuming suppliers are distributors
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

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.mrp > 0) {
        return ((this.mrp - this.sellingPrice) / this.mrp * 100).toFixed(2);
    }
    return 0;
});

// Virtual for IGST (for interstate sales)
productSchema.virtual('igst').get(function() {
    return this.gstRate;
});

// Virtual for CGST (for intrastate sales) 
productSchema.virtual('cgst').get(function() {
    return this.gstRate / 2;
});

// Virtual for SGST (for intrastate sales)
productSchema.virtual('sgst').get(function() {
    return this.gstRate / 2;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Create text index for search
productSchema.index({ 
    name: 'text', 
    modelNumber: 'text',
    'specifications.storage': 'text',
    'specifications.color': 'text'
});

// Compound indexes for performance
productSchema.index({ brandId: 1, categoryId: 1 });
productSchema.index({ modelNumber: 1 });

module.exports = mongoose.model('Product', productSchema);
