import React, { useState, useEffect } from 'react';
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
    ReloadOutlined,
    ShopOutlined,
    PlusOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

const AddProductTable = () => {
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
        warranty: '12',
        color: '',
        serialNumbers: [''],
        additionalFields: {},
        formSchema: [],
        isValid: false
    }]);
    
    // Shared states
    const [allCategories, setAllCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
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

    // Initial data fetch
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        setError('');
        try {
            console.log('🔄 Fetching initial data...');
            // Fetch all categories and distributors in parallel
            const [categoriesResponse, distributorsResponse] = await Promise.all([
                apiService.categories.getAll(), // Get all categories for the dropdown
                apiService.distributors.getAll()
            ]);

            console.log('📊 Categories response:', categoriesResponse.data);
            console.log('👥 Distributors response:', distributorsResponse.data);

            if (categoriesResponse.data.success) {
                // Get all categories for the product table dropdown
                const allCats = categoriesResponse.data.data || [];
                console.log('📊 All categories received:', allCats.length, allCats);
                
                // For now, show all categories since the API doesn't include is_leaf property
                // TODO: Update backend to include is_leaf or create a leaf-only endpoint
                setAllCategories(allCats);
                console.log('✅ Loaded categories:', allCats.length);
            } else {
                console.error('❌ Categories response not successful:', categoriesResponse.data);
            }

            if (distributorsResponse.data.success) {
                setDistributors(distributorsResponse.data.distributors || []);
                console.log('✅ Loaded distributors:', distributorsResponse.data.distributors?.length);
            } else {
                console.error('❌ Distributors response not successful:', distributorsResponse.data);
            }
        } catch (error) {
            console.error('❌ Error fetching initial data:', error);
            setError(`Failed to load initial data: ${error.message}. Please refresh the page.`);
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

    // Distributor search and selection
    const handleDistributorSearch = (value) => {
        setDistributorSearchValue(value);
        if (value.length >= 3) {
            const filtered = distributors.filter(dist =>
                dist.name.toLowerCase().includes(value.toLowerCase()) ||
                (dist.primaryPhone && dist.primaryPhone.includes(value)) ||
                (dist.gstNumber && dist.gstNumber.toLowerCase().includes(value.toLowerCase()))
            ).map(dist => ({
                value: dist._id,
                label: `${dist.name} (${dist.primaryPhone || 'No phone'})`,
                distributor: dist
            }));
            setDistributorOptions(filtered);
        } else {
            setDistributorOptions([]);
        }
    };

    const handleDistributorSelect = (value, option) => {
        const distributor = option.distributor;
        setSelectedDistributor(distributor);
        setDistributorSearchValue(distributor.name);
        form.setFieldsValue({ distributor: distributor.name, distributorId: distributor._id });
        console.log('✅ Distributor selected:', distributor.name);
    };

    // Submit handler
    const handleSubmit = async (values) => {
        console.log('📤 Submitting products data...');
        
        if (!selectedDistributor || !values.distributorId) {
            message.error('Please select a distributor first.');
            return;
        }

        // Validate products
        const validProducts = products.filter(product => 
            product.categoryId && 
            product.productName && 
            product.price
        );

        if (validProducts.length === 0) {
            message.error('Please configure at least one product with category, name, and price.');
            return;
        }

        try {
            setIsLoading(true);
            
            // Submit all products in batch
            message.info(`Submitting ${validProducts.length} products...`);
            
            const submissions = validProducts.map(product => {
                const productData = {
                    name: product.productName,
                    categoryId: product.categoryId,
                    distributorId: selectedDistributor._id,
                    price: product.price,
                    warrantyMonths: product.warranty || 12,
                    brand: product.brand,
                    color: product.color,
                    serialNumbers: product.serialNumbers.filter(s => s && s.trim()),
                    attributes: product.additionalFields || {}
                };
                
                return apiService.products.create(productData);
            });

            const results = await Promise.allSettled(submissions);
            
            // Check results
            const successCount = results.filter(result => result.status === 'fulfilled').length;
            const failureCount = results.length - successCount;

            if (successCount === results.length) {
                message.success(`🎉 All ${successCount} products saved successfully!`);
                // Reset form
                form.resetFields();
                setProducts([{
                    id: 1,
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
                }]);
                setSelectedDistributor(null);
                setDistributorSearchValue('');
                navigate('/dashboard');
            } else if (successCount > 0) {
                message.warning(`⚠️ ${successCount} products saved, ${failureCount} failed. Please check and retry.`);
            } else {
                message.error('❌ Failed to save products. Please try again.');
            }

        } catch (error) {
            console.error('❌ Error submitting products:', error);
            message.error('Failed to submit products. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <Breadcrumb className="mb-6">
                    <Breadcrumb.Item>
                        <Link to="/dashboard">Dashboard</Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>Add Products</Breadcrumb.Item>
                </Breadcrumb>

                <Card
                    title={
                        <Space>
                            <AppstoreAddOutlined className="text-orange-500" />
                            <Title level={3} className="m-0 text-gray-800">
                                Add Multiple Products - Excel Style
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
                        {/* Distributor Selection */}
                        <Card 
                            className="mb-4" 
                            title={
                                <Space>
                                    <ShopOutlined className="text-blue-500" />
                                    <span>Distributor Information</span>
                                </Space>
                            }
                            size="small"
                        >
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name="distributorId"
                                        style={{ display: 'none' }}
                                    >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        label="Select Distributor"
                                        name="distributor"
                                        rules={[{ required: true, message: 'Please select distributor' }]}
                                    >
                                        <AutoComplete
                                            value={distributorSearchValue}
                                            options={distributorOptions}
                                            onSearch={handleDistributorSearch}
                                            onSelect={handleDistributorSelect}
                                            placeholder="Type to search distributors..."
                                            className="w-full"
                                            loading={isLoading}
                                        />
                                    </Form.Item>
                                </Col>
                                {selectedDistributor && (
                                    <>
                                        <Col span={4}>
                                            <Form.Item label="Contact">
                                                <Input value={selectedDistributor.primaryPhone || 'N/A'} disabled />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <Form.Item label="GST">
                                                <Input value={selectedDistributor.gstNumber || 'N/A'} disabled />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item label="Address">
                                                <Input value={selectedDistributor.address || 'N/A'} disabled />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Card>

                        {/* Product Table */}
                        <Card 
                            className="mb-4" 
                            title={
                                <Space>
                                    <AppstoreAddOutlined className="text-green-500" />
                                    <span>Products ({products.length})</span>
                                </Space>
                            }
                            extra={
                                <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />}
                                    onClick={addNewProduct}
                                    className="bg-green-500 hover:bg-green-600"
                                >
                                    Add Product Row
                                </Button>
                            }
                            size="small"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border border-gray-300 px-2 py-2 text-left w-8">#</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left w-48">Category</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left w-40">Product Name</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left w-32">Brand</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left w-24">Price (₹)</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left w-24">Warranty (Months)</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left w-24">Color</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left w-40">Serial Numbers</th>
                                            <th className="border border-gray-300 px-2 py-2 text-left w-16">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((product, index) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-2 py-2 text-center">
                                                    <span className="text-sm font-medium">{index + 1}</span>
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2">
                                                    <Select
                                                        placeholder="Select category"
                                                        value={product.categoryId || undefined}
                                                        onChange={(value) => handleProductCategorySelect(index, value)}
                                                        className="w-full"
                                                        size="small"
                                                        loading={isLoading}
                                                        showSearch
                                                        filterOption={(input, option) =>
                                                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                        }
                                                        notFoundContent={allCategories.length === 0 ? "No categories available" : "No match found"}
                                                    >
                                                        {allCategories.map(category => (
                                                            <Option key={category._id} value={category._id}>
                                                                {category.name}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                    {/* Debug info */}
                                                    {process.env.NODE_ENV === 'development' && (
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Categories: {allCategories.length}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2">
                                                    <Input
                                                        placeholder="Product name"
                                                        value={product.productName}
                                                        onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                                                        size="small"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2">
                                                    <Input
                                                        placeholder="Brand"
                                                        value={product.brand}
                                                        onChange={(e) => updateProduct(index, 'brand', e.target.value)}
                                                        size="small"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2">
                                                    <InputNumber
                                                        placeholder="Price"
                                                        value={product.price}
                                                        onChange={(value) => updateProduct(index, 'price', value)}
                                                        size="small"
                                                        className="w-full"
                                                        min={0}
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2">
                                                    <InputNumber
                                                        placeholder="Months"
                                                        value={product.warranty}
                                                        onChange={(value) => updateProduct(index, 'warranty', value)}
                                                        size="small"
                                                        className="w-full"
                                                        min={0}
                                                        max={120}
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2">
                                                    <Input
                                                        placeholder="Color"
                                                        value={product.color}
                                                        onChange={(e) => updateProduct(index, 'color', e.target.value)}
                                                        size="small"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2">
                                                    <Input.TextArea
                                                        placeholder="Serial numbers (one per line)"
                                                        value={product.serialNumbers.join('\n')}
                                                        onChange={(e) => {
                                                            const serials = e.target.value.split('\n').filter(s => s.trim());
                                                            updateProduct(index, 'serialNumbers', serials.length > 0 ? serials : ['']);
                                                        }}
                                                        size="small"
                                                        rows={2}
                                                        className="w-full"
                                                    />
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2 text-center">
                                                    <Popconfirm
                                                        title="Remove this product?"
                                                        onConfirm={() => removeProduct(index)}
                                                        okText="Yes"
                                                        cancelText="No"
                                                        disabled={products.length <= 1}
                                                    >
                                                        <Button 
                                                            type="text" 
                                                            icon={<DeleteOutlined />}
                                                            size="small"
                                                            className="text-red-500 hover:text-red-700"
                                                            disabled={products.length <= 1}
                                                        />
                                                    </Popconfirm>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Submit Section */}
                        <Card size="small">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Text className="text-gray-600">
                                        {products.length} product(s) configured • 
                                        {products.filter(p => p.categoryId && p.productName && p.price).length} ready to save
                                    </Text>
                                </div>
                                <div className="space-x-4">
                                    <Button 
                                        onClick={() => {
                                            form.resetFields();
                                            setProducts([{
                                                id: 1,
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
                                            }]);
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
                                        className="bg-orange-500 border-orange-500 hover:bg-orange-600"
                                        disabled={!selectedDistributor || products.length === 0}
                                    >
                                        Save {products.length > 1 ? `${products.length} Products` : 'Product'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default AddProductTable;
