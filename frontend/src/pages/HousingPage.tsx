import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Table, Tag, Button, Space, Modal, Form, Input, InputNumber,
  Select, message, Popconfirm, Row, Col, Descriptions, Spin, Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, QrcodeOutlined, HomeOutlined, ScanOutlined } from '@ant-design/icons';
import {
  housingService, Cage, Building,
} from '../services/housingService';
import { rabbitService, Rabbit } from '../services/rabbitService';

const { Title, Text } = Typography;

const HousingPage: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [cages, setCages] = useState<Cage[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCage, setSelectedCage] = useState<Cage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState<number | undefined>();
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  useEffect(() => {
    Promise.all([
      housingService.listBuildings(),
      housingService.listCages(),
      rabbitService.list(),
    ]).then(([bData, cData, rData]) => {
      setBuildings(bData.results || bData);
      setCages(cData.results || cData);
      setRabbits(rData.results || rData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleAddCage = async (values: any) => {
    try {
      await housingService.createCage(values);
      message.success('Клетка добавлена');
      setModalOpen(false);
      form.resetFields();
      const cData = await housingService.listCages();
      setCages(cData.results || cData);
    } catch (err) { message.error('Ошибка'); }
  };

  const handleAssign = async (values: { rabbit_id: number }) => {
    if (!selectedCage) return;
    try {
      await housingService.assignRabbit(selectedCage.id, values.rabbit_id);
      message.success('Кролик назначен в клетку');
      setAssignModalOpen(false);
      const cData = await housingService.listCages();
      setCages(cData.results || cData);
    } catch (err) { message.error('Ошибка назначения'); }
  };

  const handleClear = async (cageId: number) => {
    try {
      await housingService.clearCage(cageId);
      message.success('Клетка освобождена');
      const cData = await housingService.listCages();
      setCages(cData.results || cData);
    } catch (err) { message.error('Ошибка'); }
  };

  const showDetail = (cage: Cage) => {
    setSelectedCage(cage);
    setDetailOpen(true);
  };

  const emptyCages = cages.filter(c => !c.current_rabbit && c.is_active);
  const occupiedCages = cages.filter(c => c.current_rabbit && c.is_active);

  const cageColumns: ColumnsType<Cage> = [
    { title: 'Адрес', dataIndex: 'shelf_address', key: 'address', render: (a: string, c: Cage) => `${a} — Клетка ${c.number}` },
    { title: 'Вместимость', dataIndex: 'capacity', key: 'capacity', width: 100 },
    {
      title: 'Кролик', dataIndex: 'current_rabbit_info', key: 'rabbit',
      render: (r: string | null) => r ? <Tag color="green">{r}</Tag> : <Tag color="default">Пусто</Tag>,
    },
    {
      title: 'Уборка', dataIndex: 'last_cleaned', key: 'cleaned',
      render: (d: string | null) => d || '—', width: 120,
    },
    {
      title: 'QR', dataIndex: 'address_qr', key: 'qr', width: 80,
      render: (qr: string) => <Tag icon={<QrcodeOutlined />} color="blue">QR</Tag>,
    },
    {
      title: '', key: 'actions', width: 200,
      render: (_: any, c: Cage) => (
        <Space>
          <Button size="small" icon={<ScanOutlined />} onClick={() => showDetail(c)}>Детали</Button>
          {c.current_rabbit ? (
            <Popconfirm title="Освободить клетку?" onConfirm={() => handleClear(c.id)}>
              <Button size="small" danger>Освободить</Button>
            </Popconfirm>
          ) : (
            <Button size="small" type="primary" onClick={() => { setSelectedCage(c); setAssignModalOpen(true); }}>
              Заселить
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}><Card><Statistic title="Всего клеток" value={cages.length} prefix={<HomeOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Занято" value={occupiedCages.length} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Свободно" value={emptyCages.length} valueStyle={{ color: '#1890ff' }} /></Card></Col>
      </Row>

      <Card
        title={<Title level={3} style={{ margin: 0, marginTop: 24 }}>🏠 Клетки</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Добавить клетку</Button>}
      >
        <Table columns={cageColumns} dataSource={cages} rowKey="id" pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      {/* Add Cage Modal */}
      <Modal title="Добавить клетку" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAddCage}>
          <Form.Item name="shelf" label="Ярус ID" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="ID яруса" />
          </Form.Item>
          <Form.Item name="number" label="Номер клетки" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="capacity" label="Вместимость" initialValue={1}>
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Modal */}
      <Modal title="Заселить кролика" open={assignModalOpen} onCancel={() => setAssignModalOpen(false)} onOk={() => assignForm.submit()}>
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="rabbit_id" label="Выберите кролика" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children" placeholder="Поиск по ID или кличке">
              {rabbits.map(r => (
                <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name || 'Без имени'}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Cage Detail Modal */}
      <Modal title="Детали клетки" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={500}>
        {selectedCage && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Адрес">{selectedCage.shelf_address} — Клетка {selectedCage.number}</Descriptions.Item>
            <Descriptions.Item label="QR">{selectedCage.address_qr}</Descriptions.Item>
            <Descriptions.Item label="Вместимость">{selectedCage.capacity}</Descriptions.Item>
            <Descriptions.Item label="Кролик">{selectedCage.current_rabbit_info || 'Пусто'}</Descriptions.Item>
            <Descriptions.Item label="Уборка">{selectedCage.last_cleaned || '—'}</Descriptions.Item>
            <Descriptions.Item label="Дезинфекция">{selectedCage.last_disinfected || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default HousingPage;
