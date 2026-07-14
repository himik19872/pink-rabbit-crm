import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, Table, Button, Space, Modal, Form, InputNumber, Input, DatePicker,
  Select, message, Popconfirm, Row, Col, Statistic, Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined, ScissorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import { rabbitService, Rabbit } from '../services/rabbitService';

const { Title } = Typography;

interface Slaughter {
  id: number;
  rabbit: number;
  rabbit_name: string;
  rabbit_id: string;
  slaughter_date: string;
  live_weight: number;
  carcass_weight: number;
  dressing_percentage: number;
  notes: string;
  created_at: string;
}

const SlaughterPage: React.FC = () => {
  const [slaughters, setSlaughters] = useState<Slaughter[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, rData, stData] = await Promise.all([
        api.get('/rabbits/slaughters/'),
        rabbitService.list({ page_size: '100' }),
        api.get('/rabbits/slaughters/stats/'),
      ]);
      setSlaughters(sData.data.results || sData.data);
      setRabbits(rData.results || rData);
      setStats(stData.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/rabbits/slaughters/', {
        ...values,
        slaughter_date: dayjs(values.slaughter_date).format('YYYY-MM-DD'),
      });
      message.success('Забой записан ✅ Кролик переведён в статус SOLD');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.detail || 'Ошибка');
    }
  };

  const handleDelete = async (id: number) => {
    try { await api.delete(`/rabbits/slaughters/${id}/`); message.success('Удалено'); fetchData(); }
    catch { message.error('Ошибка'); }
  };

  const columns: ColumnsType<Slaughter> = [
    { title: 'Дата', dataIndex: 'slaughter_date', key: 'd', width: 110 },
    { title: 'Кролик', dataIndex: 'rabbit_name', key: 'r' },
    { title: 'ID', dataIndex: 'rabbit_id', key: 'rid', width: 140 },
    {
      title: 'Живой вес', dataIndex: 'live_weight', key: 'lw', width: 110,
      render: (w: number) => `${w} г`,
    },
    {
      title: 'Вес тушки', dataIndex: 'carcass_weight', key: 'cw', width: 110,
      render: (w: number) => `${w} г`,
    },
    {
      title: 'Выход', dataIndex: 'dressing_percentage', key: 'dp', width: 90,
      render: (p: number) => <Tag color={p >= 60 ? 'green' : p >= 50 ? 'orange' : 'red'}>{p}%</Tag>,
    },
    { title: 'Примечания', dataIndex: 'notes', key: 'n', render: (n: string) => n || '—' },
    {
      title: '', key: 'act', width: 60,
      render: (_: any, r: Slaughter) => (
        <Popconfirm title="Удалить запись?" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const meatRabbits = rabbits.filter(r => r.status === 'MEAT' || r.status === 'BREEDING' || r.status === 'YOUNG');

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="Всего забоев" value={stats.total_count || 0} prefix={<ScissorOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Общий живой вес" value={stats.total_live_kg || 0} suffix="кг" precision={2} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Общий вес тушек" value={stats.total_carcass_kg || 0} suffix="кг" precision={2} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Средний убойный выход"
              value={stats.dressing_percentage || 0}
              suffix="%"
              valueStyle={{ color: (stats.dressing_percentage || 0) >= 55 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Средний живой вес" value={stats.avg_live_g || 0} suffix="г" precision={0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Средний вес тушки" value={stats.avg_carcass_g || 0} suffix="г" precision={0} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={3} style={{ margin: 0 }}><ScissorOutlined /> Учёт забоя</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>Записать забой</Button>}
      >
        <Table columns={columns} dataSource={slaughters} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      <Modal title="Записать забой" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="rabbit" label="Кролик" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children" placeholder="Выберите кролика">
              {meatRabbits.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name || 'Без имени'} ({r.status})</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="slaughter_date" label="Дата забоя" initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="live_weight" label="Живой вес (г)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="3500" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="carcass_weight" label="Вес тушки (г)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="2000" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SlaughterPage;
