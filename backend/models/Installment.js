const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
    saleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    installmentNumber: {
        type: Number,
        required: true,
        min: 1
    },
    dueDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Overdue'],
        default: 'Pending'
    },
    paidDate: {
        type: Date
    },
    paidAmount: {
        type: Number,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Bank Transfer']
    },
    transactionId: {
        type: String,
        trim: true
    },
    lateFee: {
        type: Number,
        default: 0,
        min: 0
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Create indexes for performance
installmentSchema.index({ saleId: 1 });
installmentSchema.index({ customerId: 1 });
installmentSchema.index({ dueDate: 1 });
installmentSchema.index({ status: 1 });
installmentSchema.index({ installmentNumber: 1 });

// Compound index for unique installment per sale
installmentSchema.index({ saleId: 1, installmentNumber: 1 }, { unique: true });

module.exports = mongoose.model('Installment', installmentSchema);
