const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    saleNumber: {
        type: String,
        unique: true,
        trim: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    guarantorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    items: [{
        inventoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        sellingPrice: {
            type: Number,
            required: true,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        finalPrice: {
            type: Number,
            required: true,
            min: 0
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
    }],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    totalGst: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentType: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Installment'],
        required: true
    },
    paymentDetails: {
        // For immediate payments
        amountPaid: { type: Number, min: 0 },
        paymentMethod: { type: String },
        transactionId: { type: String, trim: true },
        
        // For installments
        downPayment: { type: Number, min: 0 },
        fileCharge: { type: Number, default: 0, min: 0 },
        interestRate: { type: Number, min: 0, max: 100 },
        installmentMonths: { type: Number, min: 1, max: 60 },
        monthlyInstallment: { type: Number, min: 0 },
        totalInstallmentAmount: { type: Number, min: 0 },
        emiStartDate: { type: Date }
    },
    salesPerson: {
        type: String,
        required: true,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

// Create indexes for performance
saleSchema.index({ saleNumber: 1 }, { unique: true });
saleSchema.index({ customerId: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ paymentType: 1 });

// Pre-save middleware to generate sale number
saleSchema.pre('save', async function(next) {
    if (this.isNew && !this.saleNumber) {
        const count = await this.constructor.countDocuments();
        const year = new Date().getFullYear();
        this.saleNumber = `SALE-${year}-${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Sale', saleSchema);
