const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    transactionType: {
        type: String,
        enum: ['Sale', 'Purchase', 'Expense', 'Payment', 'Installment'],
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    referenceType: {
        type: String,
        enum: ['Sales', 'Purchases', 'Installments', 'Expenses'],
        required: true
    },
    accountType: {
        type: String,
        enum: ['Revenue', 'Expense', 'Asset', 'Liability'],
        required: true
    },
    debitAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    creditAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    transactionDate: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create indexes for performance
ledgerSchema.index({ transactionType: 1 });
ledgerSchema.index({ transactionDate: -1 });
ledgerSchema.index({ accountType: 1 });
ledgerSchema.index({ referenceId: 1, referenceType: 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
