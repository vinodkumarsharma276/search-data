import axios from 'axios';
import { dbService } from './indexedDBService.js';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export const fetchGoogleSheetData = async (forceRefresh = false) => {
    try {
        // Initialize IndexedDB
        await dbService.init();
        
        // Check IndexedDB cache first (unless force refresh)
        if (!forceRefresh) {
            const cachedData = await dbService.getData();
            if (cachedData && cachedData.length > 0) {
                console.log('Using cached data from IndexedDB, records:', cachedData.length);
                return cachedData;
            }
        }

        console.log('Fetching fresh data from Google Sheets...');
        
        if (!SPREADSHEET_ID || !API_KEY) {
            throw new Error('Missing Google Sheets configuration. Please check your environment variables.');
        }

        const range = 'Sheet1!A:L';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
        
        const response = await axios.get(url);
        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            console.warn('No data found in the sheet');
            return [];
        }

        const headers = rows[0];
        const data = rows.slice(1).map((row, index) => ({
            id: row[0] || '',
            account: row[1] || '',
            customerName: row[2] || '',
            address: row[3] || '',
            mobile: row[4] || '',
            co: row[5] || '',
            coMobile: row[6] || '',
            area: row[7] || '',
            purchaseDate: row[8] || '',
            product: row[9] || '',
            brand: row[10] || '',
            model: row[11] || '',
            name: row[2] || '',
            phone: row[4] || '',
        }));

        // Save to IndexedDB
        await dbService.saveData(data);
        
        console.log('Fresh data fetched and cached in IndexedDB, records:', data.length);
        return data;
    } catch (error) {
        console.error('Error fetching Google Sheets data:', error);
        
        // If API fails, try to return cached data as fallback
        try {
            const cachedData = await dbService.getData();
            if (cachedData && cachedData.length > 0) {
                console.log('API failed, using cached data as fallback, records:', cachedData.length);
                return cachedData;
            }
        } catch (cacheError) {
            console.error('Failed to get fallback cache data:', cacheError);
        }
        
        // If no cached data available, throw the original error
        if (error.response) {
            if (error.response.status === 403) {
                throw new Error('API key is invalid or Google Sheets API is not enabled');
            } else if (error.response.status === 400) {
                throw new Error('Invalid sheet ID or range specified');
            } else if (error.response.status === 404) {
                throw new Error('Sheet not found. Make sure the sheet is public or shared correctly');
            }
        }
        
        throw new Error(`Failed to fetch data from Google Sheets: ${error.message}`);
    }
};

export const searchGoogleSheetData = (data, searchQuery, searchField) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
        return [];
    }

    const query = searchQuery.toLowerCase();
    
    return data.filter(row => {
        if (searchField === 'all') {
            return Object.values(row).some(value => 
                value && value.toString().toLowerCase().includes(query)
            );
        } else {
            const fieldValue = row[searchField]?.toLowerCase() || '';
            return fieldValue.includes(query);
        }
    });
};

// Add function to clear cache
export const clearCache = async () => {
    await dbService.clearData();
};

// Add function to check cache status
export const getCacheInfo = async () => {
    return await dbService.getCacheInfo();
};

export default {
    fetchGoogleSheetData,
    searchGoogleSheetData,
    clearCache,
    getCacheInfo
};