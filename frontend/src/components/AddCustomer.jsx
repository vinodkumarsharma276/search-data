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
    Select,
    DatePicker,
    Radio,
    Switch
} from 'antd';
import {
    SaveOutlined,
    ArrowLeftOutlined,
    UsergroupAddOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    HomeOutlined,
    IdcardOutlined
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
            // Format date
            if (values.dateOfBirth) {
                values.dateOfBirth = values.dateOfBirth.format('YYYY-MM-DD');
            }

            // Map form fields to Customer model fields
            const customerData = {
                name: `${values.firstName} ${values.lastName}`,
                phone: values.primaryPhone,
                alternatePhone: values.secondaryPhone,
                email: values.email,
                address: {
                    street: values.address,
                    city: values.city,
                    state: values.state,
                    pincode: values.pinCode
                },
                aadharNumber: values.aadhaarNumber,
                panNumber: values.panNumber,
                dateOfBirth: values.dateOfBirth,
                occupation: values.occupation,
                monthlyIncome: values.annualIncome ? parseInt(values.annualIncome.split('-')[0]?.replace(/[^\d]/g, '')) * 1000 : 0, // Convert annual to rough monthly
                gender: values.gender?.toLowerCase(),
                maritalStatus: values.maritalStatus,
                customerType: values.customerType,
                creditLimit: values.creditLimit || 0,
                preferredCommunication: values.preferredCommunication,
                marketingConsent: values.marketingConsent || false,
                smsNotifications: values.smsNotifications || false,
                referralSource: values.referralSource,
                referredBy: values.referredBy,
                notes: values.notes,
                isActive: values.isActive !== false // Default to true if not explicitly set to false
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
        <Content style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
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
                    >
                        {/* Personal Information */}
                        <Title level={4} style={{ marginTop: 0, color: '#333333' }}>
                            <UserOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                            Personal Information
                        </Title>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="First Name"
                                    name="firstName"
                                    rules={[
                                        { required: true, message: 'Please enter first name' },
                                        { min: 2, message: 'First name must be at least 2 characters' }
                                    ]}
                                >
                                    <Input 
                                        placeholder="John"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Last Name"
                                    name="lastName"
                                    rules={[
                                        { required: true, message: 'Please enter last name' },
                                        { min: 2, message: 'Last name must be at least 2 characters' }
                                    ]}
                                >
                                    <Input 
                                        placeholder="Doe"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Customer ID"
                                    name="customerId"
                                    rules={[{ required: true, message: 'Please enter customer ID' }]}
                                >
                                    <Input 
                                        placeholder="CUST001"
                                        size="large"
                                        prefix={<IdcardOutlined style={{ color: '#666666' }} />}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                >
                                    <DatePicker 
                                        placeholder="Select date"
                                        size="large"
                                        style={{ width: '100%' }}
                                        format="DD/MM/YYYY"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Gender"
                                    name="gender"
                                    rules={[{ required: true, message: 'Please select gender' }]}
                                >
                                    <Radio.Group size="large">
                                        <Radio.Button value="Male">Male</Radio.Button>
                                        <Radio.Button value="Female">Female</Radio.Button>
                                        <Radio.Button value="Other">Other</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="Marital Status"
                                    name="maritalStatus"
                                >
                                    <Select placeholder="Select status" size="large">
                                        <Option value="Single">Single</Option>
                                        <Option value="Married">Married</Option>
                                        <Option value="Divorced">Divorced</Option>
                                        <Option value="Widowed">Widowed</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Occupation"
                                    name="occupation"
                                >
                                    <Input 
                                        placeholder="Software Engineer"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Annual Income (₹)"
                                    name="annualIncome"
                                >
                                    <Select placeholder="Select income range" size="large">
                                        <Option value="Below 2 Lakhs">Below 2 Lakhs</Option>
                                        <Option value="2-5 Lakhs">2-5 Lakhs</Option>
                                        <Option value="5-10 Lakhs">5-10 Lakhs</Option>
                                        <Option value="10-20 Lakhs">10-20 Lakhs</Option>
                                        <Option value="20-50 Lakhs">20-50 Lakhs</Option>
                                        <Option value="Above 50 Lakhs">Above 50 Lakhs</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Contact Information */}
                        <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                            <PhoneOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                            Contact Information
                        </Title>

                        <Row gutter={16}>
                            <Col span={8}>
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
                            <Col span={8}>
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
                            <Col span={8}>
                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Please enter email' },
                                        { type: 'email', message: 'Please enter valid email' }
                                    ]}
                                >
                                    <Input 
                                        placeholder="john@example.com"
                                        size="large"
                                        prefix={<MailOutlined style={{ color: '#666666' }} />}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Address Information */}
                        <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                            <HomeOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                            Address Information
                        </Title>

                        <Form.Item
                            label="Street Address"
                            name="address"
                            rules={[{ required: true, message: 'Please enter address' }]}
                        >
                            <TextArea 
                                placeholder="Enter complete address"
                                rows={2}
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
                                        placeholder="Mumbai"
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
                                        placeholder="Maharashtra"
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
                                        placeholder="400001"
                                        size="large"
                                        maxLength={6}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Identification Information */}
                        <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                            <IdcardOutlined style={{ marginRight: '8px', color: '#eb2f96' }} />
                            Identification Information
                        </Title>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Aadhaar Number"
                                    name="aadhaarNumber"
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

                        {/* Preferences & Settings */}
                        <Title level={4} style={{ marginTop: '24px', color: '#333333' }}>
                            Preferences & Settings
                        </Title>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Preferred Communication"
                                    name="preferredCommunication"
                                    rules={[{ required: true, message: 'Please select preferred communication' }]}
                                >
                                    <Radio.Group size="large">
                                        <Radio.Button value="Phone">Phone</Radio.Button>
                                        <Radio.Button value="Email">Email</Radio.Button>
                                        <Radio.Button value="WhatsApp">WhatsApp</Radio.Button>
                                    </Radio.Group>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Customer Type"
                                    name="customerType"
                                    rules={[{ required: true, message: 'Please select customer type' }]}
                                >
                                    <Select placeholder="Select type" size="large">
                                        <Option value="Retail">Retail</Option>
                                        <Option value="Corporate">Corporate</Option>
                                        <Option value="VIP">VIP</Option>
                                        <Option value="Bulk">Bulk Buyer</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Credit Limit (₹)"
                                    name="creditLimit"
                                    initialValue={0}
                                >
                                    <Select placeholder="Select credit limit" size="large">
                                        <Option value={0}>No Credit</Option>
                                        <Option value={10000}>₹10,000</Option>
                                        <Option value={25000}>₹25,000</Option>
                                        <Option value={50000}>₹50,000</Option>
                                        <Option value={100000}>₹1,00,000</Option>
                                        <Option value={200000}>₹2,00,000</Option>
                                        <Option value={500000}>₹5,00,000</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
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

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Marketing Consent"
                                    name="marketingConsent"
                                    valuePropName="checked"
                                    initialValue={true}
                                >
                                    <Switch 
                                        checkedChildren="Allow" 
                                        unCheckedChildren="Deny" 
                                        size="default"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="SMS Notifications"
                                    name="smsNotifications"
                                    valuePropName="checked"
                                    initialValue={true}
                                >
                                    <Switch 
                                        checkedChildren="Enable" 
                                        unCheckedChildren="Disable" 
                                        size="default"
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
                                    label="How did you hear about us?"
                                    name="referralSource"
                                >
                                    <Select placeholder="Select source" size="large">
                                        <Option value="Friend/Family">Friend/Family</Option>
                                        <Option value="Google Search">Google Search</Option>
                                        <Option value="Social Media">Social Media</Option>
                                        <Option value="Advertisement">Advertisement</Option>
                                        <Option value="Website">Website</Option>
                                        <Option value="Walk-in">Walk-in</Option>
                                        <Option value="Other">Other</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Referred By"
                                    name="referredBy"
                                >
                                    <Input 
                                        placeholder="Name of referrer"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            label="Special Notes"
                            name="notes"
                        >
                            <TextArea 
                                placeholder="Any special notes or preferences about the customer"
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
            </div>
        </Content>
    );
};

export default AddCustomer;
