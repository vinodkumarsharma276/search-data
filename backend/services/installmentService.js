const Sale = require('../models/Sale');
const Installment = require('../models/Installment');
const Customer = require('../models/Customer');

class InstallmentService {
    
    /**
     * Create installments when a sale is made with installment payment
     * @param {Object} saleData - Sale information
     * @returns {Array} Created installments
     */
    static async createInstallmentsForSale(saleData) {
        const { saleId, totalAmount, downPayment, installmentMonths, emiStartDate } = saleData;
        
        // Get sale details
        const sale = await Sale.findById(saleId).populate('customerId');
        if (!sale) {
            throw new Error('Sale not found');
        }
        
        // Calculate monthly installment amount
        const remainingAmount = totalAmount - (downPayment || 0);
        const monthlyAmount = Math.round(remainingAmount / installmentMonths);
        
        // Create installments using static method
        const installments = await Installment.createInstallmentsForSale({
            saleId: sale._id,
            customerId: sale.customerId._id,
            monthlyAmount,
            numberOfInstallments: installmentMonths,
            startDate: emiStartDate,
            downPayment
        });
        
        return installments;
    }
    
    /**
     * Get installment details for a specific sale with penalty calculations
     * @param {String} saleId - Sale ID
     * @returns {Object} Sale with installments and summary
     */
    static async getSaleInstallmentDetails(saleId) {
        // Get sale details
        const sale = await Sale.findById(saleId)
            .populate('customerId', 'name phone address')
            .populate('items.productId', 'name brand category');
        
        if (!sale) {
            throw new Error('Sale not found');
        }
        
        // Get all installments for this sale
        const installments = await Installment.find({ saleId })
            .sort({ installmentNumber: 1 });
        
        // Calculate current penalties for each installment
        const installmentsWithPenalty = installments.map(installment => {
            const penaltyInfo = installment.calculateCurrentPenalty();
            return {
                ...installment.toObject(),
                currentPenalty: penaltyInfo
            };
        });
        
        // Calculate summary
        const summary = this.calculateInstallmentSummary(installmentsWithPenalty);
        
        return {
            sale,
            installments: installmentsWithPenalty,
            summary
        };
    }
    
    /**
     * Calculate installment summary with penalties
     * @param {Array} installments - Array of installments
     * @returns {Object} Summary object
     */
    static calculateInstallmentSummary(installments) {
        const summary = {
            totalInstallments: installments.length,
            paidInstallments: 0,
            pendingInstallments: 0,
            overdueInstallments: 0,
            totalOriginalAmount: 0,
            totalPaidAmount: 0,
            totalRemainingAmount: 0,
            totalPenalty: 0,
            totalAmountDue: 0,
            nextDueDate: null,
            nextDueAmount: 0
        };
        
        let nextDue = null;
        
        installments.forEach(installment => {
            summary.totalOriginalAmount += installment.originalAmount;
            summary.totalPaidAmount += installment.paidAmount;
            summary.totalRemainingAmount += installment.remainingAmount;
            summary.totalPenalty += installment.currentPenalty.totalPenalty;
            summary.totalAmountDue += installment.totalAmountDue;
            
            switch (installment.status) {
                case 'Paid':
                    summary.paidInstallments++;
                    break;
                case 'Overdue':
                    summary.overdueInstallments++;
                    break;
                case 'Pending':
                case 'Partially Paid':
                    summary.pendingInstallments++;
                    
                    // Find next due date
                    if (!nextDue || new Date(installment.dueDate) < new Date(nextDue.dueDate)) {
                        nextDue = installment;
                    }
                    break;
            }
        });
        
        if (nextDue) {
            summary.nextDueDate = nextDue.dueDate;
            summary.nextDueAmount = nextDue.totalAmountDue;
        }
        
        return summary;
    }
    
    /**
     * Record a payment for an installment
     * @param {String} installmentId - Installment ID
     * @param {Object} paymentData - Payment information
     * @returns {Object} Updated installment
     */
    static async recordPayment(installmentId, paymentData) {
        const { amount, paymentMethod, transactionId, notes, penaltyPaid = 0 } = paymentData;
        
        const installment = await Installment.findById(installmentId);
        if (!installment) {
            throw new Error('Installment not found');
        }
        
        // Update payment details
        installment.paidAmount += amount;
        installment.paidDate = new Date();
        installment.paymentMethod = paymentMethod;
        installment.transactionId = transactionId;
        installment.notes = notes;
        
        // Update penalty payment
        if (penaltyPaid > 0) {
            installment.penaltyDetails.penaltyPaid += penaltyPaid;
        }
        
        // Save will trigger pre-save middleware for calculations
        await installment.save();
        
        return installment;
    }
    
    /**
     * Get overdue installments for reminders
     * @param {Number} days - Days overdue (optional)
     * @returns {Array} Overdue installments
     */
    static async getOverdueInstallments(days = 0) {
        const today = new Date();
        const overdueDate = new Date(today);
        overdueDate.setDate(today.getDate() - days);
        
        return await Installment.find({
            dueDate: { $lt: overdueDate },
            status: { $in: ['Pending', 'Partially Paid', 'Overdue'] }
        })
        .populate('saleId', 'saleNumber totalAmount')
        .populate('customerId', 'name phone')
        .sort({ dueDate: 1 });
    }
    
    /**
     * Update penalty for all overdue installments
     * @returns {Object} Update summary
     */
    static async updateAllPenalties() {
        const overdueInstallments = await this.getOverdueInstallments();
        let updatedCount = 0;
        
        for (const installment of overdueInstallments) {
            // Save will trigger penalty calculation in pre-save middleware
            await installment.save();
            updatedCount++;
        }
        
        return {
            totalOverdue: overdueInstallments.length,
            updated: updatedCount
        };
    }
}

module.exports = InstallmentService;
