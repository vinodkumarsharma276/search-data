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
    ShopOutlined,
    PhoneOutlined,
    MailOutlined,
    HomeOutlined,
    BankOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AddDistributor = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values) => {
        console.log('🏪 Submitting distributor data:', values);
        setLoading(true);

        try {
            const response = await apiService.distributors.create(values);
            
            if (response.data.success) {
                message.success('Distributor added successfully!');
                console.log('✅ Distributor saved:', response.data);
                form.resetFields();
            } else {
                message.error(response.data.message || 'Failed to add distributor');
                console.error('❌ Error saving distributor:', response.data);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to add distributor. Please try again.';
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
                <Breadcrumb.Item>Add Distributor</Breadcrumb.Item>
            </Breadcrumb>

            <Card
                title={
                    <Space>
                        <ShopOutlined style={{ color: '#722ed1' }} />
                        <Title level={3} style={{ margin: 0, color: '#333333' }}>
                            Add New Distributor
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
                        <HomeOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                        Basic Information
                    </Title>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Distributor Name"
                                name="name"
                                rules={[
                                    { required: true, message: 'Please enter distributor name' },
                                    { min: 2, message: 'Name must be at least 2 characters' }
                                ]}
                            >
                                <Input 
                                    placeholder="Enter distributor name"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Company Type"
                                name="companyType"
                                rules={[{ required: true, message: 'Please select company type' }]}
                            >
                                <Select placeholder="Select company type" size="large">
                                    <Option value="Sole Proprietorship">Sole Proprietorship</Option>
                                    <Option value="Partnership">Partnership</Option>
                                    <Option value="Private Limited">Private Limited</Option>
                                    <Option value="Public Limited">Public Limited</Option>
                                    <Option value="LLP">LLP</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="GST Number"
                                name="gstNumber"
                                rules={[
                                    { required: true, message: 'Please enter GST number' },
                                ]}
                            >
                                <Input 
                                    placeholder="22AAAAA0000A1Z5"
                                    size="large"
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="PAN Number"
                                name="panNumber"
                                rules={[
                                    { required: true, message: 'Please enter PAN number' },
                                    { 
                                        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                                        message: 'Please enter valid PAN number'
                                    }
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

                    {/* Contact Information */}
                    <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                        <PhoneOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                        Contact Information
                    </Title>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Primary Phone"
                                name="primaryPhone"
                                rules={[
                                    { required: true, message: 'Please enter primary phone' },
                                    { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit phone number' }
                                ]}
                            >
                                <Input 
                                    placeholder="9876543210"
                                    size="large"
                                    maxLength={10}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Secondary Phone"
                                name="secondaryPhone"
                                rules={[
                                    { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit phone number' }
                                ]}
                            >
                                <Input 
                                    placeholder="9876543210"
                                    size="large"
                                    maxLength={10}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Please enter email' },
                                    { type: 'email', message: 'Please enter valid email' }
                                ]}
                            >
                                <Input 
                                    placeholder="distributor@example.com"
                                    size="large"
                                    prefix={<MailOutlined style={{ color: '#666666' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Website"
                                name="website"
                            >
                                <Input 
                                    placeholder="www.example.com"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Address Information */}
                    <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                        <HomeOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                        Address Information
                    </Title>

                    <Form.Item
                        label="Street Address"
                        name="address"
                        rules={[{ required: true, message: 'Please enter address' }]}
                    >
                        <TextArea 
                            placeholder="Enter complete address"
                            rows={3}
                            size="large"
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                label="City"
                                name="city"
                                rules={[{ required: true, message: 'Please enter city' }]}
                            >
                                <Input 
                                    placeholder="City"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="State"
                                name="state"
                                rules={[{ required: true, message: 'Please enter state' }]}
                            >
                                <Input 
                                    placeholder="State"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                label="PIN Code"
                                name="pinCode"
                                rules={[
                                    { required: true, message: 'Please enter PIN code' },
                                    { pattern: /^[0-9]{6}$/, message: 'Please enter valid 6-digit PIN code' }
                                ]}
                            >
                                <Input 
                                    placeholder="123456"
                                    size="large"
                                    maxLength={6}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Banking Information */}
                    <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                        <BankOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                        Banking Information
                    </Title>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Bank Name"
                                name="bankName"
                                rules={[{ required: true, message: 'Please enter bank name' }]}
                            >
                                <Input 
                                    placeholder="State Bank of India"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Account Number"
                                name="accountNumber"
                                rules={[{ required: true, message: 'Please enter account number' }]}
                            >
                                <Input 
                                    placeholder="123456789012"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="IFSC Code"
                                name="ifscCode"
                                rules={[
                                    { required: true, message: 'Please enter IFSC code' },
                                ]}
                            >
                                <Input 
                                    placeholder="SBIN0001234"
                                    size="large"
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Branch Name"
                                name="branchName"
                                rules={[{ required: true, message: 'Please enter branch name' }]}
                            >
                                <Input 
                                    placeholder="Main Branch"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Additional Information */}
                    <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                        Additional Information
                    </Title>

                    <Form.Item
                        label="Notes"
                        name="notes"
                    >
                        <TextArea 
                            placeholder="Any additional notes about the distributor"
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
                                    backgroundColor: '#722ed1',
                                    borderColor: '#722ed1',
                                    minWidth: '150px'
                                }}
                            >
                                Save Distributor
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </>
    );
};

export default AddDistributor;
