const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
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
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        country: { type: String, default: 'India', trim: true }
    },
    aadharNumber: {
        type: String,
        trim: true
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true
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
    phone: 'text',
    alternatePhone: 'text',
    email: 'text'
});

// Additional indexes
customerSchema.index({ phone: 1 });
customerSchema.index({ aadharNumber: 1 });
customerSchema.index({ panNumber: 1 });

module.exports = mongoose.model('Customer', customerSchema);
