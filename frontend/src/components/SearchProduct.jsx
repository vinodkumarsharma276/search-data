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

    // Helper to map index to display label
    const getCategoryLevelLabel = (idx) => {
        if (idx === 0) return 'Main Category';
        return `Sub Category ${idx}`; // idx 1 -> Sub Category 1, etc.
    };

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

    // Fetches all products for a given category (leaf) using name-based filters now
    const fetchAllProductsForCategory = async (categoryId) => {
        if (!categoryId) return;
        try {
            setSearchLoading(true);
            // Fetch full category path (root -> leaf)
            const pathResp = await apiService.categories.getCategoryPath(categoryId);
            const params = { page: 1, limit: 1000 };
            let mergedSchema = [];
            if (pathResp.data?.success) {
                const rawPath = pathResp.data.data || [];
                // Fetch full category docs (some path responses may omit form_schema)
                const fullPath = await Promise.all(rawPath.map(async (node) => {
                    if (node.form_schema && node.form_schema.length) return node; // already has schema
                    try {
                        const detail = await apiService.categories.getById(node._id || node.id);
                        if (detail.data?.success) return { ...node, ...detail.data.data };
                    } catch (e) { /* ignore fetch errors */ }
                    return node; // fallback
                }));
                // Build query params for each hierarchy level
                fullPath.forEach(node => {
                    if (node.field_key && node.name) {
                        params[node.field_key] = node.name;
                    }
                });
                // Merge form schemas from each node (root common first, specifics later)
                const schemaMap = new Map();
                fullPath.forEach(node => {
                    if (Array.isArray(node.form_schema)) {
                        node.form_schema.forEach(f => {
                            if (f && f.field_id && !schemaMap.has(f.field_id)) {
                                schemaMap.set(f.field_id, { ...f });
                            }
                        });
                    }
                });
                mergedSchema = Array.from(schemaMap.values()).sort((a,b) => (a.display_order ?? 999) - (b.display_order ?? 999));
            }
            // Fetch products filtered by the deepest category via all level params
            const response = await apiService.products.search(params);
            if (response.data.success) {
                const fetchedProducts = response.data.products || [];
                setAllProducts(fetchedProducts);
                setFilteredProducts(fetchedProducts);
                // Set category info with merged schema for dynamic columns
                setCategoryInfo(mergedSchema.length ? { form_schema: mergedSchema } : null);
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
            // Auto-derive columns from fetched products when no category schema is available
            const sampleProducts = (filteredProducts && filteredProducts.length ? filteredProducts : allProducts) || [];
            const keySet = new Set();
            sampleProducts.slice(0, 200).forEach(p => {
                Object.keys(p || {}).forEach(k => keySet.add(k));
            });
            // Remove unwanted/internal keys
            const exclude = new Set(['_id','id','__v','supplierId','deleted','sold','isActive','createdAt','updatedAt','lastPurchaseDate','category_path','category_path_ids','selected_category_id','common_attributes','specific_attributes','main_category','sub_category_1','sub_category_2','sub_category_3','sub_category_4','displayName']);
            const preferredOrder = ['brand','product_name','model_number','serial_number','dealer_price','mrp','warrantyMonths','currentStock','minimumStock','color','ram','storage','capacity','size','os_version','condition'];
            const numericFields = new Set(['mrp','dealer_price']);
            const allKeys = Array.from(keySet).filter(k => !exclude.has(k) && /^[a-z0-9_]+$/i.test(k));
            // Ensure preferred ordering first then remaining alphabetically
            const ordered = [
                ...preferredOrder.filter(k => allKeys.includes(k)),
                ...allKeys.filter(k => !preferredOrder.includes(k)).sort()
            ];
            const derivedColumns = ordered.slice(0, 25).map(field => ({
                title: field.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
                dataIndex: field,
                key: field,
                width: ['model_number','serial_number','product_name'].includes(field) ? 160 : 120,
                align: numericFields.has(field) ? 'right' : undefined,
                render: (text, record) => {
                    if (editingRowId === record._id) {
                        if (numericFields.has(field)) {
                            return <Input type="number" value={editingRowData[field] ?? text ?? ''} onChange={e => setEditingRowData(prev => ({...prev,[field]: e.target.value}))} style={{ width: 110, textAlign: 'right' }} />;
                        }
                        return <Input value={editingRowData[field] ?? text ?? ''} onChange={e => setEditingRowData(prev => ({...prev,[field]: e.target.value}))} style={{ width: ['model_number','serial_number','product_name'].includes(field)?150:110 }} />;
                    }
                    if (numericFields.has(field) && text !== undefined && text !== null && text !== '') {
                        const num = Number(text);
                        if (!isNaN(num)) return `₹${num.toLocaleString('en-IN')}`;
                    }
                    return text || 'N/A';
                }
            }));

            // Distributor column
            derivedColumns.push({
                title: 'Distributor',
                key: 'distributor',
                width: 200,
                render: (text, record) => {
                    if (editingRowId === record._id) {
                        const currentSupplierId = editingRowData.supplierId || (record.supplierId && typeof record.supplierId === 'object' ? record.supplierId._id : record.supplierId);
                        return (
                            <Select style={{ width: 180 }} value={currentSupplierId} onChange={(value) => setEditingRowData(prev => ({ ...prev, supplierId: value }))} dropdownStyle={{ zIndex: 9999 }}>
                                {distributors.map(dist => (<Option key={dist._id} value={dist._id}>{dist.name}</Option>))}
                            </Select>
                        );
                    }
                    const supplier = record.supplierId;
                    if (supplier && typeof supplier === 'object') {
                        return <div style={{ fontSize: '12px', lineHeight: '1.2' }}><div style={{ fontWeight: 'bold' }}>{supplier.name}</div><div style={{ color: '#666' }}>{supplier.gstNumber || 'N/A'}</div></div>;
                    }
                    return 'N/A';
                }
            });
            // Action column
            derivedColumns.push({
                title: 'Action',
                key: 'action',
                width: 100,
                fixed: 'right',
                render: (text, record) => editingRowId === record._id ? (
                    <Button type="primary" size="small" onClick={() => handleSaveEdit(record)} style={{ width: 60 }}>OK</Button>
                ) : (
                    <Select style={{ width: 80 }} placeholder="..." onChange={(value) => handleAction(value, record)} dropdownStyle={{ zIndex: 9999 }}>
                        <Option value="edit">Edit</Option>
                        <Option value="delete">Delete</Option>
                    </Select>
                )
            });
            return derivedColumns;
        }

        const dynamicColumns = [];
        
        // Generate columns based on the category's form schema (sorted by display_order)
        const sortedSchema = [...categoryInfo.form_schema].sort((a,b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    sortedSchema.forEach(field => {
        const colLabel = field.label || field.field_id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
        if (field.field_id === 'dealer_price' || field.field_id === 'mrp') {
                // Special handling for price fields
                dynamicColumns.push({
            title: colLabel,
                    dataIndex: field.field_id,
                    key: field.field_id,
            width: 130,
            align: 'right',
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
            title: colLabel,
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
            title: colLabel,
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
            title: colLabel,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    width: field.field_id === 'model_number' || field.field_id === 'serial_number' ? 140 : 110,
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
    }, [categoryInfo, editingRowId, editingRowData, distributors, filteredProducts, allProducts]);

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
                                        label={getCategoryLevelLabel(levelIndex)}
                                        required={levelIndex === 0}
                                    >
                                        <Select
                                            showSearch
                                            placeholder={`Select ${getCategoryLevelLabel(levelIndex)}`}
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
                                tableLayout="fixed"
                                size="small"
                                style={{ minWidth: '900px' }}
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
