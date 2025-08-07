import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    Steps,
    AutoComplete,
    Pagination,
    Tag,
    Empty,
    Spin
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
    MinusCircleOutlined,
    SearchOutlined,
    FilterOutlined,
    ShopOutlined,
    BarcodeOutlined,
    MobileOutlined,
    DesktopOutlined,
    HomeOutlined
} from '@ant-design/icons';
import authService from '../services/authService';
import apiService from '../services/apiService';
import './AddSale.css';

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

    // Product search related states (global search functionality)
    const [searchLoading, setSearchLoading] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [productSearchResults, setProductSearchResults] = useState([]);
    const [currentProductPage, setCurrentProductPage] = useState(1);

    // Customer search related states
    const [customerSearchValue, setCustomerSearchValue] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
    const [customerForm] = Form.useForm();
    
    // Guarantor search related states  
    const [guarantorSearchValue, setGuarantorSearchValue] = useState('');
    const [guarantorSearchResults, setGuarantorSearchResults] = useState([]);
    const [selectedGuarantor, setSelectedGuarantor] = useState(null);
    const [showAddGuarantorForm, setShowAddGuarantorForm] = useState(false);
    const [guarantorForm] = Form.useForm();

    // Load initial data on component mount
    useEffect(() => {
        fetchCustomers();
        fetchCategories();
        // Initialize with empty sale items array - will be populated via global search
        setSaleItems([]);
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

    // Global product search function
    const handleGlobalProductSearch = async (query) => {
        setGlobalSearchQuery(query);
        setCurrentProductPage(1);
        
        if (query.length >= 3) {
            try {
                setSearchLoading(true);
                const response = await apiService.products.globalSearch(query);
                
                if (response.data.success) {
                    const fetchedProducts = response.data.products || [];
                    setProductSearchResults(fetchedProducts);
                } else {
                    message.error(response.data.message || 'Failed to search products');
                    setProductSearchResults([]);
                }
            } catch (error) {
                console.error('❌ Error searching products:', error);
                message.error('Failed to search products. Please try again.');
                setProductSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        } else {
            setProductSearchResults([]);
        }
    };

    // Handle product selection
    // Handle product selection - show form with product details and sale-specific fields
    const handleProductSelect = (product) => {
        const mrp = product.mrp || product.dealer_price || 0;
        const dealerPrice = product.dealer_price || 0;
        
        // Automatically add product to sale items
        const newItem = {
            key: Date.now() + Math.random(),
            productId: product._id,
            modelNumber: product.model_number || '',
            serialNumber: product.serial_number || '',
            brand: product.brand || '',
            mrp: mrp,
            dealerPrice: dealerPrice,
            category: product.category_name || (product.categoryId?.name) || 'N/A',
            subCategory: product.subcategory_name || (product.subcategoryId?.name) || product.sub_category || 'N/A',
            distributor: product.supplierId?.name || 'N/A',
            // Additional product fields
            description: product.description || 'N/A',
            warranty: product.warranty || 'N/A',
            color: product.color || 'N/A',
            storage: product.storage || 'N/A',
            ram: product.ram || 'N/A',
            processor: product.processor || 'N/A',
            operatingSystem: product.operating_system || product.os || 'N/A',
            screenSize: product.screen_size || product.display_size || 'N/A',
            weight: product.weight || 'N/A',
            dimensions: product.dimensions || 'N/A',
            connectivity: product.connectivity || 'N/A',
            features: product.features || 'N/A',
            // Pricing fields
            sellingPrice: parseFloat((dealerPrice * 1.15).toFixed(2)), // Selling price = Dealer price + 15%
            discount: mrp - parseFloat((dealerPrice * 1.15).toFixed(2)), // Calculate discount based on MRP - selling price
            discountPercentage: mrp > 0 ? parseFloat(((mrp - parseFloat((dealerPrice * 1.15).toFixed(2))) / mrp * 100).toFixed(2)) : 0,
            profit: parseFloat((parseFloat((dealerPrice * 1.15).toFixed(2)) - dealerPrice).toFixed(2)), // Profit = Selling price - Dealer price
            profitPercentage: dealerPrice > 0 ? parseFloat(((parseFloat((dealerPrice * 1.15).toFixed(2)) - dealerPrice) / dealerPrice * 100).toFixed(2)) : 0, // Profit % = (Profit / Dealer price) * 100
            igst: 0,
            cgst: 9,
            sgst: 9,
            gstRate: 18
        };

        setSaleItems(prev => [...prev, newItem]);
        
        // Clear the search field and results for next search
        setGlobalSearchQuery('');
        setProductSearchResults([]);
        
        const displayName = getProductDisplayName(product);
        message.success(`${displayName} added to sale!`);
    };

    const getCategoryIcon = (categoryName) => {
        const name = categoryName?.toLowerCase();
        if (name?.includes('mobile')) return <MobileOutlined />;
        if (name?.includes('tv')) return <DesktopOutlined />;
        if (name?.includes('electronics')) return <BarcodeOutlined />;
        return <ShopOutlined />;
    };

    const getProductDisplayName = (product) => {
        const brand = product.brand || '';
        const model = product.model_number || '';
        const type = product.type || '';
        const capacity = product.capacity || '';
        
        if (brand && model) {
            let displayName = `${brand} ${model}`;
            if (type) displayName += ` (${type})`;
            if (capacity) displayName += ` - ${capacity}`;
            return displayName;
        }
        
        if (brand) return brand;
        if (model) return model;
        
        return product.name || 'Product';
    };

    // Customer search functions
    const handleCustomerSearch = async (value) => {
        setCustomerSearchValue(value);
        if (value.length >= 3) {
            try {
                const token = authService.getToken();
                const response = await fetch(`/api/customers/search/${value}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    const options = data.customers.map(customer => ({
                        key: customer._id,
                        value: customer._id,
                        label: `${customer.name} - ${customer.mobile[0]} (${customer.zone})`
                    }));
                    setCustomerSearchResults(options);
                } else {
                    console.error('Customer search failed:', response.status);
                }
            } catch (error) {
                console.error('Error searching customers:', error);
            }
        } else {
            setCustomerSearchResults([]);
        }
    };

    const handleCustomerSelect = async (value) => {
        try {
            const token = authService.getToken();
            const response = await fetch(`/api/customers/${value}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedCustomer(data.customer);
                setShowAddCustomerForm(true);
                // Pre-fill the customer form
                customerForm.setFieldsValue({
                    name: data.customer.name,
                    zone: data.customer.zone,
                    address: data.customer.address,
                    mobile: data.customer.mobile,
                    email: data.customer.email || '',
                    phone: data.customer.phone || '',
                    aadharNumber: data.customer.aadharNumber || '',
                    panNumber: data.customer.panNumber || ''
                });
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
        }
    };

    const handleGuarantorSearch = async (value) => {
        setGuarantorSearchValue(value);
        if (value.length >= 3) {
            try {
                const token = authService.getToken();
                const response = await fetch(`/api/customers/search/${value}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    const options = data.customers.map(customer => ({
                        key: customer._id,
                        value: customer._id,
                        label: `${customer.name} - ${customer.mobile[0]} (${customer.zone})`
                    }));
                    setGuarantorSearchResults(options);
                } else {
                    console.error('Guarantor search failed:', response.status);
                }
            } catch (error) {
                console.error('Error searching guarantors:', error);
            }
        } else {
            setGuarantorSearchResults([]);
        }
    };

    const handleGuarantorSelect = async (value) => {
        try {
            const token = authService.getToken();
            const response = await fetch(`/api/customers/${value}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedGuarantor(data.customer);
                setShowAddGuarantorForm(true);
                // Pre-fill the guarantor form
                guarantorForm.setFieldsValue({
                    name: data.customer.name,
                    zone: data.customer.zone,
                    address: data.customer.address,
                    mobile: data.customer.mobile,
                    email: data.customer.email || '',
                    phone: data.customer.phone || '',
                    aadharNumber: data.customer.aadharNumber || '',
                    panNumber: data.customer.panNumber || ''
                });
            }
        } catch (error) {
            console.error('Error fetching guarantor details:', error);
        }
    };

    const handleAddCustomer = () => {
        setSelectedCustomer(null);
        setShowAddCustomerForm(true);
        customerForm.resetFields();
    };

    const handleAddGuarantor = () => {
        setSelectedGuarantor(null);
        setShowAddGuarantorForm(true);  
        guarantorForm.resetFields();
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
        const newItems = saleItems.filter((_, i) => i !== index);
        setSaleItems(newItems);
        message.success('Item removed from sale!');
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
        } else if (field === 'mrp' || field === 'sellingPrice' || field === 'discount' || field === 'discountPercentage') {
            const numValue = parseFloat(value) || 0;
            newItems[index][field] = numValue;
            
            const mrp = parseFloat(newItems[index].mrp) || 0;
            let sellingPrice = parseFloat(newItems[index].sellingPrice) || 0;
            let discount = parseFloat(newItems[index].discount) || 0;
            let discountPercentage = parseFloat(newItems[index].discountPercentage) || 0;
            
            if (field === 'sellingPrice') {
                // When selling price changes, calculate discount and profit
                if (mrp > 0) {
                    discount = Math.max(0, mrp - sellingPrice);
                    newItems[index].discount = discount;
                    newItems[index].discountPercentage = parseFloat(((discount / mrp) * 100).toFixed(2));
                }
                // Calculate profit
                const dealerPrice = parseFloat(newItems[index].dealerPrice) || 0;
                if (dealerPrice > 0) {
                    const profit = Math.max(0, sellingPrice - dealerPrice);
                    newItems[index].profit = parseFloat(profit.toFixed(2));
                    newItems[index].profitPercentage = parseFloat(((profit / dealerPrice) * 100).toFixed(2));
                }
            } else if (field === 'discount') {
                // When discount changes, calculate selling price and profit
                if (mrp > 0) {
                    sellingPrice = Math.max(0, mrp - numValue);
                    newItems[index].sellingPrice = sellingPrice;
                    newItems[index].discountPercentage = parseFloat(((numValue / mrp) * 100).toFixed(2));
                    // Calculate profit
                    const dealerPrice = parseFloat(newItems[index].dealerPrice) || 0;
                    if (dealerPrice > 0) {
                        const profit = Math.max(0, sellingPrice - dealerPrice);
                        newItems[index].profit = parseFloat(profit.toFixed(2));
                        newItems[index].profitPercentage = parseFloat(((profit / dealerPrice) * 100).toFixed(2));
                    }
                }
            } else if (field === 'discountPercentage') {
                // When discount percentage changes, calculate discount amount, selling price and profit
                if (mrp > 0) {
                    discount = (mrp * numValue) / 100;
                    sellingPrice = Math.max(0, mrp - discount);
                    newItems[index].discount = parseFloat(discount.toFixed(2));
                    newItems[index].sellingPrice = parseFloat(sellingPrice.toFixed(2));
                    // Calculate profit
                    const dealerPrice = parseFloat(newItems[index].dealerPrice) || 0;
                    if (dealerPrice > 0) {
                        const profit = Math.max(0, sellingPrice - dealerPrice);
                        newItems[index].profit = parseFloat(profit.toFixed(2));
                        newItems[index].profitPercentage = parseFloat(((profit / dealerPrice) * 100).toFixed(2));
                    }
                }
            } else if (field === 'mrp') {
                // When MRP changes, recalculate discount percentage
                if (sellingPrice > 0) {
                    discount = Math.max(0, numValue - sellingPrice);
                    newItems[index].discount = discount;
                    newItems[index].discountPercentage = numValue > 0 ? parseFloat(((discount / numValue) * 100).toFixed(2)) : 0;
                }
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
        <>
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
                <Row gutter={16} style={{ alignItems: 'flex-start' }}>
                    {/* Main Content */}
                    <Col xs={24} lg={16} style={{ marginBottom: 16 }}>
                        {/* Customer Selection */}
                        <Card 
                            title={<><UserOutlined /> Customer Information</>}
                            style={{ marginBottom: 16 }}
                            bodyStyle={{ padding: '16px' }}
                            size="small"
                        >
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>
                                    Customer Search
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <AutoComplete
                                        style={{ flex: 1 }}
                                        options={customerSearchResults}
                                        onSearch={handleCustomerSearch}
                                        onSelect={handleCustomerSelect}
                                        placeholder="Type customer name or mobile (min 3 chars)"
                                        allowClear
                                    />
                                    <Button 
                                        type="primary" 
                                        onClick={handleAddCustomer}
                                        icon={<PlusOutlined />}
                                    >
                                        Add Customer
                                    </Button>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ marginBottom: 8, display: 'block', fontWeight: 500 }}>
                                    Guarantor Search (Optional)
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <AutoComplete
                                        style={{ flex: 1 }}
                                        options={guarantorSearchResults}
                                        onSearch={handleGuarantorSearch}
                                        onSelect={handleGuarantorSelect}
                                        placeholder="Type guarantor name or mobile (min 3 chars)"
                                        allowClear
                                    />
                                    <Button 
                                        type="default" 
                                        onClick={handleAddGuarantor}
                                        icon={<PlusOutlined />}
                                    >
                                        Add Guarantor
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Inline Customer Form */}
                        {showAddCustomerForm && (
                            <Card 
                                title={`${selectedCustomer ? 'Edit Customer' : 'Add New Customer'}`}
                                style={{ marginBottom: 16 }}
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                            >
                                <Form
                                    form={customerForm}
                                    layout="vertical"
                                    onFinish={(values) => {
                                        console.log('Customer form values:', values);
                                        // Handle customer form submission
                                        setShowAddCustomerForm(false);
                                        message.success('Customer details saved!');
                                    }}
                                >
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Customer Name"
                                                name="name"
                                                rules={[{ required: true, message: 'Please enter customer name' }]}
                                            >
                                                <Input placeholder="Enter full name" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Zone"
                                                name="zone"
                                                rules={[{ required: true, message: 'Please select zone' }]}
                                            >
                                                <Select placeholder="Select zone">
                                                    <Option value="North">North</Option>
                                                    <Option value="South">South</Option>
                                                    <Option value="East">East</Option>
                                                    <Option value="West">West</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item
                                        label="Address"
                                        name="address"
                                        rules={[{ required: true, message: 'Please enter address' }]}
                                    >
                                        <Input.TextArea placeholder="Enter complete address" rows={2} />
                                    </Form.Item>
                                    <Form.List name="mobile">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Row key={key} gutter={16} align="middle">
                                                        <Col span={20}>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name]}
                                                                label={key === 0 ? "Mobile Numbers" : ""}
                                                                rules={[{ required: true, message: 'Please enter mobile number' }]}
                                                            >
                                                                <Input placeholder="9876543210" maxLength={10} />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={4}>
                                                            {fields.length > 1 && (
                                                                <Button
                                                                    type="text"
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => remove(name)}
                                                                    danger
                                                                />
                                                            )}
                                                        </Col>
                                                    </Row>
                                                ))}
                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Add Mobile Number
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label="Email (Optional)" name="email">
                                                <Input placeholder="email@example.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Phone (Optional)" name="phone">
                                                <Input placeholder="011-12345678" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label="Aadhaar Number (Optional)" name="aadharNumber">
                                                <Input placeholder="123456789012" maxLength={12} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="PAN Number (Optional)" name="panNumber">
                                                <Input placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                                        <Button onClick={() => setShowAddCustomerForm(false)} style={{ marginRight: 8 }}>
                                            Cancel
                                        </Button>
                                        <Button type="primary" htmlType="submit">
                                            Save Customer
                                        </Button>
                                    </div>
                                </Form>
                            </Card>
                        )}

                        {/* Inline Guarantor Form */}
                        {showAddGuarantorForm && (
                            <Card 
                                title={`${selectedGuarantor ? 'Edit Guarantor' : 'Add New Guarantor'}`}
                                style={{ marginBottom: 16 }}
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                            >
                                <Form
                                    form={guarantorForm}
                                    layout="vertical"
                                    onFinish={(values) => {
                                        console.log('Guarantor form values:', values);
                                        // Handle guarantor form submission
                                        setShowAddGuarantorForm(false);
                                        message.success('Guarantor details saved!');
                                    }}
                                >
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Guarantor Name"
                                                name="name"
                                                rules={[{ required: true, message: 'Please enter guarantor name' }]}
                                            >
                                                <Input placeholder="Enter full name" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Zone"
                                                name="zone"
                                                rules={[{ required: true, message: 'Please select zone' }]}
                                            >
                                                <Select placeholder="Select zone">
                                                    <Option value="North">North</Option>
                                                    <Option value="South">South</Option>
                                                    <Option value="East">East</Option>
                                                    <Option value="West">West</Option>
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item
                                        label="Address"
                                        name="address"
                                        rules={[{ required: true, message: 'Please enter address' }]}
                                    >
                                        <Input.TextArea placeholder="Enter complete address" rows={2} />
                                    </Form.Item>
                                    <Form.List name="mobile">
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Row key={key} gutter={16} align="middle">
                                                        <Col span={20}>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name]}
                                                                label={key === 0 ? "Mobile Numbers" : ""}
                                                                rules={[{ required: true, message: 'Please enter mobile number' }]}
                                                            >
                                                                <Input placeholder="9876543210" maxLength={10} />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col span={4}>
                                                            {fields.length > 1 && (
                                                                <Button
                                                                    type="text"
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => remove(name)}
                                                                    danger
                                                                />
                                                            )}
                                                        </Col>
                                                    </Row>
                                                ))}
                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Add Mobile Number
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label="Email (Optional)" name="email">
                                                <Input placeholder="email@example.com" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="Phone (Optional)" name="phone">
                                                <Input placeholder="011-12345678" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item label="Aadhaar Number (Optional)" name="aadharNumber">
                                                <Input placeholder="123456789012" maxLength={12} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="PAN Number (Optional)" name="panNumber">
                                                <Input placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <div style={{ textAlign: 'right', marginTop: 16 }}>
                                        <Button onClick={() => setShowAddGuarantorForm(false)} style={{ marginRight: 8 }}>
                                            Cancel
                                        </Button>
                                        <Button type="primary" htmlType="submit">
                                            Save Guarantor
                                        </Button>
                                    </div>
                                </Form>
                            </Card>
                        )}

                        {/* Products Section - GLOBAL SEARCH */}
                        <Card 
                            title={<><ShoppingCartOutlined /> Sale Items - Product Search</>}
                            style={{ marginBottom: 16 }}
                            bodyStyle={{ padding: '16px' }}
                            size="small"
                        >
                            {/* Global Product Search */}
                            <div style={{ marginBottom: 16 }}>
                                <Title level={5} style={{ marginBottom: 8 }}>
                                    <SearchOutlined /> Search Products
                                </Title>
                                <Input
                                    placeholder="Search by brand, model, or serial number (min 3 characters)..."
                                    value={globalSearchQuery}
                                    onChange={(e) => handleGlobalProductSearch(e.target.value)}
                                    suffix={<SearchOutlined />}
                                    size="large"
                                    style={{ marginBottom: 12 }}
                                />
                                
                                {searchLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <Spin size="large" />
                                        <div style={{ marginTop: 8 }}>Searching products...</div>
                                    </div>
                                ) : productSearchResults.length > 0 ? (
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                                        <Table
                                            size="small"
                                            dataSource={productSearchResults.slice((currentProductPage - 1) * 10, currentProductPage * 10)}
                                            pagination={false}
                                            scroll={{ x: 800 }}
                                            rowKey="_id"
                                            onRow={(record) => ({
                                                onClick: () => handleProductSelect(record),
                                                style: { cursor: 'pointer' }
                                            })}
                                            columns={[
                                                {
                                                    title: 'Brand',
                                                    dataIndex: 'brand',
                                                    key: 'brand',
                                                    width: 100,
                                                    render: (text) => text || 'N/A'
                                                },
                                                {
                                                    title: 'Model',
                                                    dataIndex: 'model_number',
                                                    key: 'model_number',
                                                    width: 120,
                                                    render: (text) => text || 'N/A'
                                                },
                                                {
                                                    title: 'Serial',
                                                    dataIndex: 'serial_number',
                                                    key: 'serial_number',
                                                    width: 120,
                                                    render: (text) => text || 'N/A'
                                                },
                                                {
                                                    title: 'Price',
                                                    dataIndex: 'dealer_price',
                                                    key: 'dealer_price',
                                                    width: 80,
                                                    render: (text) => text ? `₹${Number(text).toLocaleString('en-IN')}` : 'N/A'
                                                },
                                                {
                                                    title: 'Category',
                                                    key: 'category',
                                                    width: 120,
                                                    render: (_, record) => {
                                                        // First try category_name (direct field), then try populated categoryId
                                                        if (record.category_name) {
                                                            return record.category_name;
                                                        }
                                                        if (record.categoryId && typeof record.categoryId === 'object') {
                                                            return record.categoryId.name || 'N/A';
                                                        }
                                                        return 'N/A';
                                                    }
                                                },
                                                {
                                                    title: 'Distributor',
                                                    key: 'distributor',
                                                    width: 150,
                                                    render: (_, record) => {
                                                        const supplier = record.supplierId;
                                                        if (supplier && typeof supplier === 'object') {
                                                            return (
                                                                <div style={{ fontSize: '12px', lineHeight: '1.2' }}>
                                                                    <div style={{ fontWeight: 'bold' }}>{supplier.name}</div>
                                                                    <div style={{ color: '#666' }}>{supplier.gstNumber || 'N/A'}</div>
                                                                </div>
                                                            );
                                                        }
                                                        return 'N/A';
                                                    }
                                                },
                                                {
                                                    title: 'Action',
                                                    key: 'action',
                                                    width: 80,
                                                    render: (_, record) => (
                                                        <Button 
                                                            type="primary" 
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleProductSelect(record);
                                                            }}
                                                        >
                                                            Add to Sale
                                                        </Button>
                                                    )
                                                }
                                            ]}
                                        />
                                        {productSearchResults.length > 10 && (
                                            <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
                                                <Pagination
                                                    size="small"
                                                    current={currentProductPage}
                                                    total={productSearchResults.length}
                                                    pageSize={10}
                                                    onChange={setCurrentProductPage}
                                                    showSizeChanger={false}
                                                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} products`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : globalSearchQuery.length >= 3 ? (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="No products found matching your search"
                                    />
                                ) : globalSearchQuery.length > 0 && globalSearchQuery.length < 3 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                        Enter at least 3 characters to search products
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                        Start typing to search for products by brand, model, or serial number
                                    </div>
                                )}
                            </div>

                            {/* Current Sale Items List */}
                            <div style={{ marginTop: 16 }}>
                                <Title level={5} style={{ marginBottom: 8 }}>
                                    Sale Items ({saleItems.length})
                                </Title>
                                {saleItems.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {saleItems.map((item, index) => (
                                            <Card 
                                                key={item.key}
                                                type="inner"
                                                title={
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                                                            Item {index + 1}: {item.brand} {item.modelNumber}
                                                        </span>
                                                        <Popconfirm
                                                            title="Remove this item?"
                                                            description="Are you sure you want to remove this item from the sale?"
                                                            onConfirm={() => handleRemoveItem(index)}
                                                            onCancel={() => console.log('Remove cancelled')}
                                                            okText="Yes"
                                                            cancelText="No"
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
                                                    </div>
                                                }
                                                style={{ 
                                                    width: '100%',
                                                    border: '1px solid #d9d9d9',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    marginBottom: '16px'
                                                }}
                                                bodyStyle={{ padding: '24px' }}
                                                headStyle={{ 
                                                    padding: '16px 24px', 
                                                    backgroundColor: '#f8f9fa',
                                                    borderBottom: '1px solid #e8e8e8'
                                                }}
                                            >
                                                <Form layout="vertical" style={{ margin: 0 }}>
                                                    {/* Product Information Section */}
                                                    <div style={{ 
                                                        marginBottom: '20px', 
                                                        padding: '16px', 
                                                        backgroundColor: '#fafafa', 
                                                        borderRadius: '6px',
                                                        border: '1px solid #f0f0f0'
                                                    }}>
                                                        <Title level={5} style={{ marginBottom: '16px', color: '#595959' }}>
                                                            Product Information
                                                        </Title>
                                                        {/* Dynamic Product Information Fields */}
                                                        {(() => {
                                                            // Define all possible fields with their labels and property names
                                                            const productFields = [
                                                                { label: 'Brand', key: 'brand', type: 'text' },
                                                                { label: 'Model', key: 'modelNumber', type: 'text' },
                                                                { label: 'Serial Number', key: 'serialNumber', type: 'text' },
                                                                { label: 'Category', key: 'category', type: 'text' },
                                                                { label: 'Sub Category', key: 'subCategory', type: 'text' },
                                                                { label: 'Distributor', key: 'distributor', type: 'text' },
                                                                { label: 'Description', key: 'description', type: 'text' },
                                                                { label: 'MRP', key: 'mrp', type: 'currency' },
                                                                { label: 'Dealer Price', key: 'dealerPrice', type: 'currency' },
                                                                { label: 'Warranty', key: 'warranty', type: 'text' },
                                                                { label: 'IGST (%)', key: 'igst', type: 'percentage' },
                                                                { label: 'CGST (%)', key: 'cgst', type: 'percentage' },
                                                                { label: 'SGST (%)', key: 'sgst', type: 'percentage' },
                                                                { label: 'Color', key: 'color', type: 'text' },
                                                                { label: 'Storage', key: 'storage', type: 'text' },
                                                                { label: 'RAM', key: 'ram', type: 'text' },
                                                                { label: 'Processor', key: 'processor', type: 'text' },
                                                                { label: 'Operating System', key: 'operatingSystem', type: 'text' },
                                                                { label: 'Screen Size', key: 'screenSize', type: 'text' },
                                                                { label: 'Weight', key: 'weight', type: 'text' },
                                                                { label: 'Dimensions', key: 'dimensions', type: 'text' },
                                                                { label: 'Connectivity', key: 'connectivity', type: 'text' },
                                                                { label: 'Features', key: 'features', type: 'textarea' }
                                                            ];

                                                            // Add pricing fields that are always shown (editable)
                                                            const pricingFields = [
                                                                { label: 'Selling Price', key: 'sellingPrice', type: 'editable-currency', required: true },
                                                                { label: 'Discount Amount', key: 'discount', type: 'editable-currency', required: true },
                                                                { label: 'Discount %', key: 'discountPercentage', type: 'editable-percentage', required: true },
                                                                { label: 'Profit Amount', key: 'profit', type: 'currency', required: true },
                                                                { label: 'Profit %', key: 'profitPercentage', type: 'percentage', required: true }
                                                            ];

                                                            // Filter fields that have actual data (not N/A, null, undefined, or empty)
                                                            const fieldsWithData = productFields.filter(field => {
                                                                const value = field.value || item[field.key];
                                                                return value && 
                                                                       value !== 'N/A' && 
                                                                       value !== '' && 
                                                                       value !== null && 
                                                                       value !== undefined &&
                                                                       value.toString().trim() !== '';
                                                            });

                                                            // Combine filtered product fields with pricing fields
                                                            const allFields = [...fieldsWithData, ...pricingFields];

                                                            // Group fields into rows of 3
                                                            const rows = [];
                                                            for (let i = 0; i < allFields.length; i += 3) {
                                                                rows.push(allFields.slice(i, i + 3));
                                                            }

                                                            return rows.map((row, rowIndex) => (
                                                                <Row key={rowIndex} gutter={[16, 16]}>
                                                                    {row.map((field, colIndex) => {
                                                                        const value = field.value || item[field.key];
                                                                        const isFullWidth = field.type === 'textarea';
                                                                        const colSpan = isFullWidth ? 24 : 8;
                                                                        
                                                                        return (
                                                                            <Col key={field.key} xs={24} sm={isFullWidth ? 24 : 12} md={colSpan} lg={colSpan}>
                                                                                <Form.Item label={field.label} style={{ marginBottom: 16 }}>
                                                                                    {field.type === 'currency' ? (
                                                                                        <InputNumber 
                                                                                            value={value}
                                                                                            disabled 
                                                                                            style={{ 
                                                                                                width: '100%',
                                                                                                backgroundColor: '#f5f5f5',
                                                                                                color: '#595959'
                                                                                            }}
                                                                                            formatter={val => `₹ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                                            parser={val => val.replace(/₹\s?|(,*)/g, '')}
                                                                                        />
                                                                                    ) : field.type === 'percentage' ? (
                                                                                        <InputNumber 
                                                                                            value={value}
                                                                                            disabled 
                                                                                            style={{ 
                                                                                                width: '100%',
                                                                                                backgroundColor: '#f5f5f5',
                                                                                                color: '#595959'
                                                                                            }}
                                                                                            formatter={val => `${val}%`}
                                                                                            parser={val => val.replace('%', '')}
                                                                                            precision={2}
                                                                                        />
                                                                                    ) : field.type === 'editable-currency' ? (
                                                                                        <InputNumber
                                                                                            value={item[field.key]}
                                                                                            onChange={(val) => handleItemChange(index, field.key, val)}
                                                                                            style={{ width: '100%' }}
                                                                                            min={0}
                                                                                            formatter={val => `₹ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                                            parser={val => val.replace(/₹\s?|(,*)/g, '')}
                                                                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                                                                            size="large"
                                                                                        />
                                                                                    ) : field.type === 'editable-percentage' ? (
                                                                                        <InputNumber
                                                                                            value={item[field.key]}
                                                                                            onChange={(val) => handleItemChange(index, field.key, val)}
                                                                                            style={{ width: '100%' }}
                                                                                            min={0}
                                                                                            max={100}
                                                                                            formatter={val => `${val}%`}
                                                                                            parser={val => val.replace('%', '')}
                                                                                            precision={2}
                                                                                            placeholder="Enter discount %"
                                                                                            size="large"
                                                                                        />
                                                                                    ) : field.type === 'textarea' ? (
                                                                                        <Input.TextArea 
                                                                                            value={value}
                                                                                            disabled 
                                                                                            rows={2}
                                                                                            style={{ 
                                                                                                backgroundColor: '#f5f5f5',
                                                                                                color: '#595959',
                                                                                                borderColor: '#d9d9d9'
                                                                                            }} 
                                                                                        />
                                                                                    ) : (
                                                                                        <Input 
                                                                                            value={value}
                                                                                            disabled 
                                                                                            style={{ 
                                                                                                backgroundColor: '#f5f5f5',
                                                                                                color: '#595959',
                                                                                                borderColor: '#d9d9d9'
                                                                                            }} 
                                                                                        />
                                                                                    )}
                                                                                </Form.Item>
                                                                            </Col>
                                                                        );
                                                                    })}
                                                                    {/* Fill remaining columns if row has less than 3 items and no textarea */}
                                                                    {row.length < 3 && !row.some(field => field.type === 'textarea') && 
                                                                        Array.from({ length: 3 - row.length }).map((_, emptyIndex) => (
                                                                            <Col key={`empty-${rowIndex}-${emptyIndex}`} xs={0} sm={0} md={8} lg={8} />
                                                                        ))
                                                                    }
                                                                </Row>
                                                            ));
                                                        })()}
                                                    </div>

                                                </Form>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '40px 20px', 
                                        backgroundColor: '#fafafa',
                                        border: '1px dashed #d9d9d9',
                                        borderRadius: '8px'
                                    }}>
                                        <ShoppingCartOutlined style={{ fontSize: '48px', color: '#bfbfbf', marginBottom: '16px' }} />
                                        <Title level={4} style={{ color: '#8c8c8c', margin: '0 0 8px 0' }}>
                                            No items added to sale
                                        </Title>
                                        <Text style={{ color: '#8c8c8c' }}>
                                            Search and select products above to add them to this sale
                                        </Text>
                                    </div>
                                )}
                            </div>
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
                        <div className="order-summary-container">
                            <Card 
                                title="Order Summary" 
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                                className="order-summary-card"
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
                        </div>
                    </Col>
                </Row>
            </Form>
        </>
    );
};

export default AddSale;
