const DB_NAME = 'VinodElectronicsDB';
const DB_VERSION = 1;
const STORE_NAME = 'googleSheetsData';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class IndexedDBService {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async saveData(data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // Clear old data first
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
                // Add new data
                const addRequest = store.add({
                    id: 'googleSheetsData',
                    data: data,
                    timestamp: Date.now()
                });
                
                addRequest.onsuccess = () => {
                    console.log('Data saved to IndexedDB, size:', JSON.stringify(data).length, 'bytes');
                    resolve();
                };
                addRequest.onerror = () => reject(addRequest.error);
            };
            clearRequest.onerror = () => reject(clearRequest.error);
        });
    }

    async getData() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('googleSheetsData');
            
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }
                
                // Check if data is still valid (less than 24 hours old)
                const age = Date.now() - result.timestamp;
                
                if (age > CACHE_DURATION) {
                    console.log('IndexedDB data expired, age:', Math.round(age / (1000 * 60 * 60)), 'hours');
                    resolve(null);
                } else {
                    console.log('Using cached data from IndexedDB, age:', Math.round(age / (1000 * 60)), 'minutes');
                    resolve(result.data);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearData() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('IndexedDB cache cleared');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getCacheInfo() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get('googleSheetsData');
            
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve({ cached: false });
                    return;
                }
                
                const age = Date.now() - result.timestamp;
                const remainingTime = CACHE_DURATION - age;
                
                resolve({
                    cached: true,
                    age: age,
                    remainingTime: remainingTime,
                    isExpired: remainingTime <= 0,
                    lastUpdated: new Date(result.timestamp).toLocaleString(),
                    dataSize: JSON.stringify(result.data).length
                });
            };
            request.onerror = () => reject(request.error);
        });
    }
}

export const dbService = new IndexedDBService();