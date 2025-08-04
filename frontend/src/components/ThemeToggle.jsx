import React from 'react';
import { Button } from 'antd';
import { useTheme } from '../contexts/ThemeContext';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />} 
      onClick={toggleTheme}
      type="text"
      style={{
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '6px',
        marginRight: '10px'
      }}
    >
      {theme === 'light' ? 'Dark' : 'Light'}
    </Button>
  );
};

export default ThemeToggle;
