import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Layout,
    Menu,
    Button,
    Typography,
    theme,
    Card,
    Row,
    Col,
    Statistic
} from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    ShoppingCartOutlined,
    BoxPlotOutlined,
    ShopOutlined,
    UserOutlined,
    TeamOutlined,
    PlusOutlined,
    SearchOutlined,
    LogoutOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
} from '@ant-design/icons';

// Import all the components
import AddSale from './AddSale';
import AddDistributor from './AddDistributor';
import SearchDistributor from './SearchDistributor';
import SearchPage from './SearchPage';
import AddProduct from './AddProduct';
import SearchProduct from './SearchProduct';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(true);
    const siderWidth = 240;
    const collapsedSiderWidth = 80;
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Get current route for menu selection
    const getCurrentMenuKey = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'dashboard';
        if (path.startsWith('/add-sale')) return 'add-sale';
        if (path.startsWith('/search-sale')) return 'search-sale';
        if (path.startsWith('/add-product')) return 'add-product';
        if (path.startsWith('/search-product')) return 'search-product';
        if (path.startsWith('/add-distributor')) return 'add-distributor';
        if (path.startsWith('/search-distributor')) return 'search-distributor';
        if (path.startsWith('/add-customer')) return 'add-customer';
        if (path.startsWith('/search-customer')) return 'search-customer';
        if (path.startsWith('/add-employee')) return 'add-employee';
        if (path.startsWith('/search-employee')) return 'search-employee';
        if (path.startsWith('/search')) return 'search-customer';
        return 'dashboard';
    };

    const selectedKey = getCurrentMenuKey();

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
        const key = e.key;
        
        if (key === 'dashboard') {
            navigate('/dashboard');
        } else {
            navigate(`/${key}`);
        }
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
            case 'search-distributor':
                return <SearchDistributor />;
            case 'search-product':
                return <SearchProduct />;
            case 'search-customer':
            case 'search-sale':
            case 'search-employee':
                return <SearchPage searchType={selectedKey} />;
            case 'add-product':
                return <AddProduct />;
            case 'add-customer':
                return <ComingSoon feature="Add Customer" />;
            case 'add-employee':
                return <ComingSoon feature="Add Employee" />;
            default:
                return <DashboardHome />;
        }
    };

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
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 11,
                }}
                width={siderWidth}
                collapsedWidth={collapsedSiderWidth}
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
                
                {/* Custom Collapse Trigger */}
                <Button
                    type="text"
                    icon={collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        position: 'absolute',
                        bottom: 16,
                        right: collapsed ? '50%' : 16,
                        transform: collapsed ? 'translateX(50%)' : 'none',
                        fontSize: '16px',
                        width: 32,
                        height: 32,
                        color: '#8c8c8c',
                    }}
                />
            </Sider>

            {/* Main Layout */}
            <Layout style={{ marginLeft: collapsed ? collapsedSiderWidth : siderWidth, transition: 'margin-left 0.2s' }}>
                {/* Header */}
                <Header
                    style={{
                        padding: '0 24px',
                        background: colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px 0 rgba(29,35,41,.05)',
                        position: 'fixed',
                        top: 0,
                        left: collapsed ? collapsedSiderWidth : siderWidth,
                        right: 0,
                        zIndex: 10,
                        transition: 'left 0.2s',
                        height: 64,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 48,
                                height: 48,
                            }}
                        />
                        <Title level={4} style={{ margin: 0, marginLeft: 16 }}>
                            {getPageTitle(selectedKey)}
                        </Title>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </Header>

                {/* Content */}
                <Content
                    style={{
                        margin: '80px 16px 16px',
                        padding: 24,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        minHeight: 'calc(100vh - 96px)',
                        overflow: 'auto'
                    }}
                >
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
};

// Dashboard Home Component
const DashboardHome = () => {
    const navigate = useNavigate();
    
    return (
        <>
            <Title level={2} style={{ marginBottom: 8 }}>
                Welcome to Your Business Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: 32 }}>
                Use the sidebar navigation to manage your business operations
            </Text>

            {/* Quick Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Sales"
                            value={0}
                            prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Products"
                            value={0}
                            prefix={<BoxPlotOutlined style={{ color: '#1890ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Distributors"
                            value={35}
                            prefix={<ShopOutlined style={{ color: '#722ed1' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Customers"
                            value={0}
                            prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Quick Actions */}
            <Card title="Quick Actions" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            hoverable
                            onClick={() => navigate('/add-sale')}
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                        >
                            <PlusOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                            <div>Add New Sale</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            hoverable
                            onClick={() => navigate('/add-distributor')}
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                        >
                            <PlusOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
                            <div>Add Distributor</div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Card 
                            hoverable
                            onClick={() => navigate('/search-distributor')}
                            style={{ textAlign: 'center', cursor: 'pointer' }}
                        >
                            <SearchOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                            <div>Search Distributors</div>
                        </Card>
                    </Col>
                </Row>
            </Card>

            {/* Getting Started Guide */}
            <Card title="Getting Started" style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                            <Title level={4}>📊 Manage Sales</Title>
                            <Text>Add new sales transactions and track your revenue. Use the sales section to record and monitor all business transactions.</Text>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                            <Title level={4}>🏪 Distributor Network</Title>
                            <Text>Manage your distributors and supplier relationships. Currently 35 distributors are registered in your system.</Text>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                            <Title level={4}>📦 Product Inventory</Title>
                            <Text>Keep track of your products and inventory levels. Add products and monitor stock availability.</Text>
                        </div>
                    </Col>
                    <Col xs={24} md={12}>
                        <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                            <Title level={4}>👥 Customer Base</Title>
                            <Text>Maintain customer information and purchase history to build stronger relationships.</Text>
                        </div>
                    </Col>
                </Row>
            </Card>
        </>
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
            <BoxPlotOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={2}>{feature} - Coming Soon</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
                This feature is under development and will be available soon.
            </Text>
        </div>
    );
};

export default Dashboard;
