import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    AutoComplete,
    Modal,
    Tag,
    Checkbox
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
                {field.type === 'text' && (
                    <Input
                        placeholder={field.label}
                        size="large"
                        style={{ fontSize: '14px' }}
                        onChange={(e) => {
                            // Auto-uppercase for serial and model number fields
                            if (field.field_id === 'serial_number' || field.field_id === 'model_number') {
                                const upper = e.target.value?.toUpperCase();
                                form.setFieldsValue({ [`${field.field_id}_product_${productId}`]: upper });
                            }
                        }}
                    />
                )}
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
    const [copyPrevious, setCopyPrevious] = useState(false); // toggle to copy last product data when adding new
    const pendingCopyRef = useRef(null); // holds values to apply after render
    
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
            await fetchRootCategories();
        } catch (error) {
            console.error('❌ Error fetching initial data:', error);
        }
    };

    const fetchRootCategories = async () => {
        try {
            const resp = await apiService.categories.getRoots();
            if (resp.data.success) {
                const roots = resp.data.data || [];
                // Treat roots as first level
                setProducts(prev => prev.map(p => ({ ...p, categoryLevels: [roots.map(r => ({ _id: r.root_id, name: r.name, is_leaf: false }))] })));
            }
        } catch (e) { console.error('❌ Error fetching root categories:', e); }
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
        const last = products[products.length - 1];
        const base = copyPrevious ? last : products[0];
        const copying = copyPrevious && !!base.finalCategoryId;
        const isMobile = copying && base.categoryFormSchema.some(f => f.field_id === 'mobile_imei');

        const newProduct = {
            id: newProductId,
            categoryLevels: base.categoryLevels,
            selectedCategoryPath: copying ? [...base.selectedCategoryPath] : [],
            finalCategoryId: copying ? base.finalCategoryId : null,
            categoryFormSchema: copying ? JSON.parse(JSON.stringify(base.categoryFormSchema)) : [],
            imeiFields: isMobile ? base.imeiFields.map((f, idx) => ({ id: idx + 1, value: '' })) : [{ id: 1, value: '' }]
        };
        setProducts(prev => [...prev, newProduct]);

        if (copying) {
            const allVals = form.getFieldsValue(true); // get all registered values
            const suffixOld = `_product_${base.id}`;
            const suffixNew = `_product_${newProductId}`;
            const updates = {};
            Object.keys(allVals).forEach(key => {
                if (key.endsWith(suffixOld)) {
                    if (key.includes('serial_number') || key.startsWith('mobile_imei_')) return; // skip serial & IMEIs
                    const v = allVals[key];
                    if (v === undefined || v === null || v === '') return;
                    updates[key.replace(suffixOld, suffixNew)] = v;
                }
            });
            const catFieldOld = `categoryId_product_${base.id}`;
            if (allVals[catFieldOld]) updates[`categoryId_product_${newProductId}`] = allVals[catFieldOld];
            pendingCopyRef.current = { productId: newProductId, values: updates };
        }
    };

    // Apply deferred copy once products state (and new dynamic fields) have rendered
    useEffect(() => {
        if (!pendingCopyRef.current) return;
        const { productId, values } = pendingCopyRef.current;
        // Set form values (even if some fields not yet mounted; they'll pick up on mount)
        form.setFieldsValue(values);
        // Attempt focus after next paint
        requestAnimationFrame(() => {
            const input = document.querySelector(`input[name='serial_number_product_${productId}']`);
            if (input) input.focus();
        });
        // Clear ref
        pendingCopyRef.current = null;
    }, [products, form]);

    const handleSubmit = async (values) => {
        console.log('[AddProduct] handleSubmit triggered with values:', values);
        if (!values.distributorId) {
            message.error('Please select a distributor');
            return;
        }
        // Frontend validation: for each product ensure dealer_price <= mrp if both present
        for (const p of products) {
            const mrpVal = values[`mrp_product_${p.id}`];
            const dealerVal = values[`dealer_price_product_${p.id}`];
            if (mrpVal != null && dealerVal != null && Number(dealerVal) > Number(mrpVal)) {
                message.error(`Dealer Price cannot exceed MRP (Product ${p.id})`);
                return;
            }
        }
        setLoading(true);
        try {
            const productsArray = products.map(p => {
                const productData = { supplierId: values.distributorId };
                const categoryIdField = values[`categoryId_product_${p.id}`];
                if (categoryIdField) {
                    productData.categoryId = categoryIdField;
                }
                Object.keys(values).forEach(key => {
                    if (key.endsWith(`_product_${p.id}`)) {
                        const cleanKey = key.replace(`_product_${p.id}`, '');
                        if (!cleanKey.startsWith('mobile_imei_') && cleanKey !== 'categoryId') {
                            let v = values[key];
                            if (cleanKey === 'serial_number' && typeof v === 'string') v = v.toUpperCase();
                            productData[cleanKey] = v;
                        }
                    }
                });
                if (isMobileCategory(p.id)) {
                    productData.mobile_imei = p.imeiFields.map(f => values[`mobile_imei_${f.id}_product_${p.id}`]).filter(Boolean);
                }
                return productData;
            }).filter(p => p.categoryId);
            console.log('[AddProduct] Built productsArray:', productsArray);

            if (productsArray.length === 0) {
                message.error('Please select a category for at least one product.');
                setLoading(false);
                return;
            }

            console.log('[AddProduct] Sending create request...');
            const response = await apiService.products.create({ products: productsArray });
            console.log('[AddProduct] Response:', response.data);
            const { success, errors = [], message: msg } = response.data || {};

            const formatErrorsNode = (errs, summary) => {
                if (!errs.length) return null;
                const max = 40; // show up to 40 detailed entries
                const items = errs.slice(0, max).map((e, idx) => {
                    const msg = e.message || '';
                    // Highlight duplicate serial
                    const serialMatch = msg.match(/Duplicate serial number '([^']+)'/i);
                    const imeiMatch = msg.match(/IMEI numbers? already exist \(([^)]+)\)/i);
                    let formattedDetail = msg;
                    if (serialMatch) {
                        formattedDetail = (
                            <>
                                Duplicate serial number <Tag color="red" style={{ fontSize: 11 }}>{serialMatch[1]}</Tag> already exists
                            </>
                        );
                    } else if (imeiMatch) {
                        const imeis = imeiMatch[1].split(/[,\s]+/).filter(Boolean);
                        formattedDetail = (
                            <>
                                IMEI already exists: {imeis.map((im, i2) => <Tag key={i2} color="volcano" style={{ marginBottom: 2, fontSize: 11 }}>{im}</Tag>)}
                            </>
                        );
                    }
                    return (
                        <li key={idx} style={{ marginBottom: 4, fontSize: 12, lineHeight: 1.3 }}>
                            <strong style={{ color: '#444' }}>Product {e.index}:</strong> {formattedDetail}
                        </li>
                    );
                });
                return (
                    <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                        {summary && (
                            <p style={{ margin: '0 0 8px', fontSize: 12 }}>
                                Created <strong>{summary.successful}</strong> of <strong>{summary.total}</strong> products. Failures: <strong>{summary.failed}</strong>
                            </p>
                        )}
                        <ul style={{ paddingLeft: 18, margin: 0 }}>{items}</ul>
                        {errors.length > max && <p style={{ marginTop: 8, fontSize: 12 }}>...and {errors.length - max} more.</p>}
                    </div>
                );
            };

            if (success) {
                if (errors.length) {
                    Modal.warning({
                        title: 'Some products could not be added',
                        width: 560,
                        content: formatErrorsNode(errors, response.data.summary),
                        okText: 'OK'
                    });
                } else {
                    message.success(`${productsArray.length} product(s) added successfully!`);
                }
                // Reset only if at least one product created
                if ((response.data.summary?.successful || 0) > 0) {
                    form.resetFields();
                    setDistributorSearchValue('');
                    setSelectedDistributor(null);
                    setProducts([{ id: 1, categoryLevels: [], selectedCategoryPath: [], finalCategoryId: null, categoryFormSchema: [], imeiFields: [{ id: 1, value: '' }] }]);
                    await fetchRootCategories();
                }
            } else {
                // Failure (e.g., duplicate serial/IMEI when none created)
                const primaryErrorMsg = errors.length ? formatErrorsNode(errors, response.data.summary) : (msg || 'Failed to add products');
                Modal.error({
                    title: 'Product Creation Failed',
                    width: 560,
                    content: primaryErrorMsg,
                    okText: 'OK'
                });
            }
        } catch (error) {
            console.error('[AddProduct] Error creating products:', error);
            const server = error.response?.data;
            const errorsArr = server?.errors || [];
            const duplicateError = errorsArr.length ? errorsArr[0].message : (server?.message || error.message || 'An error occurred.');
            const formatSingle = () => {
                const msg = duplicateError;
                const serialMatch = msg.match(/Duplicate serial number '([^']+)'/i);
                const imeiMatch = msg.match(/IMEI numbers? already exist \(([^)]+)\)/i);
                if (serialMatch) {
                    return <span>Duplicate serial number <Tag color="red" style={{ fontSize: 11 }}>{serialMatch[1]}</Tag> already exists</span>;
                } else if (imeiMatch) {
                    const imeis = imeiMatch[1].split(/[,\s]+/).filter(Boolean);
                    return <span>IMEI already exists: {imeis.map((im,i) => <Tag key={i} color="volcano" style={{ fontSize: 11, marginBottom: 2 }}>{im}</Tag>)}</span>;
                }
                return msg;
            };
            Modal.error({
                title: 'Product Creation Error',
                width: 520,
                content: formatSingle(),
                okText: 'OK'
            });
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
                        title={<span>Product Details ({products.length} product{products.length > 1 ? 's' : ''})</span>}
                        style={{ marginBottom: 24 }}
                        bodyStyle={{ padding: '16px' }}
                    >
                        {products.map((product, productIndex) => (
                            <div key={product.id} style={{ marginBottom: productIndex < products.length - 1 ? '32px' : '0' }}>
                                {productIndex > 0 && <div style={{ borderTop: '2px solid #e8e8e8', margin: '24px 0', paddingTop: '16px', position: 'relative' }}><div style={{ position: 'absolute', top: '-12px', left: '16px', backgroundColor: '#fff', padding: '0 8px', fontSize: '12px', fontWeight: 600, color: '#666' }}>Product {product.id}</div></div>}
                                <Row gutter={16}>
                                    {product.categoryLevels.map((levelCategories, levelIndex) => (
                                        <Col key={levelIndex} xs={24} sm={12} md={8} lg={6}>
                                            {/* Dynamic level label: root = Main Category, subsequent levels = Sub Category N (1-based) */}
                                            <Form.Item label={<span style={{ fontSize: '12px', fontWeight: 500 }}>{levelIndex === 0 ? 'Main Category' : `Sub Category ${levelIndex}`}</span>} style={{ marginBottom: '16px' }}>
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
                                {productIndex === products.length - 1 && (
                                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '8px 4px', borderTop: '1px dashed #e5e5e5' }}>
                                        <Checkbox
                                            checked={copyPrevious}
                                            onChange={e => setCopyPrevious(e.target.checked)}
                                            style={{ fontSize: 12 }}
                                        >Copy previous when adding next</Checkbox>
                                        <Button type="primary" icon={<PlusCircleOutlined />} onClick={addAnotherProduct} size="small" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Add Another Product</Button>
                                    </div>
                                )}
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
                                // Use root categories loader (renamed from legacy top-level fetch)
                                fetchRootCategories();
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
