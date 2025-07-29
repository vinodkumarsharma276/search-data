import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Form,
    Input,
    Button,
    Card,
    Row,
    Col,
    message,
    Breadcrumb,
    Typography,
    Space,
    Select,
    InputNumber,
    Upload,
    Switch,
    AutoComplete,
    Divider
} from 'antd';

// Custom styles for error messages and form validation
const customStyles = `
    .ant-form-item-explain-error {
        font-size: 8px !important;
        line-height: 1.2 !important;
        margin-top: 2px !important;
    }
    
    .ant-form-item-has-error .ant-input,
    .ant-form-item-has-error .ant-select-selector,
    .ant-form-item-has-error .ant-input-number {
        border-color: #ff4d4f !important;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
    }
    
    .ant-form-item-has-error .ant-input:focus,
    .ant-form-item-has-error .ant-select-focused .ant-select-selector,
    .ant-form-item-has-error .ant-input-number:focus {
        border-color: #ff4d4f !important;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
    }
    
    /* Ensure consistent field heights */
    .ant-input-sm,
    .ant-select-sm .ant-select-selector,
    .ant-input-number-sm,
    .ant-input-number-sm .ant-input-number-input {
        height: 24px !important;
        min-height: 24px !important;
        line-height: 22px !important;
        font-size: 10px !important;
    }
    
    .ant-select-sm .ant-select-selection-item {
        line-height: 22px !important;
        font-size: 10px !important;
    }
    
    .ant-select-sm .ant-select-selection-placeholder {
        line-height: 22px !important;
        font-size: 10px !important;
    }
    
    .ant-input-number-sm .ant-input-number-input {
        padding: 0 7px !important;
    }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = customStyles;
    if (!document.head.querySelector('[data-form-styles]')) {
        styleSheet.setAttribute('data-form-styles', 'true');
        document.head.appendChild(styleSheet);
    }
}
import {
    SaveOutlined,
    ArrowLeftOutlined,
    AppstoreAddOutlined,
    DollarOutlined,
    TagOutlined,
    UploadOutlined,
    BarcodeOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddProduct = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [distributorOptions, setDistributorOptions] = useState([]);
    const [distributorSearchValue, setDistributorSearchValue] = useState('');
    const [selectedDistributor, setSelectedDistributor] = useState(null);
    const [loadingCategorySchema, setLoadingCategorySchema] = useState(false);
    
    // Multi-product state
    const [productCount, setProductCount] = useState(1);
    const [products, setProducts] = useState([{
        id: 1,
        categoryLevels: [],
        selectedCategoryPath: [],
        finalCategoryId: null,
        categoryFormSchema: [],
        imeiFields: [{ id: 1, value: '' }]
    }]);
    
    // Get product-specific state
    const getProductState = (productId) => {
        return products.find(p => p.id === productId) || products[0];
    };
    
    // Update product-specific state
    const updateProductState = (productId, updates) => {
        setProducts(prevProducts => 
            prevProducts.map(product => 
                product.id === productId 
                    ? { ...product, ...updates }
                    : product
            )
        );
    };

    useEffect(() => {
        fetchDropdownData();
    }, []);

    // Watch for distributors loading to sync any existing form values
    useEffect(() => {
        if (distributors.length > 0) {
            const distributorId = form.getFieldValue('distributorId');
            if (distributorId) {
                const selectedDistributor = distributors.find(d => d._id === distributorId);
                if (selectedDistributor) {
                    const displayText = `${selectedDistributor.name} | ${selectedDistributor.gstNumber || 'No GST'}`;
                    setDistributorSearchValue(displayText);
                }
            }
        }
    }, [distributors]);

    const fetchDropdownData = async () => {
        try {
            const response = await apiService.dropdowns.getAll();
            if (response.data.success) {
                const data = response.data.data;
                setBrands(data.brands || []);
            }

            // Fetch distributors separately
            const distributorsResponse = await apiService.distributors.getAll();
            if (distributorsResponse.data.success) {
                setDistributors(distributorsResponse.data.distributors || []);
                console.log('✅ Loaded distributors:', distributorsResponse.data.distributors?.length);
            }

            // Fetch top-level categories for hierarchical selection
            await fetchTopLevelCategories();
        } catch (error) {
            console.error('❌ Error fetching dropdown data:', error);
        }
    };

    // Fetch top-level categories
    const fetchTopLevelCategories = async () => {
        try {
            const response = await apiService.categories.getTopLevel();
            if (response.data.success) {
                // Update the first product's category levels
                updateProductState(1, { categoryLevels: [response.data.data] });
                console.log('✅ Loaded top-level categories:', response.data.data?.length);
            }
        } catch (error) {
            console.error('❌ Error fetching top-level categories:', error);
        }
    };

    // Handle distributor search for autocomplete
    const handleDistributorSearch = useCallback((value) => {
        console.log('🔍 Distributor search triggered with value:', value);
        console.log('📋 Available distributors:', distributors.length);
        setDistributorSearchValue(value);
        
        if (value.length >= 3) {
            const searchTerm = value.toLowerCase();
            const filtered = distributors.filter(distributor => {
                return (
                    (distributor.name && distributor.name.toLowerCase().includes(searchTerm)) ||
                    (distributor.gstNumber && distributor.gstNumber.toLowerCase().includes(searchTerm)) ||
                    (distributor.panNumber && distributor.panNumber.toLowerCase().includes(searchTerm)) ||
                    (distributor.primaryPhone && distributor.primaryPhone.includes(searchTerm)) ||
                    (distributor.address && distributor.address.toLowerCase().includes(searchTerm))
                );
            }).slice(0, 10);

            console.log('✅ Filtered distributors:', filtered.length);
            
            const options = filtered.map(distributor => ({
                value: `${distributor.name} | ${distributor.gstNumber || 'No GST'}`,
                label: `${distributor.name} | ${distributor.gstNumber || 'No GST'}`,
                distributor: distributor
            }));
            
            console.log('🎯 Autocomplete options:', options);
            setDistributorOptions(options);
        } else {
            setDistributorOptions([]);
        }
    }, [distributors]);

    // Handle distributor selection
    const handleDistributorSelect = useCallback((value, option) => {
        console.log('🎯 Distributor selected:', { value, option });
        if (option && option.distributor) {
            const distributor = option.distributor;
            setSelectedDistributor(distributor);
            setDistributorSearchValue(value); // Set the search box text to the selected display value
            form.setFieldsValue({ distributorId: distributor._id }); // Set the hidden form field's value to the ID
            setDistributorOptions([]);
            form.validateFields(['distributorId']); // Trigger validation to clear any error message
            console.log('✅ Form field set to:', distributor._id);
            console.log('✅ Display text set to:', value);
        }
    }, [form]);

    // Handle hierarchical category selection
    const handleCategorySelection = async (categoryId, levelIndex, productId = 1) => {
        console.log('🎯 Category selected at level', levelIndex, ':', categoryId, 'for product', productId);
        
        const currentProduct = getProductState(productId);
        
        // Update selected category path up to current level for this product
        const newPath = currentProduct.selectedCategoryPath.slice(0, levelIndex);
        newPath[levelIndex] = categoryId;
        
        // Clear category levels after current level for this product
        const newLevels = currentProduct.categoryLevels.slice(0, levelIndex + 1);
        
        try {
            // Get the selected category details
            const categoryResponse = await apiService.categories.getById(categoryId);
            if (categoryResponse.data.success) {
                const category = categoryResponse.data.data;
                
                if (category.is_leaf) {
                    // This is a leaf category - load form schema
                    console.log('🍃 Leaf category selected, loading form schema for product', productId);
                    
                    const schemaResponse = await apiService.categories.getFormSchema(categoryId);
                    const schema = schemaResponse.data.success ? schemaResponse.data.data || [] : [];
                    
                    // Update this product's state
                    updateProductState(productId, {
                        selectedCategoryPath: newPath,
                        categoryLevels: newLevels,
                        finalCategoryId: categoryId,
                        categoryFormSchema: schema
                    });
                    
                    // Update form field for this product
                    form.setFieldsValue({ [`categoryId_product_${productId}`]: categoryId });
                } else {
                    // Not a leaf - fetch children for next level
                    console.log('🌿 Non-leaf category, fetching children for product', productId);
                    
                    const childrenResponse = await apiService.categories.getChildren(categoryId);
                    if (childrenResponse.data.success && childrenResponse.data.data.length > 0) {
                        // Update this product's state
                        updateProductState(productId, {
                            selectedCategoryPath: newPath,
                            categoryLevels: [...newLevels, childrenResponse.data.data],
                            finalCategoryId: null,
                            categoryFormSchema: []
                        });
                        
                        console.log('✅ Loaded children for next level:', childrenResponse.data.data.length, 'for product', productId);
                    }
                    
                    // Clear form field as selection is not complete
                    form.setFieldsValue({ [`categoryId_product_${productId}`]: undefined });
                }
            }
        } catch (error) {
            console.error('❌ Error handling category selection for product', productId, ':', error);
        }
    };


    // Check if current category is Mobile to show dynamic IMEI fields
    const isMobileCategory = (productId = 1) => {
        const currentProduct = getProductState(productId);
        return currentProduct.finalCategoryId && currentProduct.categoryFormSchema.some(field => field.field_id === 'mobile_imei');
    };

    // Dynamic IMEI field management for specific product
    const addImeiField = (productId = 1) => {
        const currentProduct = getProductState(productId);
        const newId = Math.max(...currentProduct.imeiFields.map(f => f.id)) + 1;
        const newImeiFields = [...currentProduct.imeiFields, { id: newId, value: '' }];
        updateProductState(productId, { imeiFields: newImeiFields });
    };

    const removeImeiField = (idToRemove, productId = 1) => {
        const currentProduct = getProductState(productId);
        if (currentProduct.imeiFields.length > 1) {
            const newImeiFields = currentProduct.imeiFields.filter(field => field.id !== idToRemove);
            updateProductState(productId, { imeiFields: newImeiFields });
            // Remove the field value from form
            form.setFieldsValue({ [`mobile_imei_${idToRemove}_product_${productId}`]: undefined });
        }
    };

    const updateImeiValue = (id, value, productId = 1) => {
        const currentProduct = getProductState(productId);
        const newImeiFields = currentProduct.imeiFields.map(field => 
            field.id === id ? { ...field, value } : field
        );
        updateProductState(productId, { imeiFields: newImeiFields });
    };

    // Add another product function
    const addAnotherProduct = () => {
        const newProductId = productCount + 1;
        const firstProduct = getProductState(1);
        
        const newProduct = {
            id: newProductId,
            categoryLevels: [...firstProduct.categoryLevels], // Copy from first product
            selectedCategoryPath: [...firstProduct.selectedCategoryPath], // Copy from first product
            finalCategoryId: firstProduct.finalCategoryId, // Copy from first product
            categoryFormSchema: [...firstProduct.categoryFormSchema], // Copy from first product
            imeiFields: [...firstProduct.imeiFields] // Copy from first product
        };
        
        setProducts([...products, newProduct]);
        setProductCount(newProductId);
        
        // Get current form values to copy to new product
        const currentValues = form.getFieldsValue();
        const newFieldValues = {};
        
        // Copy condition field from first product
        if (currentValues[`condition_product_1`]) {
            newFieldValues[`condition_product_${newProductId}`] = currentValues[`condition_product_1`];
        }
        
        // Copy category ID
        if (currentValues[`categoryId_product_1`]) {
            newFieldValues[`categoryId_product_${newProductId}`] = currentValues[`categoryId_product_1`];
        }
        
        // Copy all dynamic fields from the first product to new product
        Object.keys(currentValues).forEach(key => {
            if (key.endsWith('_product_1') && !key.startsWith('condition_') && !key.startsWith('categoryId_')) {
                const baseFieldName = key.replace('_product_1', '');
                const newFieldName = `${baseFieldName}_product_${newProductId}`;
                newFieldValues[newFieldName] = currentValues[key];
            }
            
            // Copy IMEI fields
            if (key.startsWith('mobile_imei_') && key.endsWith('_product_1')) {
                const imeiPart = key.replace('_product_1', '');
                const newImeiField = `${imeiPart}_product_${newProductId}`;
                newFieldValues[newImeiField] = currentValues[key];
            }
        });
        
        // Set the copied values to form
        form.setFieldsValue(newFieldValues);
        
        console.log('✅ Added new product with copied values:', newFieldValues);
    };

    const handleSubmit = async (values) => {
        console.log('📦 Submitting product data:', values);
        console.log('🔍 Form values keys:', Object.keys(values));
        console.log('🔍 Product count:', productCount);
        
        // Validate distributor selection
        if (!values.distributorId) {
            message.error('Please select a distributor');
            return;
        }
        
        setLoading(true);

        try {
            // Convert form values to array of clean product objects
            const productsArray = [];
            
            // Extract and organize data by product
            for (let i = 1; i <= productCount; i++) {
                const productData = {
                    supplierId: values.distributorId
                };
                
                // Extract all fields for this product
                Object.keys(values).forEach(key => {
                    if (key.endsWith(`_product_${i}`)) {
                        // Remove the _product_X suffix to get clean field name
                        const cleanFieldName = key.replace(`_product_${i}`, '');
                        productData[cleanFieldName] = values[key];
                    }
                });
                
                // Also handle IMEI fields (mobile_imei_1_product_1 -> mobile_imei)
                Object.keys(values).forEach(key => {
                    if (key.includes(`_product_${i}`) && key.includes('_imei_')) {
                        // Clean IMEI field name: mobile_imei_1_product_1 -> mobile_imei
                        const cleanFieldName = key.replace(/_\d+_product_\d+$/, '');
                        productData[cleanFieldName] = values[key];
                    }
                });
                
                console.log(`🔍 Product ${i} extracted data:`, productData);
                console.log(`🔍 Product ${i} categoryId check:`, productData.categoryId);
                
                // Only add product if it has meaningful data (has a category)
                // Check for various possible category field names
                const hasCategoryData = productData.categoryId || 
                                      productData.category || 
                                      productData.selected_category_id ||
                                      Object.keys(productData).some(key => key.includes('category'));
                
                if (hasCategoryData) {
                    productsArray.push(productData);
                    console.log(`✅ Product ${i} added to array:`, productData);
                } else {
                    console.log(`⚠️ Product ${i} skipped - no category data found`);
                }
            }
            
            if (productsArray.length === 0) {
                message.error('Please select a category for at least one product');
                return;
            }
            
            console.log(`📤 Sending ${productsArray.length} products to backend:`, productsArray);
            
            // Send as array in the products field
            const requestData = {
                products: productsArray
            };
            
            const response = await apiService.products.create(requestData);
            
            if (response.data.success) {
                const count = Array.isArray(response.data.data) ? response.data.data.length : 1;
                message.success(`${count} product(s) added successfully!`);
                console.log('✅ Products saved:', response.data);
                form.resetFields();
                // Clear all states
                setDistributorSearchValue('');
                setDistributorOptions([]);
                setSelectedDistributor(null);
                // Reset products to single product
                setProducts([{
                    id: 1,
                    categoryLevels: [],
                    selectedCategoryPath: [],
                    finalCategoryId: null,
                    categoryFormSchema: [],
                    imeiFields: [{ id: 1, value: '' }]
                }]);
                setProductCount(1);
                // Reload top-level categories
                await fetchTopLevelCategories();
            } else {
                message.error(response.data.message || 'Failed to add product(s)');
                console.error('❌ Error saving products:', response.data);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to add product(s). Please try again.';
            message.error(errorMessage);
            console.error('❌ API error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <Breadcrumb style={{ marginBottom: '24px' }}>
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
                            size="default"
                        >
                            <Row gutter={16}>
                                {/* Distributor Search Field */}
                                <Col xs={24} sm={12} md={8} lg={6} xl={6}>
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
                                        label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Distributor Search <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                        validateStatus={form.getFieldError('distributorId').length ? 'error' : ''}
                                        help={form.getFieldError('distributorId')[0]}
                                        style={{ marginBottom: '16px' }}
                                    >
                                        <AutoComplete
                                            style={{ width: '100%' }}
                                            options={distributorOptions}
                                            onSearch={handleDistributorSearch}
                                            onSelect={handleDistributorSelect}
                                            value={distributorSearchValue}
                                            placeholder="Type 3+ chars to search..."
                                            allowClear
                                            size="large"
                                            dropdownStyle={{ fontSize: '14px' }}
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
                                        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                            <Form.Item 
                                                label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Name</span>}
                                                style={{ marginBottom: '16px' }}
                                            >
                                                <Input 
                                                    value={selectedDistributor.name ? selectedDistributor.name.split(' | ')[0] : 'N/A'} 
                                                    readOnly 
                                                    size="large" 
                                                    style={{ fontSize: '14px' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                            <Form.Item 
                                                label={<span style={{ fontSize: '12px', fontWeight: 500 }}>GST</span>}
                                                style={{ marginBottom: '16px' }}
                                            >
                                                <Input 
                                                    value={selectedDistributor.gstNumber || 'N/A'} 
                                                    readOnly 
                                                    size="large" 
                                                    style={{ fontSize: '14px' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                            <Form.Item 
                                                label={<span style={{ fontSize: '12px', fontWeight: 500 }}>PAN</span>}
                                                style={{ marginBottom: '16px' }}
                                            >
                                                <Input 
                                                    value={selectedDistributor.panNumber || 'N/A'} 
                                                    readOnly 
                                                    size="large" 
                                                    style={{ fontSize: '14px' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                            <Form.Item 
                                                label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Mobile</span>}
                                                style={{ marginBottom: '16px' }}
                                            >
                                                <Input 
                                                    value={selectedDistributor.primaryPhone || 'N/A'} 
                                                    readOnly 
                                                    size="large" 
                                                    style={{ fontSize: '14px' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                            <Form.Item 
                                                label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Address</span>}
                                                style={{ marginBottom: '16px' }}
                                            >
                                                <Input 
                                                    value={selectedDistributor.address || 'N/A'} 
                                                    readOnly 
                                                    size="large" 
                                                    style={{ fontSize: '14px' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Card>

                        {/* Product Details Section - All Fields Combined */}
                        <Card
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Product Details ({products.length} product{products.length > 1 ? 's' : ''})</span>
                                    <Button
                                        type="primary"
                                        size="default"
                                        icon={<PlusCircleOutlined />}
                                        onClick={addAnotherProduct}
                                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                    >
                                        Add Another Product
                                    </Button>
                                </div>
                            }
                            style={{ marginBottom: 24 }}
                            bodyStyle={{ padding: '16px' }}
                            size="default"
                        >
                            {/* Render each product */}
                            {products.map((product, productIndex) => (
                                <div key={product.id} style={{ marginBottom: productIndex < products.length - 1 ? '32px' : '0' }}>
                                    {productIndex > 0 && (
                                        <div style={{ 
                                            borderTop: '2px solid #e8e8e8', 
                                            margin: '24px 0', 
                                            paddingTop: '16px',
                                            position: 'relative'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-12px',
                                                left: '16px',
                                                backgroundColor: '#fff',
                                                padding: '0 8px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#666'
                                            }}>
                                                Product {product.id}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* All fields in compact layout with balanced responsive sizing */}
                                    <Row gutter={16}>
                                {/* Category Selection */}
                                {product.categoryLevels.length > 0 ? (
                                    product.categoryLevels.map((levelCategories, levelIndex) => (
                                        <Col key={levelIndex} xs={24} sm={12} md={8} lg={6} xl={6}>
                                            <Form.Item
                                                label={
                                                    <span style={{ fontSize: '12px', fontWeight: 500 }}>
                                                        {levelIndex === 0 ? 'Main Category' : levelIndex === 1 ? 'Sub Category' : `Category ${levelIndex + 1}`}
                                                    </span>
                                                }
                                                style={{ marginBottom: '16px' }}
                                            >
                                                <Select
                                                    placeholder={levelIndex === 0 ? 'Main' : 'Sub'}
                                                    value={product.selectedCategoryPath[levelIndex]}
                                                    onChange={(value) => handleCategorySelection(value, levelIndex, product.id)}
                                                    loading={loadingCategorySchema && levelIndex === product.categoryLevels.length - 1}
                                                    size="large"
                                                    style={{ fontSize: '14px' }}
                                                    dropdownStyle={{ fontSize: '14px' }}
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
                                    <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                                        <Form.Item
                                            label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Main Category</span>}
                                            style={{ marginBottom: '16px' }}
                                        >
                                            <Select
                                                placeholder="Loading..."
                                                disabled
                                                size="large"
                                                style={{ fontSize: '14px' }}
                                                dropdownStyle={{ fontSize: '14px' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                )}

                                {/* Dynamic Fields - All fields from full schema (common + category-specific) */}
                                {product.finalCategoryId && product.categoryFormSchema.length > 0 && 
                                    product.categoryFormSchema.map((field, index) => {
                                        // Handle IMEI field specially for Mobile category
                                        if (field.field_id === 'mobile_imei' && isMobileCategory(product.id)) {
                                            return product.imeiFields.map((imeiField, imeiIndex) => (
                                                <Col key={`${field.field_id}_${imeiField.id}_product_${product.id}`} xs={24} sm={12} md={8} lg={6} xl={6}>
                                                    <Form.Item
                                                        label={
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                                                                    IMEI {imeiField.id}
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                                    {imeiIndex === product.imeiFields.length - 1 && (
                                                                        <PlusCircleOutlined 
                                                                            style={{ 
                                                                                fontSize: '12px', 
                                                                                color: '#52c41a',
                                                                                cursor: 'pointer',
                                                                                padding: '2px'
                                                                            }}
                                                                            onClick={() => addImeiField(product.id)}
                                                                            title="Add IMEI field"
                                                                        />
                                                                    )}
                                                                    {product.imeiFields.length > 1 && (
                                                                        <MinusCircleOutlined 
                                                                            style={{ 
                                                                                fontSize: '12px', 
                                                                                color: '#ff4d4f',
                                                                                cursor: 'pointer',
                                                                                padding: '2px'
                                                                            }}
                                                                            onClick={() => removeImeiField(imeiField.id, product.id)}
                                                                            title="Remove IMEI field"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        }
                                                        name={`mobile_imei_${imeiField.id}_product_${product.id}`}
                                                        style={{ marginBottom: '16px' }}
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
                                                            size="large"
                                                            style={{ fontSize: '14px' }}
                                                            maxLength={15}
                                                            onChange={(e) => updateImeiValue(imeiField.id, e.target.value, product.id)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            ));
                                        }
                                        
                                        // Handle other fields normally
                                        return (
                                            <Col key={`${field.field_id}_product_${product.id}`} xs={24} sm={12} md={8} lg={6} xl={6}>
                                                <Form.Item
                                                    label={<span style={{ fontSize: '12px', fontWeight: 500 }}>{field.label}</span>}
                                                    name={`${field.field_id}_product_${product.id}`}
                                                    style={{ marginBottom: '16px' }}
                                                    rules={[
                                                        ...(field.validation?.required || field.is_required ? [{ required: true, message: `Please enter ${field.label.toLowerCase()}` }] : []),
                                                        ...(field.type === 'number' ? [{ type: 'number', message: 'Please enter a valid number' }] : [])
                                                    ]}
                                                >
                                                    {field.type === 'text' && (
                                                        <Input 
                                                            placeholder={field.label}
                                                            size="large"
                                                            style={{ fontSize: '14px' }}
                                                        />
                                                    )}
                                                    {field.type === 'number' && (
                                                        <InputNumber 
                                                            placeholder={field.label}
                                                            style={{ width: '100%', fontSize: '14px' }}
                                                            min={field.validation?.min || 0}
                                                            max={field.validation?.max}
                                                            size="large"
                                                        />
                                                    )}
                                                    {(field.type === 'dropdown' || field.type === 'combobox') && (
                                                        <Select 
                                                            placeholder={field.label}
                                                            mode={field.type === 'combobox' ? 'tags' : undefined}
                                                            allowClear
                                                            size="large"
                                                            style={{ fontSize: '14px' }}
                                                            dropdownStyle={{ fontSize: '14px' }}
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
                                                            size="default"
                                                            defaultChecked={field.default_value}
                                                        />
                                                    )}
                                                </Form.Item>
                                            </Col>
                                        );
                                    }).flat() // Flatten array since IMEI fields return arrays
                                }
                            </Row>
                                </div>
                            ))}
                            
                            {/* Hidden form field for final category ID for each product */}
                            {products.map(product => (
                                <Form.Item key={`categoryId_product_${product.id}`} name={`categoryId_product_${product.id}`} style={{ display: 'none' }}>
                                    <Input />
                                </Form.Item>
                            ))}

                            {/* Loading state for category schema */}
                            {loadingCategorySchema && (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                    <Text type="secondary">Loading category fields...</Text>
                                </div>
                            )}
                        </Card>

                        {/* Submit Button */}
                        <Form.Item style={{ marginTop: '32px', textAlign: 'center' }}>
                            <Space size="large">
                                <Button 
                                    type="default" 
                                    size="large"
                                    onClick={() => {
                                        form.resetFields();
                                        setDistributorSearchValue('');
                                        setDistributorOptions([]);
                                        setSelectedDistributor(null);
                                        // Reset products to single product
                                        setProducts([{
                                            id: 1,
                                            categoryLevels: [],
                                            selectedCategoryPath: [],
                                            finalCategoryId: null,
                                            categoryFormSchema: [],
                                            imeiFields: [{ id: 1, value: '' }]
                                        }]);
                                        setProductCount(1);
                                        // Reload top-level categories
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
                                    Save {products.length > 1 ? `All Products (${products.length})` : 'Product'}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
        </div>
    );
};

export default AddProduct;
