import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchGoogleSheetData, searchGoogleSheetData, refreshDataCache, getDataStats, getCacheInfo } from '../services/googleSheetsService';
import ResultsList from './ResultsList';
import Pagination from './Pagination';
import authService from "../services/authService";
import '../styles/SearchPage.css';

// Completely autonomous SearchBox that handles its own search
const AutonomousSearchBox = React.memo(() => {
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('mobile');
    const [showNumericWarning, setShowNumericWarning] = useState(false);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    
    // Custom event to communicate search results without causing re-renders
    const dispatchSearchResults = useCallback((results) => {
        window.dispatchEvent(new CustomEvent('searchResults', { detail: results }));
    }, []);

    const dispatchClearResults = useCallback(() => {
        window.dispatchEvent(new CustomEvent('clearResults'));
    }, []);

    // Perform search internally without parent dependency
    const performSearch = useCallback(async (searchQuery, searchFilter) => {
        try {
            console.log('🔍 AutonomousSearchBox performing search:', { searchQuery, searchFilter });
            
            const result = await searchGoogleSheetData(
                searchQuery, 
                searchFilter, 
                1, 
                50
            );
            
            // Dispatch results via custom event to avoid parent re-renders
            dispatchSearchResults({
                data: result.data,
                pagination: result.pagination,
                query: searchQuery,
                filter: searchFilter
            });
            
        } catch (err) {
            console.error('❌ Search error:', err);
            dispatchSearchResults({
                data: [],
                pagination: { totalResults: 0, totalPages: 0, currentPage: 1 },
                error: err.message,
                query: searchQuery,
                filter: searchFilter
            });
        }
    }, [dispatchSearchResults]);

    // Debounced search effect - completely isolated
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        
        debounceRef.current = setTimeout(() => {
            if (query.trim().length >= 3) {
                performSearch(query.trim(), filter);
            } else if (query.trim().length === 0) {
                dispatchClearResults();
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, filter, performSearch, dispatchClearResults]);    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && query.trim().length >= 3) {
            performSearch(query.trim(), filter);
        }
    };const handleInputChange = (e) => {
        let value = e.target.value;
        
        // For mobile fields, check if non-numeric characters are being typed
        if (filter === 'mobile' || filter === 'coMobile') {
            const hasNonNumeric = /[^0-9]/.test(value);
            setShowNumericWarning(hasNonNumeric);
            
            // Remove non-numeric characters
            value = value.replace(/[^0-9]/g, '');
        } else {
            setShowNumericWarning(false);
        }
        
        setQuery(value);
    };

    // Reset warning when filter changes
    const handleFilterChange = (e) => {
        setFilter(e.target.value);
        setShowNumericWarning(false);
    };    const handleClearClick = () => {
        setQuery('');
        setFilter('mobile');
        setShowNumericWarning(false);
        dispatchClearResults();
    };

    console.log('🔍 AutonomousSearchBox render - query:', query);

    return (
        <div className="search-box" style={{ padding: '20px' }}>
            <div className="search-controls" style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>                <select 
                    value={filter} 
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="all">All Fields</option>
                    <option value="mobile">Mobile</option>
                    <option value="customerName">Customer Name</option>
                    <option value="id">ID</option>
                    <option value="account">Account</option>
                    <option value="address">Address</option>
                    <option value="mobile">Mobile</option>
                    <option value="co">CO</option>
                    <option value="coMobile">CO Mobile</option>
                    <option value="area">Area</option>
                    <option value="purchaseDate">Purchase Date</option>
                    <option value="product">Product</option>
                    <option value="brand">Brand</option>
                    <option value="model">Model</option>
                </select>                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder={`Type at least 3 characters to search${filter === 'all' ? ' in all fields' : ` by ${filter}`}...`}
                    className="search-input"
                    onKeyDown={handleKeyDown}
                    style={{ minWidth: 250, flex: 1 }}
                />

                <button 
                    onClick={() => query.trim().length >= 3 && performSearch(query.trim(), filter)} 
                    className="search-btn"
                    disabled={query.trim().length < 3}
                >
                    Search
                </button>

                <button onClick={handleClearClick} className="clear-btn">
                    Clear
                </button>
            </div>
              {query.trim().length > 0 && query.trim().length < 3 && (
                <div className="search-hint">
                    Type at least 3 characters to search
                </div>
            )}
            
            {showNumericWarning && (filter === 'mobile' || filter === 'coMobile') && (
                <div className="search-warning">
                    ⚠️ Only numbers are allowed for mobile number search
                </div>
            )}
        </div>
    );
});

