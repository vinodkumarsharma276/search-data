const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    zone: {
        type: String,
        required: true,
        trim: true
    },
    mobile: [{
        type: String,
        required: true,
        trim: true
    }],
    aadharNumber: {
        type: String,
        trim: true
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    // Legacy fields for backward compatibility
    phone: {
        type: String,
        trim: true,
        index: true
    },
    alternatePhone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    dateOfBirth: {
        type: Date
    },
    occupation: {
        type: String,
        trim: true
    },
    monthlyIncome: {
        type: Number,
        min: 0
    },
    creditScore: {
        type: Number,
        min: 300,
        max: 900,
        default: 700
    },
    totalPurchases: {
        type: Number,
        default: 0,
        min: 0
    },
    totalOutstanding: {
        type: Number,
        default: 0,
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
customerSchema.index({ 
    name: 'text', 
    mobile: 'text',
    phone: 'text',
    alternatePhone: 'text',
    email: 'text'
});

// Additional indexes
customerSchema.index({ mobile: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ aadharNumber: 1 });
customerSchema.index({ panNumber: 1 });

module.exports = mongoose.model('Customer', customerSchema);
