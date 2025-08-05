import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Form,
    Input,
    Button,
    Card,
    Row,
    Col,
    Breadcrumb,
    Typography,
    Space,
    Select,
    Table,
    Pagination,
    Tag,
    Empty,
    Spin,
    message
} from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    ShopOutlined,
    BarcodeOutlined,
    MobileOutlined,
    DesktopOutlined,
    HomeOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

const SearchProduct = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    
    // Category hierarchy state
    const [categoryLevels, setCategoryLevels] = useState([]);
    const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
    const [finalCategoryId, setFinalCategoryId] = useState(null);
    const [isLeafCategory, setIsLeafCategory] = useState(false);
    
    // State for new search/filter logic
    const [searchQuery, setSearchQuery] = useState('');
    const [allProducts, setAllProducts] = useState([]); // Holds all products for the category
    const [filteredProducts, setFilteredProducts] = useState([]); // Holds products for display
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);
    const [searchPerformed, setSearchPerformed] = useState(false);
    
    // State for dynamic table columns
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [editingRowId, setEditingRowId] = useState(null);
    const [editingRowData, setEditingRowData] = useState({});
    const [distributors, setDistributors] = useState([]);

    // Fetch top-level categories on component mount
    useEffect(() => {
        fetchTopLevelCategories();
        fetchDistributors();
    }, []);

    // Frontend filtering when searchQuery changes
    useEffect(() => {
        if (searchQuery.length >= 3) {
            const lowercasedQuery = searchQuery.toLowerCase();
            const filtered = allProducts.filter(product => {
                // Simple search on product name, model, or serial
                return (
                    product.name?.toLowerCase().includes(lowercasedQuery) ||
                    product.model_number?.toLowerCase().includes(lowercasedQuery) ||
                    product.serial_number?.toLowerCase().includes(lowercasedQuery)
                );
            });
            setFilteredProducts(filtered);
        } else {
            // If query is less than 3 chars, show all products for the category
            setFilteredProducts(allProducts);
        }
        setCurrentPage(1); // Reset to first page on new filter
    }, [searchQuery, allProducts]);

    const fetchTopLevelCategories = async () => {
        try {
            setLoading(true);
            const response = await apiService.categories.getTopLevel();
            if (response.data.success) {
                setCategoryLevels([response.data.data || []]);
            }
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDistributors = async () => {
        try {
            const response = await apiService.products.getDistributors();
            if (response.data.success) {
                setDistributors(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching distributors:', error);
        }
    };

    // Fetches all products for a given category
    const fetchAllProductsForCategory = async (categoryId) => {
        if (!categoryId) return;

        try {
            setSearchLoading(true);
            // Use the search endpoint with an empty query to get all products
            const response = await apiService.products.search({
                categoryId: categoryId,
                searchQuery: '', // Empty query to fetch all
                page: 1,
                limit: 1000 // Fetch a large number of products, assuming this is enough
            });

            if (response.data.success) {
                const fetchedProducts = response.data.products || [];
                const categoryData = response.data.categoryInfo || null;
                
                setAllProducts(fetchedProducts);
                setFilteredProducts(fetchedProducts); // Initially, display all
                setCategoryInfo(categoryData); // Store category info for dynamic columns
                setSearchPerformed(true);
            } else {
                message.error(response.data.message || 'Failed to fetch products');
                setAllProducts([]);
                setFilteredProducts([]);
                setCategoryInfo(null);
            }
        } catch (error) {
            console.error('❌ Error fetching products for category:', error);
            message.error('Failed to fetch products. Please try again.');
        } finally {
            setSearchLoading(false);
        }
    };

    // Handle hierarchical category selection
    const handleCategorySelection = async (categoryId, levelIndex) => {
        const newPath = selectedCategoryPath.slice(0, levelIndex);
        newPath[levelIndex] = categoryId;
        setSelectedCategoryPath(newPath);
        
        const newLevels = categoryLevels.slice(0, levelIndex + 1);
        
        // Reset states on new selection
        setAllProducts([]);
        setFilteredProducts([]);
        setSearchQuery('');
        form.setFieldsValue({ searchQuery: '' });
        setFinalCategoryId(null);
        setIsLeafCategory(false);
        setSearchPerformed(false);
        setCurrentPage(1);
        setCategoryInfo(null); // Clear category info

        try {
            const categoryResponse = await apiService.categories.getById(categoryId);
            if (categoryResponse.data.success) {
                const category = categoryResponse.data.data;
                
                if (category.is_leaf) {
                    setCategoryLevels(newLevels);
                    setFinalCategoryId(categoryId);
                    setIsLeafCategory(true);
                    await fetchAllProductsForCategory(categoryId); // Fetch products immediately
                } else {
                    const childrenResponse = await apiService.categories.getChildren(categoryId);
                    if (childrenResponse.data.success && childrenResponse.data.data.length > 0) {
                        setCategoryLevels([...newLevels, childrenResponse.data.data]);
                    } else {
                        setCategoryLevels(newLevels); // No more children
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error handling category selection:', error);
        }
    };

    const handleSearchQueryChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleAction = (action, record) => {
        if (action === 'edit') {
            setEditingRowId(record._id);
            setEditingRowData({ ...record }); // Copy the record for editing
        } else if (action === 'delete') {
            handleDeleteProduct(record._id);
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            const response = await apiService.products.softDelete(productId);
            if (response.data.success) {
                message.success('Product deleted successfully');
                // Refresh the product list
                if (finalCategoryId) {
                    await fetchAllProductsForCategory(finalCategoryId);
                }
            } else {
                message.error('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            message.error('Failed to delete product');
        }
    };

    const handleSaveEdit = async (record) => {
        try {
            // Use the editingRowData for updates
            const updateData = { ...editingRowData };
            
            console.log('Updating product with data:', updateData);
            
            const response = await apiService.products.update(record._id, updateData);
            if (response.data.success) {
                message.success('Product updated successfully');
                setEditingRowId(null);
                setEditingRowData({});
                // Refresh the product list
                if (finalCategoryId) {
                    await fetchAllProductsForCategory(finalCategoryId);
                }
            } else {
                message.error('Failed to update product');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            message.error('Failed to update product');
        }
    };

    const getCategoryIcon = (categoryName) => {
        const name = categoryName?.toLowerCase();
        if (name?.includes('mobile')) return <MobileOutlined />;
        if (name?.includes('tv')) return <DesktopOutlined />;
        if (name?.includes('electronics')) return <BarcodeOutlined />;
        return <ShopOutlined />;
    };

    const getProductDisplayName = (product) => {
        // For your actual data structure, create a meaningful display name
        const brand = product.brand || '';
        const model = product.model_number || '';
        const type = product.type || '';
        const capacity = product.capacity || '';
        
        if (brand && model) {
            let displayName = `${brand} ${model}`;
            if (type) displayName += ` (${type})`;
            if (capacity) displayName += ` - ${capacity}`;
            return displayName;
        }
        
        if (brand) return brand;
        if (model) return model;
        
        return product.name || 'Product';
    };

    // Generate dynamic table columns based on category form schema
    const generateDynamicColumns = () => {
        if (!categoryInfo || !categoryInfo.form_schema) {
            // Fallback to basic columns if no category info
            return [
                {
                    title: 'Brand',
                    dataIndex: 'brand',
                    key: 'brand',
                },
                {
                    title: 'Model',
                    dataIndex: 'model_number',
                    key: 'model_number',
                }
            ];
        }

        const dynamicColumns = [];
        
        // Generate columns based on the category's form schema
        categoryInfo.form_schema.forEach(field => {
            if (field.field_id === 'dealer_price' || field.field_id === 'mrp') {
                // Special handling for price fields
                dynamicColumns.push({
                    title: field.label,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    render: (text, record) => {
                        if (editingRowId === record._id) {
                            return (
                                <Input
                                    type="number"
                                    defaultValue={text}
                                    onChange={(e) => record[field.field_id] = e.target.value}
                                />
                            );
                        }
                        return text ? `₹${Number(text).toLocaleString('en-IN')}` : 'N/A';
                    },
                });
            } else if (field.field_id === 'star_rating') {
                // Special handling for star rating
                dynamicColumns.push({
                    title: field.label,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    render: (text, record) => {
                        if (editingRowId === record._id) {
                            return (
                                <Select
                                    style={{ width: '100%' }}
                                    defaultValue={text}
                                    onChange={(value) => record[field.field_id] = value}
                                >
                                    {field.options?.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            );
                        }
                        return text ? `${text} ⭐` : 'N/A';
                    },
                });
            } else if (field.type === 'dropdown' && field.options) {
                // For dropdown fields, show the actual value
                dynamicColumns.push({
                    title: field.label,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    width: 150,
                    render: (text, record) => {
                        if (editingRowId === record._id) {
                            return (
                                <Select
                                    style={{ width: 130 }}
                                    value={editingRowData[field.field_id] || text}
                                    onChange={(value) => {
                                        setEditingRowData(prev => ({
                                            ...prev,
                                            [field.field_id]: value
                                        }));
                                    }}
                                    dropdownStyle={{ zIndex: 9999 }}
                                >
                                    {field.options.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            );
                        }
                        if (!text) return 'N/A';
                        // Find the option label for the value
                        const option = field.options.find(opt => opt.value === text);
                        return option ? option.label : text;
                    },
                });
            } else {
                // Standard column
                dynamicColumns.push({
                    title: field.label,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    width: field.field_id === 'model_number' || field.field_id === 'serial_number' ? 120 : 100,
                    render: (text, record) => {
                        if (editingRowId === record._id) {
                            return (
                                <Input
                                    value={editingRowData[field.field_id] || text || ''}
                                    onChange={(e) => {
                                        setEditingRowData(prev => ({
                                            ...prev,
                                            [field.field_id]: e.target.value
                                        }));
                                    }}
                                    style={{ width: field.field_id === 'model_number' || field.field_id === 'serial_number' ? 110 : 90 }}
                                />
                            );
                        }
                        return text || 'N/A';
                    },
                });
            }
        });

        // Add Distributor column
        dynamicColumns.push({
            title: 'Distributor',
            key: 'distributor',
            width: 200,
            render: (text, record) => {
                if (editingRowId === record._id) {
                    const currentSupplierId = editingRowData.supplierId || 
                        (record.supplierId && typeof record.supplierId === 'object' ? record.supplierId._id : record.supplierId);
                    
                    return (
                        <Select
                            style={{ width: 180 }}
                            value={currentSupplierId}
                            onChange={(value) => {
                                setEditingRowData(prev => ({
                                    ...prev,
                                    supplierId: value
                                }));
                            }}
                            dropdownStyle={{ zIndex: 9999 }}
                        >
                            {distributors.map(dist => (
                                <Option key={dist._id} value={dist._id}>
                                    {dist.name}
                                </Option>
                            ))}
                        </Select>
                    );
                } else {
                    const supplier = record.supplierId;
                    if (supplier && typeof supplier === 'object') {
                        return (
                            <div style={{ fontSize: '12px', lineHeight: '1.2' }}>
                                <div style={{ fontWeight: 'bold' }}>{supplier.name}</div>
                                <div style={{ color: '#666' }}>{supplier.gstNumber || 'N/A'}</div>
                            </div>
                        );
                    }
                    return 'N/A';
                }
            },
        });

        // Add Action column
        dynamicColumns.push({
            title: 'Action',
            key: 'action',
            width: 100,
            fixed: 'right',
            render: (text, record) => {
                if (editingRowId === record._id) {
                    return (
                        <Button 
                            type="primary" 
                            size="small"
                            onClick={() => handleSaveEdit(record)}
                            style={{ width: 60 }}
                        >
                            OK
                        </Button>
                    );
                } else {
                    return (
                        <Select
                            style={{ width: 80 }}
                            placeholder="..."
                            onChange={(value) => handleAction(value, record)}
                            dropdownStyle={{ zIndex: 9999 }}
                        >
                            <Option value="edit">Edit</Option>
                            <Option value="delete">Delete</Option>
                        </Select>
                    );
                }
            },
        });

        return dynamicColumns;
    };

    const columns = useMemo(() => {
        return generateDynamicColumns();
    }, [categoryInfo, editingRowId, editingRowData, distributors]);

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredProducts.slice(startIndex, startIndex + pageSize);
    }, [filteredProducts, currentPage, pageSize]);

    return (
        <div className="search-product-container">
            <Breadcrumb style={{ margin: '16px 0' }}>
                <Breadcrumb.Item><Link to="/"><HomeOutlined /></Link></Breadcrumb.Item>
                <Breadcrumb.Item>Search Products</Breadcrumb.Item>
            </Breadcrumb>
            
            <Card 
                title={<Title level={3}><SearchOutlined /> Search for Products</Title>}
                bordered={false} 
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
                <Spin spinning={loading}>
                    <Form form={form} layout="vertical">
                        <Row gutter={[16, 16]}>
                            {categoryLevels.map((level, levelIndex) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={levelIndex}>
                                    <Form.Item
                                        label={`Level ${levelIndex + 1} Category`}
                                        required={levelIndex === 0}
                                    >
                                        <Select
                                            showSearch
                                            placeholder={`Select Level ${levelIndex + 1}`}
                                            onChange={(value) => handleCategorySelection(value, levelIndex)}
                                            value={selectedCategoryPath[levelIndex]}
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                        >
                                            {level.map(cat => (
                                                <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>

                        {isLeafCategory && (
                            <Row gutter={16}>
                                <Col xs={24}>
                                    <Form.Item label="Filter Products by Name, Model, or Serial Number">
                                        <Input
                                            placeholder="Type at least 3 characters to filter results..."
                                            value={searchQuery}
                                            onChange={handleSearchQueryChange}
                                            prefix={<FilterOutlined />}
                                            disabled={!isLeafCategory || searchLoading}
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}
                    </Form>
                </Spin>
            </Card>

            <Card 
                title="Product List" 
                style={{ marginTop: '24px' }}
                extra={searchPerformed && <Text>{filteredProducts.length} of {allProducts.length} products shown</Text>}
            >
                <Spin spinning={searchLoading}>
                    {searchPerformed && filteredProducts.length > 0 ? (
                        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
                            <Table
                                columns={columns}
                                dataSource={paginatedProducts}
                                rowKey="_id"
                                pagination={false}
                                scroll={{ 
                                    x: 'max-content',
                                    y: 600 
                                }}
                                size="small"
                                style={{ minWidth: '1200px' }}
                            />
                            <Pagination
                                current={currentPage}
                                pageSize={pageSize}
                                total={filteredProducts.length}
                                onChange={handlePageChange}
                                style={{ marginTop: '20px', textAlign: 'right' }}
                                showSizeChanger={false}
                            />
                        </div>
                    ) : (
                        <Empty
                            description={
                                searchPerformed
                                    ? "No products found matching your filter."
                                    : "Please select a final product category to see the list of products."
                            }
                        />
                    )}
                </Spin>
            </Card>
        </div>
    );
};

export default SearchProduct;
