import React, { useEffect, useState, useCallback } from 'react';
import { Table, Card, Tag, Button, Space, Pagination, message, Spin, Typography } from 'antd';
import { ReloadOutlined, RollbackOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;

const DeletedProducts = () => {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const fetchDeleted = useCallback(async (p = page) => {
    try {
      setLoading(true);
      const resp = await apiService.products.getDeleted({ page: p, limit: pageSize });
      if (resp.data.success) {
        setData(resp.data.products || []);
        setTotal(resp.data.total || 0);
      } else {
        message.error(resp.data.message || 'Failed to fetch deleted products');
      }
    } catch (e) {
      console.error('Error fetching deleted products', e);
      message.error('Error fetching deleted products');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchDeleted(1); }, [fetchDeleted]);

  const handleRestore = async (id) => {
    try {
      setRestoring(true);
      const resp = await apiService.products.restore(id);
      if (resp.data.success) {
        message.success('Product restored');
        // Optimistic update remove from list
        setData(prev => prev.filter(p => p._id !== id));
        setTotal(t => (t > 0 ? t - 1 : 0));
      } else {
        message.error(resp.data.message || 'Failed to restore');
      }
    } catch (e) {
      console.error('Restore error', e);
      message.error('Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const columns = [
    { title: 'Brand', dataIndex: 'brand', key: 'brand', width: 120, render: v => v || '-' },
    { title: 'Model', dataIndex: 'model_number', key: 'model_number', width: 140, render: v => v || '-' },
    { title: 'Serial', dataIndex: 'serial_number', key: 'serial_number', width: 160, render: v => v || '-' },
    { title: 'Dealer Price', dataIndex: 'dealer_price', key: 'dealer_price', width: 110, align:'right', render: v => v? `₹${Number(v).toLocaleString('en-IN')}`:'-' },
    { title: 'MRP', dataIndex: 'mrp', key: 'mrp', width: 110, align:'right', render: v => v? `₹${Number(v).toLocaleString('en-IN')}`:'-' },
    { title: 'Deleted At', dataIndex: 'updatedAt', key: 'updatedAt', width: 170, render: v => v? new Date(v).toLocaleString():'-' },
    { title: 'Status', key: 'status', width: 90, render: () => <Tag color="red">Deleted</Tag> },
    { title: 'Action', key: 'action', fixed: 'right', width: 110, render: (_, r) => (
        <Button size="small" icon={<RollbackOutlined />} loading={restoring} onClick={() => handleRestore(r._id)}>
          Restore
        </Button>
      ) }
  ];

  return (
    <Card title={<Title level={4} style={{margin:0}}>Deleted Products</Title>} extra={<Space>
        <Button icon={<ReloadOutlined />} size="small" onClick={() => fetchDeleted(page)}>Refresh</Button>
      </Space>}>
      <Spin spinning={loading}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          size="small"
          pagination={false}
          scroll={{ x: 900, y: 520 }}
        />
        <div style={{marginTop:12, textAlign:'right'}}>
          <Pagination current={page} pageSize={pageSize} total={total} onChange={(p)=>{setPage(p); fetchDeleted(p);}} showSizeChanger={false} />
        </div>
        {data.length === 0 && !loading && <Text type="secondary">No deleted products.</Text>}
      </Spin>
    </Card>
  );
};

export default DeletedProducts;
