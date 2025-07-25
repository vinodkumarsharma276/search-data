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
    AutoComplete
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
                setCategories(data.categories || []);
                setBrands(data.brands || []);
            }

            // Fetch distributors separately
            const distributorsResponse = await apiService.distributors.getAll();
            if (distributorsResponse.data.success) {
                setDistributors(distributorsResponse.data.distributors || []);
                console.log('✅ Loaded distributors:', distributorsResponse.data.distributors?.length);
            }
        } catch (error) {
            console.error('❌ Error fetching dropdown data:', error);
        }
    };

    // Handle distributor search for autocomplete
    const handleDistributorSearch = useCallback((value) => {
        console.log('🔍 Distributor search triggered with value:', value);
        console.log('📋 Available distributors:', distributors.length);
        setDistributorSearchValue(value);
        
        if (value.length >= 3) {
            const filtered = distributors.filter(distributor => 
                distributor.name.toLowerCase().includes(value.toLowerCase()) ||
                distributor.gstNumber?.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 10);

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
            const displayText = `${option.distributor.name} | ${option.distributor.gstNumber || 'No GST'}`;
            setDistributorSearchValue(displayText);
            form.setFieldsValue({ distributorId: value });
            setDistributorOptions([]); // Clear options after selection
            console.log('✅ Form field set to:', value);
            console.log('✅ Display text set to:', displayText);
        }
    }, [form]);

    const handleSubmit = async (values) => {
        console.log('📦 Submitting product data:', values);
        
        // Validate distributor selection
        if (!values.distributorId) {
            message.error('Please select a distributor');
            return;
        }
        
        setLoading(true);

        try {
            // Map distributorId to supplierId for backend compatibility
            const productData = {
                ...values,
                supplierId: values.distributorId
            };
            delete productData.distributorId; // Remove the frontend field name
            
            console.log('📤 Sending to backend:', productData);
            
            const response = await apiService.products.create(productData);
            
            if (response.data.success) {
                message.success('Product added successfully!');
                console.log('✅ Product saved:', response.data);
                form.resetFields();
                // Clear distributor search states
                setDistributorSearchValue('');
                setDistributorOptions([]);
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
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
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

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="distributorId"
                                    rules={[{ required: true, message: 'Please select distributor' }]}
                                    style={{ display: 'none' }}
                                >
                                    <Input />
                                </Form.Item>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#000000d9', fontSize: '14px' }}>
                                        Distributor (Purchase From) <span style={{ color: '#ff4d4f' }}>*</span>
                                    </label>
                                    <AutoComplete
                                        style={{ width: '100%' }}
                                        options={distributorOptions}
                                        onSearch={handleDistributorSearch}
                                        onSelect={(selectedValue, option) => {
                                            handleDistributorSelect(selectedValue, option);
                                        }}
                                        value={distributorSearchValue}
                                        placeholder="Type at least 3 characters to search distributors..."
                                        size="large"
                                        allowClear
                                        status={form.getFieldError('distributorId').length > 0 ? 'error' : ''}
                                        onClear={() => {
                                            setDistributorSearchValue('');
                                            setDistributorOptions([]);
                                            form.setFieldsValue({ distributorId: undefined });
                                        }}
                                        onChange={(inputValue) => {
                                            handleDistributorSearch(inputValue);
                                            // Clear form value when user manually types
                                            if (typeof inputValue === 'string') {
                                                form.setFieldsValue({ distributorId: undefined });
                                            }
                                        }}
                                    />
                                    {form.getFieldError('distributorId').length > 0 && (
                                        <div style={{ color: '#ff4d4f', fontSize: '14px', marginTop: '5px' }}>
                                            {form.getFieldError('distributorId')[0]}
                                        </div>
                                    )}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="SKU/Model Number"
                                    name="modelNumber"
                                    rules={[{ required: true, message: 'Please enter SKU/Model number' }]}
                                >
                                    <Input 
                                        placeholder="SKU123 or Model-ABC"
                                        size="large"
                                        prefix={<BarcodeOutlined style={{ color: '#666666' }} />}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
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
                            <Col span={12}>
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
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Category"
                                    name="categoryId"
                                    rules={[{ required: true, message: 'Please select category' }]}
                                >
                                    <Select placeholder="Select category" size="large">
                                        {categories.map(cat => (
                                            <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
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
                        </Row>

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

                        {/* Pricing Information */}
                        <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                            <DollarOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
                            Pricing Information
                        </Title>

                        <Row gutter={16}>
                            <Col span={8}>
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
                            <Col span={8}>
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
                            <Col span={8}>
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
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
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
                            <Col span={12}>
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
                        </Row>

                        {/* Inventory Information */}
                        <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                            Inventory Information
                        </Title>

                        <Row gutter={16}>
                            <Col span={8}>
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
                            <Col span={8}>
                                <Form.Item
                                    label="Minimum Stock Level"
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
                            <Col span={8}>
                                <Form.Item
                                    label="Maximum Stock Level"
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
                        </Row>

                        {/* Additional Information */}
                        <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                            Additional Information
                        </Title>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Warranty Period (months)"
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
                            <Col span={12}>
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
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Active Status"
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

                        <Form.Item
                            label="Product Images"
                            name="images"
                        >
                            <Upload
                                listType="picture-card"
                                showUploadList={{
                                    showPreviewIcon: true,
                                    showRemoveIcon: true,
                                }}
                                beforeUpload={() => false} // Prevent auto upload
                            >
                                <div>
                                    <UploadOutlined />
                                    <div style={{ marginTop: 8 }}>Upload Images</div>
                                </div>
                            </Upload>
                        </Form.Item>

                        <Form.Item
                            label="Additional Notes"
                            name="notes"
                        >
                            <TextArea 
                                placeholder="Any additional notes about the product"
                                rows={3}
                                size="large"
                            />
                        </Form.Item>

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
        </div>
    );
};

export default AddProduct;
