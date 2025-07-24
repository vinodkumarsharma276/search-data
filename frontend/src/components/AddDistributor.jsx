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
        console.log('🔥 BUTTON CLICKED! handleSubmit function called!');
        console.log('🏪 ========================================');
        console.log('🏪 FRONTEND: AddDistributor form submitted');
        console.log('🏪 ========================================');
        console.log('📝 RAW form values from Ant Design Form:');
        console.log(JSON.stringify(values, null, 2));
        console.log('🏪 ----------------------------------------');
        
        setLoading(true);

        try {
            console.log('📡 Calling apiService.distributors.create...');
            console.log('🌐 API URL: /api/distributors');
            console.log('📤 Data being sent to backend:');
            console.log(JSON.stringify(values, null, 2));
            console.log('🏪 ----------------------------------------');

            const response = await apiService.distributors.create(values);
            
            console.log('✅ SUCCESS! Response received from backend:');
            console.log('📥 Full response object:');
            console.log(JSON.stringify(response, null, 2));
            console.log('🏪 ----------------------------------------');
            console.log('📊 Response status:', response.status);
            console.log('📄 Response data:', response.data);
            
            if (response.data.success) {
                console.log('🎉 DISTRIBUTOR CREATED SUCCESSFULLY!');
                console.log('🆔 New distributor ID:', response.data.data?._id);
                console.log('📝 Distributor name:', response.data.data?.name);
                console.log('🏢 Company type:', response.data.data?.companyType);
                console.log('🏪 ========================================');
                
                message.success('Distributor added successfully!');
                form.resetFields();
            } else {
                console.error('❌ Backend returned success: false');
                console.error('❌ Error message:', response.data.message);
                message.error(response.data.message || 'Failed to add distributor');
            }
        } catch (error) {
            console.error('❌ ========================================');
            console.error('❌ FRONTEND ERROR occurred!');
            console.error('❌ ========================================');
            console.error('❌ Full error object:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error response data:', error.response?.data);
            console.error('❌ Error response status:', error.response?.status);
            console.error('❌ Error response headers:', error.response?.headers);
            console.error('❌ ========================================');
            
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                'Failed to add distributor. Please try again.';
            message.error(errorMessage);
        } finally {
            setLoading(false);
            console.log('🏪 Form submission process completed.');
            console.log('🏪 ========================================');
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
                            <Breadcrumb.Item>Distributors</Breadcrumb.Item>
                            <Breadcrumb.Item>New Distributor</Breadcrumb.Item>
                        </Breadcrumb>
                        <Title level={3} style={{ margin: 0 }}>
                            <ShopOutlined /> Add New Distributor
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
                    onFinish={(values) => {
                        console.log('🔥 FORM onFinish triggered with values:', values);
                        handleSubmit(values);
                    }}
                    onFinishFailed={(errorInfo) => {
                        console.log('❌ FORM onFinishFailed triggered:', errorInfo);
                        console.log('❌ Failed fields:', errorInfo.errorFields);
                        console.log('❌ Form values at failure:', errorInfo.values);
                        
                        // Log each failed field in detail
                        errorInfo.errorFields.forEach((field, index) => {
                            console.log(`❌ Failed Field ${index + 1}:`);
                            console.log(`   Field Name: ${field.name[0]}`);
                            console.log(`   Errors: ${field.errors.join(', ')}`);
                            console.log(`   Current Value: ${errorInfo.values[field.name[0]]}`);
                        });
                    }}
                    requiredMark={false}
                >
                    <Row gutter={16}>
                        {/* Main Content */}
                        <Col xs={24} lg={16}>
                            {/* Basic Information */}
                            <Card 
                                title={<><ShopOutlined /> Basic Information</>}
                                style={{ marginBottom: 16 }}
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                            >
                                <Row gutter={[12, 8]}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Distributor Name"
                                            name="name"
                                            rules={[
                                                { required: true, message: 'Please enter distributor name' },
                                                { min: 2, message: 'Name must be at least 2 characters' }
                                            ]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="Enter distributor name"
                                                size="small"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Company Type"
                                            name="companyType"
                                            rules={[{ required: true, message: 'Please select company type' }]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Select placeholder="Select company type" size="small">
                                                <Option value="Sole Proprietorship">Sole Proprietorship</Option>
                                                <Option value="Partnership">Partnership</Option>
                                                <Option value="Private Limited">Private Limited</Option>
                                                <Option value="Public Limited">Public Limited</Option>
                                                <Option value="LLP">LLP</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={[12, 8]}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="GST Number"
                                            name="gstNumber"
                                            rules={[
                                                { required: true, message: 'Please enter GST number' },
                                                { 
                                                    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[0-9A-Z]{1}$|^[A-Z0-9]{10,15}$/,
                                                    message: 'Please enter valid GST number (15 characters)'
                                                }
                                            ]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="22AAAAA0000A1Z5"
                                                size="small"
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
                                                    pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$|^[A-Z0-9]{10}$/,
                                                    message: 'Please enter valid PAN number (10 characters)'
                                                }
                                            ]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="ABCDE1234F"
                                                size="small"
                                                style={{ textTransform: 'uppercase' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Contact Information */}
                            <Card 
                                title={<><PhoneOutlined /> Contact Information</>}
                                style={{ marginBottom: 16 }}
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                            >
                                <Row gutter={[12, 8]}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Primary Phone"
                                            name="primaryPhone"
                                            rules={[
                                                { required: true, message: 'Please enter primary phone' },
                                                { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit phone number' }
                                            ]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="9876543210"
                                                size="small"
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
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="9876543210"
                                                size="small"
                                                maxLength={10}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={[12, 8]}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Email"
                                            name="email"
                                            rules={[
                                                { required: true, message: 'Please enter email' },
                                                { type: 'email', message: 'Please enter valid email' }
                                            ]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="distributor@example.com"
                                                size="small"
                                                prefix={<MailOutlined style={{ color: '#666666' }} />}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Website"
                                            name="website"
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="www.example.com"
                                                size="small"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Address Information */}
                            <Card 
                                title={<><HomeOutlined /> Address Information</>}
                                style={{ marginBottom: 16 }}
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                            >
                                <Form.Item
                                    label="Street Address"
                                    name="address"
                                    rules={[{ required: true, message: 'Please enter address' }]}
                                    style={{ marginBottom: 12 }}
                                >
                                    <TextArea 
                                        placeholder="Enter complete address"
                                        rows={2}
                                        size="small"
                                    />
                                </Form.Item>

                                <Row gutter={[12, 8]}>
                                    <Col span={8}>
                                        <Form.Item
                                            label="City"
                                            name="city"
                                            rules={[{ required: true, message: 'Please enter city' }]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="City"
                                                size="small"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            label="State"
                                            name="state"
                                            rules={[{ required: true, message: 'Please enter state' }]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="State"
                                                size="small"
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
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="123456"
                                                size="small"
                                                maxLength={6}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Banking Information */}
                            <Card 
                                title={<><BankOutlined /> Banking Information</>}
                                style={{ marginBottom: 16 }}
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                            >
                                <Row gutter={[12, 8]}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Bank Name"
                                            name="bankName"
                                            rules={[{ required: true, message: 'Please enter bank name' }]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="State Bank of India"
                                                size="small"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Account Number"
                                            name="accountNumber"
                                            rules={[{ required: true, message: 'Please enter account number' }]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="123456789012"
                                                size="small"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={[12, 8]}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="IFSC Code"
                                            name="ifscCode"
                                            rules={[
                                                { required: true, message: 'Please enter IFSC code' },
                                                { 
                                                    pattern: /^[A-Z]{4}[0][A-Z0-9]{6}$|^[A-Z0-9]{8,11}$/,
                                                    message: 'Please enter valid IFSC code (8-11 characters)'
                                                }
                                            ]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="SBIN0001234"
                                                size="small"
                                                style={{ textTransform: 'uppercase' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Branch Name"
                                            name="branchName"
                                            rules={[{ required: true, message: 'Please enter branch name' }]}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <Input 
                                                placeholder="Main Branch"
                                                size="small"
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            {/* Additional Information */}
                            <Card 
                                title="Additional Information"
                                style={{ marginBottom: 16 }}
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                            >
                                <Form.Item
                                    label="Notes"
                                    name="notes"
                                    style={{ marginBottom: 0 }}
                                >
                                    <TextArea 
                                        placeholder="Any additional notes about the distributor"
                                        rows={2}
                                        size="small"
                                    />
                                </Form.Item>
                            </Card>

                            {/* Submit Button */}
                            <Card bodyStyle={{ padding: '16px', textAlign: 'center' }} size="small">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                    style={{ minWidth: 180 }}
                                    onClick={() => {
                                        console.log('🔥 BUTTON CLICKED DIRECTLY!');
                                        console.log('🔥 Form instance:', form);
                                        console.log('🔥 Form values:', form.getFieldsValue());
                                    }}
                                >
                                    {loading ? 'Saving Distributor...' : 'Save Distributor'}
                                </Button>
                            </Card>
                        </Col>

                        {/* Sidebar */}
                        <Col xs={24} lg={8}>
                            <Card 
                                title="Distributor Summary" 
                                style={{ position: 'sticky', top: 16 }}
                                bodyStyle={{ padding: '16px' }}
                                size="small"
                            >
                                <div style={{ marginBottom: 12 }}>
                                    <Text strong>Status:</Text><br />
                                    <Text style={{ color: '#52c41a' }}>New Distributor</Text>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <Text strong>Type:</Text><br />
                                    <Text>Business Partner</Text>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong>Category:</Text><br />
                                    <Text>Supply Chain</Text>
                                </div>
                                
                                <div style={{ 
                                    padding: '12px', 
                                    backgroundColor: '#f6ffed', 
                                    borderRadius: '6px',
                                    border: '1px solid #b7eb8f'
                                }}>
                                    <Text strong style={{ color: '#52c41a' }}>Benefits:</Text><br />
                                    <Text style={{ fontSize: '12px' }}>
                                        • Streamlined ordering process<br />
                                        • Automated inventory tracking<br />
                                        • Performance analytics<br />
                                        • Payment management
                                    </Text>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    );
};

export default AddDistributor;
