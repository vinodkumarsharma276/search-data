import React, { useRef, memo } from 'react';

const SearchBox = memo(({ 
    searchQuery, 
    setSearchQuery, 
    filterOption, 
    setFilterOption, 
    handleSearch, 
    handleClear,
    isSearching 
}) => {
    const inputRef = useRef(null);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        // No direct handleSearch here; let parent handle debounced search
    };

    return (
        <div className="search-box">
            <div className="search-controls" style={{ display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap' }}>
                <select 
                    value={filterOption} 
                    onChange={(e) => setFilterOption(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Fields</option>
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
                    {/* Keep legacy options for backward compatibility */}
                    {/* <option value="name">Name</option>
                    <option value="phone">Phone</option> */}
                </select>

                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder={`Type at least 3 characters to search${filterOption === 'all' ? ' in all fields' : ` by ${filterOption}`}...`}
                    className="search-input"
                    onKeyDown={handleKeyPress}
                    disabled={isSearching}
                    style={{ minWidth: 250, flex: 1 }}
                />

                <button 
                    onClick={() => handleSearch()} 
                    className="search-btn"
                    disabled={searchQuery.trim().length < 3 || isSearching}
                >
                    {isSearching ? 'Searching...' : 'Search'}
                </button>

                <button onClick={handleClear} className="clear-btn">
                    Clear
                </button>
            </div>
            
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
                <div className="search-hint">
                    Type at least 3 characters to search
                </div>
            )}
        </div>
    );
});

export default SearchBox;