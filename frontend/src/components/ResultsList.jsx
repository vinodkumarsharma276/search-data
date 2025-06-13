import React, { memo, useState } from 'react';
import '../styles/ResultsList.css';

const ResultsList = memo(({ results, loading, showNoResults = true }) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleRowClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
    };

    const fieldLabels = {
        id: 'ID',
        account: 'Account',
        customerName: 'Customer Name', 
        address: 'Address',
        mobile: 'Mobile',
        co: 'CO',
        coMobile: 'CO Mobile',
        area: 'Area',
        purchaseDate: 'Purchase Date',
        product: 'Product',
        brand: 'Brand',
        model: 'Model'
    };
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
        <div className="results-table-container" style={{ overflowX: 'auto', maxWidth: '100vw', margin: '0 auto' }}>
            <table className="results-table" style={{ width: '100%', minWidth: 900 }}>
                <thead>
                    <tr>
                        {/* <th>ID</th> */}
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
                </thead>                <tbody>
                    {results.map((item, index) => (
                        <tr 
                            key={item.id || item.account || item.customerName || index} 
                            className="result-row clickable-row"
                            onClick={() => handleRowClick(item)}
                            title="Click to view details"
                        >
                            {/* <td>{item.id || 'N/A'}</td> */}
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
            
            {/* Detail Modal */}
            {showModal && selectedItem && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Customer Details</h3>
                            <button className="modal-close" onClick={closeModal} title="Close">
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <table className="detail-table">
                                <tbody>
                                    {Object.entries(fieldLabels).map(([key, label]) => {
                                        const value = selectedItem[key];
                                        if (value && value !== 'N/A') {
                                            return (
                                                <tr key={key} className="detail-row">
                                                    <td className="detail-label">{label}</td>
                                                    <td className="detail-value">{value}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ResultsList;