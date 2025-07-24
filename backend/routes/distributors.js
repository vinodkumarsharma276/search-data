const express = require('express');
const router = express.Router();
const Distributor = require('../models/Distributor');

// POST /api/distributors - Create new distributor
router.post('/', async (req, res) => {
    console.log('🏪 ========================================');
    console.log('🏪 POST /api/distributors - Creating new distributor');
    console.log('🏪 ========================================');
    console.log('📦 RAW Request body received from frontend:');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('🏪 ----------------------------------------');

    try {
        // Create new distributor data object
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

        console.log('📝 PROCESSED distributor data BEFORE saving to DB:');
        console.log(JSON.stringify(distributorData, null, 2));
        console.log('🏪 ----------------------------------------');
        console.log('💾 Attempting to save to MongoDB...');

        const distributor = new Distributor(distributorData);
        const savedDistributor = await distributor.save();

        console.log('✅ SUCCESS! Distributor saved to database!');
        console.log('🏪 ----------------------------------------');
        console.log('📄 FINAL distributor data SAVED in DB:');
        console.log(JSON.stringify(savedDistributor.toObject(), null, 2));
        console.log('🏪 ----------------------------------------');
        console.log(`🆔 Distributor ID: ${savedDistributor._id}`);
        console.log(`📅 Created at: ${savedDistributor.createdAt}`);
        console.log(`📝 Distributor name: ${savedDistributor.name}`);
        console.log(`🏢 Company type: ${savedDistributor.companyType}`);
        console.log(`📱 Primary phone: ${savedDistributor.primaryPhone}`);
        console.log(`📧 Email: ${savedDistributor.email}`);
        console.log('🏪 ========================================');

        res.status(201).json({
            success: true,
            message: 'Distributor created successfully',
            data: savedDistributor
        });

    } catch (error) {
        console.error('❌ ========================================');
        console.error('❌ ERROR creating distributor!');
        console.error('❌ ========================================');
        console.error('❌ Error details:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        if (error.stack) {
            console.error('❌ Error stack:', error.stack);
        }
        console.error('❌ ========================================');

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = `${field} already exists. Please use a different ${field}.`;
            console.error(`❌ DUPLICATE KEY ERROR: ${message}`);
            return res.status(400).json({
                success: false,
                message: message
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            console.error('❌ VALIDATION ERRORS:', errors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        console.error('❌ GENERIC ERROR - Sending 500 response');
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
            .select('name companyType primaryPhone email city state status createdAt')
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
