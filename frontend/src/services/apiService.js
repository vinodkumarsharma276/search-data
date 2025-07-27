import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance with authentication
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token expiry
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API service methods
const apiService = {
    // Generic HTTP methods
    get: (url, config) => apiClient.get(url, config),
    post: (url, data, config) => apiClient.post(url, data, config),
    put: (url, data, config) => apiClient.put(url, data, config),
    patch: (url, data, config) => apiClient.patch(url, data, config),
    delete: (url, config) => apiClient.delete(url, config),

    // Customer API methods
    customers: {
        getAll: (params) => apiClient.get('/customers', { params }),
        getById: (id) => apiClient.get(`/customers/${id}`),
        create: (data) => apiClient.post('/customers', data),
        update: (id, data) => apiClient.put(`/customers/${id}`, data),
        delete: (id) => apiClient.delete(`/customers/${id}`)
    },

    // Product API methods
    products: {
        getAll: (params) => apiClient.get('/products', { params }),
        getById: (id) => apiClient.get(`/products/${id}`),
        create: (data) => apiClient.post('/products', data),
        update: (id, data) => apiClient.put(`/products/${id}`, data),
        delete: (id) => apiClient.delete(`/products/${id}`),
        updateStock: (id, data) => apiClient.patch(`/products/${id}/stock`, data),
        getLowStock: () => apiClient.get('/products/reports/low-stock')
    },

    // Employee API methods
    employees: {
        getAll: (params) => apiClient.get('/employees', { params }),
        getById: (id) => apiClient.get(`/employees/${id}`),
        create: (data) => apiClient.post('/employees', data),
        update: (id, data) => apiClient.put(`/employees/${id}`, data),
        delete: (id) => apiClient.delete(`/employees/${id}`),
        getByDepartment: (department) => apiClient.get(`/employees/department/${department}`),
        getHierarchy: (id) => apiClient.get(`/employees/${id}/hierarchy`),
        addPerformanceRating: (id, data) => apiClient.post(`/employees/${id}/performance`, data),
        updateLeaveBalance: (id, data) => apiClient.patch(`/employees/${id}/leave`, data)
    },

    // Distributor API methods
    distributors: {
        getAll: (params) => apiClient.get('/distributors', { params }),
        getById: (id) => apiClient.get(`/distributors/${id}`),
        create: (data) => apiClient.post('/distributors', data),
        update: (id, data) => apiClient.put(`/distributors/${id}`, data),
        delete: (id) => apiClient.delete(`/distributors/${id}`)
    },

    // Category API methods for dynamic forms
    categories: {
        getAll: () => apiClient.get('/dropdowns/categories'),
        getTopLevel: () => apiClient.get('/categories/top-level'),
        getById: (id) => apiClient.get(`/categories/${id}`),
        getChildren: (id) => apiClient.get(`/categories/${id}/children`),
        getFullSchema: (id) => apiClient.get(`/categories/${id}/full-schema`),
        getFormSchema: (id) => apiClient.get(`/categories/${id}/full-schema`), // Add this alias
        getCommonFields: () => apiClient.get('/categories/common-fields'), // Get common fields from Electronics category
        updateFieldOptions: (id, data) => apiClient.put(`/categories/${id}/update-field-options`, data),
        getCategoryPath: (id) => apiClient.get(`/categories/${id}/path`)
    },

    // Dropdown API methods
    dropdowns: {
        getCategories: () => apiClient.get('/dropdowns/categories'),
        getBrands: (categoryId) => apiClient.get('/dropdowns/brands', { params: { categoryId } }),
        getProducts: (params) => apiClient.get('/dropdowns/products', { params }),
        getAll: () => apiClient.get('/dropdowns/all')
    }
};

export default apiService;
