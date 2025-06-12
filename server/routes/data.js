import express from 'express';
import { query, validationResult } from 'express-validator';
import { protect, checkPermission } from '../middleware/auth.js';
import GoogleSheetsService from '../services/googleSheetsService.js';

const router = express.Router();

// Lazy instantiation of service
let googleSheetsService = null;
const getGoogleSheetsService = () => {
    if (!googleSheetsService) {
        googleSheetsService = new GoogleSheetsService();
    }
    return googleSheetsService;
};

// @desc    Get all data with search and pagination
// @route   GET /api/data/search
// @access  Private (requires 'read' permission)
router.get('/search', [
    protect,
    checkPermission('read'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50000 }).withMessage('Limit must be between 1 and 50000'),
    query('searchQuery').optional().trim(),
    query('searchField').optional().isIn(['all', 'customerName', 'address', 'mobile', 'area', 'product', 'brand', 'model']).withMessage('Invalid search field')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            page = 1,
            limit = 50,
            searchQuery = '',
            searchField = 'all',
            forceRefresh = false
        } = req.query;        // Fetch data from Google Sheets
        const sheetsResult = await getGoogleSheetsService().fetchData(forceRefresh === 'true');
        
        // Perform search and pagination
        const searchResult = getGoogleSheetsService().searchData(
            sheetsResult.data,
            searchQuery,
            searchField,
            parseInt(page),
            parseInt(limit)
        );

        res.json({
            success: true,
            data: searchResult.data,
            pagination: searchResult.pagination,
            searchInfo: searchResult.searchInfo,
            metadata: {
                fromCache: sheetsResult.fromCache,
                lastUpdated: sheetsResult.lastUpdated,
                totalRecords: sheetsResult.data.length
            }
        });

    } catch (error) {
        console.error('Search endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to search data'
        });
    }
});

// @desc    Get data statistics
// @route   GET /api/data/stats
// @access  Private (requires 'read' permission)
router.get('/stats', [
    protect,
    checkPermission('read')
], async (req, res) => {
    try {        const sheetsResult = await getGoogleSheetsService().fetchData();
        const cacheInfo = getGoogleSheetsService().getCacheInfo();
        
        // Calculate basic statistics
        const data = sheetsResult.data;
        const stats = {
            totalRecords: data.length,
            uniqueCustomers: new Set(data.map(row => row.customerName)).size,
            uniqueAreas: new Set(data.map(row => row.area).filter(Boolean)).size,
            uniqueBrands: new Set(data.map(row => row.brand).filter(Boolean)).size,
            recordsWithMobile: data.filter(row => row.mobile).length,
            recordsWithPurchaseDate: data.filter(row => row.purchaseDate).length
        };

        res.json({
            success: true,
            data: {
                statistics: stats,
                cacheInfo,
                lastUpdated: sheetsResult.lastUpdated,
                fromCache: sheetsResult.fromCache
            }
        });

    } catch (error) {
        console.error('Stats endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get statistics'
        });
    }
});

// @desc    Refresh data cache
// @route   POST /api/data/refresh
// @access  Private (requires 'write' permission)
router.post('/refresh', [
    protect,
    checkPermission('write')
], async (req, res) => {
    try {
        console.log(`🔄 Cache refresh requested by user: ${req.user.username}`);
        
        const sheetsResult = await getGoogleSheetsService().fetchData(true);
        
        res.json({
            success: true,
            message: 'Data refreshed successfully',
            data: {
                recordsUpdated: sheetsResult.data.length,
                lastUpdated: sheetsResult.lastUpdated,
                refreshedBy: req.user.username
            }
        });

    } catch (error) {
        console.error('Refresh endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to refresh data'
        });
    }
});

// @desc    Clear data cache
// @route   DELETE /api/data/cache
// @access  Private (requires admin role)
router.delete('/cache', [
    protect,
    checkPermission('delete')
], async (req, res) => {
    try {
        console.log(`🗑️ Cache clear requested by user: ${req.user.username}`);
        
        getGoogleSheetsService().clearCache();
        
        res.json({
            success: true,
            message: 'Cache cleared successfully',
            clearedBy: req.user.username
        });

    } catch (error) {
        console.error('Cache clear endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear cache'
        });
    }
});

// @desc    Get cache information
// @route   GET /api/data/cache/info
// @access  Private (requires 'read' permission)
router.get('/cache/info', [
    protect,
    checkPermission('read')
], async (req, res) => {
    try {
        const cacheInfo = getGoogleSheetsService().getCacheInfo();
        
        res.json({
            success: true,
            data: cacheInfo
        });

    } catch (error) {
        console.error('Cache info endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get cache information'
        });
    }
});

export default router;
