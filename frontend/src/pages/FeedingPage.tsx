import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Button, Space, Modal, Form, InputNumber, Input, Select, DatePicker, message, Row, Col, Statistic } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ExperimentOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { feedingService, FeedType, FeedDistribution, FeedPurchase } from '../services/feedingService';
import { rabbitService, Rabbit } from '../services/rabbitService';

const { Title, Text } = Typography;

const timeLabels: Record<string, string> = { MORNING: '🌅 Утро', AFTERNOON: '☀️ День', EVENING: '🌙 Вечер' };

const FeedingPage: React.FC = () => {
  const [distributions, setDistributions] = useState<FeedDistribution[]>([]);
  const [feedTypes, setFeedTypes] = useState<FeedType[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchases, setPurchases] = useState<FeedPurchase[]>([]);
  const [feeds, setFeeds] = useState<{id:number;name:string}[]>([]);
  const [form] = Form.useForm();
  const [purchaseForm] = Form.useForm();

  useEffect(() => {
    Promise.all([
      feedingService.listDistributions(),
      feedingService.listFeedTypes(),
      feedingService.listFeeds(),
      feedingService.listPurchases(),
      rabbitService.list(),
    ]).then(([dData, ftData, fData, pData, rData]) => {
      setDistributions((dData.results || dData).slice(0, 50));
      setFeedTypes(ftData.results || ftData);
      setFeeds((fData.results || fData).map((f: any) => ({ id: f.id, name: f.name })));
      setPurchases((pData.results || pData).slice(0, 50));
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

  const handleAddPurchase = async (values: any) => {
    try {
      await feedingService.createPurchase({
        ...values,
        purchase_date: dayjs(values.purchase_date).format('YYYY-MM-DD'),
        expiry_date: values.expiry_date ? dayjs(values.expiry_date).format('YYYY-MM-DD') : undefined,
      });
      message.success('Приход записан');
      setPurchaseModalOpen(false);
      purchaseForm.resetFields();
      const p = await feedingService.listPurchases();
      setPurchases((p.results || p).slice(0, 50));
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
          <Card><Statistic title="Всего корма" value={distributions.reduce((s, d) => s + Number(d.quantity), 0)} suffix="г" /></Card>
        </Col>
        <Col xs={12} sm={6}><Card><Statistic title="Закупок" value={purchases.length} prefix={<ShoppingCartOutlined />} /></Card></Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Расходы на корм"
              value={purchases.reduce((s, p) => s + Number(p.total_cost), 0)}
              suffix="₽"
              valueStyle={{ color: '#cf1322' }}
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

      {/* Приход кормов */}
      <Card
        title={<Title level={3} style={{ margin: 0, marginTop: 24 }}>📦 Приход кормов (закупки)</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { purchaseForm.resetFields(); setPurchaseModalOpen(true); }}>Оформить приход</Button>}
        style={{ marginTop: 24 }}
      >
        <Table
          columns={[
            { title: 'Дата', dataIndex: 'purchase_date', key: 'date', width: 110 },
            { title: 'Корм', dataIndex: 'feed_name', key: 'feed' },
            { title: 'Кол-во (кг)', dataIndex: 'quantity_kg', key: 'qty', width: 110 },
            { title: 'Цена/кг', dataIndex: 'price_per_kg', key: 'price', width: 100, render: (v: number) => `${v} ₽` },
            { title: 'Сумма', dataIndex: 'total_cost', key: 'cost', width: 110, render: (v: number) => <Tag color="red">{v} ₽</Tag> },
            { title: 'Поставщик', dataIndex: 'supplier', key: 'supplier', width: 130 },
            { title: 'Накладная', dataIndex: 'invoice_number', key: 'inv', width: 110 },
          ]}
          dataSource={purchases}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="middle"
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}><Text strong>ИТОГО:</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={4}><Text strong type="danger">{purchases.reduce((s, p) => s + Number(p.total_cost), 0)} ₽</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={5} colSpan={2} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Modal title="Оформление прихода корма" open={purchaseModalOpen} onCancel={() => setPurchaseModalOpen(false)} onOk={() => purchaseForm.submit()} width={500}>
        <Form form={purchaseForm} layout="vertical" onFinish={handleAddPurchase}>
          <Form.Item name="feed" label="Корм" rules={[{ required: true }]}>
            <Select placeholder="Выберите корм">{feeds.map(f => <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="quantity_kg" label="Количество (кг)" rules={[{ required: true }]}>
            <InputNumber min={0.01} step={0.1} style={{ width: '100%' }} placeholder="25" />
          </Form.Item>
          <Form.Item name="price_per_kg" label="Цена за кг (₽)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="120" />
          </Form.Item>
          <Form.Item name="purchase_date" label="Дата закупки" initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="supplier" label="Поставщик">
            <Input placeholder="ООО «Агрокорм»" />
          </Form.Item>
          <Form.Item name="invoice_number" label="Номер накладной">
            <Input placeholder="НК-001234" />
          </Form.Item>
          <Form.Item name="batch_number" label="Номер партии">
            <Input placeholder="BATCH-2026" />
          </Form.Item>
          <Form.Item name="expiry_date" label="Срок годности">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Примечания"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedingPage;
