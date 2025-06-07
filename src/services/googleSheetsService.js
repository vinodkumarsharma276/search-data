import axios from 'axios';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

export const fetchGoogleSheetData = async () => {
    try {
        console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
        console.log('API_KEY exists:', !!API_KEY);
        
        if (!SPREADSHEET_ID || !API_KEY) {
            throw new Error('Missing Google Sheets configuration. Please check your environment variables.');
        }

        // Updated range to include all columns A through I
        const range = 'Sheet1!A:L';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
        
        console.log('Fetching from URL:', url);

        const response = await axios.get(url);
        console.log('API Response:', response.data);
        
        const rows = response.data.values;

        if (!rows || rows.length === 0) {
            console.warn('No data found in the sheet');
            return [];
        }

        // Assuming first row contains headers
        const headers = rows[0];
        console.log('Headers:', headers);
        
        // Map data according to your column structure
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
            // For backward compatibility
            name: row[2] || '',
            phone: row[4] || '',
        }));

        console.log('Processed data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching Google Sheets data:', error);
        
        if (error.response) {
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
            
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
            // Search in all fields
            return Object.values(row).some(value => 
                value && value.toString().toLowerCase().includes(query)
            );
        } else {
            // Search in specific field
            const fieldValue = row[searchField]?.toLowerCase() || '';
            return fieldValue.includes(query);
        }
    });
};

export default {
    fetchGoogleSheetData,
    searchGoogleSheetData
};