import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Form, 
    Input, 
    Select, 
    Button, 
    Row, 
    Col, 
    Typography, 
    Space,
    message,
    Divider
} from 'antd';
import { 
    ArrowLeftOutlined, 
    SaveOutlined, 
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    HomeOutlined,
    BankOutlined,
    EditOutlined
} from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EditDistributor = ({ distributor, onBack }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Pre-fill form with distributor data
        console.log('🔄 EditDistributor - Received distributor data:');
        console.log(JSON.stringify(distributor, null, 2));
        console.log('🔄 Available fields in distributor object:', Object.keys(distributor));
        
        const formData = {
            name: distributor.name || '',
            companyType: distributor.companyType || '',
            gstNumber: distributor.gstNumber || '',
            panNumber: distributor.panNumber || '',
            primaryPhone: distributor.primaryPhone || '',
            secondaryPhone: distributor.secondaryPhone || '',
            email: distributor.email || '',
            website: distributor.website || '',
            address: distributor.address || '',
            city: distributor.city || '',
            state: distributor.state || '',
            pinCode: distributor.pinCode || '',
            bankName: distributor.bankName || '',
            accountNumber: distributor.accountNumber || '',
            ifscCode: distributor.ifscCode || '',
            branchName: distributor.branchName || '',
            notes: distributor.notes || ''
        };
        
        console.log('🔄 Form data being set:');
        console.log(JSON.stringify(formData, null, 2));
        
        // Check for any undefined values
        Object.entries(formData).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                console.warn(`⚠️ Field "${key}" has undefined/null value, setting to empty string`);
                formData[key] = '';
            }
        });
        
        form.setFieldsValue(formData);
    }, [distributor, form]);

    const handleSubmit = async (values) => {
        console.log('🔄 ========================================');
        console.log('🔄 EditDistributor - Form submission started');
        console.log('🔄 ========================================');
        console.log('📝 Form values received:', values);
        console.log('🆔 Distributor ID to update:', distributor._id);
        console.log('🔄 ----------------------------------------');
        setLoading(true);

        try {
            const apiUrl = `/distributors/${distributor._id}`;
            console.log(`🔄 Making PUT request to: ${apiUrl}`);
            console.log('📦 Request payload:', JSON.stringify(values, null, 2));
            
            const response = await apiService.put(apiUrl, values);
            console.log('📦 Raw API response:', response);
            console.log('📋 Response data:', response.data);
            console.log('🔄 ----------------------------------------');
            
            if (response.data && response.data.success) {
                console.log('✅ Update successful!');
                message.success('Distributor updated successfully!');
                console.log('✅ Updated distributor:', response.data.distributor);
                console.log('🔄 ========================================');
                onBack(); // Go back to search page
            } else {
                console.error('❌ Update failed - Invalid response format');
                console.error('❌ Response data:', response.data);
                message.error('Failed to update distributor - Invalid response');
            }
        } catch (error) {
            console.error('❌ ========================================');
            console.error('❌ Error updating distributor!');
            console.error('❌ ========================================');
            console.error('❌ Error object:', error);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error response data:', error.response?.data);
            console.error('❌ Error message:', error.message);
            console.error('❌ ========================================');
            
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update distributor';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        onBack();
    };

    const handleFormFailed = (errorInfo) => {
        console.error('❌ ========================================');
        console.error('❌ Form validation failed!');
        console.error('❌ ========================================');
        console.error('❌ Error info:', errorInfo);
        console.error('❌ Failed fields:', errorInfo.errorFields);
        
        // Log detailed field errors
        errorInfo.errorFields.forEach((field, index) => {
            console.error(`❌ Field ${index + 1}:`, {
                name: field.name,
                nameString: Array.isArray(field.name) ? field.name.join('.') : field.name,
                value: field.value,
                errors: field.errors
            });
        });
        
        console.error('❌ ========================================');
        message.error('Please check the form for validation errors');
    };

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <Card style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Button 
                                icon={<ArrowLeftOutlined />} 
                                onClick={handleCancel}
                                style={{ marginRight: '16px' }}
                            >
                                Back
                            </Button>
                            <div>
                                <Title level={3} style={{ margin: 0, marginBottom: '4px' }}>
                                    <EditOutlined /> Edit Distributor
                                </Title>
                                <Text type="secondary">
                                    Update distributor information for: <Text strong>{distributor.name}</Text>
                                </Text>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Edit Form */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    onFinishFailed={handleFormFailed}
                    autoComplete="off"
                >
                    {/* Basic Information */}
                    <Card 
                        title={
                            <Space>
                                <UserOutlined />
                                <span>Basic Information</span>
                            </Space>
                        }
                        style={{ marginBottom: '24px' }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Distributor Name"
                                    name="name"
                                    rules={[{ required: true, message: 'Please enter distributor name' }]}
                                >
                                    <Input placeholder="Enter distributor name" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Company Type"
                                    name="companyType"
                                    rules={[{ required: true, message: 'Please select company type' }]}
                                >
                                    <Select placeholder="Select company type">
                                        <Option value="Proprietorship">Proprietorship</Option>
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
                                        { min: 10, message: 'GST number must be at least 10 characters' },
                                        { max: 15, message: 'GST number cannot exceed 15 characters' },
                                        { pattern: /^[0-9A-Z]+$/i, message: 'GST number can only contain letters and numbers' }
                                    ]}
                                >
                                    <Input placeholder="AGADD345RTG or 22AAAAA0000A1Z5" style={{ textTransform: 'uppercase' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="PAN Number"
                                    name="panNumber"
                                    rules={[
                                        { min: 10, message: 'PAN number must be 10 characters' },
                                        { max: 10, message: 'PAN number must be 10 characters' },
                                        { pattern: /^[A-Z0-9]{10}$/i, message: 'Please enter a valid 10-character PAN number' }
                                    ]}
                                >
                                    <Input placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Contact Information */}
                    <Card 
                        title={
                            <Space>
                                <PhoneOutlined />
                                <span>Contact Information</span>
                            </Space>
                        }
                        style={{ marginBottom: '24px' }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Primary Phone"
                                    name="primaryPhone"
                                    rules={[
                                        { pattern: /^[6-9]\d{9}$/, message: 'Please enter a valid 10-digit phone number' }
                                    ]}
                                >
                                    <Input placeholder="9876543210" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Secondary Phone"
                                    name="secondaryPhone"
                                    rules={[
                                        { pattern: /^[6-9]\d{9}$/, message: 'Please enter a valid 10-digit phone number' }
                                    ]}
                                >
                                    <Input placeholder="9876543210 (Optional)" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Email"
                                    name="email"
                                    rules={[
                                        { type: 'email', message: 'Please enter a valid email address' }
                                    ]}
                                >
                                    <Input placeholder="distributor@example.com" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Website"
                                    name="website"
                                >
                                    <Input placeholder="https://www.example.com" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Address Information */}
                    <Card 
                        title={
                            <Space>
                                <HomeOutlined />
                                <span>Address Information</span>
                            </Space>
                        }
                        style={{ marginBottom: '24px' }}
                    >
                        <Form.Item
                            label="Address"
                            name="address"
                        >
                            <TextArea 
                                rows={3} 
                                placeholder="Enter complete address"
                                showCount
                                maxLength={500}
                            />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item
                                    label="City"
                                    name="city"
                                >
                                    <Input placeholder="Enter city" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="State"
                                    name="state"
                                >
                                    <Input placeholder="Enter state" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    label="PIN Code"
                                    name="pinCode"
                                    rules={[
                                        { pattern: /^[1-9][0-9]{5}$/, message: 'Please enter a valid 6-digit PIN code' }
                                    ]}
                                >
                                    <Input placeholder="123456" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Banking Information */}
                    <Card 
                        title={
                            <Space>
                                <BankOutlined />
                                <span>Banking Information</span>
                            </Space>
                        }
                        style={{ marginBottom: '24px' }}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Bank Name"
                                    name="bankName"
                                >
                                    <Input placeholder="Enter bank name" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Account Number"
                                    name="accountNumber"
                                    rules={[
                                        { pattern: /^[0-9]{9,18}$/, message: 'Please enter a valid account number' }
                                    ]}
                                >
                                    <Input placeholder="Enter account number" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="IFSC Code"
                                    name="ifscCode"
                                    rules={[
                                        { pattern: /^[A-Z0-9]{4,11}$/i, message: 'IFSC code must be 4-11 characters (letters and numbers only)' }
                                    ]}
                                >
                                    <Input placeholder="ABCD0123456 (Optional)" style={{ textTransform: 'uppercase' }} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Branch Name"
                                    name="branchName"
                                >
                                    <Input placeholder="Enter branch name" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>

                    {/* Additional Notes */}
                    <Card 
                        title="Additional Notes"
                        style={{ marginBottom: '24px' }}
                    >
                        <Form.Item
                            label="Notes"
                            name="notes"
                        >
                            <TextArea 
                                rows={4} 
                                placeholder="Enter any additional notes or comments about this distributor"
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Card>

                    {/* Action Buttons */}
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <Space size="large">
                                <Button size="large" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                    onClick={() => {
                                        console.log('🔄 Update Distributor button clicked!');
                                        console.log('🔄 Form values before submit:', form.getFieldsValue());
                                    }}
                                >
                                    Update Distributor
                                </Button>
                            </Space>
                        </div>
                    </Card>
                </Form>
            </div>
        </div>
    );
};

export default EditDistributor;
