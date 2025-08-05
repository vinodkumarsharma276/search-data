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

// GET /api/distributors - Get all distributors with product stats
router.get('/', async (req, res) => {
    console.log('🏪 GET /api/distributors - Fetching all distributors with product stats');

    try {
        const distributorsWithStats = await Distributor.aggregate([
            // Filter out soft-deleted distributors
            {
                $match: { deleted: { $ne: true } }
            },
            // Lookup products associated with each distributor
            {
                $lookup: {
                    from: 'products', // The collection name for products
                    localField: '_id',
                    foreignField: 'supplierId',
                    as: 'products'
                }
            },
            // Add fields for total products and total value
            {
                $addFields: {
                    totalProducts: { $size: "$products" },
                    totalValue: {
                        $reduce: {
                            input: "$products",
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    { $ifNull: [ "$$this.price", "$$this.sellingPrice", "$$this.dealer_price", "$$this.mrp", "$$this.common_purchase_price", "$$this.purchase_price", 0 ] }
                                ]
                            }
                        }
                    }
                }
            },
            // Project the desired fields for the final output
            {
                $project: {
                    name: 1,
                    companyType: 1,
                    primaryPhone: 1,
                    email: 1,
                    city: 1,
                    state: 1,
                    gstNumber: 1,
                    panNumber: 1,
                    address: 1,
                    status: 1,
                    createdAt: 1,
                    totalProducts: 1,
                    totalValue: 1
                }
            },
            // Sort by creation date
            {
                $sort: { createdAt: -1 }
            }
        ]);

        console.log('✅ Found distributors:', distributorsWithStats.length);
        res.json({
            success: true,
            distributors: distributorsWithStats
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

// DELETE /api/distributors/:id - Soft delete distributor
router.delete('/:id', async (req, res) => {
    console.log('🏪 DELETE /api/distributors/:id - Soft deleting distributor:', req.params.id);

    try {
        const distributor = await Distributor.findByIdAndUpdate(
            req.params.id,
            { $set: { deleted: true } },
            { new: true }
        );

        if (!distributor) {
            return res.status(404).json({
                success: false,
                message: 'Distributor not found'
            });
        }

        console.log('✅ Distributor soft deleted successfully:', distributor.name);
        res.json({
            success: true,
            message: 'Distributor deleted successfully',
            distributor: distributor
        });

    } catch (error) {
        console.error('❌ Error soft deleting distributor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete distributor',
            error: error.message
        });
    }
});

module.exports = router;
