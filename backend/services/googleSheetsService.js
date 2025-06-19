import axios from 'axios';
import NodeCache from 'node-cache';

// Create cache instance
const cache = new NodeCache({ 
    stdTTL: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour default
    checkperiod: 600 // Check for expired keys every 10 minutes
});

class GoogleSheetsService {    
    constructor() {        
        this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
        this.apiKey = process.env.GOOGLE_API_KEY;
        this.cacheKey = 'google_sheets_data';
        this.lastFetchKey = 'last_fetch_time';
        
        if (!this.spreadsheetId || !this.apiKey) {
            throw new Error('Google Sheets configuration missing. Check environment variables.');
        }

        // Set up periodic data refresh
        this.setupPeriodicRefresh();
    }

    async fetchData(forceRefresh = false) {
        try {
            // Check cache first
            if (!forceRefresh) {
                const cachedData = cache.get(this.cacheKey);
                if (cachedData) {
                    console.log('📦 Returning cached data, records:', cachedData.length);
                    return {
                        data: cachedData,
                        fromCache: true,
                        lastUpdated: cache.get(this.lastFetchKey)
                    };
                }
            }

            console.log('🔄 Fetching fresh data from Google Sheets...');

            const range = 'Sheet1!A:L';
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
            
            const response = await axios.get(url);
            const rows = response.data.values;

            if (!rows || rows.length === 0) {
                console.warn('⚠️ No data found in the sheet');
                return { data: [], fromCache: false, lastUpdated: new Date().toISOString() };
            }

            // Process the data
            const headers = rows[0];
            const data = rows.slice(1).map((row, index) => ({
                // id: row[0] || `row_${index}`,
                account: row[0] || '',
                customerName: row[1] || '',
                address: row[2] || '',
                mobile: row[3] || '',
                co: row[4] || '',
                coMobile: row[5] || '',
                area: row[6] || '',
                purchaseDate: row[7] || '',
                product: row[8] || '',
                brand: row[9] || '',
                model: row[10] || '',
                // Aliases for backward compatibility
                name: row[1] || '',
                phone: row[3] || '',
            }));

            // Cache the data
            const timestamp = new Date().toISOString();
            cache.set(this.cacheKey, data);
            cache.set(this.lastFetchKey, timestamp);

            console.log('✅ Fresh data fetched and cached, records:', data.length);
            
            return {
                data,
                fromCache: false,
                lastUpdated: timestamp
            };

        } catch (error) {
            console.error('❌ Error fetching Google Sheets data:', error);
            
            // Try to return cached data as fallback
            const cachedData = cache.get(this.cacheKey);
            if (cachedData) {
                console.log('🔄 API failed, returning cached data as fallback');
                return {
                    data: cachedData,
                    fromCache: true,
                    lastUpdated: cache.get(this.lastFetchKey),
                    error: 'API failed, using cached data'
                };
            }

            throw this.handleApiError(error);
        }
    }

    searchData(data, searchQuery, searchField = 'all', page = 1, limit = 50) {
        try {
            let filteredData = data;

            // Apply search filter
            if (searchQuery && searchQuery.trim().length >= 1) {
                const query = searchQuery.toLowerCase().trim();
                
                filteredData = data.filter(row => {
                    if (searchField === 'all') {
                        // Search across all fields
                        return Object.values(row).some(value => 
                            value && value.toString().toLowerCase().includes(query)
                        );
                    } else {
                        // Search specific field
                        const fieldValue = row[searchField]?.toString().toLowerCase() || '';
                        return fieldValue.includes(query);
                    }
                });
            }

            // Calculate pagination
            const totalResults = filteredData.length;
            const totalPages = Math.ceil(totalResults / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            
            const paginatedData = filteredData.slice(startIndex, endIndex);

            return {
                data: paginatedData,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalResults,
                    resultsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                searchInfo: {
                    query: searchQuery,
                    field: searchField,
                    resultsFound: totalResults
                }
            };

        } catch (error) {
            console.error('❌ Error during search:', error);
            throw new Error('Search operation failed');
        }
    }

    clearCache() {
        cache.del(this.cacheKey);
        cache.del(this.lastFetchKey);
        console.log('🗑️ Cache cleared');
    }

    getCacheInfo() {
        const hasCache = cache.has(this.cacheKey);
        const lastUpdated = cache.get(this.lastFetchKey);
        const cacheStats = cache.getStats();
        
        return {
            hasCache,
            lastUpdated,
            stats: cacheStats,
            ttl: cache.getTtl(this.cacheKey)
        };
    }

    setupPeriodicRefresh() {
        const refreshInterval = parseInt(process.env.DATA_REFRESH_INTERVAL) || 24 * 60 * 60 * 1000; // 24 hours
        
        setInterval(async () => {
            try {
                console.log('🔄 Periodic data refresh triggered');
                await this.fetchData(true);
            } catch (error) {
                console.error('❌ Periodic refresh failed:', error);
            }
        }, refreshInterval);

        console.log(`⏰ Periodic refresh scheduled every ${refreshInterval / 1000 / 60} minutes`);
    }

    handleApiError(error) {
        if (error.response) {
            switch (error.response.status) {
                case 403:
                    return new Error('Google Sheets API access forbidden. Check API key and permissions.');
                case 400:
                    return new Error('Invalid request. Check sheet ID and range.');
                case 404:
                    return new Error('Sheet not found. Verify sheet ID and sharing settings.');
                case 429:
                    return new Error('API rate limit exceeded. Please try again later.');
                default:
                    return new Error(`Google Sheets API error: ${error.response.status}`);
            }
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return new Error('Network error. Please check your internet connection.');
        }
        
        return new Error(`Failed to fetch data: ${error.message}`);
    }
}

// Export the class instead of a singleton instance
export default GoogleSheetsService;
