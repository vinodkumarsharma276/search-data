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
    ShopOutlined
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

            // Construct product data structure
            const productData = {
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
                    productData.common_attributes[fieldId] = value;
                } else {
                    productData.specific_attributes[fieldId] = value;
                }
            });

            console.log('📤 Sending product data:', productData);

            // Submit to API
            const response = await apiService.products.create(productData);

            if (response.data.success) {
                message.success('Product added successfully!');
                console.log('✅ Product saved:', response.data);
                
                // Reset form
                form.resetFields();
                setSelectedCategoryPath([]);
                setCurrentCategoryChildren([]);
                setFullFormSchema([]);
                setFormData({});
                setDistributorSearchValue('');
                setDistributorOptions([]);
            } else {
                message.error(response.data.message || 'Failed to add product');
            }

        } catch (error) {
            console.error('❌ Error submitting product:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add product. Please try again.';
            message.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
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
                    <Breadcrumb.Item>Add Product (Dynamic)</Breadcrumb.Item>
                </Breadcrumb>

                <Card
                    title={
                        <Space>
                            <AppstoreAddOutlined className="text-orange-500" />
                            <Title level={3} className="m-0 text-gray-800">
                                Add New Product - Dynamic Form
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
                        {/* Category Selection Section */}
                        <Card 
                            className="mb-4" 
                            title={
                                <Space>
                                    <TagOutlined className="text-orange-500" />
                                    <span>Product Category</span>
                                </Space>
                            }
                            size="small"
                            bodyStyle={{ padding: '16px' }}
                        >
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
                        </Card>

                        {/* Distributor Selection (Always Required) */}
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

                        {/* Dynamic Form Fields */}
                        {fullFormSchema.length > 0 && (
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
                                <Spin spinning={isLoading}>
                                    <Row gutter={12}>
                                        {fullFormSchema.map(field => (
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
                                        ))}
                                    </Row>
                                </Spin>
                            </Card>
                        )}

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
