const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    imeiNumber: {
        type: String,
        trim: true
    },
    distributorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: true
    },
    purchaseDetails: {
        purchaseDate: {
            type: Date,
            required: true
        },
        purchasePrice: {
            type: Number,
            required: true,
            min: 0
        },
        invoiceNumber: {
            type: String,
            trim: true
        },
        gstAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        }
    },
    status: {
        type: String,
        enum: ['Available', 'Sold', 'Damaged', 'Returned'],
        default: 'Available'
    },
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale'
    }
}, {
    timestamps: true
});

// Create indexes for performance
inventorySchema.index({ serialNumber: 1 }, { unique: true });
inventorySchema.index({ status: 1 });
inventorySchema.index({ productId: 1 });
inventorySchema.index({ distributorId: 1 });
inventorySchema.index({ imeiNumber: 1 });

// Text search index
inventorySchema.index({ 
    serialNumber: 'text',
    imeiNumber: 'text'
});

module.exports = mongoose.model('Inventory', inventorySchema);
