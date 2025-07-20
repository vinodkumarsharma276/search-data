const express = require('express');
const router = express.Router();
const InstallmentService = require('../services/installmentService');
const Installment = require('../models/Installment');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// @route   POST /api/installments/create-for-sale
// @desc    Create installments for a sale
// @access  Private
router.post('/create-for-sale', auth, [
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

        const installments = await InstallmentService.createInstallmentsForSale(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Installments created successfully',
            data: installments
        });
    } catch (error) {
        console.error('Create installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating installments'
        });
    }
});

// @route   GET /api/installments/sale/:saleId
// @desc    Get installment details for a sale
// @access  Private
router.get('/sale/:saleId', auth, async (req, res) => {
    try {
        const { saleId } = req.params;
        const details = await InstallmentService.getSaleInstallmentDetails(saleId);
        
        res.json({
            success: true,
            data: details
        });
    } catch (error) {
        console.error('Get sale installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching installment details'
        });
    }
});

// @route   POST /api/installments/:id/payment
// @desc    Record payment for an installment
// @access  Private
router.post('/:id/payment', auth, [
    body('amount').isNumeric().withMessage('Payment amount must be a number'),
    body('paymentMethod').isIn(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque']).withMessage('Invalid payment method')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updatedInstallment = await InstallmentService.recordPayment(id, req.body);
        
        res.json({
            success: true,
            message: 'Payment recorded successfully',
            data: updatedInstallment
        });
    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error recording payment'
        });
    }
});

// @route   GET /api/installments/overdue
// @desc    Get overdue installments
// @access  Private
router.get('/overdue', auth, async (req, res) => {
    try {
        const { days = 0 } = req.query;
        const overdueInstallments = await InstallmentService.getOverdueInstallments(parseInt(days));
        
        res.json({
            success: true,
            data: overdueInstallments
        });
    } catch (error) {
        console.error('Get overdue installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching overdue installments'
        });
    }
});

// @route   GET /api/installments/customer/:customerId
// @desc    Get all installments for a customer
// @access  Private
router.get('/customer/:customerId', auth, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { status, page = 1, limit = 10 } = req.query;
        
        const query = { customerId };
        if (status) {
            query.status = status;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const installments = await Installment.find(query)
            .populate('saleId', 'saleNumber totalAmount')
            .sort({ dueDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Installment.countDocuments(query);
        
        res.json({
            success: true,
            data: installments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get customer installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching customer installments'
        });
    }
});

// @route   PUT /api/installments/update-penalties
// @desc    Update penalties for all overdue installments
// @access  Private (Admin only)
router.put('/update-penalties', auth, async (req, res) => {
    try {
        // This could be restricted to admin users only
        const result = await InstallmentService.updateAllPenalties();
        
        res.json({
            success: true,
            message: 'Penalties updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Update penalties error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating penalties'
        });
    }
});

// @route   GET /api/installments/:id
// @desc    Get specific installment details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const installment = await Installment.findById(id)
            .populate('saleId')
            .populate('customerId', 'name phone');
            
        if (!installment) {
            return res.status(404).json({
                success: false,
                message: 'Installment not found'
            });
        }
        
        // Calculate current penalty
        const currentPenalty = installment.calculateCurrentPenalty();
        
        res.json({
            success: true,
            data: {
                ...installment.toObject(),
                currentPenalty
            }
        });
    } catch (error) {
        console.error('Get installment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching installment'
        });
    }
});

module.exports = router;
