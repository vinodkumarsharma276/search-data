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
    specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

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
