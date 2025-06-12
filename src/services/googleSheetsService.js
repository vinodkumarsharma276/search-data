import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with auth token
const createApiClient = () => {
    const token = localStorage.getItem('authToken');
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
    });
};

export const fetchGoogleSheetData = async (forceRefresh = false) => {
    try {
        const apiClient = createApiClient();
        const response = await apiClient.get('/data/search', {
            params: {
                forceRefresh,
                page: 1,
                limit: 10000 // Get all data for now
            }
        });

        if (response.data.success) {
            const data = response.data.data;
            console.log('✅ Data fetched from backend API, records:', data.length);
            return data;
        } else {
            throw new Error(response.data.error || 'Failed to fetch data');
        }
    } catch (error) {
        console.error('❌ Error fetching data from backend:', error);
        
        if (error.response?.status === 401) {
            // Authentication error - redirect to login
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return [];
        }
        
        throw new Error(error.response?.data?.error || 'Failed to fetch data from server');
    }
};

export const searchGoogleSheetData = async (searchQuery, searchField = 'all', page = 1, limit = 50) => {
    try {
        const apiClient = createApiClient();
        const response = await apiClient.get('/data/search', {
            params: {
                searchQuery,
                searchField,
                page,
                limit
            }
        });

        if (response.data.success) {
            return {
                data: response.data.data,
                pagination: response.data.pagination,
                searchInfo: response.data.searchInfo,
                metadata: response.data.metadata
            };
        } else {
            throw new Error(response.data.error || 'Search failed');
        }
    } catch (error) {
        console.error('❌ Error searching data:', error);
        throw new Error(error.response?.data?.error || 'Search operation failed');
    }
};

// Function to refresh data cache
export const refreshDataCache = async () => {
    try {
        const apiClient = createApiClient();
        const response = await apiClient.post('/data/refresh');
        
        if (response.data.success) {
            console.log('✅ Data cache refreshed successfully');
            return response.data;
        } else {
            throw new Error(response.data.error || 'Failed to refresh cache');
        }
    } catch (error) {
        console.error('❌ Error refreshing cache:', error);
        throw new Error(error.response?.data?.error || 'Failed to refresh data cache');
    }
};

// Function to get data statistics
export const getDataStats = async () => {
    try {
        const apiClient = createApiClient();
        // Use the search endpoint to get metadata which includes stats
        const response = await apiClient.get('/data/search', {
            params: {
                page: 1,
                limit: 1 // Just need metadata, not actual data
            }
        });
        
        if (response.data.success) {
            const metadata = response.data.metadata;
            return {
                totalRecords: metadata.totalRecords,
                lastUpdated: metadata.lastUpdated,
                fromCache: metadata.fromCache
            };
        } else {
            throw new Error(response.data.error || 'Failed to get statistics');
        }
    } catch (error) {
        console.error('❌ Error getting statistics:', error);
        throw new Error(error.response?.data?.error || 'Failed to get data statistics');
    }
};

// Add function to clear cache (admin only)
export const clearCache = async () => {
    try {
        const apiClient = createApiClient();
        const response = await apiClient.delete('/data/cache');
        
        if (response.data.success) {
            console.log('✅ Cache cleared successfully');
            return response.data;
        } else {
            throw new Error(response.data.error || 'Failed to clear cache');
        }
    } catch (error) {
        console.error('❌ Error clearing cache:', error);
        throw new Error(error.response?.data?.error || 'Failed to clear cache');
    }
};

// Add function to check cache status
export const getCacheInfo = async () => {
    try {
        const apiClient = createApiClient();
        const response = await apiClient.get('/data/cache/info');
        
        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.error || 'Failed to get cache info');
        }
    } catch (error) {
        console.error('❌ Error getting cache info:', error);
        return null;
    }
};

export default {
    fetchGoogleSheetData,
    searchGoogleSheetData,
    refreshDataCache,
    getDataStats,
    clearCache,
    getCacheInfo
};