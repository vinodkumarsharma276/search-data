import React, { useState, useEffect, useCallback } from 'react';
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
    Checkbox,
    AutoComplete,
    Spin,
    Alert
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    AppstoreAddOutlined,
    TagOutlined,
    ReloadOutlined,
    ShopOutlined,
    PlusOutlined,
    MinusOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

const AddProductDynamic = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    
    // State management as per requirements
    const [topLevelCategories, setTopLevelCategories] = useState([]);
    const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
    const [currentCategoryChildren, setCurrentCategoryChildren] = useState([]);
    const [fullFormSchema, setFullFormSchema] = useState([]);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [categoryCache, setCategoryCache] = useState({});
    
    // Distributor state (still needed for purchase tracking)
    const [distributors, setDistributors] = useState([]);
    const [distributorOptions, setDistributorOptions] = useState([]);
    const [distributorSearchValue, setDistributorSearchValue] = useState('');
    const [selectedDistributor, setSelectedDistributor] = useState(null);

    // Initial data fetch
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // Fetch top-level categories and distributors in parallel
            const [categoriesResponse, distributorsResponse] = await Promise.all([
                apiService.categories.getTopLevel(),
                apiService.distributors.getAll()
            ]);

            if (categoriesResponse.data.success) {
                setTopLevelCategories(categoriesResponse.data.data);
                console.log('✅ Loaded top-level categories:', categoriesResponse.data.data.length);
            }

            if (distributorsResponse.data.success) {
                setDistributors(distributorsResponse.data.distributors || []);
                console.log('✅ Loaded distributors:', distributorsResponse.data.distributors?.length);
            }
        } catch (error) {
            console.error('❌ Error fetching initial data:', error);
            setError('Failed to load initial data. Please refresh the page.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle category selection at any level
    const handleCategorySelect = useCallback(async (categoryId, categoryName, levelIndex) => {
        console.log('🏷️ Category selected:', { categoryId, categoryName, levelIndex });
        
        try {
            setIsLoading(true);
            setError('');

            // Update selectedCategoryPath
            const newPath = selectedCategoryPath.slice(0, levelIndex);
            newPath.push({ id: categoryId, name: categoryName });
            setSelectedCategoryPath(newPath);

            // Fetch category details (use cache if available)
            let category = categoryCache[categoryId];
            if (!category) {
                const response = await apiService.categories.getById(categoryId);
                if (response.data.success) {
                    category = response.data.data;
                    setCategoryCache(prev => ({ ...prev, [categoryId]: category }));
                }
            }

            if (!category) {
                throw new Error('Category not found');
            }

            // Check if this is a leaf category
            if (category.is_leaf) {
                console.log('🍃 Leaf category selected, compiling form schema...');
                await compileFullFormSchema(categoryId);
            } else {
                console.log('🌿 Non-leaf category, fetching children...');
                // Fetch children for next dropdown
                const childrenResponse = await apiService.categories.getChildren(categoryId);
                if (childrenResponse.data.success) {
                    setCurrentCategoryChildren(childrenResponse.data.data);
                }
                
                // Clear form schema since we're not at a leaf yet
                setFullFormSchema([]);
                setFormData({});
            }

        } catch (error) {
            console.error('❌ Error handling category selection:', error);
            setError('Failed to load category data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategoryPath, categoryCache]);

    // Compile full form schema for leaf category
    const compileFullFormSchema = useCallback(async (leafCategoryId) => {
        try {
            console.log('📋 Compiling full form schema for:', leafCategoryId);
            
            const response = await apiService.categories.getFullSchema(leafCategoryId);
            if (response.data.success) {
                const schema = response.data.data;
                setFullFormSchema(schema);
                
                // Initialize form data with default values
                const initialFormData = {};
                schema.forEach(field => {
                    if (field.default_value !== null && field.default_value !== undefined) {
                        initialFormData[field.field_id] = field.default_value;
                    }
                });
                setFormData(initialFormData);
                
                console.log('✅ Compiled schema with', schema.length, 'fields');
            }
        } catch (error) {
            console.error('❌ Error compiling form schema:', error);
            setError('Failed to load form schema. Please try again.');
        }
    }, []);

    // Handle dynamic form input changes
    const handleInputChange = useCallback(async (fieldId, value, fieldType, categoryIdOfField) => {
        console.log('📝 Input changed:', { fieldId, value, fieldType });
        
        // Update form data
        const newFormData = { ...formData, [fieldId]: value };
        setFormData(newFormData);

        // Handle combobox new option logic
        if (fieldType === 'combobox' && categoryIdOfField) {
            const field = fullFormSchema.find(f => f.field_id === fieldId);
            if (field && field.options && !field.options.some(opt => opt.value === value)) {
                // This is a new value, add it to the options
                try {
                    console.log('➕ Adding new option to combobox:', { fieldId, value });
                    await apiService.categories.updateFieldOptions(categoryIdOfField, {
                        field_id: fieldId,
                        new_option_value: value,
                        new_option_label: value
                    });
                    
                    // Update the schema to include the new option
                    setFullFormSchema(prev => prev.map(f => {
                        if (f.field_id === fieldId) {
                            return {
                                ...f,
                                options: [...f.options, { value, label: value }]
                            };
                        }
                        return f;
                    }));
                    
                    message.success(`Added "${value}" to ${field.label} options`);
                } catch (error) {
                    console.error('❌ Error adding new option:', error);
                    message.warning('Failed to save new option, but you can still use it');
                }
            }
        }

        // TODO: Implement visibility rules evaluation here
        evaluateVisibilityRules(newFormData);
    }, [formData, fullFormSchema]);

    // Evaluate visibility rules for all fields
    const evaluateVisibilityRules = useCallback((currentFormData) => {
        // This would iterate through fullFormSchema and check visibility_rules
        // For now, we'll implement basic logic
        console.log('👁️ Evaluating visibility rules...', currentFormData);
        // TODO: Implement full visibility rules logic
    }, [fullFormSchema]);

    // Distributor search handlers (unchanged from previous implementation)
    const handleDistributorSearch = useCallback((value) => {
        setDistributorSearchValue(value);
        
        if (value.length >= 3) {
            const filtered = distributors.filter(distributor => 
                distributor.name.toLowerCase().includes(value.toLowerCase()) ||
                distributor.gstNumber?.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 10);

            const options = filtered.map(distributor => ({
                value: distributor._id,
                label: `${distributor.name} | ${distributor.gstNumber || 'No GST'}`,
                distributor: distributor
            }));
            
            setDistributorOptions(options);
        } else {
            setDistributorOptions([]);
        }
    }, [distributors]);

    const handleDistributorSelect = useCallback((value, option) => {
        if (option && option.distributor) {
            const distributor = option.distributor;
            const displayText = `${distributor.name} | ${distributor.gstNumber || 'No GST'}`;
            setDistributorSearchValue(displayText);
            
            const distributorDetails = {
                id: distributor._id,
                name: distributor.name,
                gst: distributor.gstNumber,
                pan: distributor.panNumber,
                address: distributor.address,
                phone: distributor.primaryPhone
            };
            
            setSelectedDistributor(distributorDetails);
            form.setFieldsValue({ distributorId: value });
            setDistributorOptions([]);
        }
    }, [form]);

    // Form submission
    const handleSubmit = async (values) => {
        console.log('📤 Submitting product data...');
        
        try {
            // Validate that we have a leaf category selected
            if (fullFormSchema.length === 0) {
                message.error('Please select a product category');
                return;
            }

            // Validate distributor
            if (!values.distributorId) {
                message.error('Please select a distributor');
                return;
            }

            // Client-side validation based on form schema
            const validationErrors = [];
            fullFormSchema.forEach(field => {
                if (field.is_required && (!formData[field.field_id] && formData[field.field_id] !== 0)) {
                    validationErrors.push(`${field.label} is required`);
                }
            });

            if (validationErrors.length > 0) {
                message.error('Please fill all required fields: ' + validationErrors.join(', '));
                return;
            }

            setIsLoading(true);

            // Check if we have serial numbers for bulk creation
            let serialNumbers = [];
            let hasSerialNumbers = false;

            if (serialNumbersArray && Array.isArray(serialNumbersArray) && serialNumbersArray.length > 0) {
                // Filter out empty serial numbers
                serialNumbers = serialNumbersArray.filter(sn => sn && sn.trim() !== '');
                hasSerialNumbers = serialNumbers.length > 0;
            }

            // Base product data structure
            const baseProductData = {
                category_path: selectedCategoryPath.map(cat => cat.name),
                category_path_ids: selectedCategoryPath.map(cat => cat.id),
                selected_category_id: selectedCategoryPath[selectedCategoryPath.length - 1].id,
                common_attributes: {},
                specific_attributes: {},
                supplierId: values.distributorId // Map to backend field name
            };

            // Separate common and specific attributes
            Object.entries(formData).forEach(([fieldId, value]) => {
                if (fieldId.startsWith('common_')) {
                    baseProductData.common_attributes[fieldId] = value;
                } else {
                    baseProductData.specific_attributes[fieldId] = value;
                }
            });

            if (hasSerialNumbers) {
                // Create multiple products with different serial numbers
                message.info(`Creating ${serialNumbers.length} products with individual serial numbers...`);
                
                const creationPromises = serialNumbers.map(serialNumber => {
                    const productData = { 
                        ...baseProductData,
                        common_attributes: { ...baseProductData.common_attributes },
                        specific_attributes: { ...baseProductData.specific_attributes }
                    };
                    
                    // Add serial number to appropriate attributes
                    if (baseProductData.common_attributes.hasOwnProperty('common_serial_number')) {
                        productData.common_attributes.common_serial_number = serialNumber.trim();
                    } else if (baseProductData.specific_attributes.hasOwnProperty('specific_serial_number')) {
                        productData.specific_attributes.specific_serial_number = serialNumber.trim();
                    }
                    
                    console.log('📤 Creating product with serial:', serialNumber.trim());
                    return apiService.products.create(productData);
                });

                const responses = await Promise.all(creationPromises);
                const successCount = responses.filter(r => r.data.success).length;
                
                if (successCount === serialNumbers.length) {
                    message.success(`Successfully created ${successCount} products with serial numbers!`);
                } else {
                    message.warning(`Created ${successCount} out of ${serialNumbers.length} products. Please check for duplicates.`);
                }
                
                // Reset serial numbers
                setSerialNumbersArray(['']);
            } else {
                // Create single product without serial number
                console.log('📤 Sending product data:', baseProductData);
                const response = await apiService.products.create(baseProductData);

                if (response.data.success) {
                    message.success('Product added successfully!');
                    console.log('✅ Product saved:', response.data);
                } else {
                    message.error(response.data.message || 'Failed to add product');
                }
            }

            // Reset form
            form.resetFields();
            setSelectedCategoryPath([]);
            setCurrentCategoryChildren([]);
            setFullFormSchema([]);
            setFormData({});
            setDistributorSearchValue('');
            setDistributorOptions([]);
            setSerialNumbersArray(['']);

        } catch (error) {
            console.error('❌ Error submitting product:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add product. Please try again.';
            message.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Render serial number field with multiple inputs
    const renderSerialNumberField = (field) => {
        const { field_id, label, enabled = true } = field;
        const serialNumbers = formData[field_id] || [''];

        const addSerialNumber = () => {
            const newSerialNumbers = [...serialNumbers, ''];
            handleInputChange(field_id, newSerialNumbers, 'text', field.categoryId);
        };

        const removeSerialNumber = (index) => {
            if (serialNumbers.length > 1) {
                const newSerialNumbers = serialNumbers.filter((_, i) => i !== index);
                handleInputChange(field_id, newSerialNumbers, 'text', field.categoryId);
            }
        };

        const updateSerialNumber = (index, value) => {
            const newSerialNumbers = [...serialNumbers];
            newSerialNumbers[index] = value;
            handleInputChange(field_id, newSerialNumbers, 'text', field.categoryId);
        };

        const disabledStyle = !enabled ? {
            backgroundColor: '#f5f5f5 !important',
            color: '#999999 !important',
            cursor: 'not-allowed',
            opacity: 0.7
        } : {};

        const validSerialCount = serialNumbers.filter(s => s.trim()).length;

        return (
            <div className="serial-numbers-container">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={!enabled ? { color: '#999999' } : {}}>
                        {label} {validSerialCount > 0 && `(${validSerialCount} items)`}
                    </span>
                    <Button 
                        type="dashed" 
                        size="small" 
                        icon={<PlusOutlined />}
                        onClick={addSerialNumber}
                        disabled={!enabled}
                        style={disabledStyle}
                    >
                        Add Serial Number
                    </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {serialNumbers.map((serial, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 min-w-[30px]">
                                {index + 1}.
                            </span>
                            <Input
                                placeholder={`Serial number ${index + 1}`}
                                value={serial}
                                onChange={(e) => updateSerialNumber(index, e.target.value)}
                                disabled={!enabled}
                                style={{ flex: 1, ...disabledStyle }}
                                className={!enabled ? 'ant-input-disabled' : ''}
                            />
                            {serialNumbers.length > 1 && (
                                <Button 
                                    type="text" 
                                    size="small" 
                                    icon={<MinusCircleOutlined />}
                                    onClick={() => removeSerialNumber(index)}
                                    disabled={!enabled}
                                    danger
                                    style={disabledStyle}
                                />
                            )}
                        </div>
                    ))}
                </div>
                {validSerialCount > 1 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600">
                        📦 This will create {validSerialCount} separate product entries with individual serial numbers
                    </div>
                )}
            </div>
        );
    };

    // Render dynamic form field
    const renderDynamicField = (field) => {
        const { field_id, label, type, is_required, options, default_value, enabled = true } = field;
        
        const commonProps = {
            value: formData[field_id] || default_value || '',
            onChange: (e) => {
                const value = e?.target ? e.target.value : e;
                handleInputChange(field_id, value, type, field.categoryId);
            },
            disabled: !enabled
        };

        // Styling for disabled fields
        const disabledStyle = !enabled ? {
            backgroundColor: '#f5f5f5 !important',
            color: '#999999 !important',
            cursor: 'not-allowed',
            border: '1px solid #d9d9d9 !important',
            opacity: 0.7,
            pointerEvents: 'none'
        } : {};

        // Additional disabled class for Ant Design components
        const disabledClassName = !enabled ? 'ant-input-disabled' : '';

        switch (type) {
            case 'text':
                return (
                    <Input 
                        {...commonProps}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        style={{ width: '100%', ...disabledStyle }}
                        className={disabledClassName}
                    />
                );

            case 'number':
                return (
                    <InputNumber 
                        {...commonProps}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        style={{ width: '100%', ...disabledStyle }}
                        className={disabledClassName}
                        min={0}
                        precision={field_id.includes('price') ? 2 : 0}
                    />
                );

            case 'boolean':
                return (
                    <div className="flex items-center py-1" style={!enabled ? { opacity: 0.6 } : {}}>
                        <Checkbox 
                            checked={formData[field_id] || false}
                            onChange={(e) => handleInputChange(field_id, e.target.checked, type, field.categoryId)}
                            disabled={!enabled}
                            style={!enabled ? { opacity: 0.6 } : {}}
                        >
                            <span className="ml-2" style={!enabled ? { color: '#999999', opacity: 0.6 } : {}}>{label}</span>
                        </Checkbox>
                    </div>
                );

            case 'dropdown':
                return (
                    <Select 
                        {...commonProps}
                        placeholder={`Select ${label.toLowerCase()}`}
                        allowClear
                        style={{ width: '100%', ...disabledStyle }}
                        className={disabledClassName}
                        onChange={(value) => handleInputChange(field_id, value, type, field.categoryId)}
                    >
                        {options?.map(option => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                );

            case 'combobox':
                return (
                    <AutoComplete
                        {...commonProps}
                        placeholder={`Type or select ${label.toLowerCase()}`}
                        options={options?.map(opt => ({ value: opt.value, label: opt.label }))}
                        onChange={(value) => handleInputChange(field_id, value, type, field.categoryId)}
                        onSelect={(value) => handleInputChange(field_id, value, type, field.categoryId)}
                        allowClear
                        style={{ width: '100%', ...disabledStyle }}
                        className={disabledClassName}
                        filterOption={(inputValue, option) =>
                            option.label.toLowerCase().includes(inputValue.toLowerCase())
                        }
                    />
                );

            default:
                return (
                    <Input 
                        {...commonProps} 
                        style={{ width: '100%', ...disabledStyle }}
                        className={disabledClassName}
                    />
                );
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <Breadcrumb className="mb-6">
                    <Breadcrumb.Item>
                        <Link to="/dashboard">Dashboard</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>Add Product</Breadcrumb.Item>
                </Breadcrumb>

                <Card
                    title={
                        <Space>
                            <AppstoreAddOutlined className="text-orange-500" />
                            <Title level={3} className="m-0 text-gray-800">
                                Add New Product
                            </Title>
                        </Space>
                    }
                    extra={
                        <Space>
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={fetchInitialData}
                                loading={isLoading}
                            >
                                Refresh
                            </Button>
                            <Button 
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/dashboard')}
                            >
                                Back to Dashboard
                            </Button>
                        </Space>
                    }
                    className="bg-white rounded-lg border border-gray-200"
                >
                    {error && (
                        <Alert 
                            message={error} 
                            type="error" 
                            closable 
                            onClose={() => setError('')}
                            className="mb-6"
                        />
                    )}

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        {/* Distributor Selection (Always Required) - Moved to Top */}
                        <Card 
                            className="mb-4" 
                            title={
                                <Space>
                                    <ShopOutlined className="text-blue-500" />
                                    <span>Distributor</span>
                                </Space>
                            }
                            size="small"
                            bodyStyle={{ padding: '16px' }}
                        >
                            <Row gutter={12}>
                                <Col span={24} md={4} lg={4} xl={4}>
                                    <Form.Item
                                        name="distributorId"
                                        rules={[{ required: true, message: 'Please select distributor' }]}
                                        style={{ display: 'none' }}
                                    >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        label="Select Distributor"
                                        required
                                        className="mb-3"
                                    >
                                        <AutoComplete
                                            className="w-full"
                                            options={distributorOptions}
                                            onSearch={handleDistributorSearch}
                                            onSelect={handleDistributorSelect}
                                            value={distributorSearchValue}
                                            placeholder="Type at least 3 characters to search distributors..."
                                            allowClear
                                            onClear={() => {
                                                setDistributorSearchValue('');
                                                setDistributorOptions([]);
                                                setSelectedDistributor(null);
                                                form.setFieldsValue({ distributorId: undefined });
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                
                                {/* Distributor Details Display */}
                                {selectedDistributor && (
                                    <>
                                        <Col span={24} md={4} lg={4} xl={4}>
                                            <Form.Item
                                                label="Distributor Name"
                                                className="mb-3"
                                            >
                                                <Input
                                                    value={selectedDistributor.name}
                                                    readOnly
                                                    disabled
                                                    style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', cursor: 'not-allowed' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24} md={4} lg={4} xl={4}>
                                            <Form.Item
                                                label="GST Number"
                                                className="mb-3"
                                            >
                                                <Input
                                                    value={selectedDistributor.gst || 'N/A'}
                                                    readOnly
                                                    disabled
                                                    style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', cursor: 'not-allowed' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24} md={4} lg={4} xl={4}>
                                            <Form.Item
                                                label="PAN Number"
                                                className="mb-3"
                                            >
                                                <Input
                                                    value={selectedDistributor.pan || 'N/A'}
                                                    readOnly
                                                    disabled
                                                    style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', cursor: 'not-allowed' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24} md={4} lg={4} xl={4}>
                                            <Form.Item
                                                label="Phone Number"
                                                className="mb-3"
                                            >
                                                <Input
                                                    value={selectedDistributor.phone || 'N/A'}
                                                    readOnly
                                                    disabled
                                                    style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', cursor: 'not-allowed' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24} md={8} lg={8} xl={8}>
                                            <Form.Item
                                                label="Address"
                                                className="mb-3"
                                            >
                                                <Input.TextArea
                                                    value={selectedDistributor.address || 'N/A'}
                                                    readOnly
                                                    disabled
                                                    rows={2}
                                                    style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', cursor: 'not-allowed' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Card>

                        {/* Product Details Section (Includes Category Selection + Product Fields) */}
                        <Card 
                            className="mb-4" 
                            title={
                                <Space>
                                    <AppstoreAddOutlined className="text-green-500" />
                                    <span>Product Details</span>
                                </Space>
                            }
                            size="small"
                            bodyStyle={{ padding: '16px' }}
                        >
                            {/* Category Selection within Product Details */}
                            <div className="mb-4 p-3 bg-gray-50 rounded border">
                                <div className="mb-2 text-sm font-medium text-gray-600">
                                    <TagOutlined className="text-orange-500 mr-1" />
                                    Select Product Category
                                </div>
                                <Row gutter={12}>
                                    {/* Top Level Category Dropdown */}
                                    <Col span={24} md={4} lg={4} xl={4}>
                                        <Form.Item
                                            label="Category Level 1"
                                            required
                                            className="mb-3"
                                        >
                                            <Select
                                                placeholder="Select category"
                                                className="w-full"
                                                loading={isLoading}
                                                value={selectedCategoryPath[0]?.id}
                                                onChange={(value) => {
                                                    const category = topLevelCategories.find(cat => cat._id === value);
                                                    if (category) {
                                                        handleCategorySelect(value, category.name, 0);
                                                    }
                                                }}
                                            >
                                                {topLevelCategories.map(category => (
                                                    <Option key={category._id} value={category._id}>
                                                        {category.name} {category.is_leaf && '(Product Category)'}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>

                                    {/* Dynamic Category Dropdowns */}
                                    {selectedCategoryPath.length > 0 && currentCategoryChildren.length > 0 && (
                                        <Col span={24} md={4} lg={4} xl={4}>
                                            <Form.Item
                                                label={`Category Level 2`}
                                                required
                                                className="mb-3"
                                            >
                                                <Select
                                                    placeholder="Select subcategory"
                                                    className="w-full"
                                                    loading={isLoading}
                                                    onChange={(value) => {
                                                        const category = currentCategoryChildren.find(cat => cat._id === value);
                                                        if (category) {
                                                            handleCategorySelect(value, category.name, selectedCategoryPath.length);
                                                        }
                                                    }}
                                                >
                                                    {currentCategoryChildren.map(category => (
                                                        <Option key={category._id} value={category._id}>
                                                            {category.name} {category.is_leaf && '(Product Category)'}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    )}
                                </Row>
                            </div>

                            {/* Dynamic Product Form Fields */}
                            {fullFormSchema.length > 0 && (
                                <Spin spinning={isLoading}>
                                    <Row gutter={12}>
                                        {fullFormSchema.map(field => {
                                            // Handle serial number field specially for multiple entries
                                            if (field.field_id === 'common_serial_number' || field.field_id === 'specific_serial_number') {
                                                return (
                                                    <Col key={field.field_id} span={24}>
                                                        <Form.Item
                                                            label={field.label}
                                                            required={field.is_required}
                                                            className="mb-3"
                                                        >
                                                            {renderSerialNumberField(field)}
                                                        </Form.Item>
                                                    </Col>
                                                );
                                            }
                                            
                                            return (
                                                <Col 
                                                    key={field.field_id} 
                                                    span={field.type === 'boolean' ? 24 : 4}
                                                    xs={24}
                                                    sm={field.type === 'boolean' ? 24 : 12}
                                                    md={field.type === 'boolean' ? 24 : 4}
                                                    lg={field.type === 'boolean' ? 24 : 4}
                                                    xl={field.type === 'boolean' ? 24 : 4}
                                                >
                                                    <Form.Item
                                                        label={field.type === 'boolean' ? null : field.label}
                                                        required={field.is_required}
                                                        className="mb-3"
                                                    >
                                                        {renderDynamicField(field)}
                                                    </Form.Item>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </Spin>
                            )}
                        </Card>





                        {/* Submit Section */}
                        <Card size="small" bodyStyle={{ padding: '16px' }}>
                            <div className="flex justify-center space-x-4">
                                <Button 
                                    onClick={() => {
                                        form.resetFields();
                                        setSelectedCategoryPath([]);
                                        setCurrentCategoryChildren([]);
                                        setFullFormSchema([]);
                                        setFormData({});
                                        setDistributorSearchValue('');
                                        setDistributorOptions([]);
                                        setSelectedDistributor(null);
                                        setSerialNumbersArray(['']);
                                    }}
                                >
                                    Reset Form
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={isLoading}
                                    icon={<SaveOutlined />}
                                    className="bg-orange-500 border-orange-500 hover:bg-orange-600 min-w-[150px]"
                                    disabled={fullFormSchema.length === 0}
                                >
                                    Save Product
                                </Button>
                            </div>
                        </Card>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default AddProductDynamic;
