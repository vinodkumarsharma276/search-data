import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    Switch,
    AutoComplete
} from 'antd';
import {
    SaveOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title } = Typography;
const { Option } = Select;

// This component handles the rendering and visibility logic for a single dynamic field.
const DynamicField = ({ field, productId, form, isMobileCategory, addImeiField, removeImeiField, updateImeiValue, imeiFields }) => {
    // This hook watches for changes in any form field and triggers a re-render
    const watchedValues = Form.useWatch([], form);

    // useMemo will re-evaluate the field's visibility whenever watchedValues changes.
    const isVisible = useMemo(() => {
        if (!field.visibility_rules || field.visibility_rules.length === 0) {
            return true; // Always visible if there are no rules
        }

        // Check if ANY of the visibility rules match (OR logic)
        return field.visibility_rules.some(rule => {
            const controllingFieldName = `${rule.field}_product_${productId}`;
            const controllingFieldValue = form.getFieldValue(controllingFieldName);

            if (controllingFieldValue === undefined || controllingFieldValue === null) {
                return false; // Don't show if the dependent field isn't set
            }

            switch (rule.operator) {
                case 'equals':
                    return controllingFieldValue === rule.value;
                case 'not_equals':
                    return controllingFieldValue !== rule.value;
                // Add other operators here if needed
                default:
                    return false;
            }
        });
    }, [watchedValues, field.visibility_rules, productId, form]);

    // This effect clears the field's value if it becomes hidden
    useEffect(() => {
        if (!isVisible) {
            const fieldName = `${field.field_id}_product_${productId}`;
            if (form.getFieldValue(fieldName)) {
                form.setFieldsValue({ [fieldName]: undefined });
            }
        }
    }, [isVisible, field.field_id, productId, form]);

    if (!isVisible) {
        return null; // Don't render the field if it's not visible
    }

    // Special handling for IMEI fields in the Mobile category
    if (field.field_id === 'mobile_imei' && isMobileCategory(productId)) {
        return imeiFields.map((imeiField, imeiIndex) => (
            <Col key={`${field.field_id}_${imeiField.id}_product_${productId}`} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Form.Item
                    label={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', fontWeight: 500 }}>IMEI {imeiField.id}</span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                {imeiIndex === imeiFields.length - 1 && (
                                    <PlusCircleOutlined style={{ fontSize: '12px', color: '#52c41a', cursor: 'pointer', padding: '2px' }} onClick={() => addImeiField(productId)} title="Add IMEI field" />
                                )}
                                {imeiFields.length > 1 && (
                                    <MinusCircleOutlined style={{ fontSize: '12px', color: '#ff4d4f', cursor: 'pointer', padding: '2px' }} onClick={() => removeImeiField(imeiField.id, productId)} title="Remove IMEI field" />
                                )}
                            </div>
                        </div>
                    }
                    name={`mobile_imei_${imeiField.id}_product_${productId}`}
                    style={{ marginBottom: '16px' }}
                    rules={[
                        ...(field.is_required && imeiIndex === 0 ? [{ required: true, message: 'Please enter at least one IMEI number' }] : []),
                        { pattern: /^\d{15}$/, message: 'IMEI must be 15 digits' }
                    ]}
                >
                    <Input placeholder={`IMEI ${imeiField.id} (15 digits)`} size="large" style={{ fontSize: '14px' }} maxLength={15} onChange={(e) => updateImeiValue(imeiField.id, e.target.value, productId)} />
                </Form.Item>
            </Col>
        ));
    }

    // Default rendering for all other field types
    return (
        <Col key={`${field.field_id}_product_${productId}`} xs={24} sm={12} md={8} lg={6} xl={6}>
            <Form.Item
                label={<span style={{ fontSize: '12px', fontWeight: 500 }}>{field.label}</span>}
                name={`${field.field_id}_product_${productId}`}
                style={{ marginBottom: '16px' }}
                rules={[
                    ...(field.is_required ? [{ required: true, message: `Please enter ${field.label.toLowerCase()}` }] : []),
                    ...(field.type === 'number' ? [{ type: 'number', message: 'Please enter a valid number' }] : [])
                ]}
            >
                {field.type === 'text' && <Input placeholder={field.label} size="large" style={{ fontSize: '14px' }} />}
                {field.type === 'number' && <InputNumber placeholder={field.label} style={{ width: '100%', fontSize: '14px' }} size="large" />}
                {(field.type === 'dropdown' || field.type === 'combobox') && (
                    <Select placeholder={field.label} mode={field.type === 'combobox' ? 'tags' : undefined} allowClear size="large" style={{ fontSize: '14px' }} dropdownStyle={{ fontSize: '14px' }}>
                        {field.options && field.options.map(option => (
                            <Option key={option.value} value={option.value}>{option.label}</Option>
                        ))}
                    </Select>
                )}
                {field.type === 'boolean' && <Switch checkedChildren="Yes" unCheckedChildren="No" size="default" defaultChecked={field.default_value} />}
            </Form.Item>
        </Col>
    );
};


