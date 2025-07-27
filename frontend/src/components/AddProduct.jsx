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
import {
    SaveOutlined,
    ArrowLeftOutlined,
    AppstoreAddOutlined,
    DollarOutlined,
    TagOutlined,
    UploadOutlined,
    BarcodeOutlined
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
                value: distributor._id,
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
            const displayText = `${distributor.name} | ${distributor.gstNumber || 'No GST'}`;
            setDistributorSearchValue(displayText);
            form.setFieldsValue({ distributorId: value });
            setDistributorOptions([]); // Clear options after selection
            console.log('✅ Form field set to:', value);
            console.log('✅ Display text set to:', displayText);
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

    const handleSubmit = async (values) => {
        console.log('📦 Submitting product data:', values);
        
        // Validate distributor selection
        if (!values.distributorId) {
            message.error('Please select a distributor');
            return;
        }
        
        setLoading(true);

        try {
            // Separate dynamic category fields from main product data
            const dynamicFields = {};
            const mainFields = {};
            
            // Extract category-specific fields
            if (categoryFormSchema.length > 0) {
                categoryFormSchema.forEach(field => {
                    if (values[field.field_id] !== undefined) {
                        dynamicFields[field.field_id] = values[field.field_id];
                    }
                });
            }
            
            // Main product fields
            Object.keys(values).forEach(key => {
                if (!dynamicFields.hasOwnProperty(key)) {
                    mainFields[key] = values[key];
                }
            });
            
            // Map distributorId to supplierId for backend compatibility
            const productData = {
                ...mainFields,
                supplierId: values.distributorId,
                categoryFormData: dynamicFields // Send dynamic fields separately
            };
            delete productData.distributorId; // Remove the frontend field name
            
            console.log('📤 Sending to backend:', productData);
            console.log('🎯 Dynamic category fields:', dynamicFields);
            
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
                title={
                    <Space>
                        <AppstoreAddOutlined style={{ color: '#fa8c16' }} />
                        <Title level={3} style={{ margin: 0, color: '#333333' }}>
                            Add New Product
                        </Title>
                    </Space>
                }
                extra={
                    <Button 
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to Dashboard
                        </Button>
                    }
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
                        {/* Basic Information */}
                        <Title level={4} style={{ marginTop: 0, color: '#333333' }}>
                            <TagOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
                            Basic Information
                        </Title>

                        {/* Distributor Information Section */}
                        <Card
                            title="Distributor Information"
                            style={{ marginBottom: 24 }}
                            bodyStyle={{ padding: '16px' }}
                            size="small"
                        >
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>
                                    Distributor Search <span style={{ color: '#ff4d4f' }}>*</span>
                                </label>
                                <Form.Item
                                    name="distributorId"
                                    rules={[{ required: true, message: 'Please select distributor' }]}
                                    style={{ margin: 0 }}
                                >
                                    <AutoComplete
                                        style={{ width: '100%' }}
                                        options={distributorOptions}
                                        onSearch={handleDistributorSearch}
                                        onSelect={handleDistributorSelect}
                                        value={distributorSearchValue}
                                        placeholder="Type at least 3 characters to search by name, GST, PAN, mobile, or address..."
                                        allowClear
                                        onClear={() => {
                                            setDistributorSearchValue('');
                                            setDistributorOptions([]);
                                            setSelectedDistributor(null);
                                            form.setFieldsValue({ distributorId: undefined });
                                        }}
                                    />
                                </Form.Item>
                            </div>

                            {/* Display selected distributor details in 5 columns */}
                            {selectedDistributor && (
                                <Row gutter={16} style={{ marginTop: 16, padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                                    <Col span={5}>
                                        <div>
                                            <Text strong style={{ fontSize: '12px', color: '#666' }}>Name</Text>
                                            <div style={{ fontSize: '14px', marginTop: '2px' }}>{selectedDistributor.name}</div>
                                        </div>
                                    </Col>
                                    <Col span={4}>
                                        <div>
                                            <Text strong style={{ fontSize: '12px', color: '#666' }}>GST</Text>
                                            <div style={{ fontSize: '14px', marginTop: '2px' }}>{selectedDistributor.gstNumber || 'N/A'}</div>
                                        </div>
                                    </Col>
                                    <Col span={4}>
                                        <div>
                                            <Text strong style={{ fontSize: '12px', color: '#666' }}>PAN</Text>
                                            <div style={{ fontSize: '14px', marginTop: '2px' }}>{selectedDistributor.panNumber || 'N/A'}</div>
                                        </div>
                                    </Col>
                                    <Col span={4}>
                                        <div>
                                            <Text strong style={{ fontSize: '12px', color: '#666' }}>Mobile</Text>
                                            <div style={{ fontSize: '14px', marginTop: '2px' }}>{selectedDistributor.primaryPhone || 'N/A'}</div>
                                        </div>
                                    </Col>
                                    <Col span={7}>
                                        <div>
                                            <Text strong style={{ fontSize: '12px', color: '#666' }}>Address</Text>
                                            <div style={{ fontSize: '14px', marginTop: '2px', lineHeight: '1.3' }}>
                                                {selectedDistributor.address || 'N/A'}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>
                            )}
                        </Card>

                        {/* Product Details Section - All Fields Combined */}
                        <Card
                            title="Product Details"
                            style={{ marginBottom: 24 }}
                            bodyStyle={{ padding: '16px' }}
                            size="small"
                        >
                            {/* Hierarchical Category Selection */}
                            <div style={{ marginBottom: 24 }}>
                                <Text strong style={{ fontSize: '16px', color: '#333', marginBottom: '12px', display: 'block' }}>
                                    Category Selection
                                </Text>
                                
                                {/* Category dropdowns in 5-column grid layout */}
                                <Row gutter={[16, 16]}>
                                    {categoryLevels.map((levelCategories, levelIndex) => (
                                        <Col key={levelIndex} xs={24} sm={12} md={8} lg={5} xl={5}>
                                            <Form.Item
                                                label={`Level ${levelIndex + 1}: ${levelIndex === 0 ? 'Main Category' : levelIndex === 1 ? 'Sub Category' : `Category ${levelIndex + 1}`}`}
                                                style={{ margin: 0 }}
                                            >
                                                <Select
                                                    placeholder={`Select ${levelIndex === 0 ? 'main category' : 'sub category'}`}
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                    value={selectedCategoryPath[levelIndex]}
                                                    onChange={(value) => handleCategorySelection(value, levelIndex)}
                                                    loading={loadingCategorySchema && levelIndex === categoryLevels.length - 1}
                                                >
                                                    {levelCategories.map(category => (
                                                        <Option key={category._id} value={category._id}>
                                                            {category.name} {category.is_leaf ? '(Leaf)' : ''}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    ))}
                                </Row>
                                
                                {/* Hidden form field for final category ID */}
                                <Form.Item name="categoryId" style={{ display: 'none' }}>
                                    <Input />
                                </Form.Item>
                            </div>

                            {/* Basic Product Information */}
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Product Name"
                                        name="name"
                                        rules={[
                                            { required: true, message: 'Please enter product name' },
                                            { min: 2, message: 'Product name must be at least 2 characters' }
                                        ]}
                                    >
                                        <Input 
                                            placeholder="Enter product name"
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Condition"
                                        name="condition"
                                        rules={[{ required: true, message: 'Please select condition' }]}
                                    >
                                        <Select placeholder="Select condition" size="large">
                                            <Option value="New">New</Option>
                                            <Option value="Refurbished">Refurbished</Option>
                                            <Option value="Used">Used</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Purchase Price (₹)"
                                        name="purchasePrice"
                                        rules={[
                                            { required: true, message: 'Please enter purchase price' },
                                            { type: 'number', min: 0, message: 'Price must be positive' }
                                        ]}
                                    >
                                        <InputNumber 
                                            placeholder="0.00"
                                            size="large"
                                            style={{ width: '100%' }}
                                            precision={2}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="MRP (₹)"
                                        name="mrp"
                                        rules={[
                                            { required: true, message: 'Please enter MRP' },
                                            { type: 'number', min: 0, message: 'MRP must be positive' }
                                        ]}
                                    >
                                        <InputNumber 
                                            placeholder="0.00"
                                            size="large"
                                            style={{ width: '100%' }}
                                            precision={2}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                                    <Form.Item
                                        label="Status"
                                        name="isActive"
                                        valuePropName="checked"
                                        initialValue={true}
                                    >
                                        <Switch 
                                            checkedChildren="Active" 
                                            unCheckedChildren="Inactive" 
                                            size="default"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Selling Price (₹)"
                                        name="sellingPrice"
                                        rules={[
                                            { required: true, message: 'Please enter selling price' },
                                            { type: 'number', min: 0, message: 'Price must be positive' }
                                        ]}
                                    >
                                        <InputNumber 
                                            placeholder="0.00"
                                            size="large"
                                            style={{ width: '100%' }}
                                            precision={2}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="GST Rate (%)"
                                        name="gstRate"
                                        rules={[{ required: true, message: 'Please enter GST rate' }]}
                                    >
                                        <Select placeholder="Select GST rate" size="large">
                                            <Option value={0}>0%</Option>
                                            <Option value={5}>5%</Option>
                                            <Option value={12}>12%</Option>
                                            <Option value={18}>18%</Option>
                                            <Option value={28}>28%</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="HSN Code"
                                        name="hsnCode"
                                        rules={[{ required: true, message: 'Please enter HSN code' }]}
                                    >
                                        <Input 
                                            placeholder="8471"
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Current Stock"
                                        name="currentStock"
                                        rules={[
                                            { required: true, message: 'Please enter current stock' },
                                            { type: 'number', min: 0, message: 'Stock must be non-negative' }
                                        ]}
                                    >
                                        <InputNumber 
                                            placeholder="0"
                                            size="large"
                                            style={{ width: '100%' }}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                                    <Form.Item
                                        label="Minimum Stock"
                                        name="minimumStock"
                                        rules={[
                                            { required: true, message: 'Please enter minimum stock level' },
                                            { type: 'number', min: 0, message: 'Stock level must be non-negative' }
                                        ]}
                                    >
                                        <InputNumber 
                                            placeholder="5"
                                            size="large"
                                            style={{ width: '100%' }}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Maximum Stock"
                                        name="maximumStock"
                                    >
                                        <InputNumber 
                                            placeholder="100"
                                            size="large"
                                            style={{ width: '100%' }}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Warranty (months)"
                                        name="warrantyPeriod"
                                    >
                                        <InputNumber 
                                            placeholder="12"
                                            size="large"
                                            style={{ width: '100%' }}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Weight (grams)"
                                        name="weight"
                                    >
                                        <InputNumber 
                                            placeholder="1000"
                                            size="large"
                                            style={{ width: '100%' }}
                                            min={0}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={5} xl={5}>
                                    <Form.Item
                                        label="Brand"
                                        name="brandId"
                                        rules={[{ required: true, message: 'Please select brand' }]}
                                    >
                                        <Select placeholder="Select brand" size="large">
                                            {brands.map(brand => (
                                                <Option key={brand._id} value={brand._id}>{brand.name}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8} lg={4} xl={4}>
                                    <Form.Item
                                        label="Notes"
                                        name="notes"
                                    >
                                        <Input 
                                            placeholder="Additional notes"
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <Form.Item
                                        label="Description"
                                        name="description"
                                        rules={[{ required: true, message: 'Please enter product description' }]}
                                    >
                                        <TextArea 
                                            placeholder="Enter detailed product description"
                                            rows={3}
                                            size="large"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* Dynamic Category-based Fields */}
                            {finalCategoryId && categoryFormSchema.length > 0 && (
                                <div style={{ marginTop: 24 }}>
                                    <Divider orientation="left">
                                        <Text strong style={{ fontSize: '16px', color: '#333' }}>
                                            Category Fields (Common + Specific)
                                        </Text>
                                    </Divider>
                                    {/* Render dynamic fields in rows of 5 - no filtering needed as categories are now clean */}
                                    {(() => {
                                        return Array.from({ length: Math.ceil(categoryFormSchema.length / 5) }, (_, rowIndex) => (
                                            <Row key={rowIndex} gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                                {categoryFormSchema.slice(rowIndex * 5, (rowIndex + 1) * 5).map((field) => (
                                                    <Col key={field.field_id} xs={24} sm={12} md={8} lg={5} xl={Math.floor(24 / Math.min(5, categoryFormSchema.slice(rowIndex * 5, (rowIndex + 1) * 5).length))}>
                                                        <Form.Item
                                                            label={field.label}
                                                            name={field.field_id}
                                                            rules={[
                                                                ...(field.validation?.required || field.is_required ? [{ required: true, message: `Please enter ${field.label.toLowerCase()}` }] : []),
                                                                ...(field.type === 'number' ? [{ type: 'number', message: 'Please enter a valid number' }] : [])
                                                            ]}
                                                        >
                                                            {field.type === 'text' && (
                                                                <Input 
                                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                                    size="large"
                                                                />
                                                            )}
                                                            {field.type === 'number' && (
                                                                <InputNumber 
                                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                                    size="large"
                                                                    style={{ width: '100%' }}
                                                                    min={field.validation?.min || 0}
                                                                    max={field.validation?.max}
                                                                />
                                                            )}
                                                            {(field.type === 'dropdown' || field.type === 'combobox') && (
                                                                <Select 
                                                                    placeholder={`Select ${field.label.toLowerCase()}`}
                                                                    size="large"
                                                                    mode={field.type === 'combobox' ? 'tags' : undefined}
                                                                    allowClear
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
                                                ))}
                                            </Row>
                                        ));
                                    })()}
                                </div>
                            )}

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
