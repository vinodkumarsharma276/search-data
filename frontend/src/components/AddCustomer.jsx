import React, { useState } from 'react';
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
    Select
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    UsergroupAddOutlined,
    UserOutlined,
    PhoneOutlined,
    HomeOutlined,
    IdcardOutlined,
    PlusOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddCustomer = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        console.log('👤 Submitting customer data:', values);
        setLoading(true);

        try {
            // Map form fields to Customer model fields
            const customerData = {
                name: values.name,
                address: values.address,
                zone: values.zone,
                mobile: values.mobile || [],
                aadharNumber: values.aadharNumber,
                panNumber: values.panNumber,
                isActive: true
            };

            const response = await apiService.customers.create(customerData);
            
            if (response.data.success) {
                message.success('Customer added successfully!');
                console.log('✅ Customer saved:', response.data);
                form.resetFields();
            } else {
                message.error(response.data.message || 'Failed to add customer');
                console.error('❌ Error saving customer:', response.data);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to add customer. Please try again.';
            message.error(errorMessage);
            console.error('❌ API error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Breadcrumb style={{ marginBottom: '24px' }}>
                <Breadcrumb.Item>
                    <Link to="/dashboard">Dashboard</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>Add Customer</Breadcrumb.Item>
            </Breadcrumb>

            <Card
                title={
                    <Space>
                        <UsergroupAddOutlined style={{ color: '#eb2f96' }} />
                        <Title level={3} style={{ margin: 0, color: '#333333' }}>
                            Add New Customer
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
                    initialValues={{
                        mobile: ['']
                    }}
                >
                    {/* Customer Information */}
                    <Title level={4} style={{ marginTop: 0, color: '#333333' }}>
                        <UserOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                        Customer Information
                    </Title>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Name"
                                name="name"
                                rules={[
                                    { required: true, message: 'Please enter customer name' },
                                    { min: 2, message: 'Name must be at least 2 characters' }
                                ]}
                            >
                                <Input 
                                    placeholder="Enter full name"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Zone"
                                name="zone"
                                rules={[{ required: true, message: 'Please select zone' }]}
                            >
                                <Select placeholder="Select zone" size="large">
                                    <Option value="North">North</Option>
                                    <Option value="South">South</Option>
                                    <Option value="East">East</Option>
                                    <Option value="West">West</Option>
                                    <Option value="Central">Central</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="Address"
                        name="address"
                        rules={[{ required: true, message: 'Please enter address' }]}
                    >
                        <Input.TextArea 
                            placeholder="Enter complete address"
                            rows={3}
                            size="large"
                        />
                    </Form.Item>

                    {/* Mobile Numbers */}
                    <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                        <PhoneOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                        Mobile Numbers
                    </Title>

                    <Form.List
                        name="mobile"
                        rules={[
                            {
                                validator: async (_, mobile) => {
                                    if (!mobile || mobile.length < 1) {
                                        return Promise.reject(new Error('At least one mobile number is required'));
                                    }
                                },
                            },
                        ]}
                    >
                        {(fields, { add, remove }, { errors }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={16} align="middle">
                                        <Col span={20}>
                                            <Form.Item
                                                {...restField}
                                                name={[name]}
                                                rules={[
                                                    { required: true, message: 'Please enter mobile number' },
                                                    { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit mobile number' }
                                                ]}
                                            >
                                                <Input 
                                                    placeholder="9876543210"
                                                    size="large"
                                                    maxLength={10}
                                                    prefix={<PhoneOutlined style={{ color: '#666666' }} />}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            {fields.length > 1 && (
                                                <Button
                                                    type="text"
                                                    icon={<MinusCircleOutlined />}
                                                    onClick={() => remove(name)}
                                                    danger
                                                    size="large"
                                                />
                                            )}
                                        </Col>
                                    </Row>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                        size="large"
                                    >
                                        Add Mobile Number
                                    </Button>
                                    <Form.ErrorList errors={errors} />
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    {/* Identification Information */}
                    <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                        <IdcardOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                        Identification (Optional)
                    </Title>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Aadhaar Number"
                                name="aadharNumber"
                                rules={[
                                    { pattern: /^[0-9]{12}$/, message: 'Please enter valid 12-digit Aadhaar number' }
                                ]}
                            >
                                <Input 
                                    placeholder="123456789012"
                                    size="large"
                                    maxLength={12}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="PAN Number"
                                name="panNumber"
                                rules={[
                                    { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Please enter valid PAN number' }
                                ]}
                            >
                                <Input 
                                    placeholder="ABCDE1234F"
                                    size="large"
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Submit Button */}
                    <Form.Item style={{ marginTop: '32px', textAlign: 'center' }}>
                        <Space size="large">
                            <Button 
                                type="default" 
                                size="large"
                                onClick={() => form.resetFields()}
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
                                    backgroundColor: '#eb2f96',
                                    borderColor: '#eb2f96',
                                    minWidth: '150px'
                                }}
                            >
                                Save Customer
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </>
    );
};

export default AddCustomer;
