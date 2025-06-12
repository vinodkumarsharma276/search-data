import React from 'react';

const SearchBox = ({ 
    searchQuery, 
    setSearchQuery, 
    filterOption, 
    setFilterOption, 
    handleSearch, 
    handleClear,
    isSearching 
}) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // Auto-search when user types 3 or more characters or deletes
        if (value.trim().length >= 3) {
            handleSearch(value);
        } else if (value.trim().length === 0) {
            // Clear results when query is empty
            handleSearch('');
        }
    };

    return (
        <div className="search-box">
            <div className="search-controls">
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
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder={`Type at least 3 characters to search${filterOption === 'all' ? ' in all fields' : ` by ${filterOption}`}...`}
                    className="search-input"
                    onKeyPress={handleKeyPress}
                    disabled={isSearching}
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
};

export default SearchBox;