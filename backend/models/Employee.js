const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    // Personal Information
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other']
    },
    maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed'],
        default: 'single'
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    
    // Address Information
    address: {
        street: String,
        city: String,
        state: String,
        country: {
            type: String,
            default: 'India'
        },
        pincode: String
    },
    
    // Emergency Contact
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    
    // Employment Details
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        enum: ['Sales', 'Accounts', 'Administration', 'Technical', 'Management', 'HR', 'Marketing', 'Operations']
    },
    designation: {
        type: String,
        required: true,
        trim: true
    },
    dateOfJoining: {
        type: Date,
        required: true,
        default: Date.now
    },
    employmentType: {
        type: String,
        required: true,
        enum: ['full-time', 'part-time', 'contract', 'intern'],
        default: 'full-time'
    },
    workLocation: {
        type: String,
        required: true,
        default: 'Head Office'
    },
    reportingManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    
    // Salary Information
    basicSalary: {
        type: Number,
        required: true,
        min: 0
    },
    allowances: {
        hra: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    
    // Banking Details
    bankDetails: {
        accountHolderName: {
            type: String,
            trim: true
        },
        accountNumber: {
            type: String,
            trim: true
        },
        ifscCode: {
            type: String,
            trim: true,
            uppercase: true
        },
        bankName: {
            type: String,
            trim: true
        },
        branch: {
            type: String,
            trim: true
        }
    },
    
    // Identity Documents
    panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        validate: {
            validator: function(v) {
                return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
            },
            message: 'Invalid PAN number format'
        }
    },
    aadhaarNumber: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^[0-9]{12}$/.test(v);
            },
            message: 'Aadhaar number must be 12 digits'
        }
    },
    
    // Professional Details
    qualifications: [{
        degree: String,
        institution: String,
        year: Number,
        percentage: Number
    }],
    experience: {
        totalYears: { type: Number, default: 0 },
        previousCompanies: [{
            company: String,
            designation: String,
            from: Date,
            to: Date,
            ctc: Number
        }]
    },
    skills: [{
        type: String,
        trim: true
    }],
    
    // Work Preferences
    workShift: {
        type: String,
        enum: ['morning', 'evening', 'night', 'rotational'],
        default: 'morning'
    },
    weekOffDays: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    
    // Documents and Photo
    profilePhoto: {
        type: String, // URL or file path
        trim: true
    },
    documents: {
        resume: String,
        offerLetter: String,
        idProof: String,
        addressProof: String,
        certificates: [String]
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    terminationDate: {
        type: Date
    },
    terminationReason: {
        type: String,
        trim: true
    },
    
    // Performance
    performanceRatings: [{
        period: String,
        rating: Number,
        comments: String,
        reviewDate: { type: Date, default: Date.now }
    }],
    
    // Leave Management
    leaveBalance: {
        earned: { type: Number, default: 21 },
        casual: { type: Number, default: 12 },
        sick: { type: Number, default: 12 },
        maternity: { type: Number, default: 0 },
        paternity: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
employeeSchema.virtual('age').get(function() {
    if (this.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    return null;
});

// Virtual for total salary
employeeSchema.virtual('totalSalary').get(function() {
    const allowanceTotal = (this.allowances?.hra || 0) + 
                          (this.allowances?.transport || 0) + 
                          (this.allowances?.medical || 0) + 
                          (this.allowances?.other || 0);
    return this.basicSalary + allowanceTotal;
});

// Virtual for years of service
employeeSchema.virtual('yearsOfService').get(function() {
    const today = new Date();
    const joinDate = new Date(this.dateOfJoining);
    const years = today.getFullYear() - joinDate.getFullYear();
    const monthDiff = today.getMonth() - joinDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joinDate.getDate())) {
        return years - 1;
    }
    return years;
});

// Ensure virtual fields are serialized
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

// Create text index for search
employeeSchema.index({ 
    firstName: 'text', 
    lastName: 'text',
    email: 'text',
    employeeId: 'text',
    department: 'text',
    designation: 'text'
});

// Compound indexes for performance
employeeSchema.index({ department: 1, isActive: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ email: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
