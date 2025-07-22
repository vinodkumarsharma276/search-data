import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Card, 
    Row, 
    Col, 
    Typography, 
    Space,
    Breadcrumb
} from 'antd';
import {
    ShoppingCartOutlined,
    SearchOutlined,
    UserOutlined,
    ShopOutlined,
    TeamOutlined,
    AppstoreAddOutlined,
    UsergroupAddOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Dashboard = () => {
    const navigate = useNavigate();

    const menuOptions = [
        {
            title: 'Add Sale',
            description: 'Create new sales transactions with EMI options',
            icon: <ShoppingCartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
            path: '/add-sale',
            color: '#e6f7ff',
            borderColor: '#1890ff'
        },
        {
            title: 'Search Customer Data',
            description: 'Search and view customer information and history',
            icon: <SearchOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
            path: '/search',
            color: '#f6ffed',
            borderColor: '#52c41a'
        },
        {
            title: 'Add Distributor',
            description: 'Register new distributors and suppliers',
            icon: <ShopOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
            path: '/add-distributor',
            color: '#f9f0ff',
            borderColor: '#722ed1'
        },
        {
            title: 'Add Product',
            description: 'Add new products to inventory',
            icon: <AppstoreAddOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />,
            path: '/add-product',
            color: '#fff7e6',
            borderColor: '#fa8c16'
        },
        {
            title: 'Add Employee',
            description: 'Register new employees and staff members',
            icon: <TeamOutlined style={{ fontSize: '48px', color: '#13c2c2' }} />,
            path: '/add-employee',
            color: '#e6fffb',
            borderColor: '#13c2c2'
        },
        {
            title: 'Add Customer',
            description: 'Register new customers',
            icon: <UsergroupAddOutlined style={{ fontSize: '48px', color: '#eb2f96' }} />,
            path: '/add-customer',
            color: '#fff0f6',
            borderColor: '#eb2f96'
        }
    ];

    const handleCardClick = (path) => {
        navigate(path);
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <div style={{ marginBottom: '32px' }}>
                    <Title level={2} style={{ color: '#333333', marginBottom: '8px' }}>
                        Business Dashboard
                    </Title>
                    <Text style={{ fontSize: '16px', color: '#666666' }}>
                        Select an option below to manage your business operations
                    </Text>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Title level={2} style={{ color: '#333333', marginBottom: '8px' }}>
                        Welcome to Your Business Dashboard
                    </Title>
                    <Text style={{ fontSize: '16px', color: '#666666' }}>
                        Choose an option below to get started
                    </Text>
                </div>

                <Row gutter={[24, 24]}>
                    {menuOptions.map((option, index) => (
                        <Col 
                            key={index}
                            xs={24} 
                            sm={12} 
                            md={8} 
                            lg={8}
                        >
                            <Card
                                hoverable
                                onClick={() => handleCardClick(option.path)}
                                style={{
                                    height: '220px',
                                    borderRadius: '12px',
                                    border: `2px solid ${option.borderColor}`,
                                    backgroundColor: option.color,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                bodyStyle={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '24px'
                                }}
                            >
                                <Space direction="vertical" align="center" size="large" style={{ width: '100%' }}>
                                    {option.icon}
                                    <div style={{ textAlign: 'center' }}>
                                        <Title level={4} style={{ margin: '8px 0', color: '#333333' }}>
                                            {option.title}
                                        </Title>
                                        <Text style={{ color: '#666666', fontSize: '14px', textAlign: 'center', display: 'block' }}>
                                            {option.description}
                                        </Text>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <div style={{ 
                    marginTop: '48px', 
                    padding: '24px', 
                    backgroundColor: '#ffffff', 
                    borderRadius: '8px',
                    border: '1px solid #e1e5e9',
                    textAlign: 'center'
                }}>
                    <Title level={4} style={{ color: '#333333', marginBottom: '16px' }}>
                        Quick Stats
                    </Title>
                    <Row gutter={24}>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', fontSize: '24px', color: '#1890ff' }}>0</Text>
                            <Text style={{ color: '#666666' }}>Total Sales Today</Text>
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', fontSize: '24px', color: '#52c41a' }}>0</Text>
                            <Text style={{ color: '#666666' }}>Active Customers</Text>
                        </Col>
                        <Col span={8}>
                            <Text strong style={{ display: 'block', fontSize: '24px', color: '#fa8c16' }}>0</Text>
                            <Text style={{ color: '#666666' }}>Products in Stock</Text>
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
