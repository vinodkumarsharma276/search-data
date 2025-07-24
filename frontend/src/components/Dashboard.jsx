import React, { useState } from 'react';
import { Layout, Menu, Typography, Card, Button, theme } from 'antd';
import {
    ShoppingCartOutlined,
    BoxPlotOutlined,
    ShopOutlined,
    UserOutlined,
    TeamOutlined,
    PlusOutlined,
    SearchOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Import your existing components
import AddSale from './AddSale';
import AddDistributor from './AddDistributor';
import SearchPage from './SearchPage';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [selectedKey, setSelectedKey] = useState('dashboard');
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Menu items with nested structure
    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: 'sales',
            icon: <ShoppingCartOutlined />,
            label: 'Sales',
            children: [
                {
                    key: 'add-sale',
                    icon: <PlusOutlined />,
                    label: 'Add Sale',
                },
                {
                    key: 'search-sale',
                    icon: <SearchOutlined />,
                    label: 'Search Sales',
                },
            ],
        },
        {
            key: 'products',
            icon: <BoxPlotOutlined />,
            label: 'Products',
            children: [
                {
                    key: 'add-product',
                    icon: <PlusOutlined />,
                    label: 'Add Product',
                },
                {
                    key: 'search-product',
                    icon: <SearchOutlined />,
                    label: 'Search Products',
                },
            ],
        },
        {
            key: 'distributors',
            icon: <ShopOutlined />,
            label: 'Distributors',
            children: [
                {
                    key: 'add-distributor',
                    icon: <PlusOutlined />,
                    label: 'Add Distributor',
                },
                {
                    key: 'search-distributor',
                    icon: <SearchOutlined />,
                    label: 'Search Distributors',
                },
            ],
        },
        {
            key: 'customers',
            icon: <UserOutlined />,
            label: 'Customers',
            children: [
                {
                    key: 'add-customer',
                    icon: <PlusOutlined />,
                    label: 'Add Customer',
                },
                {
                    key: 'search-customer',
                    icon: <SearchOutlined />,
                    label: 'Search Customers',
                },
            ],
        },
        {
            key: 'employees',
            icon: <TeamOutlined />,
            label: 'Employees',
            children: [
                {
                    key: 'add-employee',
                    icon: <PlusOutlined />,
                    label: 'Add Employee',
                },
                {
                    key: 'search-employee',
                    icon: <SearchOutlined />,
                    label: 'Search Employees',
                },
            ],
        },
    ];

    const handleMenuClick = (e) => {
        setSelectedKey(e.key);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const renderContent = () => {
        switch (selectedKey) {
            case 'dashboard':
                return <DashboardHome />;
            case 'add-sale':
                return <AddSale />;
            case 'add-distributor':
                return <AddDistributor />;
            case 'search-customer':
            case 'search-sale':
            case 'search-product':
            case 'search-distributor':
            case 'search-employee':
                return <SearchPage searchType={selectedKey} />;
            case 'add-product':
                return <ComingSoon feature="Add Product" />;
            case 'add-customer':
                return <ComingSoon feature="Add Customer" />;
            case 'add-employee':
                return <ComingSoon feature="Add Employee" />;
            default:
                return <DashboardHome />;
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Sidebar */}
            <Sider 
                trigger={null} 
                collapsible 
                collapsed={collapsed}
                style={{
                    background: colorBgContainer,
                    boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
                }}
                width={280}
                collapsedWidth={80}
            >
                {/* Logo/Brand */}
                <div style={{ 
                    height: 64, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '0' : '0 16px',
                    borderBottom: '1px solid #f0f0f0'
                }}>
                    {collapsed ? (
                        <ShopOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    ) : (
                        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                            Vinod Electronics
                        </Title>
                    )}
                </div>

                {/* Menu */}
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    style={{ 
                        border: 'none',
                        marginTop: 8
                    }}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>

            {/* Main Layout */}
            <Layout>
                {/* Header */}
                <Header
                    style={{
                        padding: '0 16px',
                        background: colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px 0 rgba(29,35,41,.05)',
                        zIndex: 1
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />
                        <Title level={4} style={{ margin: 0, marginLeft: 16 }}>
                            {getPageTitle(selectedKey)}
                        </Title>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text>Welcome, Admin</Text>
                        <Button 
                            type="text" 
                            icon={<LogoutOutlined />} 
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </div>
                </Header>

                {/* Content */}
                <Content
                    style={{
                        margin: 0,
                        padding: 0,
                        background: '#f5f5f5',
                        minHeight: 'calc(100vh - 64px)',
                        overflow: 'auto'
                    }}
                >
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
};

// Helper function to get page title
const getPageTitle = (selectedKey) => {
    const titles = {
        'dashboard': 'Business Dashboard',
        'add-sale': 'Add New Sale',
        'search-sale': 'Search Sales',
        'add-product': 'Add New Product',
        'search-product': 'Search Products', 
        'add-distributor': 'Add New Distributor',
        'search-distributor': 'Search Distributors',
        'add-customer': 'Add New Customer',
        'search-customer': 'Search Customers',
        'add-employee': 'Add New Employee',
        'search-employee': 'Search Employees'
    };
    return titles[selectedKey] || 'Dashboard';
};

// Dashboard Home Component
const DashboardHome = () => {
    return (
        <div style={{ padding: '24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Title level={2} style={{ marginBottom: 8 }}>
                    Welcome to Your Business Dashboard
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: 32 }}>
                    Use the sidebar navigation to manage your business operations
                </Text>

                {/* Quick Stats */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: 16, 
                    marginBottom: 32 
                }}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <ShoppingCartOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                            <Title level={3} style={{ margin: 0 }}>0</Title>
                            <Text type="secondary">Total Sales</Text>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <BoxPlotOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                            <Title level={3} style={{ margin: 0 }}>0</Title>
                            <Text type="secondary">Products</Text>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <ShopOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                            <Title level={3} style={{ margin: 0 }}>1</Title>
                            <Text type="secondary">Distributors</Text>
                        </div>
                    </Card>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <UserOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }} />
                            <Title level={3} style={{ margin: 0 }}>0</Title>
                            <Text type="secondary">Customers</Text>
                        </div>
                    </Card>
                </div>

                {/* Getting Started */}
                <Card title="Getting Started" style={{ marginBottom: 24 }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: 16 
                    }}>
                        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                            <Title level={4}>📊 Manage Sales</Title>
                            <Text>Add new sales transactions and track your revenue.</Text>
                        </div>
                        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                            <Title level={4}>📦 Product Inventory</Title>
                            <Text>Keep track of your products and inventory levels.</Text>
                        </div>
                        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                            <Title level={4}>🏪 Distributor Network</Title>
                            <Text>Manage your distributors and supplier relationships.</Text>
                        </div>
                        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                            <Title level={4}>👥 Customer Base</Title>
                            <Text>Maintain customer information and purchase history.</Text>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Coming Soon Component
const ComingSoon = ({ feature }) => {
    return (
        <div style={{ 
            padding: '64px 24px', 
            textAlign: 'center',
            background: 'white',
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <BoxPlotOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
            <Title level={2}>{feature}</Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
                This feature is coming soon! We're working hard to bring you the best experience.
            </Text>
        </div>
    );
};

export default Dashboard;
