import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Input, 
    Table, 
    Button, 
    Space, 
    Typography, 
    AutoComplete, 
    message,
    Pagination,
    Tag,
    Spin
} from 'antd';
import { 
    SearchOutlined, 
    EditOutlined, 
    EyeOutlined,
    ArrowLeftOutlined 
} from '@ant-design/icons';
import apiService from '../services/apiService';
import EditDistributor from './EditDistributor';

const { Title, Text } = Typography;
const { Search } = Input;

const SearchDistributor = () => {
    const [loading, setLoading] = useState(false);
    const [distributors, setDistributors] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(30);
    const [totalDistributors, setTotalDistributors] = useState(0);
    const [selectedDistributor, setSelectedDistributor] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Load all distributors on component mount
    useEffect(() => {
        fetchAllDistributors();
    }, []);

    const fetchAllDistributors = async () => {
        setLoading(true);
        try {
            console.log('🔍 Fetching all distributors from API...');
            console.log('🌐 Full API URL will be:', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/distributors`);
            const response = await apiService.get('/distributors');
            console.log('📦 Raw API response:', response);
            console.log('📋 Response data:', response.data);
            
            if (response.data && response.data.success) {
                console.log('✅ Successfully fetched distributors:', response.data.distributors.length);
                setDistributors(response.data.distributors);
                setTotalDistributors(response.data.distributors.length);
            } else {
                console.error('❌ API response indicates failure:', response.data);
                message.error('Failed to fetch distributors - Invalid response format');
            }
        } catch (error) {
            console.error('❌ Error fetching distributors:', error);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error message:', error.message);
            message.error(`Failed to fetch distributors: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle search input change for autocomplete
    const handleSearchChange = async (value) => {
        setSearchValue(value);
        
        if (value.length >= 3) {
            try {
                // Filter distributors based on search value
                const filtered = distributors.filter(distributor => 
                    distributor.name.toLowerCase().includes(value.toLowerCase()) ||
                    distributor.primaryPhone.includes(value) ||
                    distributor.email?.toLowerCase().includes(value.toLowerCase()) ||
                    distributor.city?.toLowerCase().includes(value.toLowerCase()) ||
                    distributor.companyType?.toLowerCase().includes(value.toLowerCase())
                ).slice(0, 10);

                const options = filtered.map(distributor => ({
                    value: distributor._id,
                    label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{distributor.name}</span>
                            <span style={{ color: '#666', fontSize: '12px' }}>
                                {distributor.primaryPhone} • {distributor.city}
                            </span>
                        </div>
                    ),
                    distributor: distributor
                }));
                
                setSearchResults(options);
            } catch (error) {
                console.error('Error searching distributors:', error);
            }
        } else {
            setSearchResults([]);
        }
    };

    // Handle distributor selection from autocomplete
    const handleDistributorSelect = (value, option) => {
        const selected = option.distributor;
        setSelectedDistributor(selected);
        setSearchValue(selected.name);
        setSearchResults([]);
        // Filter table to show only selected distributor
        setDistributors([selected]);
        setCurrentPage(1);
        setTotalDistributors(1);
    };

    // Clear search and show all distributors
    const clearSearch = () => {
        setSearchValue('');
        setSearchResults([]);
        setSelectedDistributor(null);
        fetchAllDistributors();
        setCurrentPage(1);
    };

    // Handle edit distributor
    const handleEdit = (distributor) => {
        setSelectedDistributor(distributor);
        setIsEditing(true);
    };

    // Handle back from edit mode
    const handleBackFromEdit = () => {
        setIsEditing(false);
        setSelectedDistributor(null);
        fetchAllDistributors(); // Refresh data after potential update
    };

    // Get paginated data
    const getPaginatedData = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return distributors.slice(startIndex, endIndex);
    };

    // Table columns - only show essential fields in table, but keep all data for editing
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Company Type',
            dataIndex: 'companyType',
            key: 'companyType',
            width: 120,
            render: (text) => (
                <Tag color={text === 'Proprietorship' ? 'blue' : text === 'Partnership' ? 'green' : 'purple'}>
                    {text}
                </Tag>
            )
        },
        {
            title: 'Phone',
            dataIndex: 'primaryPhone',
            key: 'primaryPhone',
            width: 130
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            render: (text) => text || '-'
        },
        {
            title: 'City',
            dataIndex: 'city',
            key: 'city',
            width: 120
        },
        {
            title: 'State',
            dataIndex: 'state',
            key: 'state',
            width: 120
        },
        {
            title: 'GST Number',
            dataIndex: 'gstNumber',
            key: 'gstNumber',
            width: 150,
            render: (text) => text || '-'
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (text) => new Date(text).toLocaleDateString()
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    if (isEditing && selectedDistributor) {
        return (
            <EditDistributor 
                distributor={selectedDistributor}
                onBack={handleBackFromEdit}
            />
        );
    }

    return (
        <div style={{ padding: '24px', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <Card style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <Title level={3} style={{ margin: 0, marginBottom: '8px' }}>
                            🏪 Search Distributors
                        </Title>
                        <Text type="secondary">
                            Search and manage your distributor network
                        </Text>
                    </div>

                    {/* Search Bar */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '300px', maxWidth: '500px' }}>
                                <AutoComplete
                                    style={{ width: '100%' }}
                                    options={searchResults}
                                    onSearch={handleSearchChange}
                                    onSelect={handleDistributorSelect}
                                    value={searchValue}
                                    placeholder="Type at least 3 characters to search by name, phone, email, or city..."
                                >
                                    <Input
                                        size="large"
                                        prefix={<SearchOutlined />}
                                        style={{ width: '100%' }}
                                    />
                                </AutoComplete>
                            </div>
                            {searchValue && (
                                <Button 
                                    type="default"
                                    onClick={clearSearch}
                                    size="large"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text>
                            {selectedDistributor ? (
                                <>Showing distributor: <Text strong>{selectedDistributor.name}</Text></>
                            ) : (
                                <>Found <Text strong>{totalDistributors}</Text> distributors</>
                            )}
                        </Text>
                        {selectedDistributor && (
                            <Button onClick={clearSearch}>
                                Show All Distributors
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Results Table */}
                <Card>
                    <Spin spinning={loading}>
                        <Table
                            columns={columns}
                            dataSource={getPaginatedData()}
                            pagination={false}
                            rowKey="_id"
                            scroll={{ x: 1200 }}
                            size="middle"
                        />
                        
                        {/* Custom Pagination */}
                        {totalDistributors > pageSize && (
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={totalDistributors}
                                    onChange={(page) => setCurrentPage(page)}
                                    showSizeChanger={false}
                                    showQuickJumper
                                    showTotal={(total, range) => 
                                        `${range[0]}-${range[1]} of ${total} distributors`
                                    }
                                />
                            </div>
                        )}
                    </Spin>
                </Card>

                {/* Empty State */}
                {!loading && distributors.length === 0 && (
                    <Card style={{ textAlign: 'center', marginTop: '24px' }}>
                        <div style={{ padding: '48px 24px' }}>
                            <SearchOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                            <Title level={4}>No Distributors Found</Title>
                            <Text type="secondary">
                                {searchValue ? 'Try adjusting your search terms' : 'No distributors have been added yet'}
                            </Text>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default SearchDistributor;
