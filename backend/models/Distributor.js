const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    companyType: {
        type: String,
        required: true,
        enum: ['Sole Proprietorship', 'Partnership', 'Private Limited', 'Public Limited', 'LLP']
    },
    gstNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    panNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    primaryPhone: {
        type: String,
        required: true,
        trim: true
    },
    secondaryPhone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    website: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pinCode: {
        type: String,
        required: true,
        trim: true
    },
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    ifscCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    branchName: {
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
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    deleted: {
        type: Boolean,
        default: false
    },
    // Legacy fields for compatibility
    contactPerson: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    totalPurchaseAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalProductsPurchased: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'distributors'
});

// Create text index for search
distributorSchema.index({ 
    name: 'text', 
    companyType: 'text',
    primaryPhone: 'text',
    email: 'text',
    gstNumber: 'text',
    city: 'text',
    state: 'text'
});

// Index for better query performance
distributorSchema.index({ name: 1 });
distributorSchema.index({ gstNumber: 1 });
distributorSchema.index({ email: 1 });

module.exports = mongoose.model('Distributor', distributorSchema);
