import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Modal, Form, InputNumber, Input, Select, DatePicker, message, Row, Col, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ExperimentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { feedingService, FeedType, FeedDistribution } from '../services/feedingService';
import { rabbitService, Rabbit } from '../services/rabbitService';

const { Title } = Typography;

const timeLabels: Record<string, string> = { MORNING: '🌅 Утро', AFTERNOON: '☀️ День', EVENING: '🌙 Вечер' };

const FeedingPage: React.FC = () => {
  const [distributions, setDistributions] = useState<FeedDistribution[]>([]);
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([
      feedingService.listDistributions(),
      feedingService.listFeedTypes(),
      rabbitService.list(),
    ]).then(([dData, ftData, rData]) => {
      setDistributions((dData.results || dData).slice(0, 50));
      setFeedTypes(ftData.results || ftData);
      setRabbits(rData.results || rData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (values: any) => {
    try {
      await feedingService.createDistribution({
        ...values,
        distribution_date: dayjs(values.distribution_date).format('YYYY-MM-DD'),
      });
      message.success('Раздача записана');
      setModalOpen(false);
      form.resetFields();
      const d = await feedingService.listDistributions();
      setDistributions((d.results || d).slice(0, 50));
    } catch (err) { message.error('Ошибка'); }
  };

  const columns: ColumnsType<FeedDistribution> = [
    { title: 'Дата', dataIndex: 'distribution_date', key: 'date', width: 120 },
    { title: 'Время', dataIndex: 'time_of_day', key: 'time', render: (t: string) => timeLabels[t] || t, width: 100 },
    { title: 'Количество (г)', dataIndex: 'quantity', key: 'qty', width: 120 },
    { title: 'Примечания', dataIndex: 'notes', key: 'notes' },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card><Statistic title="Раздач" value={distributions.length} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Всего корма"
              value={distributions.reduce((s, d) => s + Number(d.quantity), 0)}
              suffix="г"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={3} style={{ margin: 0 }}>🍽️ Кормление</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>Записать раздачу</Button>}
      >
        <Table columns={columns} dataSource={distributions} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      <Modal title="Запись раздачи корма" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="rabbit" label="Кролик" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children" placeholder="Поиск">
              {rabbits.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="feed" label="Корм" rules={[{ required: true }]}>
            <Select placeholder="Выберите корм">
              {feedTypes.map(ft => <Select.Option key={ft.id} value={ft.id}>{ft.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="Количество (г)" rules={[{ required: true }]}>
            <InputNumber min={1} max={5000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="distribution_date" label="Дата" initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="time_of_day" label="Время суток" initialValue="MORNING">
            <Select>{Object.entries(timeLabels).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="notes" label="Примечания"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedingPage;
