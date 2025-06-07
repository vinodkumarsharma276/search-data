import React, { useState, useEffect, useCallback } from 'react';
import { fetchGoogleSheetData, searchGoogleSheetData, clearCache, getCacheInfo } from '../services/googleSheetsService';
import SearchBox from './SearchBox';
import ResultsList from './ResultsList';
import Pagination from './Pagination';

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('customerName');
    const [allData, setAllData] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [paginatedResults, setPaginatedResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [cachedSearchData, setCachedSearchData] = useState([]);
    const [lastSearchQuery, setLastSearchQuery] = useState('');
    const [lastFilterOption, setLastFilterOption] = useState('');
    const [cacheInfo, setCacheInfo] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalResults, setTotalResults] = useState(0);
    const RESULTS_PER_PAGE = 50;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const data = await fetchGoogleSheetData(forceRefresh);
            setAllData(data);
            
            // Update cache info
            const info = await getCacheInfo();
            setCacheInfo(info);
            
            setError('');
        } catch (err) {
            setError('Failed to load data from Google Sheets');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Add refresh handler
    const handleRefresh = async () => {
        await loadData(true);
    };

    // Add clear cache handler
    const handleClearCache = async () => {
        try {
            await clearCache();
            const info = await getCacheInfo();
            setCacheInfo(info);
            await loadData(true);
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    };

    // Debounced search function
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const performSearch = useCallback(async (query = searchQuery) => {
    if (!query.trim() || query.trim().length < 3) {
        setSearchResults([]);
        setPaginatedResults([]);
        setTotalResults(0);
        setTotalPages(0);
        setCurrentPage(1);
        setCachedSearchData([]);
        setLastSearchQuery('');
        return;
    }

    setIsSearching(true);
    
    try {
        let resultsToFilter = [];
        const queryTrimmed = query.trim();
        const filterChanged = filterOption !== lastFilterOption;
        
        // Check if we need to fetch from API or can use cached data
        const shouldFetchFromAPI = !lastSearchQuery || 
                                 filterChanged || 
                                 queryTrimmed.length < lastSearchQuery.length ||
                                 !queryTrimmed.startsWith(lastSearchQuery) ||
                                 queryTrimmed.length === 3;
                    
        console.log('Search Debug:', {
            query: queryTrimmed,
            lastQuery: lastSearchQuery,
            filterChanged,
            shouldFetchFromAPI,
            cachedDataLength: cachedSearchData.length
        });

        if (shouldFetchFromAPI) {
            // Make fresh API call with minimum 3 characters
            const minQuery = queryTrimmed.substring(0, 3);
            const freshResults = searchGoogleSheetData(allData, minQuery, filterOption);
            setCachedSearchData(freshResults);
            setLastSearchQuery(minQuery);
            setLastFilterOption(filterOption);
            resultsToFilter = freshResults;
        } else {
            // Use cached data
            resultsToFilter = cachedSearchData;
        }

        // Filter cached results for current query
        const finalResults = queryTrimmed.length > 3 ? 
            resultsToFilter.filter(row => {
                const query = queryTrimmed.toLowerCase();
                if (filterOption === 'all') {
                    return Object.values(row).some(value => 
                        value && value.toString().toLowerCase().includes(query)
                    );
                } else {
                    const fieldValue = row[filterOption]?.toLowerCase() || '';
                    return fieldValue.includes(query);
                }
            }) : resultsToFilter;

        setSearchResults(finalResults);
        setTotalResults(finalResults.length);
        
        // Calculate pagination
        const pages = Math.ceil(finalResults.length / RESULTS_PER_PAGE);
        setTotalPages(pages);
        
        // Reset to first page when search changes
        setCurrentPage(1);
        
        // Get first page results
        const startIndex = 0;
        const endIndex = Math.min(RESULTS_PER_PAGE, finalResults.length);
        setPaginatedResults(finalResults.slice(startIndex, endIndex));
        
    } catch (err) {
        console.error('Search error:', err);
        setError('Error occurred during search');
    } finally {
        setIsSearching(false);
    }
}, [allData, filterOption, searchQuery, cachedSearchData, lastSearchQuery, lastFilterOption]);


    // Debounced search for real-time typing
    const debouncedSearch = useCallback(
        debounce((query) => performSearch(query), 300),
        [performSearch]
    );

    const handleSearch = (query = searchQuery) => {
        if (query.trim().length >= 3) {
            debouncedSearch(query);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        setSearchResults([]);
        setPaginatedResults([]);
        setTotalResults(0);
        setTotalPages(0);
        setCurrentPage(1);
        setCachedSearchData([]);
        setLastSearchQuery('');
        setLastFilterOption('');
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        const startIndex = (page - 1) * RESULTS_PER_PAGE;
        const endIndex = Math.min(startIndex + RESULTS_PER_PAGE, searchResults.length);
        setPaginatedResults(searchResults.slice(startIndex, endIndex));
    };

    // Trigger search when filter option changes
    useEffect(() => {
        if (searchQuery.trim().length >= 3) {
            performSearch();
        }
    }, [filterOption, performSearch]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="search-container">
                <div className="search-header-title-only">
                    <h1>Vinod Electronics</h1>
                </div>
                <div className="loading show">Loading data from Google Sheets...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="search-container">
                <div className="search-header-title-only">
                    <h1>Vinod Electronics</h1>
                </div>
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="search-container">
            <div className="search-header-title-only">
                <h1>Vinod Electronics</h1>
                <div className="header-actions">
                    <button onClick={handleRefresh} className="refresh-btn" disabled={loading}>
                        {loading ? 'Refreshing...' : '🔄 Refresh'}
                    </button>
                    {cacheInfo?.cached && (
                        <div className="cache-info">
                            <span>Last updated: {cacheInfo.lastUpdated}</span>
                            <span>Size: {Math.round(cacheInfo.dataSize / 1024)} KB</span>
                        </div>
                    )}
                </div>
            </div>

            <SearchBox 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterOption={filterOption}
                setFilterOption={setFilterOption}
                handleSearch={handleSearch}
                handleClear={handleClear}
                isSearching={isSearching}
            />

            <div className="results-section">
                <div className="results-header">
                    <h3>
                        {searchQuery.trim().length >= 3 ? (
                            <>Results ({totalResults}) 
                            {totalResults > RESULTS_PER_PAGE && 
                                ` - Showing ${((currentPage - 1) * RESULTS_PER_PAGE) + 1}-${Math.min(currentPage * RESULTS_PER_PAGE, totalResults)}`
                            }</>
                        ) : (
                            'Enter at least 3 characters to search'
                        )}
                    </h3>
                </div>
                
                <ResultsList 
                    results={paginatedResults} 
                    loading={isSearching}
                    showNoResults={searchQuery.trim().length >= 3 && !isSearching}
                />
                
                {totalPages > 1 && (
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>
        </div>
    );
};

export default SearchPage;