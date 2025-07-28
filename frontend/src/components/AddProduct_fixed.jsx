import React, { useState, useEffect } from 'react';
import { 
    Form, 
    Input, 
    InputNumber, 
    Select, 
    Button, 
    Card, 
    Space, 
    AutoComplete, 
    Switch,
    Row, 
    Col, 
    Breadcrumb, 
    Typography,
    Tabs,
    message 
} from 'antd';
import { 
    SaveOutlined, 
    PlusCircleOutlined, 
    MinusCircleOutlined,
    PlusOutlined 
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// Product Form Fields Component for individual products
const ProductFormFields = ({ 
    productIndex, 
    product, 
    form, 
    handleCategorySelection, 
    loadingCategorySchema,
    isMobileCategoryForProduct,
    addImeiField,
    removeImeiField, 
    updateImeiValue 
}) => {
    const productId = product.id;
    
    return (
        <Row gutter={12}>
            {/* Category Selection */}
            {product.categoryLevels.length > 0 ? (
                product.categoryLevels.map((levelCategories, levelIndex) => (
                    <Col key={levelIndex} xs={24} sm={12} md={6} lg={2} xl={2}>
                        <Form.Item
                            label={
                                <span style={{ fontSize: '10px', fontWeight: 500 }}>
                                    {levelIndex === 0 ? 'Main Category' : levelIndex === 1 ? 'Sub Category' : `Category ${levelIndex + 1}`}
                                </span>
                            }
                            style={{ marginBottom: '12px' }}
                        >
                            <Select
                                placeholder={levelIndex === 0 ? 'Main' : 'Sub'}
                                value={product.selectedCategoryPath[levelIndex]}
                                onChange={(value) => handleCategorySelection(value, levelIndex, productIndex)}
                                loading={loadingCategorySchema && levelIndex === product.categoryLevels.length - 1}
                                size="small"
                                style={{ fontSize: '10px' }}
                                dropdownStyle={{ fontSize: '10px' }}
                            >
                                {levelCategories.map(category => (
                                    <Option key={category._id} value={category._id}>
                                        {category.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                ))
            ) : (
                <Col xs={24} sm={12} md={6} lg={2} xl={2}>
                    <Form.Item
                        label={<span style={{ fontSize: '10px', fontWeight: 500 }}>Main Category</span>}
                        style={{ marginBottom: '12px' }}
                    >
                        <Select
                            placeholder="Loading..."
                            disabled
                            size="small"
                            style={{ fontSize: '10px' }}
                            dropdownStyle={{ fontSize: '10px' }}
                        />
                    </Form.Item>
                </Col>
            )}
            
            <Col xs={24} sm={12} md={6} lg={2} xl={2}>
                <Form.Item
                    label={<span style={{ fontSize: '10px', fontWeight: 500 }}>Condition</span>}
                    name={`condition_product_${productId}`}
                    style={{ marginBottom: '12px' }}
                    rules={[{ required: true, message: 'Please select condition' }]}
                >
                    <Select placeholder="Condition" size="small" style={{ fontSize: '10px' }} dropdownStyle={{ fontSize: '10px' }}>
                        <Option value="New">New</Option>
                        <Option value="Refurbished">Refurbished</Option>
                        <Option value="Used">Used</Option>
                    </Select>
                </Form.Item>
            </Col>

            {/* Dynamic Fields - All fields from full schema (common + category-specific) */}
            {product.finalCategoryId && product.categoryFormSchema.length > 0 && 
                product.categoryFormSchema.map((field, index) => {
                    // Handle IMEI field specially for Mobile category
                    if (field.field_id === 'mobile_imei' && isMobileCategoryForProduct(productIndex)) {
                        return product.imeiFields.map((imeiField, imeiIndex) => (
                            <Col key={`${field.field_id}_${imeiField.id}_product_${productId}`} xs={24} sm={12} md={6} lg={2} xl={2}>
                                <Form.Item
                                    label={
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 500 }}>
                                                IMEI {imeiField.id}
                                            </span>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {imeiIndex === product.imeiFields.length - 1 && (
                                                    <PlusCircleOutlined 
                                                        style={{ 
                                                            fontSize: '10px', 
                                                            color: '#52c41a',
                                                            cursor: 'pointer',
                                                            padding: '2px'
                                                        }}
                                                        onClick={() => addImeiField(productIndex)}
                                                        title="Add IMEI field"
                                                    />
                                                )}
                                                {product.imeiFields.length > 1 && (
                                                    <MinusCircleOutlined 
                                                        style={{ 
                                                            fontSize: '10px', 
                                                            color: '#ff4d4f',
                                                            cursor: 'pointer',
                                                            padding: '2px'
                                                        }}
                                                        onClick={() => removeImeiField(productIndex, imeiField.id)}
                                                        title="Remove IMEI field"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    }
                                    name={`mobile_imei_${imeiField.id}_product_${productId}`}
                                    style={{ marginBottom: '12px' }}
                                    rules={[
                                        ...(field.is_required && imeiIndex === 0 ? [{ required: true, message: 'Please enter at least one IMEI number' }] : []),
                                        {
                                            pattern: /^\d{15}$/,
                                            message: 'IMEI must be 15 digits'
                                        }
                                    ]}
                                >
                                    <Input 
                                        placeholder={`IMEI ${imeiField.id} (15 digits)`}
                                        size="small"
                                        style={{ fontSize: '10px' }}
                                        maxLength={15}
                                        onChange={(e) => updateImeiValue(productIndex, imeiField.id, e.target.value)}
                                    />
                                </Form.Item>
                            </Col>
                        ));
                    }
                    
                    // Handle other fields normally
                    return (
                        <Col key={`${field.field_id}_product_${productId}`} xs={24} sm={12} md={6} lg={2} xl={2}>
                            <Form.Item
                                label={<span style={{ fontSize: '10px', fontWeight: 500 }}>{field.label}</span>}
                                name={`${field.field_id}_product_${productId}`}
                                style={{ marginBottom: '12px' }}
                                rules={[
                                    ...(field.validation?.required || field.is_required ? [{ required: true, message: `Please enter ${field.label.toLowerCase()}` }] : []),
                                    ...(field.type === 'number' ? [{ type: 'number', message: 'Please enter a valid number' }] : [])
                                ]}
                            >
                                {field.type === 'text' && (
                                    <Input 
                                        placeholder={field.label}
                                        size="small"
                                        style={{ fontSize: '10px' }}
                                    />
                                )}
                                {field.type === 'number' && (
                                    <InputNumber 
                                        placeholder={field.label}
                                        style={{ width: '100%', fontSize: '10px' }}
                                        min={field.validation?.min || 0}
                                        max={field.validation?.max}
                                        size="small"
                                    />
                                )}
                                {(field.type === 'dropdown' || field.type === 'combobox') && (
                                    <Select 
                                        placeholder={field.label}
                                        mode={field.type === 'combobox' ? 'tags' : undefined}
                                        allowClear
                                        size="small"
                                        style={{ fontSize: '10px' }}
                                        dropdownStyle={{ fontSize: '10px' }}
                                    >
                                        {field.options && field.options.map(option => (
                                            <Option 
                                                key={typeof option === 'string' ? option : option.value} 
                                                value={typeof option === 'string' ? option : option.value}
                                            >
                                                {typeof option === 'string' ? option : option.label}
                                            </Option>
                                        ))}
                                    </Select>
                                )}
                                {field.type === 'boolean' && (
                                    <Switch 
                                        checkedChildren="Yes" 
                                        unCheckedChildren="No" 
                                        size="small"
                                        defaultChecked={field.default_value}
                                    />
                                )}
                            </Form.Item>
                        </Col>
                    );
                }).flat() // Flatten array since IMEI fields return arrays
            }
            
            {/* Hidden form field for final category ID */}
            <Form.Item name={`categoryId_product_${productId}`} style={{ display: 'none' }}>
                <Input />
            </Form.Item>

            {/* Loading state for category schema */}
            {loadingCategorySchema && (
                <Col xs={24}>
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        <Text type="secondary">Loading category fields...</Text>
                    </div>
                </Col>
            )}
        </Row>
    );
};

const AddProduct = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // Multi-product state
    const [products, setProducts] = useState([{
        id: Date.now(),
        categoryLevels: [],
        selectedCategoryPath: [],
        finalCategoryId: null,
        categoryFormSchema: [],
        imeiFields: [{ id: 1, value: '' }]
    }]);
    const [activeProductTab, setActiveProductTab] = useState('1');

    // Distributor state
    const [distributorOptions, setDistributorOptions] = useState([]);
    const [distributorSearchValue, setDistributorSearchValue] = useState('');
    const [selectedDistributor, setSelectedDistributor] = useState(null);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [loadingCategorySchema, setLoadingCategorySchema] = useState(false);

    useEffect(() => {
        // Initialize the first product with categories
        fetchTopLevelCategories();
    }, []);

    // Multi-product management functions
    const addProduct = () => {
        const newProduct = {
            id: Date.now(),
            categoryLevels: [],
            selectedCategoryPath: [],
            finalCategoryId: null,
            categoryFormSchema: [],
            imeiFields: [{ id: 1, value: '' }]
        };
        setProducts([...products, newProduct]);
        setActiveProductTab(newProduct.id.toString());
        
        // Initialize category levels for new product
        fetchTopLevelCategoriesForProduct(products.length);
    };

    const removeProduct = (productId) => {
        if (products.length <= 1) return;
        
        const filteredProducts = products.filter(p => p.id !== parseInt(productId));
        setProducts(filteredProducts);
        
        // Switch to first available tab
        if (activeProductTab === productId && filteredProducts.length > 0) {
            setActiveProductTab(filteredProducts[0].id.toString());
        }
    };

    // Category management for individual products
    const fetchTopLevelCategories = async () => {
        try {
            const response = await api.get('/categories');
            const topLevelCategories = response.data.filter(cat => !cat.parentId);
            
            // Update first product
            setProducts(prev => prev.map((product, index) => 
                index === 0 ? { ...product, categoryLevels: [topLevelCategories] } : product
            ));
        } catch (error) {
            console.error('Error fetching categories:', error);
            message.error('Failed to load categories');
        }
    };

    const fetchTopLevelCategoriesForProduct = async (productIndex) => {
        try {
            const response = await api.get('/categories');
            const topLevelCategories = response.data.filter(cat => !cat.parentId);
            
            setProducts(prev => prev.map((product, index) => 
                index === productIndex ? { ...product, categoryLevels: [topLevelCategories] } : product
            ));
        } catch (error) {
            console.error('Error fetching categories:', error);
            message.error('Failed to load categories for new product');
        }
    };

    const handleCategorySelection = async (categoryId, levelIndex, productIndex) => {
        setLoadingCategorySchema(true);
        
        try {
            setProducts(prev => prev.map((product, index) => {
                if (index !== productIndex) return product;
                
                const newSelectedPath = [...product.selectedCategoryPath];
                newSelectedPath[levelIndex] = categoryId;
                newSelectedPath.splice(levelIndex + 1);
                
                const newCategoryLevels = [...product.categoryLevels];
                newCategoryLevels.splice(levelIndex + 1);
                
                return {
                    ...product,
                    selectedCategoryPath: newSelectedPath,
                    categoryLevels: newCategoryLevels,
                    finalCategoryId: null,
                    categoryFormSchema: []
                };
            }));

            // Check if this category has children
            const childrenResponse = await api.get(`/categories?parentId=${categoryId}`);
            const children = childrenResponse.data;

            if (children.length > 0) {
                // Has children, add next level
                setProducts(prev => prev.map((product, index) => {
                    if (index !== productIndex) return product;
                    
                    const newCategoryLevels = [...product.categoryLevels];
                    newCategoryLevels[levelIndex + 1] = children;
                    
                    return { ...product, categoryLevels: newCategoryLevels };
                }));
            } else {
                // No children, this is final category
                setProducts(prev => prev.map((product, index) => {
                    if (index !== productIndex) return product;
                    
                    return { ...product, finalCategoryId: categoryId };
                }));

                // Set the category ID in form for this product
                const productId = products[productIndex].id;
                form.setFieldsValue({ [`categoryId_product_${productId}`]: categoryId });
                
                // Fetch category-specific form schema
                await fetchCategoryFormSchema(categoryId, productIndex);
            }
        } catch (error) {
            console.error('Error handling category selection:', error);
            message.error('Failed to load category details');
        } finally {
            setLoadingCategorySchema(false);
        }
    };

    const fetchCategoryFormSchema = async (categoryId, productIndex) => {
        try {
            const response = await api.get(`/categories/${categoryId}/form-schema`);
            
            setProducts(prev => prev.map((product, index) => 
                index === productIndex ? { ...product, categoryFormSchema: response.data } : product
            ));
        } catch (error) {
            console.error('Error fetching form schema:', error);
            message.error('Failed to load category form fields');
        }
    };

    // IMEI field management for products
    const isMobileCategoryForProduct = (productIndex) => {
        const product = products[productIndex];
        return product.categoryFormSchema.some(field => field.field_id === 'mobile_imei');
    };

    const addImeiField = (productIndex) => {
        setProducts(prev => prev.map((product, index) => {
            if (index !== productIndex) return product;
            
            const newImeiFields = [...product.imeiFields];
            const newId = Math.max(...newImeiFields.map(f => f.id)) + 1;
            newImeiFields.push({ id: newId, value: '' });
            
            return { ...product, imeiFields: newImeiFields };
        }));
    };

    const removeImeiField = (productIndex, imeiId) => {
        setProducts(prev => prev.map((product, index) => {
            if (index !== productIndex) return product;
            
            if (product.imeiFields.length <= 1) return product;
            
            const newImeiFields = product.imeiFields.filter(field => field.id !== imeiId);
            return { ...product, imeiFields: newImeiFields };
        }));
    };

    const updateImeiValue = (productIndex, imeiId, value) => {
        setProducts(prev => prev.map((product, index) => {
            if (index !== productIndex) return product;
            
            const newImeiFields = product.imeiFields.map(field => 
                field.id === imeiId ? { ...field, value } : field
            );
            
            return { ...product, imeiFields: newImeiFields };
        }));
    };

    // Distributor search functions
    const handleDistributorSearch = async (value) => {
        setDistributorSearchValue(value);
        
        if (value.length >= 3) {
            try {
                const response = await api.get(`/distributors?search=${encodeURIComponent(value)}&limit=10`);
                const options = response.data.map(distributor => ({
                    value: distributor._id,
                    label: `${distributor.name} | ${distributor.gstNumber || 'No GST'} | ${distributor.phone || 'No Phone'}`,
                    distributor: distributor
                }));
                setDistributorOptions(options);
            } catch (error) {
                console.error('Error searching distributors:', error);
                message.error('Failed to search distributors');
            }
        } else {
            setDistributorOptions([]);
        }
    };

    const handleDistributorSelect = (value, option) => {
        setSelectedDistributor(option.distributor);
        setDistributorSearchValue(option.label);
        form.setFieldsValue({ distributorId: value });
    };

    // Form submission
    const handleSubmit = async (values) => {
        setLoading(true);
        
        try {
            // Create an array to store all product creation promises
            const productPromises = products.map(async (product) => {
                const productId = product.id;
                
                // Collect all form values for this product
                const productData = {
                    supplierId: values.distributorId,
                    categoryId: values[`categoryId_product_${productId}`],
                    condition: values[`condition_product_${productId}`]
                };

                // Add all dynamic fields for this product
                Object.keys(values).forEach(key => {
                    if (key.endsWith(`_product_${productId}`) && 
                        !key.startsWith('condition_') && 
                        !key.startsWith('categoryId_')) {
                        
                        const fieldName = key.replace(`_product_${productId}`, '');
                        productData[fieldName] = values[key];
                    }
                });

                // Handle IMEI fields specially
                if (isMobileCategoryForProduct(products.findIndex(p => p.id === product.id))) {
                    const imeiValues = [];
                    product.imeiFields.forEach(imeiField => {
                        const imeiValue = values[`mobile_imei_${imeiField.id}_product_${productId}`];
                        if (imeiValue && imeiValue.trim()) {
                            imeiValues.push(imeiValue.trim());
                        }
                    });
                    if (imeiValues.length > 0) {
                        productData.mobile_imei = imeiValues;
                    }
                }

                // Create the product
                return await api.post('/products', productData);
            });

            // Wait for all products to be created
            const responses = await Promise.all(productPromises);
            
            message.success(`Successfully created ${responses.length} product(s)!`);
            navigate('/dashboard');
            
        } catch (error) {
            console.error('Error creating products:', error);
            
            if (error.response?.status === 400 && error.response?.data?.message) {
                message.error(`Validation Error: ${error.response.data.message}`);
            } else if (error.response?.status === 404) {
                message.error('Distributor not found. Please select a valid distributor.');
            } else {
                message.error('Failed to create products. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            padding: '20px', 
            backgroundColor: '#f5f5f5', 
            minHeight: '100vh' 
        }}>
            <Breadcrumb style={{ marginBottom: '20px' }}>
                <Breadcrumb.Item>
                    <Link to="/dashboard">Dashboard</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>Add Product</Breadcrumb.Item>
            </Breadcrumb>

            <Card
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e1e5e9'
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark={false}
                >
                    {/* Distributor Information Section */}
                    <Card
                        title="Distributor Information"
                        style={{ marginBottom: 24 }}
                        bodyStyle={{ padding: '16px' }}
                        size="small"
                    >
                        <Row gutter={12}>
                            {/* Distributor Search Field */}
                            <Col xs={24} sm={12} md={6} lg={2} xl={2}>
                                {/* Hidden field to store the actual distributorId for form submission */}
                                <Form.Item
                                    name="distributorId"
                                    rules={[{ required: true, message: 'Please select distributor' }]}
                                    style={{ display: 'none' }}
                                >
                                    <Input />
                                </Form.Item>
                                
                                {/* Visual AutoComplete component (not connected to form) */}
                                <Form.Item
                                    label={<span style={{ fontSize: '10px', fontWeight: 500 }}>Distributor Search <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                    validateStatus={form.getFieldError('distributorId').length ? 'error' : ''}
                                    help={form.getFieldError('distributorId')[0]}
                                    style={{ marginBottom: '12px' }}
                                >
                                    <AutoComplete
                                        style={{ width: '100%' }}
                                        options={distributorOptions}
                                        onSearch={handleDistributorSearch}
                                        onSelect={handleDistributorSelect}
                                        value={distributorSearchValue}
                                        placeholder="Type 3+ chars to search..."
                                        allowClear
                                        size="small"
                                        dropdownStyle={{ fontSize: '10px' }}
                                        className="autocomplete-small-font"
                                        onClear={() => {
                                            setDistributorSearchValue('');
                                            setDistributorOptions([]);
                                            setSelectedDistributor(null);
                                            form.setFieldsValue({ distributorId: undefined });
                                        }}
                                    />
                                </Form.Item>
                            </Col>

                            {/* Display selected distributor details in compact grid */}
                            {selectedDistributor && (
                                <>
                                    <Col xs={24} sm={12} md={6} lg={2} xl={2}>
                                        <Form.Item 
                                            label={<span style={{ fontSize: '10px', fontWeight: 500 }}>Name</span>}
                                            style={{ marginBottom: '12px' }}
                                        >
                                            <Input 
                                                value={selectedDistributor.name ? selectedDistributor.name.split(' | ')[0] : 'N/A'} 
                                                readOnly 
                                                size="small" 
                                                style={{ fontSize: '10px' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={6} lg={2} xl={2}>
                                        <Form.Item 
                                            label={<span style={{ fontSize: '10px', fontWeight: 500 }}>GST</span>}
                                            style={{ marginBottom: '12px' }}
                                        >
                                            <Input 
                                                value={selectedDistributor.gstNumber || 'N/A'} 
                                                readOnly 
                                                size="small" 
                                                style={{ fontSize: '10px' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={6} lg={2} xl={2}>
                                        <Form.Item 
                                            label={<span style={{ fontSize: '10px', fontWeight: 500 }}>PAN</span>}
                                            style={{ marginBottom: '12px' }}
                                        >
                                            <Input 
                                                value={selectedDistributor.panNumber || 'N/A'} 
                                                readOnly 
                                                size="small" 
                                                style={{ fontSize: '10px' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={6} lg={2} xl={2}>
                                        <Form.Item 
                                            label={<span style={{ fontSize: '10px', fontWeight: 500 }}>Phone</span>}
                                            style={{ marginBottom: '12px' }}
                                        >
                                            <Input 
                                                value={selectedDistributor.phone || 'N/A'} 
                                                readOnly 
                                                size="small" 
                                                style={{ fontSize: '10px' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col xs={24} sm={12} md={6} lg={2} xl={2}>
                                        <Form.Item 
                                            label={<span style={{ fontSize: '10px', fontWeight: 500 }}>Address</span>}
                                            style={{ marginBottom: '12px' }}
                                        >
                                            <Input 
                                                value={selectedDistributor.address || 'N/A'} 
                                                readOnly 
                                                size="small" 
                                                style={{ fontSize: '10px' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </>
                            )}
                        </Row>
                    </Card>

                    {/* Multi-Product Tabs Section */}
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Product Information ({products.length} products)</span>
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={addProduct}
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                >
                                    Add Product
                                </Button>
                            </div>
                        }
                        style={{ marginBottom: 24 }}
                        bodyStyle={{ padding: '16px' }}
                        size="small"
                    >
                        <Tabs
                            type="editable-card"
                            activeKey={activeProductTab}
                            onChange={setActiveProductTab}
                            onEdit={(targetKey, action) => {
                                if (action === 'remove') {
                                    removeProduct(targetKey);
                                }
                            }}
                            hideAdd
                        >
                            {products.map((product) => (
                                <TabPane
                                    tab={`Product ${product.id}`}
                                    key={product.id}
                                    closable={products.length > 1}
                                >
                                    <ProductFormFields
                                        productIndex={products.findIndex(p => p.id === product.id)}
                                        product={product}
                                        form={form}
                                        handleCategorySelection={handleCategorySelection}
                                        loadingCategorySchema={loadingCategorySchema}
                                        isMobileCategoryForProduct={isMobileCategoryForProduct}
                                        addImeiField={addImeiField}
                                        removeImeiField={removeImeiField}
                                        updateImeiValue={updateImeiValue}
                                    />
                                </TabPane>
                            ))}
                        </Tabs>
                    </Card>

                    {/* Form Actions */}
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
                            <Button
                                type="default"
                                size="large"
                                onClick={() => {
                                    form.resetFields();
                                    setDistributorSearchValue('');
                                    setDistributorOptions([]);
                                    setSelectedDistributor(null);
                                    // Reset products to single initial product
                                    setProducts([{
                                        id: Date.now(),
                                        categoryLevels: [],
                                        selectedCategoryPath: [],
                                        finalCategoryId: null,
                                        categoryFormSchema: [],
                                        imeiFields: [{ id: 1, value: '' }]
                                    }]);
                                    setActiveProductTab(products[0]?.id?.toString() || '1');
                                    // Reload top-level categories for first product
                                    fetchTopLevelCategories();
                                }}
                            >
                                Reset Form
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={loading}
                                icon={<SaveOutlined />}
                                style={{
                                    backgroundColor: '#fa8c16',
                                    borderColor: '#fa8c16',
                                    minWidth: '150px'
                                }}
                            >
                                Save All Products ({products.length})
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default AddProduct;
