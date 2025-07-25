const express = require('express');
const router = express.Router();
const Distributor = require('../models/Distributor');

// POST /api/distributors - Create new distributor
router.post('/', async (req, res) => {
    console.log('🏪 POST /api/distributors - Creating new distributor');
    console.log('📦 Request body:', req.body);

    try {
        // Create new distributor
        const distributorData = {
            name: req.body.name,
            companyType: req.body.companyType,
            gstNumber: req.body.gstNumber?.toUpperCase(),
            panNumber: req.body.panNumber?.toUpperCase(),
            primaryPhone: req.body.primaryPhone,
            secondaryPhone: req.body.secondaryPhone,
            email: req.body.email?.toLowerCase(),
            website: req.body.website,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            pinCode: req.body.pinCode,
            bankName: req.body.bankName,
            accountNumber: req.body.accountNumber,
            ifscCode: req.body.ifscCode?.toUpperCase(),
            branchName: req.body.branchName,
            notes: req.body.notes
        };

        const distributor = new Distributor(distributorData);
        const savedDistributor = await distributor.save();

        console.log('✅ Distributor created successfully:', savedDistributor._id);
        res.status(201).json({
            success: true,
            message: 'Distributor created successfully',
            distributor: savedDistributor
        });

    } catch (error) {
        console.error('❌ Error creating distributor:', error);

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists. Please use a different ${field}.`
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create distributor',
            error: error.message
        });
    }
});

// GET /api/distributors - Get all distributors
router.get('/', async (req, res) => {
    console.log('🏪 GET /api/distributors - Fetching all distributors');

    try {
        const distributors = await Distributor.find()
            .select('name companyType primaryPhone email city state gstNumber status createdAt')
            .sort({ createdAt: -1 });

        console.log('✅ Found distributors:', distributors.length);
        res.json({
            success: true,
            distributors: distributors
        });

    } catch (error) {
        console.error('❌ Error fetching distributors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch distributors',
            error: error.message
        });
    }
});

// GET /api/distributors/:id - Get distributor by ID
router.get('/:id', async (req, res) => {
    console.log('🏪 GET /api/distributors/:id - Fetching distributor:', req.params.id);

    try {
        const distributor = await Distributor.findById(req.params.id);

        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: 'Distributor not found'
            });
        }

        console.log('✅ Distributor found:', distributor.name);
        res.json({
            success: true,
            distributor: distributor
        });

    } catch (error) {
        console.error('❌ Error fetching distributor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch distributor',
            error: error.message
        });
    }
});

// PUT /api/distributors/:id - Update distributor
router.put('/:id', async (req, res) => {
    console.log('🏪 PUT /api/distributors/:id - Updating distributor:', req.params.id);

    try {
        const updateData = {
            name: req.body.name,
            companyType: req.body.companyType,
            gstNumber: req.body.gstNumber?.toUpperCase(),
            panNumber: req.body.panNumber?.toUpperCase(),
            primaryPhone: req.body.primaryPhone,
            secondaryPhone: req.body.secondaryPhone,
            email: req.body.email?.toLowerCase(),
            website: req.body.website,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            pinCode: req.body.pinCode,
            bankName: req.body.bankName,
            accountNumber: req.body.accountNumber,
            ifscCode: req.body.ifscCode?.toUpperCase(),
            branchName: req.body.branchName,
            notes: req.body.notes
        };

        const distributor = await Distributor.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: 'Distributor not found'
            });
        }

        console.log('✅ Distributor updated successfully:', distributor.name);
        res.json({
            success: true,
            message: 'Distributor updated successfully',
            distributor: distributor
        });

    } catch (error) {
        console.error('❌ Error updating distributor:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists. Please use a different ${field}.`
            });
        }

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update distributor',
            error: error.message
        });
    }
});

// DELETE /api/distributors/:id - Delete distributor
router.delete('/:id', async (req, res) => {
    console.log('🏪 DELETE /api/distributors/:id - Deleting distributor:', req.params.id);

    try {
        const distributor = await Distributor.findByIdAndDelete(req.params.id);

        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: 'Distributor not found'
            });
        }

        console.log('✅ Distributor deleted successfully:', distributor.name);
        res.json({
            success: true,
            message: 'Distributor deleted successfully',
            distributor: distributor
        });

    } catch (error) {
        console.error('❌ Error deleting distributor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete distributor',
            error: error.message
        });
    }
});

module.exports = router;
