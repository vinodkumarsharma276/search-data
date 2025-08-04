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
    Spin
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
    
    // Category hierarchy state (similar to AddProduct)
    const [categoryLevels, setCategoryLevels] = useState([]);
    const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
    const [finalCategoryId, setFinalCategoryId] = useState(null);
    const [isLeafCategory, setIsLeafCategory] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);
    const [searchPerformed, setSearchPerformed] = useState(false);

    // Fetch top-level categories on component mount
    useEffect(() => {
        fetchTopLevelCategories();
    }, []);

    // Auto-search when query length >= 3 and leaf category is selected
    useEffect(() => {
        if (finalCategoryId && searchQuery.length >= 3) {
            const timeoutId = setTimeout(() => {
                handleSearch();
            }, 500); // Debounce search

            return () => clearTimeout(timeoutId);
        } else if (searchQuery.length < 3 && searchPerformed) {
            // Clear results if query becomes too short
            setProducts([]);
            setTotalProducts(0);
            setSearchPerformed(false);
        }
    }, [searchQuery, finalCategoryId]);

    const fetchTopLevelCategories = async () => {
        try {
            setLoading(true);
            const response = await apiService.categories.getTopLevel();
            if (response.data.success) {
                setCategoryLevels([response.data.data || []]);
                console.log('✅ Loaded top-level categories for search:', response.data.data?.length);
            }
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle hierarchical category selection (similar to AddProduct)
    const handleCategorySelection = async (categoryId, levelIndex) => {
        console.log('🎯 Category selected at level', levelIndex, ':', categoryId);
        
        // Update selected category path up to current level
        const newPath = selectedCategoryPath.slice(0, levelIndex);
        newPath[levelIndex] = categoryId;
        setSelectedCategoryPath(newPath);
        
        // Clear category levels after current level
        const newLevels = categoryLevels.slice(0, levelIndex + 1);
        
        try {
            // Get the selected category details
            const categoryResponse = await apiService.categories.getById(categoryId);
            if (categoryResponse.data.success) {
                const category = categoryResponse.data.data;
                
                if (category.is_leaf) {
                    // This is a leaf category - enable search
                    console.log('🍃 Leaf category selected, search enabled');
                    setCategoryLevels(newLevels);
                    setFinalCategoryId(categoryId);
                    setIsLeafCategory(true);
                } else {
                    // Not a leaf - fetch children for next level
                    console.log('🌿 Non-leaf category, fetching children');
                    
                    const childrenResponse = await apiService.categories.getChildren(categoryId);
                    if (childrenResponse.data.success && childrenResponse.data.data.length > 0) {
                        setCategoryLevels([...newLevels, childrenResponse.data.data]);
                        setFinalCategoryId(null);
                        setIsLeafCategory(false);
                        
                        console.log('✅ Loaded children for next level:', childrenResponse.data.data.length);
                    }
                }
                
                // Clear previous search results when category changes
                setSearchQuery('');
                setProducts([]);
                setTotalProducts(0);
                setCurrentPage(1);
                setSearchPerformed(false);
                form.setFieldsValue({ searchQuery: '' });
            }
        } catch (error) {
            console.error('❌ Error handling category selection:', error);
        }
    };

    const handleSearchQueryChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    const handleSearch = useCallback(async (page = 1) => {
        if (!finalCategoryId || searchQuery.length < 3) {
            return;
        }

        try {
            setSearchLoading(true);
            console.log('🔍 Searching products:', { 
                category: finalCategoryId, 
                query: searchQuery, 
                page,
                pageSize 
            });

            const response = await apiService.products.search({
                categoryId: finalCategoryId,
                searchQuery: searchQuery,
                page: page,
                limit: pageSize
            });

            if (response.data.success) {
                setProducts(response.data.products || []);
                setTotalProducts(response.data.total || 0);
                setCurrentPage(page);
                setSearchPerformed(true);
                console.log('✅ Search results:', response.data.products?.length, 'of', response.data.total);
            } else {
                message.error(response.data.message || 'Search failed');
                setProducts([]);
                setTotalProducts(0);
            }
        } catch (error) {
            console.error('❌ Search error:', error);
            message.error('Search failed. Please try again.');
            setProducts([]);
            setTotalProducts(0);
        } finally {
            setSearchLoading(false);
        }
    }, [finalCategoryId, searchQuery, pageSize]);

    const handlePageChange = (page) => {
        handleSearch(page);
    };

    const getCategoryIcon = (categoryName) => {
        const name = categoryName?.toLowerCase();
        if (name?.includes('mobile')) return <MobileOutlined />;
        if (name?.includes('tv')) return <DesktopOutlined />;
        if (name?.includes('electronics')) return <BarcodeOutlined />;
        return <ShopOutlined />;
    };

    const getProductDisplayName = (product) => {
        return product.name || 
               product.getDisplayName?.() ||
               product.model_number ||
               product.brand ||
               'Unknown Product';
    };

    const getProductPrice = (product) => {
        return product.sellingPrice || 
               product.price ||
               product.mrp ||
               product.dealer_price ||
               0;
    };

    // Table columns configuration
    const columns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
            width: 100,
            render: (brand) => (
                <Text strong style={{ fontSize: '15px' }}>
                    {brand || 'N/A'}
                </Text>
            ),
        },
        {
            title: 'Model Number',
            dataIndex: 'model_number',
            key: 'model_number',
            width: 120,
            render: (text) => (
                <Text style={{ fontSize: '14px' }}>{text || 'N/A'}</Text>
            ),
        },
        {
            title: 'Serial Number',
            dataIndex: 'serial_number',
            key: 'serial_number',
            width: 130,
            render: (text) => (
                <Text style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                    {text || 'N/A'}
                </Text>
            ),
        },
        {
            title: 'MRP',
            dataIndex: 'mrp',
            key: 'mrp',
            width: 100,
            render: (mrp) => (
                <Text style={{ fontSize: '14px', color: '#52c41a' }}>
                    {mrp ? `₹${Number(mrp).toLocaleString('en-IN')}` : 'N/A'}
                </Text>
            ),
        },
        {
            title: 'Dealer Price',
            dataIndex: 'dealer_price',
            key: 'dealer_price',
            width: 110,
            render: (dealerPrice) => (
                <Text strong style={{ fontSize: '14px', color: '#fa8c16' }}>
                    {dealerPrice ? `₹${Number(dealerPrice).toLocaleString('en-IN')}` : 'N/A'}
                </Text>
            ),
        }
    ];

    const selectedCategoryName = useMemo(() => {
        // Get the final (leaf) category name from the hierarchy
        if (finalCategoryId && categoryLevels.length > 0) {
            for (const level of categoryLevels) {
                const category = level.find(cat => cat._id === finalCategoryId);
                if (category) return category.name;
            }
        }
        return '';
    }, [categoryLevels, finalCategoryId]);

    return (
        <div>
            <Breadcrumb style={{ marginBottom: '24px' }}>
                <Breadcrumb.Item>
                    <Link to="/dashboard">Dashboard</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>Search Products</Breadcrumb.Item>
            </Breadcrumb>

            <Card
                title={
                    <Space>
                        <SearchOutlined style={{ color: '#fa8c16' }} />
                        <Title level={3} style={{ margin: 0, color: '#333333' }}>
                            Search Products
                        </Title>
                    </Space>
                }
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e1e5e9',
                    marginBottom: '24px'
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                >
                    <Row gutter={16}>
                        {/* Hierarchical Category Selection */}
                        {categoryLevels.length > 0 ? (
                            categoryLevels.map((levelCategories, levelIndex) => (
                                <Col key={levelIndex} xs={24} sm={12} md={8} lg={6}>
                                    <Form.Item
                                        label={
                                            <Space>
                                                <FilterOutlined />
                                                <span style={{ fontWeight: 500 }}>
                                                    {levelIndex === 0 ? 'Main Category' : 
                                                     levelIndex === 1 ? 'Sub Category' : 
                                                     `Category ${levelIndex + 1}`}
                                                </span>
                                                {levelIndex === 0 && <span style={{ color: '#ff4d4f' }}>*</span>}
                                            </Space>
                                        }
                                        rules={levelIndex === 0 ? [{ required: true, message: 'Please select a category' }] : []}
                                    >
                                        <Select
                                            placeholder={levelIndex === 0 ? 'Select main category' : 'Select subcategory'}
                                            value={selectedCategoryPath[levelIndex]}
                                            onChange={(value) => handleCategorySelection(value, levelIndex)}
                                            loading={loading}
                                            size="large"
                                            style={{ fontSize: '14px' }}
                                        >
                                            {levelCategories.map(category => (
                                                <Option key={category._id} value={category._id}>
                                                    <Space>
                                                        {getCategoryIcon(category.name)}
                                                        {category.name}
                                                    </Space>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            ))
                        ) : (
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Form.Item
                                    label={
                                        <Space>
                                            <FilterOutlined />
                                            <span style={{ fontWeight: 500 }}>Main Category</span>
                                            <span style={{ color: '#ff4d4f' }}>*</span>
                                        </Space>
                                    }
                                >
                                    <Select
                                        placeholder="Loading categories..."
                                        disabled
                                        loading={loading}
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                        )}
                        
                        <Col xs={24} sm={12} md={10} lg={12}>
                            <Form.Item
                                label={
                                    <Space>
                                        <SearchOutlined />
                                        <span style={{ fontWeight: 500 }}>Search Query</span>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            (Brand, Model, or Serial Number)
                                        </span>
                                    </Space>
                                }
                                name="searchQuery"
                            >
                                <Input
                                    placeholder={isLeafCategory ? 
                                        "Type at least 3 characters to search..." : 
                                        "Select a category first"
                                    }
                                    value={searchQuery}
                                    onChange={handleSearchQueryChange}
                                    disabled={!isLeafCategory}
                                    size="large"
                                    style={{ fontSize: '14px' }}
                                    suffix={
                                        searchLoading ? (
                                            <Spin size="small" />
                                        ) : (
                                            <SearchOutlined style={{ color: isLeafCategory ? '#fa8c16' : '#ccc' }} />
                                        )
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={24} md={6} lg={6}>
                            <Form.Item label=" " style={{ marginTop: '6px' }}>
                                <Space>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {isLeafCategory && searchQuery.length >= 3 ? (
                                            searchLoading ? 'Searching...' : 
                                            `Found ${totalProducts} products`
                                        ) : finalCategoryId && searchQuery.length > 0 && searchQuery.length < 3 ? (
                                            `Type ${3 - searchQuery.length} more characters`
                                        ) : finalCategoryId ? (
                                            'Ready to search'
                                        ) : (
                                            'Select category to start'
                                        )}
                                    </Text>
                                </Space>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            {/* Search Results */}
            <Card
                title={
                    <Space>
                        <ShopOutlined style={{ color: '#fa8c16' }} />
                        <Title level={4} style={{ margin: 0, color: '#333333' }}>
                            Search Results
                            {selectedCategoryName && (
                                <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>
                                    in {selectedCategoryName}
                                </Text>
                            )}
                        </Title>
                    </Space>
                }
                extra={
                    totalProducts > 0 && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Page {currentPage} of {Math.ceil(totalProducts / pageSize)}
                        </Text>
                    )
                }
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e1e5e9'
                }}
            >
                {searchPerformed ? (
                    products.length > 0 ? (
                        <>
                            <Table
                                columns={columns}
                                dataSource={products}
                                rowKey="_id"
                                pagination={false}
                                loading={searchLoading}
                                size="small"
                                scroll={{ x: 800 }}
                                style={{ marginBottom: '16px' }}
                                rowClassName={(record, index) => 
                                    index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
                                }
                            />
                            
                            {totalProducts > pageSize && (
                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <Pagination
                                        current={currentPage}
                                        total={totalProducts}
                                        pageSize={pageSize}
                                        onChange={handlePageChange}
                                        showSizeChanger={false}
                                        showQuickJumper
                                        showTotal={(total, range) => 
                                            `${range[0]}-${range[1]} of ${total} products`
                                        }
                                        style={{ justifyContent: 'center' }}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Space direction="vertical" size={8}>
                                    <Text>No products found</Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        Try searching with different keywords in {selectedCategoryName}
                                    </Text>
                                </Space>
                            }
                        />
                    )
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Space direction="vertical" size={8}>
                                <Text>Ready to search</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {!finalCategoryId ? 
                                        'Select a category and enter search terms to find products' :
                                        'Enter at least 3 characters to start searching'
                                    }
                                </Text>
                            </Space>
                        }
                    />
                )}
            </Card>

            {/* Custom CSS for table styling */}
            <style jsx>{`
                .table-row-light {
                    background-color: #fafafa;
                }
                .table-row-dark {
                    background-color: #ffffff;
                }
                .ant-table-tbody > tr:hover > td {
                    background-color: #e6f7ff !important;
                }
                .ant-pagination-item-active {
                    border-color: #fa8c16;
                    background-color: #fa8c16;
                }
                .ant-pagination-item-active a {
                    color: #fff;
                }
            `}</style>
        </div>
    );
};

export default SearchProduct;