// Results container that listens to custom events
const EventDrivenResults = React.memo(() => {
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [currentQuery, setCurrentQuery] = useState('');    const [currentFilter, setCurrentFilter] = useState('mobile');
    const [isSearching, setIsSearching] = useState(false);
    
    const RESULTS_PER_PAGE = 50;

    // Listen to search results via custom events
    useEffect(() => {
        const handleSearchResults = (event) => {
            const { data, pagination, query, filter, error } = event.detail;
            console.log('📊 EventDrivenResults received:', { data: data?.length, pagination, query, filter });
            
            setResults(data || []);
            setTotalResults(pagination?.totalResults || 0);
            setTotalPages(pagination?.totalPages || 0);
            setCurrentPage(pagination?.currentPage || 1);
            setCurrentQuery(query || '');            setCurrentFilter(filter || 'mobile');
            setHasSearched(true);
            setIsSearching(false);
        };

        const handleClearResults = () => {
            console.log('🧹 EventDrivenResults clearing results');
            setResults([]);
            setTotalResults(0);
            setTotalPages(0);
            setCurrentPage(1);
            setHasSearched(false);            setCurrentQuery('');
            setCurrentFilter('mobile');
            setIsSearching(false);
        };

        window.addEventListener('searchResults', handleSearchResults);
        window.addEventListener('clearResults', handleClearResults);

        return () => {
            window.removeEventListener('searchResults', handleSearchResults);
            window.removeEventListener('clearResults', handleClearResults);
        };
    }, []);

    // Page change handler
    const handlePageChange = useCallback(async (page) => {
        if (currentQuery) {
            setIsSearching(true);
            try {
                const result = await searchGoogleSheetData(
                    currentQuery, 
                    currentFilter, 
                    page, 
                    RESULTS_PER_PAGE
                );
                
                setResults(result.data);
                setTotalResults(result.pagination.totalResults);
                setTotalPages(result.pagination.totalPages);
                setCurrentPage(result.pagination.currentPage);
            } catch (err) {
                console.error('❌ Page change error:', err);
            } finally {
                setIsSearching(false);
            }
        }
    }, [currentQuery, currentFilter]);

    console.log('📋 EventDrivenResults render - results:', results.length);

    return (
        <div className="results-section">
            <div className="results-header">
                <h3>
                    {hasSearched ? (
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
                results={results} 
                loading={isSearching}
                showNoResults={hasSearched && !isSearching}
            />
            
            {totalPages > 1 && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
});

const SearchPage = () => {
    // Data loading state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cacheInfo, setCacheInfo] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [dataStats, setDataStats] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    console.log('🔍 SearchPageFixed render');    useEffect(() => {
        loadData();
        loadUserData();
        loadStats();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuOpen && !event.target.closest('.burger-menu')) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

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

    const handleLogout = () => {
        authService.logout();
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
                    <div className="controls-section">
                        <button onClick={handleRefresh} className="icon-btn refresh-icon-btn" disabled={loading} title="Refresh Data">
                            🔄
                        </button>
                        {cacheInfo?.hasCache && (
                            <div className="cache-timestamp" title="Last data update">
                                📅 {new Date(cacheInfo.lastUpdated).toLocaleString()}
                            </div>
                        )}
                    </div>
                    {dataStats && (
                        <div className="data-stats">
                            <span className="total-rows" title="Total records">📊 {dataStats.totalRecords.toLocaleString()}</span>
                            <span className="unique-customers" title="Unique customers">👥 {dataStats.uniqueCustomers}</span>
                        </div>
                    )}
                </div>
                
                <div className="header-center">
                    <h1>Vinod Electronics</h1>
                </div>
                
                <div className="header-right">
                    <div className="burger-menu">
                        <button 
                            className="burger-btn" 
                            onClick={() => setMenuOpen(!menuOpen)}
                            title="Menu"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                        {menuOpen && (
                            <div className="burger-dropdown">
                                {currentUser && (
                                    <div className="dropdown-user-info">
                                        <span className="dropdown-username">👤 {currentUser.username}</span>
                                        <span className="dropdown-user-role">
                                            {currentUser.role === 'admin' && '🔑 Admin'}
                                            {currentUser.role === 'manager' && '📋 Manager'}
                                            {currentUser.role === 'employee' && '👷 Employee'}
                                        </span>
                                    </div>
                                )}
                                <button onClick={handleLogout} className="dropdown-logout">
                                    🚪 Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Completely autonomous search box */}
            <AutonomousSearchBox />

            {/* Event-driven results container */}
            <EventDrivenResults />
        </div>
    );
};

export default SearchPage;
