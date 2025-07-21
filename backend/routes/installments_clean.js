const express = require('express');
const router = express.Router();
const InstallmentService = require('../services/installmentService');
const Installment = require('../models/Installment');
const { body, validationResult } = require('express-validator');

// @route   POST /api/installments/create-for-sale
router.post('/create-for-sale', [
    body('saleId').isMongoId().withMessage('Valid sale ID required'),
    body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
    body('installmentMonths').isInt({ min: 1, max: 60 }).withMessage('Installment months must be between 1-60'),
    body('emiStartDate').isISO8601().withMessage('Valid start date required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { saleId, totalAmount, downPayment = 0, installmentMonths, emiStartDate } = req.body;
        
        const installments = await InstallmentService.createInstallmentsForSale({
            saleId, totalAmount, downPayment, installmentMonths,
            emiStartDate: new Date(emiStartDate)
        });

        res.status(201).json({
            success: true,
            message: 'Installments created successfully',
            data: installments
        });
    } catch (error) {
        console.error('Create installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create installments'
        });
    }
});

// @route   GET /api/installments/sale/:saleId
router.get('/sale/:saleId', async (req, res) => {
    try {
        const { saleId } = req.params;
        const details = await InstallmentService.getSaleInstallmentDetails(saleId);
        res.json({ success: true, data: details });
    } catch (error) {
        console.error('Get sale installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get installment details'
        });
    }
});

// @route   POST /api/installments/:id/payment
router.post('/:id/payment', [
    body('amount').isNumeric().withMessage('Payment amount must be a number'),
    body('paymentMethod').isIn(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque']).withMessage('Invalid payment method')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { amount, paymentMethod, transactionId, notes } = req.body;
        
        const updatedInstallment = await InstallmentService.recordPayment(id, {
            amount: parseFloat(amount), paymentMethod, transactionId, notes
        });

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: updatedInstallment
        });
    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to record payment'
        });
    }
});

// @route   GET /api/installments/overdue
router.get('/overdue', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const overdueInstallments = await InstallmentService.getOverdueInstallments({
            page: parseInt(page), limit: parseInt(limit)
        });
        
        res.json({
            success: true,
            data: overdueInstallments.installments,
            pagination: overdueInstallments.pagination
        });
    } catch (error) {
        console.error('Get overdue installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get overdue installments'
        });
    }
});

// @route   GET /api/installments/customer/:customerId
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;
        
        const query = { customerId };
        if (status) query.status = status;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const installments = await Installment.find(query)
            .populate('saleId', 'saleNumber totalAmount')
            .sort({ dueDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Installment.countDocuments(query);
        
        res.json({
            success: true,
            data: installments,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get customer installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get customer installments'
        });
    }
});

// @route   PUT /api/installments/update-penalties
router.put('/update-penalties', async (req, res) => {
    try {
        const result = await InstallmentService.updateAllPenalties();
        res.json({
            success: true,
            message: `Updated penalties for ${result.modifiedCount} installments`,
            data: result
        });
    } catch (error) {
        console.error('Update penalties error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update penalties'
        });
    }
});

// @route   GET /api/installments/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const installment = await Installment.findById(id)
            .populate('saleId')
            .populate('customerId');
            
        if (!installment) {
            return res.status(404).json({
                success: false,
                message: 'Installment not found'
            });
        }
        
        res.json({ success: true, data: installment });
    } catch (error) {
        console.error('Get installment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get installment details'
        });
    }
});

module.exports = router;
