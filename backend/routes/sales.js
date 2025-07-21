const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Installment = require('../models/Installment');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// @route   POST /api/sales
// @desc    Create a new sale
// @access  Private
router.post('/', [
    body('customerId').isMongoId().withMessage('Valid customer ID required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('totalAmount').isNumeric().withMessage('Total amount must be a number'),
    body('paymentType').isIn(['Cash', 'Card', 'UPI', 'Installment']).withMessage('Invalid payment type'),
    body('salesPerson').notEmpty().withMessage('Sales person name required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const sale = new Sale(req.body);
        await sale.save();

        res.status(201).json({
            success: true,
            message: 'Sale created successfully',
            data: sale
        });
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating sale'
        });
    }
});

// @route   GET /api/sales
// @desc    Get all sales with pagination
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, paymentType, search } = req.query;
        const query = {};

        // Add filters
        if (status) query.status = status;
        if (paymentType) query.paymentType = paymentType;
        if (search) {
            query.$or = [
                { saleNumber: { $regex: search, $options: 'i' } },
                { salesPerson: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const sales = await Sale.find(query)
            .populate('customerId', 'name phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Sale.countDocuments(query);

        res.json({
            success: true,
            data: {
                sales,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching sales'
        });
    }
});

// @route   GET /api/sales/:id
// @desc    Get sale by ID with installments
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const sale = await Sale.findById(id)
            .populate('customerId', 'name phone address');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        // Get installments if payment type is installment
        let installments = [];
        if (sale.paymentType === 'Installment') {
            installments = await Installment.find({ saleId: id })
                .sort({ installmentNumber: 1 });
        }

        res.json({
            success: true,
            data: {
                sale,
                installments
            }
        });
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching sale'
        });
    }
});

// @route   PUT /api/sales/:id
// @desc    Update sale
// @access  Private
router.put('/:id', [
    body('status').optional().isIn(['Pending', 'Completed', 'Cancelled']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const sale = await Sale.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        ).populate('customerId', 'name phone');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        res.json({
            success: true,
            message: 'Sale updated successfully',
            data: sale
        });
    } catch (error) {
        console.error('Update sale error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating sale'
        });
    }
});

// @route   GET /api/sales/customer/:customerId
// @desc    Get all sales for a specific customer
// @access  Private
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const sales = await Sale.find({ customerId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Sale.countDocuments({ customerId });

        res.json({
            success: true,
            data: {
                sales,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get customer sales error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching customer sales'
        });
    }
});

// @route   GET /api/sales/stats/dashboard
// @desc    Get sales statistics for dashboard
// @access  Private
router.get('/stats/dashboard', async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // Today's stats
        const todayStats = await Sale.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    cashSales: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentType', 'Cash'] }, 1, 0]
                        }
                    },
                    installmentSales: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentType', 'Installment'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Month's stats
        const monthStats = await Sale.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Year's stats
        const yearStats = await Sale.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Recent sales
        const recentSales = await Sale.find()
            .populate('customerId', 'name phone')
            .sort({ createdAt: -1 })
            .limit(5);

        // Payment type distribution
        const paymentTypeStats = await Sale.aggregate([
            {
                $group: {
                    _id: '$paymentType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                today: todayStats[0] || { totalSales: 0, totalAmount: 0, cashSales: 0, installmentSales: 0 },
                month: monthStats[0] || { totalSales: 0, totalAmount: 0 },
                year: yearStats[0] || { totalSales: 0, totalAmount: 0 },
                recentSales,
                paymentTypeStats
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error fetching dashboard statistics'
        });
    }
});

module.exports = router;
