import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, message, Row, Col, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, MedicineBoxOutlined, AlertOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { healthService, HealthEvent } from '../services/healthService';
import { rabbitService, Rabbit } from '../services/rabbitService';

const { Title } = Typography;

const eventColors: Record<string, string> = {
  VACCINATION: 'blue', TREATMENT: 'orange', QUARANTINE: 'red', CHECKUP: 'green', SURGERY: 'volcano', DEWORMING: 'purple', OTHER: 'default',
};
const eventLabels: Record<string, string> = {
  VACCINATION: '💉 Прививка', TREATMENT: '💊 Лечение', QUARANTINE: '🚫 Карантин', CHECKUP: '🩺 Осмотр', SURGERY: '🔪 Хирургия', DEWORMING: '🪱 Дегельминтизация', OTHER: 'Другое',
};
const riskLabels: Record<string, string> = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий' };
const riskColors: Record<string, string> = { LOW: 'green', MEDIUM: 'orange', HIGH: 'red' };

const HealthPage: React.FC = () => {
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([healthService.list(), rabbitService.list()])
      .then(([eData, rData]) => {
        setEvents(eData.results || eData);
        setRabbits(rData.results || rData);
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (values: any) => {
    try {
      await healthService.create({
        ...values,
        date: dayjs(values.date).format('YYYY-MM-DD'),
      });
      message.success('Мероприятие записано');
      setModalOpen(false);
      form.resetFields();
      const d = await healthService.list();
      setEvents(d.results || d);
    } catch (err) { message.error('Ошибка'); }
  };

  const columns: ColumnsType<HealthEvent> = [
    { title: 'Дата', dataIndex: 'date', key: 'date', width: 110 },
    {
      title: 'Тип', dataIndex: 'event_type', key: 'type', width: 150,
      render: (t: string) => <Tag color={eventColors[t]}>{eventLabels[t]}</Tag>,
    },
    { title: 'Кролик', dataIndex: 'rabbit', key: 'rabbit', width: 80 },
    { title: 'Описание', dataIndex: 'description', key: 'desc' },
    { title: 'Лекарство', dataIndex: 'medication', key: 'med' },
    { title: 'Ветеринар', dataIndex: 'vet_name', key: 'vet', width: 130 },
    {
      title: 'Риск', dataIndex: 'risk_level', key: 'risk', width: 90,
      render: (r: string) => <Tag color={riskColors[r]}>{riskLabels[r]}</Tag>,
    },
    {
      title: 'Срочно', dataIndex: 'is_urgent', key: 'urgent', width: 80,
      render: (u: boolean) => u ? <Tag color="red">ДА</Tag> : null,
    },
  ];

  const urgentCount = events.filter(e => e.is_urgent).length;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card><Statistic title="Мероприятий" value={events.length} prefix={<MedicineBoxOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Срочных" value={urgentCount} valueStyle={{ color: urgentCount > 0 ? '#cf1322' : undefined }} prefix={<AlertOutlined />} /></Card></Col>
      </Row>

      <Card
        title={<Title level={3} style={{ margin: 0 }}>🏥 Здоровье</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>Записать мероприятие</Button>}
      >
        <Table columns={columns} dataSource={events} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      <Modal title="Ветеринарное мероприятие" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="rabbit" label="Кролик" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {rabbits.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="event_type" label="Тип" rules={[{ required: true }]}>
            <Select>{Object.entries(eventLabels).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="date" label="Дата" initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Описание" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="medication" label="Лекарство"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="dosage" label="Дозировка"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="vet_name" label="Ветеринар"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="risk_level" label="Уровень риска" initialValue="LOW">
              <Select>{Object.entries(riskLabels).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
            </Form.Item></Col>
          </Row>
          <Form.Item name="is_urgent" label="Срочно" initialValue={false}>
            <Select><Select.Option value={true}>Да</Select.Option><Select.Option value={false}>Нет</Select.Option></Select>
          </Form.Item>
          <Form.Item name="notes" label="Примечания"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HealthPage;
