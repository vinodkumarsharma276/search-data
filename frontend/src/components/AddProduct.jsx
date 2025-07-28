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
    const [categoryLevels, setCategoryLevels] = useState([]); // Array of category levels for hierarchical selection
    const [selectedCategoryPath, setSelectedCategoryPath] = useState([]); // Track selected category path
    const [finalCategoryId, setFinalCategoryId] = useState(null); // Final leaf category ID
    const [categoryFormSchema, setCategoryFormSchema] = useState([]);
    const [loadingCategorySchema, setLoadingCategorySchema] = useState(false);
    const [imeiFields, setImeiFields] = useState([{ id: 1, value: '' }]); // Dynamic IMEI fields

    useEffect(() => {
        fetchDropdownData();
    }, []);

    // Reset IMEI fields when category changes
    useEffect(() => {
        if (!isMobileCategory()) {
            setImeiFields([{ id: 1, value: '' }]);
        }
    }, [finalCategoryId, categoryFormSchema]);

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
                setCategoryLevels([response.data.data]);
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
    const handleCategorySelection = async (categoryId, levelIndex) => {
        console.log('🎯 Category selected at level', levelIndex, ':', categoryId);
        
        // Update selected category path up to current level
        const newPath = selectedCategoryPath.slice(0, levelIndex);
        newPath[levelIndex] = categoryId;
        setSelectedCategoryPath(newPath);
        
        // Clear category levels after current level
        const newLevels = categoryLevels.slice(0, levelIndex + 1);
        setCategoryLevels(newLevels);
        
        try {
            // Get the selected category details
            const categoryResponse = await apiService.categories.getById(categoryId);
            if (categoryResponse.data.success) {
                const category = categoryResponse.data.data;
                
                if (category.is_leaf) {
                    // This is a leaf category - load form schema
                    console.log('� Leaf category selected, loading form schema...');
                    setFinalCategoryId(categoryId);
                    await loadCategoryFormSchema(categoryId);
                    
                    // Update form field
                    form.setFieldsValue({ categoryId: categoryId });
                } else {
                    // Not a leaf - fetch children for next level
                    console.log('🌿 Non-leaf category, fetching children...');
                    setFinalCategoryId(null);
                    setCategoryFormSchema([]);
                    
                    const childrenResponse = await apiService.categories.getChildren(categoryId);
                    if (childrenResponse.data.success && childrenResponse.data.data.length > 0) {
                        setCategoryLevels([...newLevels, childrenResponse.data.data]);
                        console.log('✅ Loaded children for next level:', childrenResponse.data.data.length);
                    }
                    
                    // Clear form field as selection is not complete
                    form.setFieldsValue({ categoryId: undefined });
                }
            }
        } catch (error) {
            console.error('❌ Error handling category selection:', error);
        }
    };

    // Load category form schema
    const loadCategoryFormSchema = async (categoryId) => {
        setLoadingCategorySchema(true);
        try {
            const response = await apiService.categories.getFormSchema(categoryId);
            console.log('📋 Category form schema response:', response.data);
            
            if (response.data.success) {
                setCategoryFormSchema(response.data.data || []);
                console.log('✅ Category form schema loaded:', response.data.data?.length, 'fields');
            } else {
                console.warn('⚠️ Failed to load category form schema:', response.data.message);
                setCategoryFormSchema([]);
            }
        } catch (error) {
            console.error('❌ Error fetching category form schema:', error);
            setCategoryFormSchema([]);
        } finally {
            setLoadingCategorySchema(false);
        }
    };

    // Dynamic IMEI field management
    const addImeiField = () => {
        const newId = Math.max(...imeiFields.map(f => f.id)) + 1;
        setImeiFields([...imeiFields, { id: newId, value: '' }]);
    };

    const removeImeiField = (idToRemove) => {
        if (imeiFields.length > 1) {
            setImeiFields(imeiFields.filter(field => field.id !== idToRemove));
            // Remove the field value from form
            form.setFieldsValue({ [`mobile_imei_${idToRemove}`]: undefined });
        }
    };

    const updateImeiValue = (id, value) => {
        setImeiFields(imeiFields.map(field => 
            field.id === id ? { ...field, value } : field
        ));
    };

    // Check if current category is Mobile to show dynamic IMEI fields
    const isMobileCategory = () => {
        return finalCategoryId && categoryFormSchema.some(field => field.field_id === 'mobile_imei');
    };

    const handleSubmit = async (values) => {
        console.log('📦 Submitting product data:', values);
        
        // Validate distributor selection
        if (!values.distributorId) {
            message.error('Please select a distributor');
            return;
        }
        
        setLoading(true);

        try {
            // Flatten all form data into simple key-value pairs
            const productData = {
                // Map the distributor field
                supplierId: values.distributorId,
                // Include all other form fields directly
                ...values
            };
            
            // Remove the frontend-specific field name
            delete productData.distributorId;
            
            console.log('📤 Sending to backend (loose schema):', productData);
            
            const response = await apiService.products.create(productData);
            
            if (response.data.success) {
                message.success('Product added successfully!');
                console.log('✅ Product saved:', response.data);
                form.resetFields();
                // Clear all states
                setDistributorSearchValue('');
                setDistributorOptions([]);
                setSelectedDistributor(null);
                setCategoryLevels([]);
                setSelectedCategoryPath([]);
                setFinalCategoryId(null);
                setCategoryFormSchema([]);
                setImeiFields([{ id: 1, value: '' }]); // Reset IMEI fields
                // Reload top-level categories
                await fetchTopLevelCategories();
            } else {
                message.error(response.data.message || 'Failed to add product');
                console.error('❌ Error saving product:', response.data);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to add product. Please try again.';
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
                                                label={<span style={{ fontSize: '10px', fontWeight: 500 }}>Mobile</span>}
                                                style={{ marginBottom: '12px' }}
                                            >
                                                <Input 
                                                    value={selectedDistributor.primaryPhone || 'N/A'} 
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

                        {/* Product Details Section - All Fields Combined */}
                        <Card
                            title="Product Details"
                            style={{ marginBottom: 24 }}
                            bodyStyle={{ padding: '16px' }}
                            size="small"
                        >
                            {/* All fields in compact layout with balanced responsive sizing */}
                            <Row gutter={12}>
                                {/* Category Selection */}
                                {categoryLevels.length > 0 ? (
                                    categoryLevels.map((levelCategories, levelIndex) => (
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
                                                    value={selectedCategoryPath[levelIndex]}
                                                    onChange={(value) => handleCategorySelection(value, levelIndex)}
                                                    loading={loadingCategorySchema && levelIndex === categoryLevels.length - 1}
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
                                        name="condition"
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
                                {finalCategoryId && categoryFormSchema.length > 0 && 
                                    categoryFormSchema.map((field, index) => {
                                        // Handle IMEI field specially for Mobile category
                                        if (field.field_id === 'mobile_imei' && isMobileCategory()) {
                                            return imeiFields.map((imeiField, imeiIndex) => (
                                                <Col key={`${field.field_id}_${imeiField.id}`} xs={24} sm={12} md={6} lg={2} xl={2}>
                                                    <Form.Item
                                                        label={
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '10px', fontWeight: 500 }}>
                                                                    IMEI {imeiField.id}
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                                    {imeiIndex === imeiFields.length - 1 && (
                                                                        <PlusCircleOutlined 
                                                                            style={{ 
                                                                                fontSize: '10px', 
                                                                                color: '#52c41a',
                                                                                cursor: 'pointer',
                                                                                padding: '2px'
                                                                            }}
                                                                            onClick={addImeiField}
                                                                            title="Add IMEI field"
                                                                        />
                                                                    )}
                                                                    {imeiFields.length > 1 && (
                                                                        <MinusCircleOutlined 
                                                                            style={{ 
                                                                                fontSize: '10px', 
                                                                                color: '#ff4d4f',
                                                                                cursor: 'pointer',
                                                                                padding: '2px'
                                                                            }}
                                                                            onClick={() => removeImeiField(imeiField.id)}
                                                                            title="Remove IMEI field"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        }
                                                        name={`mobile_imei_${imeiField.id}`}
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
                                                            onChange={(e) => updateImeiValue(imeiField.id, e.target.value)}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            ));
                                        }
                                        
                                        // Handle other fields normally
                                        return (
                                            <Col key={field.field_id} xs={24} sm={12} md={6} lg={2} xl={2}>
                                                <Form.Item
                                                    label={<span style={{ fontSize: '10px', fontWeight: 500 }}>{field.label}</span>}
                                                    name={field.field_id}
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
                            </Row>
                            
                            {/* Hidden form field for final category ID */}
                            <Form.Item name="categoryId" style={{ display: 'none' }}>
                                <Input />
                            </Form.Item>

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
                                        setCategoryLevels([]);
                                        setSelectedCategoryPath([]);
                                        setFinalCategoryId(null);
                                        setCategoryFormSchema([]);
                                        setImeiFields([{ id: 1, value: '' }]); // Reset IMEI fields
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
                                    Save Product
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
        </div>
    );
};

export default AddProduct;
