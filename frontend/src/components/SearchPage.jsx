import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGoogleSheetData, searchGoogleSheetData, refreshDataCache, getDataStats, getCacheInfo } from '../services/googleSheetsService';
import SearchBox from './SearchBox';
import ResultsList from './ResultsList';
import Pagination from './Pagination';
import authService from "../services/authService";

import '../styles/SearchPage.css';

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOption, setFilterOption] = useState('customerName');
    const [allData, setAllData] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [paginatedResults, setPaginatedResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState('');
    const [cacheInfo, setCacheInfo] = useState(null);
    const [totalRows, setTotalRows] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [dataStats, setDataStats] = useState(null);

    // Use refs to store search cache data to avoid dependency issues
    const cachedSearchDataRef = useRef([]);
    const lastSearchQueryRef = useRef('');
    const lastFilterOptionRef = useRef('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalResults, setTotalResults] = useState(0);
    const RESULTS_PER_PAGE = 50;

    console.log('🔍 SearchPage render');    
    
    useEffect(() => {
        loadData();
        loadUserData();
        loadStats();
    }, []);

    const loadUserData = () => {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
    };

    const loadStats = async () => {
        try {
            const stats = await getDataStats();
            console.log('📊 Data statistics loaded:', stats);
            setDataStats(stats);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const loadData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const data = await fetchGoogleSheetData(forceRefresh);
            // console.log('📊 Data loaded from Google Sheets:', data);
            setAllData(data);
            setTotalRows(data.length);
            
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
    };    // Add refresh handler for backend API
    const handleRefresh = async () => {
        try {
            await refreshDataCache();
            await loadData(true);
            await loadStats();
        } catch (error) {
            console.error('Failed to refresh data:', error);
            setError('Failed to refresh data');
        }
    };

    // Update search to use backend API
    const performSearch = useCallback(async (query, currentFilter, page = 1) => {
        if (!query.trim() || query.trim().length < 1) {
            setSearchResults([]);
            setPaginatedResults([]);
            setTotalResults(0);
            setTotalPages(0);
            setCurrentPage(1);
            return;
        }

        setIsSearching(true);
        
        try {
            console.log('🔍 Performing search:', { query, currentFilter, page });
            
            const result = await searchGoogleSheetData(
                query.trim(), 
                currentFilter, 
                page, 
                RESULTS_PER_PAGE
            );
            console.log('📊 Search results:', result.data);
            setSearchResults(result.data);
            setPaginatedResults(result.data);
            setTotalResults(result.pagination.totalResults);
            setTotalPages(result.pagination.totalPages);
            setCurrentPage(result.pagination.currentPage);
            
            console.log('✅ Search completed:', result.searchInfo);
            
        } catch (err) {
            console.error('❌ Search error:', err);
            setError(err.message || 'Error occurred during search');
        } finally {
            setIsSearching(false);
        }
    }, []);    // Debounced search function
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

    // Debounced search for real-time typing
    const debouncedSearchRef = useRef();
    
    useEffect(() => {
        debouncedSearchRef.current = debounce((query, filter) => {
            performSearch(query, filter, 1);
        }, 300);
    }, [performSearch]);

    const handleSearch = (query = searchQuery) => {
        if (query.trim().length >= 1) {
            debouncedSearchRef.current(query, filterOption);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        setSearchResults([]);
        setPaginatedResults([]);
        setTotalResults(0);
        setTotalPages(0);
        setCurrentPage(1);
    };

    const handlePageChange = async (page) => {
        if (searchQuery.trim().length >= 1) {
            await performSearch(searchQuery, filterOption, page);
        }
    };

    // Trigger search when filter option changes
    useEffect(() => {
        if (searchQuery.trim().length >= 1) {
            performSearch(searchQuery, filterOption, 1);
        }
    }, [filterOption, performSearch]);

    const handleLogout = () => {
         // Use authService for proper logout
        authService.logout();
        // Redirect to login page
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
    }    return (
        <div className="search-container">
            <div className="search-header-redesigned">
                <div className="header-left">
                    <button onClick={handleRefresh} className="icon-btn refresh-icon-btn" disabled={loading} title="Refresh Data">
                        🔄
                    </button>
                    {cacheInfo?.hasCache && (
                        <div className="cache-timestamp" title="Last data update">
                            📅 {new Date(cacheInfo.lastUpdated).toLocaleString()}
                        </div>
                    )}
                    {dataStats && (
                        <div className="data-stats">
                            <span className="total-rows" title="Total records">📊 {dataStats.totalRecords.toLocaleString()}</span>
                            <span className="unique-customers" title="Unique customers">👥 {dataStats.uniqueCustomers}</span>
                        </div>
                    )}
                </div>
                
                <div className="header-center">
                    <h1>Vinod Electronics Search</h1>
                    {currentUser && (
                        <div className="user-info">
                            <span className="username">👤 {currentUser.username}</span>
                            <span className="user-role" title="User role">
                                {currentUser.role === 'admin' && '🔑 Admin'}
                                {currentUser.role === 'manager' && '📋 Manager'}
                                {currentUser.role === 'employee' && '👷 Employee'}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="header-right">
                    <button onClick={handleLogout} className="icon-btn logout-icon-btn" title="Logout">
                        🚪 Logout
                    </button>
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
                        {searchQuery.trim().length >= 1 ? (
                            <>Results ({totalResults}) 
                            {totalResults > RESULTS_PER_PAGE && 
                                ` - Page ${currentPage} of ${totalPages}`
                            }</>
                        ) : (
                            'Enter search terms to find records'
                        )}
                    </h3>
                </div>
                
                <ResultsList 
                    results={paginatedResults} 
                    loading={isSearching}
                    showNoResults={searchQuery.trim().length >= 1 && !isSearching}
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