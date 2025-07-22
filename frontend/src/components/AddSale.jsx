import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Form,
    Input,
    Select,
    Button,
    Card,
    Row,
    Col,
    Divider,
    InputNumber,
    DatePicker,
    Radio,
    Space,
    Typography,
    Table,
    Popconfirm,
    message,
    Breadcrumb,
    Steps
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    ArrowLeftOutlined,
    ShoppingCartOutlined,
    UserOutlined,
    DollarOutlined,
    FileTextOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AddSale = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [itemBrands, setItemBrands] = useState({});
    const [itemProducts, setItemProducts] = useState({});
    const [itemSerialNumbers, setItemSerialNumbers] = useState({});
    const [saleItems, setSaleItems] = useState([]);
    const [paymentType, setPaymentType] = useState('Cash');
    const [emiDetails, setEmiDetails] = useState({
        fileCharges: 0,
        interestRate: 0,
        downPayment: 0,
        numberOfInstallments: 12,
        installments: []
    });
    const [totals, setTotals] = useState({
        subtotal: 0,
        totalGst: 0,
        totalAmount: 0,
        finalAmount: 0,
        pendingAmount: 0
    });

    // Load initial data on component mount
    useEffect(() => {
        fetchCustomers();
        fetchCategories();
        // Initialize with one empty item
        setSaleItems([createEmptyItem()]);
    }, []);

    // Calculate totals when items change
    useEffect(() => {
        calculateTotals();
    }, [saleItems]);

    const createEmptyItem = () => ({
        key: Date.now() + Math.random(),
        categoryId: '',
        brandId: '',
        productId: '',
        productName: '',
        modelNumber: '',
        serialNumber: '',
        mrp: 0,
        sellingPrice: 0,
        discount: 0,
        discountPercentage: 0,
        igst: 0,
        cgst: 9,
        sgst: 9,
        gstRate: 18
    });

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            message.error('Failed to fetch customers');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/dropdowns/categories');
            if (response.ok) {
                const data = await response.json();
                setCategories(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            message.error('Failed to fetch categories');
        }
    };

    const fetchBrands = async (categoryId, itemIndex) => {
        try {
            const response = await fetch(`/api/dropdowns/brands?categoryId=${categoryId}`);
            if (response.ok) {
                const data = await response.json();
                setItemBrands(prev => ({
                    ...prev,
                    [itemIndex]: data.data || []
                }));
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
            message.error('Failed to fetch brands');
        }
    };

    const fetchProducts = async (categoryId, brandId, itemIndex) => {
        try {
            let url = '/api/dropdowns/products?';
            if (categoryId) url += `categoryId=${categoryId}&`;
            if (brandId) url += `brandId=${brandId}`;
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setItemProducts(prev => ({
                    ...prev,
                    [itemIndex]: data.data || []
                }));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            message.error('Failed to fetch products');
        }
    };

    const fetchSerialNumbers = async (productId, itemIndex) => {
        try {
            const response = await fetch(`/api/dropdowns/serial-numbers?productId=${productId}`);
            if (response.ok) {
                const data = await response.json();
                setItemSerialNumbers(prev => ({
                    ...prev,
                    [itemIndex]: data.data || []
                }));
            }
        } catch (error) {
            console.error('Error fetching serial numbers:', error);
            message.error('Failed to fetch serial numbers');
        }
    };

    const fetchProductDetails = async (productId) => {
        try {
            const response = await fetch(`/api/dropdowns/product/${productId}`);
            if (response.ok) {
                const data = await response.json();
                return data.data;
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
        }
        return null;
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalGst = 0;

        saleItems.forEach(item => {
            const sellingPrice = parseFloat(item.sellingPrice) || 0;
            const discount = parseFloat(item.discount) || 0;
            const gstRate = parseFloat(item.gstRate) || 0;
            
            const finalPrice = sellingPrice - discount;
            const gstAmount = (finalPrice * gstRate) / 100;
            
            subtotal += finalPrice;
            totalGst += gstAmount;
        });

        const totalAmount = subtotal + totalGst;
        
        setTotals(prev => ({
            ...prev,
            subtotal: subtotal.toFixed(2),
            totalGst: totalGst.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            finalAmount: paymentType === 'Installment' ? 
                (totalAmount + parseFloat(emiDetails.fileCharges || 0) + 
                ((totalAmount * parseFloat(emiDetails.interestRate || 0)) / 100)).toFixed(2) :
                totalAmount.toFixed(2),
            pendingAmount: paymentType === 'Installment' ?
                (totalAmount + parseFloat(emiDetails.fileCharges || 0) + 
                ((totalAmount * parseFloat(emiDetails.interestRate || 0)) / 100) - 
                parseFloat(emiDetails.downPayment || 0)).toFixed(2) :
                '0.00'
        }));
    };

    // EMI Calculation Functions
    const calculateEMI = () => {
        const totalAmount = parseFloat(totals.totalAmount || 0);
        const fileCharges = parseFloat(emiDetails.fileCharges || 0);
        const interestRate = parseFloat(emiDetails.interestRate || 0);
        const downPayment = parseFloat(emiDetails.downPayment || 0);
        const numberOfInstallments = parseInt(emiDetails.numberOfInstallments || 12);

        if (totalAmount <= 0 || numberOfInstallments <= 0) {
            setEmiDetails(prev => ({ ...prev, installments: [] }));
            return;
        }

        // Calculate final amount (including interest and file charges)
        const interestAmount = (totalAmount * interestRate) / 100;
        const finalAmount = totalAmount + fileCharges + interestAmount;
        const pendingAmount = finalAmount - downPayment;
        
        // Calculate monthly EMI
        const monthlyEMI = pendingAmount / numberOfInstallments;

        // Generate installment schedule
        const installments = [];
        const currentDate = new Date();
        
        for (let i = 1; i <= numberOfInstallments; i++) {
            const dueDate = new Date(currentDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            
            installments.push({
                key: i,
                installmentNumber: i,
                amount: monthlyEMI.toFixed(2),
                dueDate: dueDate.toDateString(),
                status: 'Pending'
            });
        }

        setEmiDetails(prev => ({
            ...prev,
            installments
        }));

        // Recalculate totals to update final amount and pending amount
        calculateTotals();
    };

    const handleEMIFieldChange = (field, value) => {
        setEmiDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePaymentTypeChange = (e) => {
        setPaymentType(e.target.value);
        if (e.target.value !== 'Installment') {
            setEmiDetails({
                fileCharges: 0,
                interestRate: 0,
                downPayment: 0,
                numberOfInstallments: 12,
                installments: []
            });
        }
    };

    // Recalculate EMI when totals or EMI details change
    useEffect(() => {
        if (paymentType === 'Installment') {
            calculateEMI();
        }
    }, [totals.totalAmount, emiDetails.fileCharges, emiDetails.interestRate, emiDetails.downPayment, emiDetails.numberOfInstallments, paymentType]);

    const handleAddItem = () => {
        setSaleItems([...saleItems, createEmptyItem()]);
    };

    const handleRemoveItem = (index) => {
        if (saleItems.length > 1) {
            const newItems = saleItems.filter((_, i) => i !== index);
            setSaleItems(newItems);
        }
    };

    const handleItemChange = async (index, field, value) => {
        const newItems = [...saleItems];
        
        if (field === 'categoryId') {
            newItems[index] = {
                ...newItems[index],
                categoryId: value,
                brandId: '',
                productId: '',
                productName: '',
                modelNumber: '',
                serialNumber: '',
                mrp: 0,
                sellingPrice: 0,
                discount: 0
            };
            
            if (value) {
                fetchBrands(value, index);
            } else {
                setItemBrands(prev => ({ ...prev, [index]: [] }));
                setItemProducts(prev => ({ ...prev, [index]: [] }));
                setItemSerialNumbers(prev => ({ ...prev, [index]: [] }));
            }
        } else if (field === 'brandId') {
            newItems[index] = {
                ...newItems[index],
                brandId: value,
                productId: '',
                productName: '',
                modelNumber: '',
                serialNumber: '',
                mrp: 0,
                sellingPrice: 0,
                discount: 0
            };
            
            if (value && newItems[index].categoryId) {
                fetchProducts(newItems[index].categoryId, value, index);
            } else {
                setItemProducts(prev => ({ ...prev, [index]: [] }));
                setItemSerialNumbers(prev => ({ ...prev, [index]: [] }));
            }
        } else if (field === 'productId') {
            newItems[index].productId = value;
            newItems[index].serialNumber = '';
            
            if (value) {
                const productDetails = await fetchProductDetails(value);
                if (productDetails) {
                    newItems[index].productName = productDetails.name;
                    newItems[index].modelNumber = productDetails.modelNumber || '';
                    newItems[index].mrp = productDetails.mrp || 0;
                    newItems[index].sellingPrice = productDetails.sellingPrice || 0;
                    newItems[index].gstRate = productDetails.gstRate || 18;
                    
                    if (productDetails.mrp && productDetails.sellingPrice) {
                        const discount = productDetails.mrp - productDetails.sellingPrice;
                        newItems[index].discount = discount;
                        newItems[index].discountPercentage = ((discount / productDetails.mrp) * 100).toFixed(2);
                    }
                }
                fetchSerialNumbers(value, index);
            } else {
                setItemSerialNumbers(prev => ({ ...prev, [index]: [] }));
            }
        } else if (field === 'mrp' || field === 'sellingPrice' || field === 'discount') {
            const numValue = parseFloat(value) || 0;
            newItems[index][field] = numValue;
            
            const mrp = parseFloat(newItems[index].mrp) || 0;
            const sellingPrice = parseFloat(newItems[index].sellingPrice) || 0;
            
            if (field === 'mrp' || field === 'sellingPrice') {
                if (mrp > 0 && sellingPrice > 0) {
                    const discount = mrp - sellingPrice;
                    newItems[index].discount = discount;
                    newItems[index].discountPercentage = ((discount / mrp) * 100).toFixed(2);
                }
            } else if (field === 'discount' && mrp > 0) {
                newItems[index].sellingPrice = mrp - numValue;
                newItems[index].discountPercentage = ((numValue / mrp) * 100).toFixed(2);
            }
            
            const gstRate = newItems[index].gstRate || 18;
            if (gstRate >= 12) {
                newItems[index].igst = gstRate;
                newItems[index].cgst = 0;
                newItems[index].sgst = 0;
            } else {
                newItems[index].igst = 0;
                newItems[index].cgst = gstRate / 2;
                newItems[index].sgst = gstRate / 2;
            }
        } else {
            newItems[index][field] = value;
        }
        
        setSaleItems(newItems);
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const saleData = {
                customerId: values.customerId,
                items: saleItems.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    serialNumber: item.serialNumber,
                    sellingPrice: parseFloat(item.sellingPrice),
                    discount: parseFloat(item.discount) || 0,
                    finalPrice: parseFloat(item.sellingPrice) - (parseFloat(item.discount) || 0),
                    gstAmount: ((parseFloat(item.sellingPrice) - (parseFloat(item.discount) || 0)) * parseFloat(item.gstRate)) / 100,
                    totalAmount: (parseFloat(item.sellingPrice) - (parseFloat(item.discount) || 0)) + (((parseFloat(item.sellingPrice) - (parseFloat(item.discount) || 0)) * parseFloat(item.gstRate)) / 100)
                })),
                subtotal: parseFloat(totals.subtotal),
                totalGst: parseFloat(totals.totalGst),
                totalAmount: parseFloat(totals.totalAmount),
                paymentType: values.paymentType,
                salesPerson: values.salesPerson || 'Vinod Sharma',
                notes: values.notes || ''
            };

            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(saleData)
            });

            if (response.ok) {
                const sale = await response.json();
                message.success(`Sale created successfully! Sale Number: ${sale.saleNumber}`);
                navigate('/search');
            } else {
                message.error('Failed to create sale');
            }
        } catch (error) {
            console.error('Error creating sale:', error);
            message.error('Error creating sale');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '16px', background: '#f0f2f5' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                    {/* Header */}
                    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                        <Col>
                            <Breadcrumb style={{ marginBottom: 6 }}>
                                <Breadcrumb.Item>
                                    <Link to="/search">Dashboard</Link>
                                </Breadcrumb.Item>
                                <Breadcrumb.Item>Sales</Breadcrumb.Item>
                                <Breadcrumb.Item>New Sale</Breadcrumb.Item>
                            </Breadcrumb>
                            <Title level={3} style={{ margin: 0 }}>
                                <ShoppingCartOutlined /> Create New Sale
                            </Title>
                        </Col>
                        <Col>
                            <Button 
                                icon={<ArrowLeftOutlined />} 
                                onClick={() => navigate('/search')}
                                size="small"
                            >
                                Back to Dashboard
                            </Button>
                        </Col>
                    </Row>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        requiredMark={false}
                    >
                        <Row gutter={16}>
                            {/* Main Content */}
                            <Col xs={24} lg={16}>
                                {/* Customer Selection */}
                                <Card 
                                    title={<><UserOutlined /> Customer Information</>}
                                    style={{ marginBottom: 16 }}
                                    bodyStyle={{ padding: '16px' }}
                                    size="small"
                                >
                                    <Form.Item
                                        label="Select Customer"
                                        name="customerId"
                                        rules={[{ required: true, message: 'Please select a customer' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select
                                            placeholder="Choose customer or add new"
                                            showSearch
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                        >
                                            {customers.map(customer => (
                                                <Option key={customer._id} value={customer._id}>
                                                    {customer.name} - {customer.phone}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Card>

                                {/* Products Section */}
                                <Card 
                                    title={<><ShoppingCartOutlined /> Sale Items</>}
                                    style={{ marginBottom: 16 }}
                                    bodyStyle={{ padding: '12px' }}
                                    size="small"
                                    extra={
                                        <Button 
                                            type="primary" 
                                            icon={<PlusOutlined />} 
                                            onClick={handleAddItem}
                                            size="small"
                                        >
                                            Add Item
                                        </Button>
                                    }
                                >
                                    {saleItems.map((item, index) => (
                                        <Card 
                                            key={item.key}
                                            type="inner"
                                            title={`Item ${index + 1}`}
                                            style={{ 
                                                marginBottom: index === saleItems.length - 1 ? 0 : 12,
                                                border: '1px solid #e8e8e8'
                                            }}
                                            bodyStyle={{ padding: '12px' }}
                                            headStyle={{ padding: '8px 12px', minHeight: '40px' }}
                                            size="small"
                                            extra={
                                                saleItems.length > 1 && (
                                                    <Popconfirm
                                                        title="Remove this item?"
                                                        onConfirm={() => handleRemoveItem(index)}
                                                    >
                                                        <Button 
                                                            icon={<DeleteOutlined />} 
                                                            size="small" 
                                                            danger
                                                            type="text"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Popconfirm>
                                                )
                                            }
                                        >
                                            {/* Row 1: Category, Brand, Product */}
                                            <Row gutter={12} style={{ marginBottom: 12 }}>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        Category
                                                    </label>
                                                    <Select
                                                        placeholder="Select category"
                                                        value={item.categoryId}
                                                        onChange={(value) => handleItemChange(index, 'categoryId', value)}
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                    >
                                                        {categories.map(cat => (
                                                            <Option key={cat._id} value={cat._id}>{cat.name}</Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        Brand
                                                    </label>
                                                    <Select
                                                        placeholder="Select brand"
                                                        value={item.brandId}
                                                        onChange={(value) => handleItemChange(index, 'brandId', value)}
                                                        disabled={!item.categoryId}
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                    >
                                                        {(itemBrands[index] || []).map(brand => (
                                                            <Option key={brand._id} value={brand._id}>{brand.name}</Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        Product
                                                    </label>
                                                    <Select
                                                        placeholder="Select product"
                                                        value={item.productId}
                                                        onChange={(value) => handleItemChange(index, 'productId', value)}
                                                        disabled={!item.brandId}
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                    >
                                                        {(itemProducts[index] || []).map(product => (
                                                            <Option key={product._id} value={product._id}>{product.name}</Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                            </Row>

                                            {/* Row 2: Serial Number, MRP, Selling Price */}
                                            <Row gutter={12} style={{ marginBottom: 12 }}>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        Serial Number
                                                    </label>
                                                    <Select
                                                        placeholder="Select serial number"
                                                        value={item.serialNumber}
                                                        onChange={(value) => handleItemChange(index, 'serialNumber', value)}
                                                        disabled={!item.productId}
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                    >
                                                        {(itemSerialNumbers[index] || []).map(serialItem => (
                                                            <Option key={serialItem._id} value={serialItem.serialNumber}>
                                                                {serialItem.serialNumber} ({serialItem.condition})
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Col>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        MRP (₹)
                                                    </label>
                                                    <InputNumber
                                                        value={item.mrp}
                                                        onChange={(value) => handleItemChange(index, 'mrp', value)}
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                        formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                                        placeholder="0"
                                                    />
                                                </Col>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        Selling Price (₹)
                                                    </label>
                                                    <InputNumber
                                                        value={item.sellingPrice}
                                                        onChange={(value) => handleItemChange(index, 'sellingPrice', value)}
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                        formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                                        placeholder="0"
                                                    />
                                                </Col>
                                            </Row>

                                            {/* Row 3: Discount, GST Rate, Total */}
                                            <Row gutter={12}>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        Discount (₹)
                                                    </label>
                                                    <InputNumber
                                                        value={item.discount}
                                                        onChange={(value) => handleItemChange(index, 'discount', value)}
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                        formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={value => value.replace(/₹\s?|(,*)/g, '')}
                                                        placeholder="0"
                                                    />
                                                    {item.discountPercentage > 0 && (
                                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                                            {item.discountPercentage}% off
                                                        </Text>
                                                    )}
                                                </Col>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        GST Rate
                                                    </label>
                                                    <Input
                                                        value={`${item.gstRate}%`}
                                                        disabled
                                                        style={{ width: '100%' }}
                                                        size="small"
                                                    />
                                                </Col>
                                                <Col xs={24} sm={8}>
                                                    <label style={{ display: 'block', marginBottom: 2, fontWeight: 500, fontSize: '13px' }}>
                                                        Item Total
                                                    </label>
                                                    <Input
                                                        value={`₹ ${((parseFloat(item.sellingPrice) || 0) - (parseFloat(item.discount) || 0) + (((parseFloat(item.sellingPrice) || 0) - (parseFloat(item.discount) || 0)) * (parseFloat(item.gstRate) || 0)) / 100).toFixed(2)}`}
                                                        disabled
                                                        style={{ width: '100%', fontWeight: 'bold' }}
                                                        size="small"
                                                    />
                                                </Col>
                                            </Row>

                                            {/* Product Name Display */}
                                            {item.productName && (
                                                <div style={{ marginTop: 8, padding: '6px 8px', backgroundColor: '#f8f9fa', borderRadius: 4, fontSize: '12px' }}>
                                                    <Text strong>Product: </Text>
                                                    <Text>{item.productName}</Text>
                                                    {item.modelNumber && (
                                                        <>
                                                            <Text strong> | Model: </Text>
                                                            <Text>{item.modelNumber}</Text>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </Card>

                                {/* Payment Section */}
                                <Card 
                                    title={<><DollarOutlined /> Payment Details</>}
                                    style={{ marginBottom: 16 }}
                                    bodyStyle={{ padding: '16px' }}
                                    size="small"
                                >
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Payment Type"
                                                name="paymentType"
                                                initialValue="Cash"
                                                style={{ marginBottom: 12 }}
                                            >
                                                <Radio.Group size="small" onChange={handlePaymentTypeChange} value={paymentType}>
                                                    <Radio value="Cash">Cash</Radio>
                                                    <Radio value="Card">Card</Radio>
                                                    <Radio value="UPI">UPI</Radio>
                                                    <Radio value="Installment">EMI</Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Sales Person"
                                                name="salesPerson"
                                                initialValue="Vinod Sharma"
                                                style={{ marginBottom: 12 }}
                                            >
                                                <Input size="small" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* EMI Fields - Show only when Installment is selected */}
                                    {paymentType === 'Installment' && (
                                        <div className="emi-configuration" style={{ marginTop: 16, padding: '12px', borderRadius: '8px' }}>
                                            <Title level={5} style={{ margin: '0 0 16px 0' }}>
                                                EMI Configuration
                                            </Title>
                                            
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label="File Charges (₹)"
                                                        style={{ marginBottom: 12 }}
                                                    >
                                                        <InputNumber
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                            min={0}
                                                            value={emiDetails.fileCharges}
                                                            onChange={(value) => handleEMIFieldChange('fileCharges', value || 0)}
                                                            placeholder="Enter file charges"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label="Interest Rate (%)"
                                                        style={{ marginBottom: 12 }}
                                                    >
                                                        <InputNumber
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                            min={0}
                                                            max={50}
                                                            step={0.1}
                                                            value={emiDetails.interestRate}
                                                            onChange={(value) => handleEMIFieldChange('interestRate', value || 0)}
                                                            placeholder="Enter interest rate"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label="Down Payment (₹)"
                                                        style={{ marginBottom: 12 }}
                                                    >
                                                        <InputNumber
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                            min={0}
                                                            max={parseFloat(totals.totalAmount || 0)}
                                                            value={emiDetails.downPayment}
                                                            onChange={(value) => handleEMIFieldChange('downPayment', value || 0)}
                                                            placeholder="Enter down payment"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label="Number of Installments"
                                                        style={{ marginBottom: 12 }}
                                                    >
                                                        <Select
                                                            size="small"
                                                            value={emiDetails.numberOfInstallments}
                                                            onChange={(value) => handleEMIFieldChange('numberOfInstallments', value)}
                                                            style={{ width: '100%' }}
                                                        >
                                                            <Option value={3}>3 Months</Option>
                                                            <Option value={6}>6 Months</Option>
                                                            <Option value={9}>9 Months</Option>
                                                            <Option value={12}>12 Months</Option>
                                                            <Option value={18}>18 Months</Option>
                                                            <Option value={24}>24 Months</Option>
                                                            <Option value={36}>36 Months</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            {/* EMI Summary */}
                                            <div className="payment-summary" style={{ marginTop: 16, padding: '12px', borderRadius: '6px' }}>
                                                <Title level={5} style={{ margin: '0 0 12px 0' }}>Payment Summary</Title>
                                                <Row gutter={16}>
                                                    <Col span={6}>
                                                        <Text strong>Original Amount:</Text><br />
                                                        <Text style={{ fontSize: '16px', color: 'var(--success-color)' }}>₹{totals.totalAmount}</Text>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Text strong>Final Amount:</Text><br />
                                                        <Text style={{ fontSize: '16px', color: 'var(--primary-color)' }}>₹{totals.finalAmount}</Text>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Text strong>Extra Cost:</Text><br />
                                                        <Text style={{ fontSize: '16px', color: '#fa8c16' }}>₹{(totals.finalAmount - totals.totalAmount).toFixed(2)}</Text>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Text strong>Pending Amount:</Text><br />
                                                        <Text style={{ fontSize: '16px', color: 'var(--warning-color)' }}>₹{totals.pendingAmount}</Text>
                                                    </Col>
                                                </Row>
                                            </div>

                                            {/* Installment Schedule Table */}
                                            {emiDetails.installments.length > 0 && (
                                                <div style={{ marginTop: 16 }}>
                                                    <Title level={5} style={{ margin: '0 0 12px 0' }}>Installment Schedule</Title>
                                                    <Table
                                                        size="small"
                                                        dataSource={emiDetails.installments}
                                                        pagination={false}
                                                        scroll={{ y: 200 }}
                                                        columns={[
                                                            {
                                                                title: 'Installment #',
                                                                dataIndex: 'installmentNumber',
                                                                key: 'installmentNumber',
                                                                width: 100,
                                                                align: 'center'
                                                            },
                                                            {
                                                                title: 'Amount (₹)',
                                                                dataIndex: 'amount',
                                                                key: 'amount',
                                                                width: 100,
                                                                align: 'right',
                                                                render: (amount) => <Text strong>{amount}</Text>
                                                            },
                                                            {
                                                                title: 'Due Date',
                                                                dataIndex: 'dueDate',
                                                                key: 'dueDate',
                                                                width: 120
                                                            },
                                                            {
                                                                title: 'Status',
                                                                dataIndex: 'status',
                                                                key: 'status',
                                                                width: 80,
                                                                align: 'center',
                                                                render: (status) => (
                                                                    <Text style={{ 
                                                                        color: status === 'Pending' ? 'var(--warning-color)' : 'var(--success-color)',
                                                                        fontWeight: 500 
                                                                    }}>
                                                                        {status}
                                                                    </Text>
                                                                )
                                                            }
                                                        ]}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Form.Item
                                        label="Notes (Optional)"
                                        name="notes"
                                        style={{ marginBottom: 0, marginTop: paymentType === 'Installment' ? 16 : 0 }}
                                    >
                                        <TextArea rows={2} placeholder="Any additional notes about this sale..." size="small" />
                                    </Form.Item>
                                </Card>

                                {/* Submit Section */}
                                <Card bodyStyle={{ padding: '16px', textAlign: 'center' }} size="small">
                                    <Button 
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        htmlType="submit"
                                        loading={loading}
                                        style={{ minWidth: 180 }}
                                    >
                                        {loading ? 'Creating Sale...' : 'Create Sale'}
                                    </Button>
                                </Card>
                            </Col>

                            {/* Summary Sidebar */}
                            <Col xs={24} lg={8}>
                                <Card 
                                    title="Order Summary" 
                                    style={{ position: 'sticky', top: 16 }}
                                    bodyStyle={{ padding: '16px' }}
                                    size="small"
                                >
                                    <div style={{ marginBottom: 12 }}>
                                        <Row justify="space-between">
                                            <Text>Subtotal:</Text>
                                            <Text strong>₹{totals.subtotal}</Text>
                                        </Row>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <Row justify="space-between">
                                            <Text>GST:</Text>
                                            <Text strong>₹{totals.totalGst}</Text>
                                        </Row>
                                    </div>
                                    <Divider style={{ margin: '12px 0' }} />
                                    
                                    {/* Show EMI details if Installment payment */}
                                    {paymentType === 'Installment' ? (
                                        <>
                                            <div style={{ marginBottom: 12 }}>
                                                <Row justify="space-between">
                                                    <Text>Original Amount:</Text>
                                                    <Text strong>₹{totals.totalAmount}</Text>
                                                </Row>
                                            </div>
                                            {emiDetails.fileCharges > 0 && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <Row justify="space-between">
                                                        <Text>File Charges:</Text>
                                                        <Text strong>₹{emiDetails.fileCharges}</Text>
                                                    </Row>
                                                </div>
                                            )}
                                            {emiDetails.interestRate > 0 && (
                                                <div style={{ marginBottom: 12 }}>
                                                    <Row justify="space-between">
                                                        <Text>Interest ({emiDetails.interestRate}%):</Text>
                                                        <Text strong>₹{((parseFloat(totals.totalAmount || 0) * emiDetails.interestRate) / 100).toFixed(2)}</Text>
                                                    </Row>
                                                </div>
                                            )}
                                            <div style={{ marginBottom: 16 }}>
                                                <Row justify="space-between">
                                                    <Title level={5} style={{ margin: 0 }}>Final Amount:</Title>
                                                    <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                                                        ₹{totals.finalAmount}
                                                    </Title>
                                                </Row>
                                            </div>
                                            {emiDetails.downPayment > 0 && (
                                                <>
                                                    <div style={{ marginBottom: 12 }}>
                                                        <Row justify="space-between">
                                                            <Text>Down Payment:</Text>
                                                            <Text strong style={{ color: 'var(--success-color)' }}>₹{emiDetails.downPayment}</Text>
                                                        </Row>
                                                    </div>
                                                    <div style={{ marginBottom: 16 }}>
                                                        <Row justify="space-between">
                                                            <Title level={5} style={{ margin: 0, color: 'var(--warning-color)' }}>Pending Amount:</Title>
                                                            <Title level={5} style={{ margin: 0, color: 'var(--warning-color)' }}>
                                                                ₹{totals.pendingAmount}
                                                            </Title>
                                                        </Row>
                                                    </div>
                                                </>
                                            )}
                                            {emiDetails.installments.length > 0 && (
                                                <div style={{ 
                                                    padding: '8px', 
                                                    backgroundColor: 'var(--bg-tertiary)', 
                                                    borderRadius: '4px', 
                                                    marginBottom: 16 
                                                }}>
                                                    <Text strong>EMI Details:</Text><br />
                                                    <Text style={{ fontSize: '12px' }}>
                                                        {emiDetails.numberOfInstallments} installments of ₹{emiDetails.installments[0]?.amount || 0} each
                                                    </Text>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ marginBottom: 16 }}>
                                            <Row justify="space-between">
                                                <Title level={5} style={{ margin: 0 }}>Total:</Title>
                                                <Title level={5} style={{ margin: 0, color: 'var(--primary-color)' }}>
                                                    ₹{totals.totalAmount}
                                                </Title>
                                            </Row>
                                        </div>
                                    )}

                                    {/* Items Summary */}
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Title level={5} style={{ marginBottom: 8 }}>Items ({saleItems.length})</Title>
                                    {saleItems.map((item, index) => (
                                        <div key={item.key} style={{ marginBottom: 6 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text ellipsis style={{ flex: 1, fontSize: '13px' }}>
                                                    {item.productName || `Item ${index + 1}`}
                                                </Text>
                                                <Text strong style={{ fontSize: '13px' }}>₹{item.sellingPrice || 0}</Text>
                                            </div>
                                            {item.serialNumber && (
                                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                                    SN: {item.serialNumber}
                                                </Text>
                                            )}
                                        </div>
                                    ))}
                                </Card>
                            </Col>
                        </Row>
                    </Form>
                </div>
        </div>
    );
};

export default AddSale;
