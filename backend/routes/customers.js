const express = require('express');
const Customer = require('../models/Customer');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all customers
// @route   GET /api/customers
// @access  Protected
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        
        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const customers = await Customer.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Customer.countDocuments(query);

        res.json({
            success: true,
            data: customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customers'
        });
    }
});

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Protected
router.get('/:id', protect, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch customer'
        });
    }
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Protected (write permission)
router.post('/', protect, checkPermission('write'), async (req, res) => {
    try {
        const customer = new Customer(req.body);
        await customer.save();

        res.status(201).json({
            success: true,
            data: customer,
            message: 'Customer created successfully'
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Customer with this phone number already exists'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create customer'
        });
    }
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Protected (write permission)
router.put('/:id', protect, checkPermission('write'), async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customer,
            message: 'Customer updated successfully'
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update customer'
        });
    }
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Protected (admin only)
router.delete('/:id', protect, checkPermission('admin'), async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete customer'
        });
    }
});

// @desc    Search customers (for auto-complete)
// @route   GET /api/customers/search/:query
// @access  Protected
router.get('/search/:query', protect, async (req, res) => {
    try {
        const { query } = req.params;
        
        const customers = await Customer.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } }
            ]
        })
        .select('name phone email _id')
        .limit(10);

        res.json({
            success: true,
            data: customers
        });
    } catch (error) {
        console.error('Error searching customers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search customers'
        });
    }
});

module.exports = router;
