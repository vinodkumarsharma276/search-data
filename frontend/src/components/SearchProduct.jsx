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
    // Multi-root support removed from UI (auto-select first root internally)
    const [roots, setRoots] = useState([]); // retained for internal fetch; not displayed
    const [selectedRootKey, setSelectedRootKey] = useState(null); // internal only
    
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

    // Fetch first root (internally) and distributors on mount
    useEffect(() => {
        fetchRoots();
        fetchDistributors();
    }, []);

    // Frontend filtering when searchQuery changes
    useEffect(() => {
        if (!allProducts || !allProducts.length) {
            setFilteredProducts([]);
            return;
        }
        if (searchQuery && searchQuery.length >= 3) {
            const q = searchQuery.trim().toLowerCase();
            const filtered = allProducts.filter(p => {
                const model = (p.model_number || '').toString().toLowerCase();
                const serial = (p.serial_number || '').toString().toLowerCase();
                const pname = (p.product_name || p.name || '').toString().toLowerCase();
                const brand = (p.brand || '').toString().toLowerCase();
                return model.includes(q) || serial.includes(q) || pname.includes(q) || brand.includes(q);
            });
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(allProducts);
        }
        setCurrentPage(1);
    }, [searchQuery, allProducts]);

    // Load roots then auto-select first root tree
    const fetchRoots = async () => {
        try {
            setLoading(true);
            const resp = await apiService.categories.getRoots();
            if (resp.data.success) {
                const list = resp.data.data || [];
                setRoots(list);
                if (list.length) {
                    // Build top-level (Main Category) options from all roots so user can pick any root directly
                    const topLevel = list.map(r => ({ _id: r.root_id, name: r.name, is_leaf: false }));
                    setCategoryLevels([topLevel]);
                } else {
                    setCategoryLevels([]);
                }
            }
        } catch (e) {
            console.error('❌ Error fetching roots:', e);
        } finally { setLoading(false); }
    };

    // Load a materialized tree and build first level options
    const loadRootTree = async (rootKey) => {
        try {
            setLoading(true);
            const resp = await apiService.categories.getTree(rootKey);
            if (resp.data.success) {
                const nodes = resp.data.data?.nodes || [];
                const top = nodes.filter(n => !n.parent_id).map(n => ({ _id: n._id, name: n.name, is_leaf: n.is_leaf }));
                setCategoryLevels([top]);
            }
        } catch (e) {
            console.error('❌ Error loading tree:', e);
        } finally { setLoading(false); }
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
            // First, detect if this selection corresponds to a root category (present in roots list)
            const asRoot = roots.find(r => String(r.root_id) === String(categoryId));
            if (asRoot) {
                // Load its tree and populate next level (its children) as Sub Category 1
                const resp = await apiService.categories.getTree(asRoot.root_key);
                if (resp.data.success) {
                    const nodes = resp.data.data?.nodes || [];
                    // Top-level children (level 1) are nodes whose parent_id equals the root's id
                    const topChildren = nodes
                        .filter(n => n.parent_id && String(n.parent_id) === String(asRoot.root_id))
                        .map(n => ({ _id: n._id, name: n.name, is_leaf: n.is_leaf }));
                    // Reset deeper levels when switching root
                    setCategoryLevels([categoryLevels[0], topChildren]);
                }
                return; // stop further processing
            }

            const detailResp = await apiService.categories.getById(categoryId);
            if (!detailResp.data.success) return;
            const category = detailResp.data.data;
            if (category.is_leaf) {
                setCategoryLevels(newLevels);
                setFinalCategoryId(categoryId);
                setIsLeafCategory(true);
                await fetchAllProductsForCategory(categoryId);
            } else {
                const childrenResp = await apiService.categories.getChildren(categoryId);
                if (childrenResp.data.success && childrenResp.data.data.length) {
                    setCategoryLevels([...newLevels, childrenResp.data.data]);
                } else {
                    setCategoryLevels(newLevels);
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

    // Helper to compute adaptive width for a field based on sample data
    const computeAdaptiveWidth = (fieldId, rows) => {
        // Preferred explicit widths for some known fields (acts as upper bounds / defaults)
        const explicit = {
            product_name: 180,
            name: 180,
            model_number: 160,
            serial_number: 170,
            dealer_price: 110,
            mrp: 110,
            warrantyMonths: 110,
            brand: 120,
            color: 90,
            ram: 80,
            ram_gb: 80,
            storage: 100,
            storage_gb: 110,
            capacity: 110,
            size: 90,
            star_rating: 95,
            os_version: 120,
            supplierId: 160
        };
        const sample = rows.slice(0, 200);
        let maxLen = 0;
        sample.forEach(r => {
            const v = r && r[fieldId];
            if (v === undefined || v === null) return;
            const str = String(v);
            if (str.length > maxLen) maxLen = str.length;
        });
        // Base character width approximation
        let width = Math.min(240, Math.max(60, maxLen * 7 + 28));
        if (explicit[fieldId]) {
            // Don't exceed explicit; also ensure at least explicit * 0.7 to avoid too tiny
            width = Math.min(explicit[fieldId], Math.max(width, Math.round(explicit[fieldId] * 0.7)));
        }
        return width;
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
            const derivedColumns = ordered.slice(0, 25).map(field => {
                const adaptiveWidth = computeAdaptiveWidth(field, sampleProducts);
                return ({
                    title: field.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
                    dataIndex: field,
                    key: field,
                    width: adaptiveWidth,
                    align: numericFields.has(field) ? 'right' : undefined,
                    render: (text, record) => {
                        if (editingRowId === record._id) {
                            if (numericFields.has(field)) {
                                return <Input type="number" value={editingRowData[field] ?? text ?? ''} onChange={e => setEditingRowData(prev => ({...prev,[field]: e.target.value}))} style={{ width: adaptiveWidth - 10, textAlign: 'right' }} />;
                            }
                            return <Input value={editingRowData[field] ?? text ?? ''} onChange={e => setEditingRowData(prev => ({...prev,[field]: e.target.value}))} style={{ width: adaptiveWidth - 10 }} />;
                        }
                        if (numericFields.has(field) && text !== undefined && text !== null && text !== '') {
                            const num = Number(text);
                            if (!isNaN(num)) return `₹${num.toLocaleString('en-IN')}`;
                        }
                        return text || 'N/A';
                    }
                });
            });

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
            // Sold status column (before Action)
            derivedColumns.push({
                title: 'Sold',
                key: 'sold',
                dataIndex: 'sold',
                width: 70,
                render: (value) => {
                    const sold = !!value;
                    return <Tag color={sold ? 'red' : 'green'} style={{ fontSize: 10, padding: '0 6px' }}>{sold ? 'YES' : 'NO'}</Tag>;
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
    const sampleRows = filteredProducts.length ? filteredProducts : allProducts;
    sortedSchema.forEach(field => {
        const colLabel = field.label || field.field_id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
        if (field.field_id === 'dealer_price' || field.field_id === 'mrp') {
                // Special handling for price fields
                const adaptiveWidth = computeAdaptiveWidth(field.field_id, sampleRows);
                dynamicColumns.push({
                    title: colLabel,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    width: adaptiveWidth,
                    align: 'right',
                    render: (text, record) => {
                        if (editingRowId === record._id) {
                            return (
                                <Input
                                    type="number"
                                    defaultValue={text}
                                    onChange={(e) => record[field.field_id] = e.target.value}
                                    style={{ width: adaptiveWidth - 10, textAlign: 'right' }}
                                />
                            );
                        }
                        return text ? `₹${Number(text).toLocaleString('en-IN')}` : 'N/A';
                    },
                });
        } else if (field.field_id === 'star_rating') {
                // Special handling for star rating
                const adaptiveWidth = computeAdaptiveWidth(field.field_id, sampleRows);
                dynamicColumns.push({
                    title: colLabel,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    width: adaptiveWidth,
                    render: (text, record) => {
                        if (editingRowId === record._id) {
                            return (
                                <Select
                                    style={{ width: adaptiveWidth - 10 }}
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
                const adaptiveWidth = computeAdaptiveWidth(field.field_id, sampleRows);
                dynamicColumns.push({
                    title: colLabel,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    width: adaptiveWidth,
                    render: (text, record) => {
                        if (editingRowId === record._id) {
                            return (
                                <Select
                                    style={{ width: adaptiveWidth - 10 }}
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
                        const option = field.options.find(opt => opt.value === text);
                        return option ? option.label : text;
                    },
                });
        } else {
                // Special handling for mobile_imei (array -> multiline display)
                if (field.field_id === 'mobile_imei') {
                    // Cap width so long IMEI arrays don't allocate excessive horizontal space
                    const adaptiveWidth = Math.min(
                        computeAdaptiveWidth(field.field_id, sampleRows),
                        170 // max width in px for IMEI column
                    );
                    dynamicColumns.push({
                        title: colLabel,
                        dataIndex: field.field_id,
                        key: field.field_id,
                        width: adaptiveWidth,
                        render: (text, record) => {
                            // text may be array due to dynamic data shape; ensure we read from record for safety
                            const value = record[field.field_id];
                            if (editingRowId === record._id) {
                                const currentList = Array.isArray(editingRowData[field.field_id])
                                    ? editingRowData[field.field_id]
                                    : (Array.isArray(value) ? value : (value ? [value] : []));
                                return (
                                    <Input.TextArea
                                        value={currentList.join('\n')}
                                        onChange={(e) => {
                                            const lines = e.target.value
                                                .split(/\n+/)
                                                .map(s => s.trim())
                                                .filter(s => s.length > 0);
                                            setEditingRowData(prev => ({
                                                ...prev,
                                                [field.field_id]: lines
                                            }));
                                        }}
                                        autoSize={{ minRows: 2, maxRows: 4 }}
                                        style={{ width: adaptiveWidth - 10, fontFamily: 'monospace', lineHeight: '16px' }}
                                        placeholder="One IMEI per line"
                                    />
                                );
                            }
                            if (Array.isArray(value) && value.length) {
                                return (
                                    <div style={{ whiteSpace: 'pre-line', lineHeight: '14px', fontFamily: 'monospace', overflowWrap: 'anywhere' }}>
                                        {value.join('\n')}
                                    </div>
                                );
                            }
                            return 'N/A';
                        }
                    });
                    return; // skip default standard column path
                }
                // Standard column
                const adaptiveWidth = computeAdaptiveWidth(field.field_id, sampleRows);
                dynamicColumns.push({
                    title: colLabel,
                    dataIndex: field.field_id,
                    key: field.field_id,
                    width: adaptiveWidth,
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
                                    style={{ width: adaptiveWidth - 10 }}
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

        // Add Sold column before Action
        dynamicColumns.push({
            title: 'Sold',
            key: 'sold',
            dataIndex: 'sold',
            width: 70,
            render: (value) => {
                const sold = !!value;
                return <Tag color={sold ? 'red' : 'green'} style={{ fontSize: 10, padding: '0 6px' }}>{sold ? 'YES' : 'NO'}</Tag>;
            },
            fixed: dynamicColumns.some(c => c.fixed === 'right') ? undefined : undefined
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
                        {/* Compact table styling to reduce row height and handle long serial numbers */}
                        <style>{`
                            .search-product-container .ant-table-wrapper .ant-table-tbody .ant-table-cell {
                                font-size: 12px; /* reduced from default ~14px */
                                line-height: 1.15; /* tighter vertical spacing */
                                padding: 4px 6px; /* reduce cell padding */
                                white-space: normal; /* allow wrapping */
                                word-break: break-word; /* break long serial numbers */
                            }
                            .search-product-container .ant-table-wrapper .ant-table-thead .ant-table-cell {
                                padding: 6px 6px; /* slightly tighter header */
                                font-size: 12.5px; /* subtle reduction for consistency */
                            }
                            .search-product-container .ant-table-wrapper .ant-table-cell input,
                            .search-product-container .ant-table-wrapper .ant-table-cell .ant-select-selector,
                            .search-product-container .ant-table-wrapper .ant-table-cell .ant-input {
                                font-size: 12px;
                            }
                        `}</style>
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
