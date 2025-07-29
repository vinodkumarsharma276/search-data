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
    Alert,
    Table,
    Popconfirm
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
    MinusCircleOutlined,
    DeleteOutlined,
    EditOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

const AddProductDynamic = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    
    // Excel-like product table state
    const [products, setProducts] = useState([{
        id: 1,
        categoryPath: '',
        categoryId: '',
        productName: '',
        brand: '',
        price: '',
        warranty: '',
        color: '',
        serialNumbers: [''],
        additionalFields: {},
        formSchema: [],
        isValid: false
    }]);
    
    // Shared states
    const [topLevelCategories, setTopLevelCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [categoryCache, setCategoryCache] = useState({});
    
    // Distributor state (shared for all products)
    const [distributors, setDistributors] = useState([]);
    const [distributorOptions, setDistributorOptions] = useState([]);
    const [distributorSearchValue, setDistributorSearchValue] = useState('');
    const [selectedDistributor, setSelectedDistributor] = useState(null);

    // Excel-like product management functions
    const addNewProduct = () => {
        const newProduct = {
            id: Date.now(),
            categoryPath: '',
            categoryId: '',
            productName: '',
            brand: '',
            price: '',
            warranty: '12',
            color: '',
            serialNumbers: [''],
            additionalFields: {},
            formSchema: [],
            isValid: false
        };
        setProducts(prev => [...prev, newProduct]);
        message.success('New product row added');
    };
    
    const removeProduct = (indexToRemove) => {
        if (products.length <= 1) {
            message.warning('At least one product is required.');
            return;
        }
        setProducts(prev => prev.filter((_, index) => index !== indexToRemove));
        message.success('Product removed');
    };
    
    const updateProduct = (index, field, value) => {
        setProducts(prev => prev.map((product, i) => 
            i === index ? { ...product, [field]: value } : product
        ));
    };
    
    const updateProductAdditionalField = (index, fieldId, value) => {
        setProducts(prev => prev.map((product, i) => 
            i === index 
                ? { 
                    ...product, 
                    additionalFields: { ...product.additionalFields, [fieldId]: value }
                } 
                : product
        ));
    };

    // Initial data fetch
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // Fetch all categories and distributors in parallel
            const [categoriesResponse, leafCategoriesResponse, distributorsResponse] = await Promise.all([
                apiService.categories.getTopLevel(),
                apiService.categories.getAll(), // Get all categories for the dropdown
                apiService.distributors.getAll()
            ]);

            if (categoriesResponse.data.success) {
                setTopLevelCategories(categoriesResponse.data.data);
                console.log('✅ Loaded top-level categories:', categoriesResponse.data.data.length);
            }

            if (leafCategoriesResponse.data.success) {
                // Filter only leaf categories for the product table dropdown
                const leafCategories = leafCategoriesResponse.data.data.filter(cat => cat.is_leaf);
                setAllCategories(leafCategories);
                console.log('✅ Loaded leaf categories:', leafCategories.length);
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

    // Handle category selection for a specific product row
    const handleProductCategorySelect = async (productIndex, categoryId) => {
        const selectedCategory = allCategories.find(cat => cat._id === categoryId);
        if (!selectedCategory) return;

        try {
            setIsLoading(true);
            
            // Update basic category info
            updateProduct(productIndex, 'categoryId', categoryId);
            updateProduct(productIndex, 'categoryPath', selectedCategory.name);
            
            // Compile form schema for this category
            const compiledSchema = await compileFormSchemaForCategory(categoryId);
            updateProduct(productIndex, 'formSchema', compiledSchema);
            
            // Initialize additional fields based on schema
            const initialFields = {};
            compiledSchema.forEach(field => {
                if (field.default_value !== undefined) {
                    initialFields[field.field_id] = field.default_value;
                }
            });
            updateProduct(productIndex, 'additionalFields', initialFields);
            
            console.log(`✅ Category configured for product ${productIndex + 1}:`, selectedCategory.name);
            
        } catch (error) {
            console.error('❌ Error configuring category for product:', error);
            message.error('Failed to configure category. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Compile form schema for a category (simplified version)
    const compileFormSchemaForCategory = async (categoryId) => {
        try {
            const response = await apiService.categories.getFormSchema(categoryId);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error('Failed to fetch form schema');
        } catch (error) {
            console.error('❌ Error compiling form schema:', error);
            return [];
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

    // Form submission - now handles multiple products
    const handleSubmit = async (values) => {
        console.log('📤 Submitting multiple products data...');
        
        try {
            // Validate distributor (shared across all products)
            if (!values.distributorId) {
                message.error('Please select a distributor');
                return;
            }

            // Validate all products
            const validProducts = [];
            const productValidationErrors = [];

            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                
                // Skip products without category selection
                if (product.fullFormSchema.length === 0) {
                    productValidationErrors.push(`Product ${i + 1}: Please select a category`);
                    continue;
                }

                // Validate required fields for this product
                const fieldErrors = [];
                product.fullFormSchema.forEach(field => {
                    if (field.is_required && (!product.formData[field.field_id] && product.formData[field.field_id] !== 0)) {
                        fieldErrors.push(`${field.label}`);
                    }
                });

                if (fieldErrors.length > 0) {
                    productValidationErrors.push(`Product ${i + 1}: Missing required fields - ${fieldErrors.join(', ')}`);
                    continue;
                }

                // Check for serial numbers for this product
                let serialNumbers = [];
                let hasSerialNumbers = false;
                
                // Look for serial number fields in this product's form data
                Object.keys(product.formData).forEach(fieldId => {
                    if (fieldId.includes('serial_number')) {
                        const serialData = product.formData[fieldId];
                        if (Array.isArray(serialData)) {
                            serialNumbers = serialData.filter(sn => sn && sn.trim() !== '');
                            hasSerialNumbers = serialNumbers.length > 0;
                        } else if (serialData && serialData.trim()) {
                            serialNumbers = [serialData.trim()];
                            hasSerialNumbers = true;
                        }
                    }
                });

                // Create base product data for this product
                const baseProductData = {
                    category_path: product.selectedCategoryPath.map(cat => cat.name),
                    category_path_ids: product.selectedCategoryPath.map(cat => cat.id),
                    selected_category_id: product.selectedCategoryPath[product.selectedCategoryPath.length - 1].id,
                    common_attributes: {},
                    specific_attributes: {},
                    supplierId: values.distributorId
                };

                // Organize attributes by type (common vs specific)
                Object.keys(product.formData).forEach(fieldId => {
                    const value = product.formData[fieldId];
                    if (value !== undefined && value !== null && value !== '') {
                        if (fieldId.startsWith('common_')) {
                            baseProductData.common_attributes[fieldId] = value;
                        } else if (fieldId.startsWith('specific_')) {
                            baseProductData.specific_attributes[fieldId] = value;
                        }
                    }
                });

                if (hasSerialNumbers) {
                    // Create multiple products with different serial numbers
                    serialNumbers.forEach(serialNumber => {
                        const productData = JSON.parse(JSON.stringify(baseProductData));
                        
                        // Add serial number to appropriate attributes
                        Object.keys(product.formData).forEach(fieldId => {
                            if (fieldId.includes('serial_number')) {
                                if (fieldId.startsWith('common_')) {
                                    productData.common_attributes[fieldId] = serialNumber;
                                } else if (fieldId.startsWith('specific_')) {
                                    productData.specific_attributes[fieldId] = serialNumber;
                                }
                            }
                        });
                        
                        validProducts.push(productData);
                    });
                } else {
                    // Single product without serial number
                    validProducts.push(baseProductData);
                }
            }

            // Check if we have any validation errors
            if (productValidationErrors.length > 0) {
                message.error(`Validation errors:\n${productValidationErrors.join('\n')}`);
                return;
            }

            // Check if we have any valid products to submit
            if (validProducts.length === 0) {
                message.error('No valid products to submit. Please configure at least one product.');
                return;
            }

            setIsLoading(true);
            
            // Submit all products in batch
            message.info(`Submitting ${validProducts.length} products...`);
            
            const promises = validProducts.map(productData => {
                console.log('📤 Creating product:', productData);
                return apiService.products.create(productData);
            });

            const results = await Promise.allSettled(promises);
            
            // Analyze results
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected');
            
            if (successful === validProducts.length) {
                message.success(`Successfully created ${successful} products!`);
                // Reset all products to initial state
                setProducts([{
                    id: 1,
                    selectedCategoryPath: [],
                    currentCategoryChildren: [],
                    fullFormSchema: [],
                    formData: {}
                }]);
                setActiveProductIndex(0);
                form.resetFields();
                
                // Navigate back or to product list
                navigate('/dashboard');
            } else {
                message.warning(`Created ${successful} out of ${validProducts.length} products. ${failed.length} failed.`);
                if (failed.length > 0) {
                    console.error('Failed products:', failed);
                }
            }

        } catch (error) {
            console.error('❌ Error submitting products:', error);
            message.error('Failed to submit products. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Render serial number field with multiple inputs (starts with 1 field)
    const renderSerialNumberField = (field) => {
        const { field_id, label, enabled = true } = field;
        // Initialize with one empty string only if no data exists
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

        const validSerialCount = serialNumbers.filter(s => s && s.trim()).length;

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
                                size="large"
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
                        size="large"
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
                        size="large"
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
                        size="large"
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
                            <Row gutter={16}>
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
                                            size="large"
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
                                                    size="large"
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
                                                    size="large"
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
                                                    size="large"
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
                                                    size="large"
                                                    style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', cursor: 'not-allowed' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24} md={4} lg={4} xl={4}>
                                            <Form.Item
                                                label="Address"
                                                className="mb-3"
                                            >
                                                <Input.TextArea
                                                    value={selectedDistributor.address || 'N/A'}
                                                    readOnly
                                                    disabled
                                                    rows={2}
                                                    size="large"
                                                    style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', cursor: 'not-allowed' }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Card>

                        {/* Multi-Product Management */}
                        <Card 
                            className="mb-4" 
                            title={
                                <Space>
                                    <AppstoreAddOutlined className="text-purple-500" />
                                    <span>Products ({products.length})</span>
                                </Space>
                            }
                            extra={
                                <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />}
                                    onClick={addNewProduct}
                                    size="small"
                                    className="bg-green-500 hover:bg-green-600"
                                >
                                    Add Product
                                </Button>
                            }
                            size="small"
                            bodyStyle={{ padding: '8px 16px' }}
                        >
                            <div className="flex flex-wrap gap-2">
                                {products.map((product, index) => (
                                    <div 
                                        key={product.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                                            activeProductIndex === index 
                                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}
                                        onClick={() => switchToProduct(index)}
                                    >
                                        <AppstoreAddOutlined className="text-sm" />
                                        <span className="text-sm font-medium">
                                            Product {index + 1}
                                            {product.selectedCategoryPath.length > 0 && (
                                                <span className="text-xs ml-1 opacity-75">
                                                    ({product.selectedCategoryPath[product.selectedCategoryPath.length - 1]?.name})
                                                </span>
                                            )}
                                        </span>
                                        {products.length > 1 && (
                                            <Button 
                                                type="text" 
                                                icon={<MinusCircleOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeProduct(index);
                                                }}
                                                size="small"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                style={{ padding: '2px 4px', minWidth: 'auto' }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Product Details Section (Includes Category Selection + Product Fields) */}
                        <Card 
                            className="mb-4" 
                            title={
                                <Space>
                                    <AppstoreAddOutlined className="text-green-500" />
                                    <span>Product {activeProductIndex + 1} Details</span>
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
                                <Row gutter={16}>
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
                                                size="large"
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
                                                    size="large"
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
                                    <Row gutter={16}>
                                        {fullFormSchema
                                            .filter((field, index, array) => {
                                                // Remove duplicate serial number fields - keep only the first one found
                                                if (field.field_id.includes('serial_number')) {
                                                    return array.findIndex(f => f.field_id.includes('serial_number')) === index;
                                                }
                                                return true;
                                            })
                                            .map(field => {
                                                // Handle any serial number field for multiple entries  
                                                if (field.field_id.includes('serial_number')) {
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
                                        setProducts([{
                                            id: 1,
                                            selectedCategoryPath: [],
                                            currentCategoryChildren: [],
                                            fullFormSchema: [],
                                            formData: {}
                                        }]);
                                        setActiveProductIndex(0);
                                        setDistributorSearchValue('');
                                        setDistributorOptions([]);
                                        setSelectedDistributor(null);
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
                                    Save {products.length > 1 ? `${products.length} Products` : 'Product'}
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
