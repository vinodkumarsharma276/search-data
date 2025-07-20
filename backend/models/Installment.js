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
    originalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Overdue', 'Partially Paid'],
        default: 'Pending'
    },
    
    // Payment tracking
    paidDate: {
        type: Date
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingAmount: {
        type: Number,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque']
    },
    transactionId: {
        type: String,
        trim: true
    },
    
    // Penalty system (₹2 per day)
    penaltyDetails: {
        daysOverdue: {
            type: Number,
            default: 0,
            min: 0
        },
        penaltyRate: {
            type: Number,
            default: 2, // ₹2 per day
            min: 0
        },
        totalPenalty: {
            type: Number,
            default: 0,
            min: 0
        },
        penaltyPaid: {
            type: Number,
            default: 0,
            min: 0
        },
        remainingPenalty: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // Final amount including penalty
    totalAmountDue: {
        type: Number,
        min: 0
    },
    
    // Additional tracking
    remindersSent: {
        type: Number,
        default: 0
    },
    lastReminderDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    
    // Auto-calculated fields
    isOverdue: {
        type: Boolean,
        default: false
    },
    overdueBy: {
        type: Number, // days
        default: 0
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
installmentSchema.index({ isOverdue: 1 });

// Compound index for unique installment per sale
installmentSchema.index({ saleId: 1, installmentNumber: 1 }, { unique: true });

// Pre-save middleware for auto-calculations
installmentSchema.pre('save', function(next) {
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    
    // Calculate overdue status and days
    if (today > dueDate && this.status === 'Pending') {
        this.isOverdue = true;
        this.overdueBy = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        this.status = 'Overdue';
        
        // Calculate penalty (₹2 per day)
        this.penaltyDetails.daysOverdue = this.overdueBy;
        this.penaltyDetails.totalPenalty = this.overdueBy * this.penaltyDetails.penaltyRate;
        this.penaltyDetails.remainingPenalty = this.penaltyDetails.totalPenalty - this.penaltyDetails.penaltyPaid;
    }
    
    // Calculate remaining amount
    this.remainingAmount = this.originalAmount - this.paidAmount;
    
    // Calculate total amount due (original + penalty)
    this.totalAmountDue = this.remainingAmount + this.penaltyDetails.remainingPenalty;
    
    // Update status based on payment
    if (this.paidAmount >= this.originalAmount) {
        this.status = 'Paid';
        this.isOverdue = false;
    } else if (this.paidAmount > 0 && this.paidAmount < this.originalAmount) {
        this.status = 'Partially Paid';
    }
    
    next();
});

// Instance method to calculate current penalty
installmentSchema.methods.calculateCurrentPenalty = function() {
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    
    if (today > dueDate && this.status !== 'Paid') {
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        const totalPenalty = daysOverdue * this.penaltyDetails.penaltyRate;
        const remainingPenalty = totalPenalty - this.penaltyDetails.penaltyPaid;
        
        return {
            daysOverdue,
            totalPenalty,
            remainingPenalty
        };
    }
    
    return {
        daysOverdue: 0,
        totalPenalty: 0,
        remainingPenalty: 0
    };
};

// Static method to create installments for a sale
installmentSchema.statics.createInstallmentsForSale = async function(saleData) {
    const { 
        saleId, 
        customerId, 
        monthlyAmount, 
        numberOfInstallments, 
        startDate,
        downPayment = 0 
    } = saleData;
    
    const installments = [];
    let currentDate = new Date(startDate);
    
    for (let i = 1; i <= numberOfInstallments; i++) {
        // Add one month to the current date
        currentDate.setMonth(currentDate.getMonth() + 1);
        
        const installment = new this({
            saleId,
            customerId,
            installmentNumber: i,
            dueDate: new Date(currentDate),
            originalAmount: monthlyAmount,
            remainingAmount: monthlyAmount,
            totalAmountDue: monthlyAmount
        });
        
        installments.push(installment);
    }
    
    return await this.insertMany(installments);
};

module.exports = mongoose.model('Installment', installmentSchema);
