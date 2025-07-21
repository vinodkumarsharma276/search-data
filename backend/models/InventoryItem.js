const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    purchasePrice: {
        type: Number,
        required: true,
        min: 0
    },
    purchaseDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        // Not required initially, can be added later
    },
    condition: {
        type: String,
        enum: ['new', 'refurbished', 'used', 'damaged'],
        default: 'new'
    },
    status: {
        type: String,
        enum: ['available', 'sold', 'reserved', 'damaged', 'returned'],
        default: 'available'
    },
    location: {
        type: String,
        trim: true,
        default: 'main-store'
    },
    notes: {
        type: String,
        trim: true
    },
    soldDate: {
        type: Date
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale'
    },
    warranty: {
        startDate: {
            type: Date
        },
        endDate: {
            type: Date
        },
        type: {
            type: String,
            enum: ['manufacturer', 'extended', 'store'],
            default: 'manufacturer'
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
inventoryItemSchema.index({ productId: 1 });
inventoryItemSchema.index({ serialNumber: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ productId: 1, status: 1 });

// Virtual to get product details
inventoryItemSchema.virtual('product', {
    ref: 'Product',
    localField: 'productId',
    foreignField: '_id',
    justOne: true
});

// Ensure virtual fields are serialized
inventoryItemSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
