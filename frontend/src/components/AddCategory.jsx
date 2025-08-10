import React, { useEffect, useState, useMemo } from 'react';
import { Card, Form, Input, Button, Select, Switch, Space, Row, Col, Typography, Divider, message, Tag } from 'antd';
import { PlusOutlined, SaveOutlined, NodeIndexOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

function buildTreeIndex(nodes) {
  const byId = new Map();
  nodes.forEach(n => byId.set(String(n._id), { ...n, children: [] }));
  const roots = [];
  byId.forEach(n => {
    if (n.parent_id) {
      const p = byId.get(String(n.parent_id));
      if (p) p.children.push(n);
    } else {
      roots.push(n);
    }
  });
  return { roots, byId };
}

const defaultField = () => ({
  field_id: '',
  label: '',
  type: 'text',
  is_required: false,
  enabled: true,
  options: [],
  display_order: 0
});

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'combobox', label: 'Combobox' }
];

const AddCategory = () => {
  const [form] = Form.useForm();
  const [roots, setRoots] = useState([]); 
  const [selectedRootKey, setSelectedRootKey] = useState(null);
  const [rootTree, setRootTree] = useState(null); 
  const [nodesIndex, setNodesIndex] = useState({ roots: [], byId: new Map() });
  const [parentId, setParentId] = useState(null); 
  const [isLeaf, setIsLeaf] = useState(false);
  const [fields, setFields] = useState([]); 
  const [loadingRoots, setLoadingRoots] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadRoots(); }, []);

  const loadRoots = async () => {
    try {
      setLoadingRoots(true);
      const resp = await apiService.categories.getRoots();
      if (resp.data.success) setRoots(resp.data.data || []);
    } catch (e) {
      message.error('Failed to load roots');
    } finally { setLoadingRoots(false); }
  };

  const loadTree = async (rootKey) => {
    try {
      const resp = await apiService.categories.getTree(rootKey);
      if (resp.data.success) {
        setRootTree(resp.data.data);
        const idx = buildTreeIndex(resp.data.data.nodes || []);
        setNodesIndex(idx);
      }
    } catch (e) {
      message.error('Failed to load tree');
    }
  };

  const handleSelectRoot = (value) => {
    setSelectedRootKey(value);
    setParentId(null);
    setFields([]);
    setIsLeaf(false);
    if (value) loadTree(value);
  };

  const parentPath = useMemo(() => {
    if (!parentId || !nodesIndex.byId.size) return [];
    const chain = [];
    let current = nodesIndex.byId.get(String(parentId));
    while (current) {
      chain.unshift(current);
      current = current.parent_id ? nodesIndex.byId.get(String(current.parent_id)) : null;
    }
    return chain;
  }, [parentId, nodesIndex]);

  const addField = () => setFields(prev => [...prev, { ...defaultField(), display_order: prev.length }]);
  const updateField = (idx, patch) => setFields(prev => prev.map((f,i)=> i===idx? { ...f, ...patch }: f));
  const removeField = (idx) => setFields(prev => prev.filter((_,i)=> i!==idx));

  const handleCreate = async () => {
    try {
      await form.validateFields(['name']);
      setCreating(true);
      const payload = {
        name: form.getFieldValue('name'),
        parent_id: parentId || null,
        is_leaf: isLeaf,
        form_schema: isLeaf || !parentId ? fields.filter(f => f.field_id && f.label) : []
      };
      const resp = await apiService.categories.create(payload);
      if (resp.data.success) {
        message.success('Category created');
        form.resetFields();
        setParentId(null); setFields([]); setIsLeaf(false);
        await loadRoots();
        if (payload.parent_id) {
          const rootKey = selectedRootKey || (resp.data.data.level === 0 ? resp.data.data.name : selectedRootKey);
          if (rootKey) await loadTree(rootKey);
        } else {
          setSelectedRootKey(resp.data.data.name);
          await loadTree(resp.data.data.name);
        }
      } else {
        message.error(resp.data.message || 'Failed to create');
      }
    } catch (e) {
      if (e?.errorFields) return; 
      message.error(e.response?.data?.message || e.message || 'Error');
    } finally { setCreating(false); }
  };

  const rootOptions = roots.map(r => ({ value: r.root_key, label: r.name }));

  return (
    <Card title={<span><NodeIndexOutlined /> Add / Manage Categories</span>} bodyStyle={{ padding: 16 }}>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card size="small" title="1. Select or Create Root" bodyStyle={{ padding: 12 }} style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                placeholder="Select existing root"
                options={rootOptions}
                loading={loadingRoots}
                allowClear
                value={selectedRootKey}
                onChange={handleSelectRoot}
              />
              <Divider plain style={{ margin: '8px 0' }}>or</Divider>
              <Form form={form} layout="vertical" onFinish={handleCreate}>
                <Form.Item name="name" label="New Category Name" rules={[{ required: true, message: 'Enter name' }]}> <Input placeholder="e.g. Appliances" /> </Form.Item>
                <Form.Item label="Parent (optional)">
                  <Select
                    showSearch
                    allowClear
                    placeholder={selectedRootKey ? 'Search within tree' : 'Select root first'}
                    disabled={!selectedRootKey}
                    value={parentId}
                    onChange={v => setParentId(v || null)}
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    options={nodesIndex.roots.flatMap(rootNode => {
                      const collect = []; const stack = [rootNode];
                      while (stack.length) { const n = stack.pop(); collect.push({ value: n._id, label: `${' › '.repeat(n.level)}${n.name}` }); (n.children||[]).forEach(c=>stack.push(c)); }
                      return collect;
                    })}
                  />
                </Form.Item>
                <Form.Item label="Is Leaf?" valuePropName="checked">
                  <Switch checked={isLeaf} onChange={v=> setIsLeaf(v)} />
                </Form.Item>
                {(isLeaf || !parentId) && (
                  <Card size="small" title={parentId ? 'Specific Fields (Leaf)' : 'Common Fields (Root)'} bodyStyle={{ padding: 8 }} extra={<Button size="small" type="dashed" onClick={addField} icon={<PlusOutlined />}>Field</Button>}>
                    {fields.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>No fields yet. Add one.</Text>}
                    {fields.map((f, idx) => (
                      <Row key={idx} gutter={4} style={{ marginBottom: 8 }} align="middle">
                        <Col span={5}><Input size="small" placeholder="field_id" value={f.field_id} onChange={e=> updateField(idx,{ field_id: e.target.value })} /></Col>
                        <Col span={5}><Input size="small" placeholder="Label" value={f.label} onChange={e=> updateField(idx,{ label: e.target.value })} /></Col>
                        <Col span={4}>
                          <Select size="small" value={f.type} onChange={v=> updateField(idx,{ type: v })} style={{ width: '100%' }}>
                            {fieldTypes.map(t=> <Option key={t.value} value={t.value}>{t.label}</Option>)}
                          </Select>
                        </Col>
                        <Col span={3}><Switch size="small" checked={f.is_required} onChange={v=> updateField(idx,{ is_required: v })} /></Col>
                        <Col span={3}><Switch size="small" checked={f.enabled} onChange={v=> updateField(idx,{ enabled: v })} /></Col>
                        <Col span={4}><Input size="small" type="number" placeholder="#" value={f.display_order} onChange={e=> updateField(idx,{ display_order: Number(e.target.value) })} /></Col>
                        <Col span={24} style={{ marginTop: 4 }}>
                          {(f.type === 'dropdown' || f.type === 'combobox') && (
                            <Input.TextArea
                              rows={1}
                              size="small"
                              placeholder="Options (one per line as value|label)"
                              value={f.options.map(o=> `${o.value}|${o.label}`).join('\n')}
                              onChange={e=> {
                                const opts = e.target.value.split(/\n+/).filter(Boolean).map(line=>{
                                  const [val, lab] = line.split('|');
                                  return { value: val?.trim(), label: (lab||val).trim() };
                                }).filter(o=>o.value);
                                updateField(idx,{ options: opts });
                              }}
                            />
                          )}
                        </Col>
                        <Col span={24}>
                          <Space size={4} wrap>
                            {f.options && f.options.map(o=> <Tag key={o.value}>{o.label}</Tag>)}
                            <Button size="small" danger onClick={()=> removeField(idx)}>Remove</Button>
                          </Space>
                        </Col>
                        <Divider style={{ margin: '8px 0' }} />
                      </Row>
                    ))}
                  </Card>
                )}
                {parentPath.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Parent Path: {parentPath.map(p=> p.name).join(' > ')}</Text>
                  </div>
                )}
                <Form.Item style={{ marginTop: 12 }}>
                  <Space>
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleCreate} loading={creating}>Create Category</Button>
                    <Button onClick={()=> { form.resetFields(); setParentId(null); setFields([]); setIsLeaf(false); }}>Reset</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card size="small" title="2. Current Tree" bodyStyle={{ padding: 12, maxHeight: 600, overflow: 'auto' }}>
            {!selectedRootKey && <Text type="secondary">Select a root to view its tree.</Text>}
            {selectedRootKey && rootTree && (
              <TreeView nodesIndex={nodesIndex} onSelect={id=> setParentId(id)} selectedId={parentId} />
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

const TreeView = ({ nodesIndex, onSelect, selectedId }) => {
  const renderNode = (node) => {
    const isSelected = String(selectedId) === String(node._id);
    return (
      <div key={node._id} style={{ marginLeft: node.level * 12, padding: '2px 4px', cursor: 'pointer', background: isSelected ? '#e6f7ff' : 'transparent', borderRadius: 4 }} onClick={()=> onSelect(node._id)}>
        <span style={{ fontWeight: node.level === 0 ? 600 : 400 }}>{node.name}</span>
        {node.is_leaf && <Tag color="green" size="small" style={{ marginLeft: 6 }}>leaf</Tag>}
      </div>
    );
  };
  const all = [];
  nodesIndex.roots.forEach(r => {
    const stack = [r];
    while (stack.length) {
      const n = stack.pop();
      all.push(renderNode(n));
      (n.children || []).slice().reverse().forEach(c => stack.push(c));
    }
  });
  return <div>{all}</div>;
};

export default AddCategory;
