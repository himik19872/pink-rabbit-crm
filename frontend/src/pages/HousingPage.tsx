import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Table, Tag, Button, Space, Modal, Form, InputNumber,
  Select, message, Popconfirm, Row, Col, Descriptions, Spin, Statistic, QRCode,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, QrcodeOutlined, HomeOutlined, ScanOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import {
  housingService, Cage,
} from '../services/housingService';
import { rabbitService, Rabbit } from '../services/rabbitService';
import LabelPrinter from '../components/LabelPrinter';

const { Title } = Typography;

const HousingPage: React.FC = () => {
  const [cages, setCages] = useState<Cage[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCage, setSelectedCage] = useState<Cage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingCage, setEditingCage] = useState<Cage | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    Promise.all([
      housingService.listCages(),
      rabbitService.list(),
    ]).then(([cData, rData]) => {
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

  const handleEditCage = async (values: any) => {
    if (!editingCage) return;
    try {
      await housingService.updateCage(editingCage.id, values);
      message.success('Клетка обновлена');
      setEditModalOpen(false);
      setEditingCage(null);
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
    { title: 'Вместимость', dataIndex: 'capacity', key: 'capacity', width: 100, render: (c: number) => `${c} крол.` },
    {
      title: 'Кролик', dataIndex: 'current_rabbit_info', key: 'rabbit',
      render: (r: string | null) => r ? <Tag color="green">{r}</Tag> : <Tag color="default">Пусто</Tag>,
    },
    {
      title: 'Уборка', dataIndex: 'last_cleaned', key: 'cleaned',
      render: (d: string | null) => d || '—', width: 120,
    },
    {
      title: 'QR', key: 'qr', width: 80,
      render: (_: any, c: Cage) => (
        <Button type="link" icon={<QrcodeOutlined />} onClick={() => { setSelectedCage(c); setQrModalOpen(true); }}>
          QR
        </Button>
      ),
    },
    {
      title: '', key: 'actions', width: 200,
      render: (_: any, c: Cage) => (
        <Space>
          <Button size="small" icon={<ScanOutlined />} onClick={() => showDetail(c)}>Детали</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditingCage(c); editForm.setFieldsValue(c); setEditModalOpen(true); }} />
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
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button icon={<PrinterOutlined />} onClick={() => setPrintModalOpen(true)}>
                Печать этикеток ({selectedRowKeys.length})
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Добавить клетку</Button>
          </Space>
        }
      >
        <Table
          columns={cageColumns}
          dataSource={cages}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          size="middle"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
        />
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
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Cage Modal */}
      <Modal title="Редактировать клетку" open={editModalOpen} onCancel={() => setEditModalOpen(false)} onOk={() => editForm.submit()}>
        <Form form={editForm} layout="vertical" onFinish={handleEditCage}>
          <Form.Item name="capacity" label="Вместимость (кроликов)">
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
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
            <Descriptions.Item label="QR-код">
              <QRCode value={selectedCage.address_qr} size={150} />
            </Descriptions.Item>
            <Descriptions.Item label="Вместимость">{selectedCage.capacity}</Descriptions.Item>
            <Descriptions.Item label="Кролик">{selectedCage.current_rabbit_info || 'Пусто'}</Descriptions.Item>
            <Descriptions.Item label="Уборка">{selectedCage.last_cleaned || '—'}</Descriptions.Item>
            <Descriptions.Item label="Дезинфекция">{selectedCage.last_disinfected || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* QR Print Modal — одна клетка */}
      <Modal
        title="🖨️ QR-код для печати"
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={<Button type="primary" onClick={() => window.print()}>🖨️ Печать</Button>}
        width={400}
      >
        {selectedCage && (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <QRCode value={selectedCage.address_qr} size={200} style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedCage.shelf_address} — Клетка {selectedCage.number}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{selectedCage.address_qr}</div>
          </div>
        )}
      </Modal>

      {/* Batch Print Modal */}
      <LabelPrinter
        open={printModalOpen}
        cages={cages
          .filter(c => selectedRowKeys.includes(c.id))
          .map(c => ({
            id: c.id,
            address: `${c.shelf_address} — Клетка ${c.number}`,
            qrData: c.address_qr,
            barcodeData: c.barcode_text || `CAGE${String(c.id).padStart(6, '0')}`,
            capacity: c.capacity,
          }))
        }
        onClose={() => { setPrintModalOpen(false); setSelectedRowKeys([]); }}
      />
    </div>
  );
};

export default HousingPage;
