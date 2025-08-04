import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Space, Typography, Dropdown, Avatar } from 'antd';
import {
    LogoutOutlined,
    UserOutlined,
    HomeOutlined,
    ShopOutlined
} from '@ant-design/icons';
import authService from '../services/authService';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = authService.getCurrentUser();
    const { theme } = useTheme();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: (
                <span>
                    <strong>{currentUser?.username || 'User'}</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                        {currentUser?.role === 'admin' ? 'Administrator' : 
                         currentUser?.role === 'manager' ? 'Manager' : 'Employee'}
                    </small>
                </span>
            ),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: handleLogout,
        },
    ];

    // Don't show header on login page
    if (location.pathname === '/login') {
        return null;
    }

    return (
        <AntHeader 
            style={{
                background: theme === 'dark' 
                    ? 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'
                    : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                padding: '0 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}
        >
            {/* Left side - Business name and navigation */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                    <Space align="center">
                        <ShopOutlined 
                            style={{ 
                                fontSize: '28px', 
                                color: '#fff',
                                marginRight: '8px'
                            }} 
                        />
                        <Title 
                            level={3} 
                            style={{ 
                                margin: 0, 
                                color: '#fff',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}
                        >
                            Vinod Electronics
                        </Title>
                    </Space>
                </Link>
                
                {location.pathname !== '/dashboard' && (
                    <Link to="/dashboard" style={{ marginLeft: '32px' }}>
                        <Button
                            type="text"
                            icon={<HomeOutlined />}
                            style={{
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '6px'
                            }}
                        >
                            Dashboard
                        </Button>
                    </Link>
                )}
            </div>

            {/* Right side - User info and logout */}
            <Space align="center">
                <ThemeToggle />
                <Dropdown
                    menu={{ items: userMenuItems }}
                    placement="bottomRight"
                    trigger={['click']}
                >
                    <Button
                        type="text"
                        style={{
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '6px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Space>
                            <Avatar 
                                size="small" 
                                icon={<UserOutlined />} 
                                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            />
                            <span>{currentUser?.username || 'User'}</span>
                        </Space>
                    </Button>
                </Dropdown>
                
                <Button
                    type="text"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '6px'
                    }}
                >
                    Logout
                </Button>
            </Space>
        </AntHeader>
    );
};

export default Header;
