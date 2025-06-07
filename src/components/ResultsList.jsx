import React from 'react';
import '../styles/ResultsList.css';

const ResultsList = ({ results, loading, showNoResults = true }) => {
    if (loading) {
        return <div className="loading">Searching...</div>;
    }

    if (showNoResults && results.length === 0) {
        return (
            <div className="results-list">
                <div className="no-results">
                    No results found. Try a different search term.
                </div>
            </div>
        );
    }

    if (results.length === 0) {
        return null;
    }

    return (
        <div className="results-table-container">
            <table className="results-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Account</th>
                        <th>Customer Name</th>
                        <th>Address</th>
                        <th>Mobile</th>
                        <th>CO</th>
                        <th>CO Mobile</th>
                        <th>Area</th>
                        <th>Purchase Date</th>
                        <th>Product</th>
                        <th>Brand</th>
                        <th>Model</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((item, index) => (
                        <tr key={index} className="result-row">
                            <td>{item.id || 'N/A'}</td>
                            <td>{item.account || 'N/A'}</td>
                            <td>{item.customerName || 'N/A'}</td>
                            <td>{item.address || 'N/A'}</td>
                            <td>{item.mobile || 'N/A'}</td>
                            <td>{item.co || 'N/A'}</td>
                            <td>{item.coMobile || 'N/A'}</td>
                            <td>{item.area || 'N/A'}</td>
                            <td>{item.purchaseDate || 'N/A'}</td>
                            <td>{item.product || 'N/A'}</td>
                            <td>{item.brand || 'N/A'}</td>
                            <td>{item.model || 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResultsList;