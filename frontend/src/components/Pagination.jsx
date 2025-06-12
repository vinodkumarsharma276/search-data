import React from 'react';
import '../styles/Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        // Adjust start if we're near the end
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="pagination">
            <button 
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
            >
                First
            </button>
            
            <button 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
            >
                Previous
            </button>
            
            {getPageNumbers().map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                >
                    {page}
                </button>
            ))}
            
            <button 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
            >
                Next
            </button>
            
            <button 
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
            >
                Last
            </button>
        </div>
    );
};

export default Pagination;