const AddProduct = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [distributors, setDistributors] = useState([]);
    const [distributorOptions, setDistributorOptions] = useState([]);
    const [distributorSearchValue, setDistributorSearchValue] = useState('');
    const [selectedDistributor, setSelectedDistributor] = useState(null);
    const [loadingCategorySchema, setLoadingCategorySchema] = useState(false);
    
    const [productCount, setProductCount] = useState(1);
    const [products, setProducts] = useState([{
        id: 1,
        categoryLevels: [],
        selectedCategoryPath: [],
        finalCategoryId: null,
        categoryFormSchema: [],
        imeiFields: [{ id: 1, value: '' }]
    }]);
    
    const getProductState = (productId) => products.find(p => p.id === productId) || products[0];
    
    const updateProductState = (productId, updates) => {
        setProducts(prevProducts => 
            prevProducts.map(product => 
                product.id === productId ? { ...product, ...updates } : product
            )
        );
    };

    useEffect(() => {
        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (distributors.length > 0) {
            const distributorId = form.getFieldValue('distributorId');
            if (distributorId) {
                const selected = distributors.find(d => d._id === distributorId);
                if (selected) {
                    setDistributorSearchValue(`${selected.name} | ${selected.gstNumber || 'No GST'}`);
                }
            }
        }
    }, [distributors, form]);

    const fetchDropdownData = async () => {
        try {
            const distributorsResponse = await apiService.distributors.getAll();
            if (distributorsResponse.data.success) {
                setDistributors(distributorsResponse.data.distributors || []);
            }
            await fetchTopLevelCategories();
        } catch (error) {
            console.error('❌ Error fetching initial data:', error);
        }
    };

    const fetchTopLevelCategories = async () => {
        try {
            const response = await apiService.categories.getTopLevel();
            if (response.data.success) {
                const topLevelCategories = response.data.data || [];
                setProducts(prev => prev.map(p => ({ ...p, categoryLevels: [topLevelCategories] })));
            }
        } catch (error) {
            console.error('❌ Error fetching top-level categories:', error);
        }
    };

    const handleDistributorSearch = useCallback((value) => {
        setDistributorSearchValue(value);
        if (value.length >= 3) {
            const searchTerm = value.toLowerCase();
            const filtered = distributors.filter(d =>
                d.name?.toLowerCase().includes(searchTerm) ||
                d.gstNumber?.toLowerCase().includes(searchTerm) ||
                d.primaryPhone?.includes(searchTerm)
            ).slice(0, 10);
            
            setDistributorOptions(filtered.map(d => ({
                value: `${d.name} | ${d.gstNumber || 'No GST'}`,
                label: `${d.name} | ${d.gstNumber || 'No GST'}`,
                distributor: d
            })));
        } else {
            setDistributorOptions([]);
        }
    }, [distributors]);

    const handleDistributorSelect = useCallback((value, option) => {
        if (option && option.distributor) {
            const { distributor } = option;
            setSelectedDistributor(distributor);
            setDistributorSearchValue(value);
            form.setFieldsValue({ distributorId: distributor._id });
            setDistributorOptions([]);
            form.validateFields(['distributorId']);
        }
    }, [form]);

    const handleCategorySelection = async (categoryId, levelIndex, productId) => {
        const currentProduct = getProductState(productId);
        const newPath = currentProduct.selectedCategoryPath.slice(0, levelIndex);
        newPath[levelIndex] = categoryId;
        const newLevels = currentProduct.categoryLevels.slice(0, levelIndex + 1);

        try {
            const categoryResponse = await apiService.categories.getById(categoryId);
            if (!categoryResponse.data.success) return;
            
            const category = categoryResponse.data.data;
            if (category.is_leaf) {
                setLoadingCategorySchema(true);
                const schemaResponse = await apiService.categories.getFormSchema(categoryId);
                const schema = schemaResponse.data.success ? schemaResponse.data.data || [] : [];
                updateProductState(productId, {
                    selectedCategoryPath: newPath,
                    categoryLevels: newLevels,
                    finalCategoryId: categoryId,
                    categoryFormSchema: schema
                });
                form.setFieldsValue({ [`categoryId_product_${productId}`]: categoryId });
                setLoadingCategorySchema(false);
            } else {
                const childrenResponse = await apiService.categories.getChildren(categoryId);
                if (childrenResponse.data.success && childrenResponse.data.data.length > 0) {
                    updateProductState(productId, {
                        selectedCategoryPath: newPath,
                        categoryLevels: [...newLevels, childrenResponse.data.data],
                        finalCategoryId: null,
                        categoryFormSchema: []
                    });
                }
                form.setFieldsValue({ [`categoryId_product_${productId}`]: undefined });
            }
        } catch (error) {
            console.error('❌ Error handling category selection:', error);
            setLoadingCategorySchema(false);
        }
    };

    const isMobileCategory = (productId) => {
        const p = getProductState(productId);
        return p.finalCategoryId && p.categoryFormSchema.some(f => f.field_id === 'mobile_imei');
    };

    const addImeiField = (productId) => {
        const p = getProductState(productId);
        const newId = (p.imeiFields.length > 0 ? Math.max(...p.imeiFields.map(f => f.id)) : 0) + 1;
        updateProductState(productId, { imeiFields: [...p.imeiFields, { id: newId, value: '' }] });
    };

    const removeImeiField = (idToRemove, productId) => {
        const p = getProductState(productId);
        if (p.imeiFields.length > 1) {
            updateProductState(productId, { imeiFields: p.imeiFields.filter(f => f.id !== idToRemove) });
            form.setFieldsValue({ [`mobile_imei_${idToRemove}_product_${productId}`]: undefined });
        }
    };

    const updateImeiValue = (id, value, productId) => {
        const p = getProductState(productId);
        updateProductState(productId, {
            imeiFields: p.imeiFields.map(f => f.id === id ? { ...f, value } : f)
        });
    };

    const addAnotherProduct = () => {
        const newProductId = (products.length > 0 ? Math.max(...products.map(p => p.id)) : 0) + 1;
        const firstProduct = getProductState(products[0].id);
        
        setProducts([...products, {
            id: newProductId,
            categoryLevels: firstProduct.categoryLevels,
            selectedCategoryPath: [],
            finalCategoryId: null,
            categoryFormSchema: [],
            imeiFields: [{ id: 1, value: '' }]
        }]);
    };

    const handleSubmit = async (values) => {
        if (!values.distributorId) {
            message.error('Please select a distributor');
            return;
        }
        setLoading(true);
        try {
            const productsArray = products.map(p => {
                const productData = { supplierId: values.distributorId };
                Object.keys(values).forEach(key => {
                    if (key.endsWith(`_product_${p.id}`)) {
                        const cleanKey = key.replace(`_product_${p.id}`, '');
                        if (!cleanKey.startsWith('mobile_imei_')) {
                            productData[cleanKey] = values[key];
                        }
                    }
                });
                if (isMobileCategory(p.id)) {
                    productData.mobile_imei = p.imeiFields.map(f => values[`mobile_imei_${f.id}_product_${p.id}`]).filter(Boolean);
                }
                return productData;
            }).filter(p => p.categoryId);

            if (productsArray.length === 0) {
                message.error('Please select a category for at least one product.');
                setLoading(false);
                return;
            }

            const response = await apiService.products.create({ products: productsArray });
            if (response.data.success) {
                message.success(`${productsArray.length} product(s) added successfully!`);
                form.resetFields();
                setDistributorSearchValue('');
                setSelectedDistributor(null);
                setProducts([{
                    id: 1,
                    categoryLevels: [],
                    selectedCategoryPath: [],
                    finalCategoryId: null,
                    categoryFormSchema: [],
                    imeiFields: [{ id: 1, value: '' }]
                }]);
                fetchTopLevelCategories();
            } else {
                message.error(response.data.message || 'Failed to add products.');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Breadcrumb style={{ marginBottom: '24px' }}>
                <Breadcrumb.Item><Link to="/dashboard">Dashboard</Link></Breadcrumb.Item>
                <Breadcrumb.Item>Add Product</Breadcrumb.Item>
            </Breadcrumb>
            <Card style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e1e5e9' }}>
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
                    <Card title="Distributor Information" style={{ marginBottom: 24 }} bodyStyle={{ padding: '16px' }}>
                        <Row gutter={16}>
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Form.Item name="distributorId" rules={[{ required: true, message: 'Please select a distributor' }]} style={{ display: 'none' }}><Input /></Form.Item>
                                <Form.Item label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Distributor Search <span style={{ color: '#ff4d4f' }}>*</span></span>} validateStatus={form.getFieldError('distributorId').length ? 'error' : ''} help={form.getFieldError('distributorId')[0]} style={{ marginBottom: '16px' }}>
                                    <AutoComplete
                                        options={distributorOptions}
                                        onSearch={handleDistributorSearch}
                                        onSelect={handleDistributorSelect}
                                        value={distributorSearchValue}
                                        placeholder="Type 3+ chars to search..."
                                        allowClear
                                        size="large"
                                        onClear={() => {
                                            setDistributorSearchValue('');
                                            setSelectedDistributor(null);
                                            form.setFieldsValue({ distributorId: undefined });
                                        }}
                                    />
                                </Form.Item>
                            </Col>
                            {selectedDistributor && (
                                <>
                                    <Col xs={24} sm={12} md={8} lg={6}><Form.Item label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Name</span>}><Input value={selectedDistributor.name} readOnly size="large" /></Form.Item></Col>
                                    <Col xs={24} sm={12} md={8} lg={6}><Form.Item label={<span style={{ fontSize: '12px', fontWeight: 500 }}>GST</span>}><Input value={selectedDistributor.gstNumber || 'N/A'} readOnly size="large" /></Form.Item></Col>
                                    <Col xs={24} sm={12} md={8} lg={6}><Form.Item label={<span style={{ fontSize: '12px', fontWeight: 500 }}>PAN</span>}><Input value={selectedDistributor.panNumber || 'N/A'} readOnly size="large" /></Form.Item></Col>
                                    <Col xs={24} sm={12} md={8} lg={6}><Form.Item label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Mobile</span>}><Input value={selectedDistributor.primaryPhone || 'N/A'} readOnly size="large" /></Form.Item></Col>
                                    <Col xs={24} sm={12} md={8} lg={6}><Form.Item label={<span style={{ fontSize: '12px', fontWeight: 500 }}>Address</span>}><Input value={selectedDistributor.address || 'N/A'} readOnly size="large" /></Form.Item></Col>
                                </>
                            )}
                        </Row>
                    </Card>

                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Product Details ({products.length} product{products.length > 1 ? 's' : ''})</span>
                                <Button type="primary" icon={<PlusCircleOutlined />} onClick={addAnotherProduct} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Add Another Product</Button>
                            </div>
                        }
                        style={{ marginBottom: 24 }}
                        bodyStyle={{ padding: '16px' }}
                    >
                        {products.map((product, productIndex) => (
                            <div key={product.id} style={{ marginBottom: productIndex < products.length - 1 ? '32px' : '0' }}>
                                {productIndex > 0 && <div style={{ borderTop: '2px solid #e8e8e8', margin: '24px 0', paddingTop: '16px', position: 'relative' }}><div style={{ position: 'absolute', top: '-12px', left: '16px', backgroundColor: '#fff', padding: '0 8px', fontSize: '12px', fontWeight: 600, color: '#666' }}>Product {product.id}</div></div>}
                                <Row gutter={16}>
                                    {product.categoryLevels.map((levelCategories, levelIndex) => (
                                        <Col key={levelIndex} xs={24} sm={12} md={8} lg={6}>
                                            <Form.Item label={<span style={{ fontSize: '12px', fontWeight: 500 }}>{levelIndex === 0 ? 'Main Category' : `Category ${levelIndex + 1}`}</span>} style={{ marginBottom: '16px' }}>
                                                <Select
                                                    placeholder={levelIndex === 0 ? 'Select Main' : 'Select Sub'}
                                                    value={product.selectedCategoryPath[levelIndex]}
                                                    onChange={(value) => handleCategorySelection(value, levelIndex, product.id)}
                                                    loading={loadingCategorySchema && levelIndex === product.categoryLevels.length - 1}
                                                    size="large"
                                                >
                                                    {levelCategories.map(cat => <Option key={cat._id} value={cat._id}>{cat.name}</Option>)}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    ))}
                                    
                                    {product.finalCategoryId && product.categoryFormSchema.map(field => (
                                        <DynamicField
                                            key={`${field.field_id}_product_${product.id}`}
                                            field={field}
                                            productId={product.id}
                                            form={form}
                                            isMobileCategory={isMobileCategory}
                                            addImeiField={addImeiField}
                                            removeImeiField={removeImeiField}
                                            updateImeiValue={updateImeiValue}
                                            imeiFields={product.imeiFields}
                                        />
                                    ))}
                                </Row>
                                <Form.Item key={`categoryId_product_${product.id}`} name={`categoryId_product_${product.id}`} style={{ display: 'none' }}><Input /></Form.Item>
                            </div>
                        ))}
                    </Card>

                    <Form.Item style={{ marginTop: '32px', textAlign: 'center' }}>
                        <Space size="large">
                            <Button type="default" size="large" onClick={() => {
                                form.resetFields();
                                setDistributorSearchValue('');
                                setSelectedDistributor(null);
                                setProducts([{ id: 1, categoryLevels: [], selectedCategoryPath: [], finalCategoryId: null, categoryFormSchema: [], imeiFields: [{ id: 1, value: '' }] }]);
                                fetchTopLevelCategories();
                            }}>Reset Form</Button>
                            <Button type="primary" htmlType="submit" size="large" loading={loading} icon={<SaveOutlined />} style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', minWidth: '150px' }}>
                                Save {products.length > 1 ? `All Products (${products.length})` : 'Product'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </>
    );
};

export default AddProduct;
