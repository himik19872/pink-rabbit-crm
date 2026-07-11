import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Card, Typography, Modal, Form, Input, Select, DatePicker, Popconfirm, message, Drawer, Descriptions, List, Row, Col } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, LineChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { rabbitService, Rabbit, RabbitFormData } from '../services/rabbitService';
import { housingService, Cage } from '../services/housingService';

const { Title } = Typography;
const { Option } = Select;

const statusColors: Record<string, string> = {
  BREEDING: 'green', MEAT: 'red', PET: 'blue', DECEASED: 'default', SOLD: 'orange',
};
const statusLabels: Record<string, string> = {
  BREEDING: 'Племенной', MEAT: 'Мясной', PET: 'Декоративный', DECEASED: 'Умер', SOLD: 'Продан',
};

const RabbitsPage: React.FC = () => {
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [cages, setCages] = useState<Cage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRabbit, setEditingRabbit] = useState<Rabbit | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRabbit, setSelectedRabbit] = useState<Rabbit | null>(null);
  const [weights, setWeights] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      const [rData, cData] = await Promise.all([rabbitService.list(), housingService.listCages({ is_active: 'true' })]);
      setRabbits(rData.results || rData);
      setCages(cData.results || cData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (values: any) => {
    const data: RabbitFormData = {
      ...values,
      birth_date: dayjs(values.birth_date).format('YYYY-MM-DD'),
      mother: values.mother || null,
      father: values.father || null,
    };
    try {
      if (editingRabbit) {
        await rabbitService.update(editingRabbit.id, data);
        message.success('Кролик обновлён');
      } else {
        await rabbitService.create(data);
        message.success('Кролик добавлен');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingRabbit(null);
      fetchData();
    } catch (err: any) {
      message.error('Ошибка: ' + (err?.response?.data?.detail || ''));
    }
  };

  const handleDelete = async (id: number) => {
    await rabbitService.delete(id);
    message.success('Кролик удалён');
    fetchData();
  };

  const openDrawer = async (rabbit: Rabbit) => {
    setSelectedRabbit(rabbit);
    setDrawerOpen(true);
    try {
      const wData = await rabbitService.getWeights(rabbit.id);
      setWeights(wData.results || wData);
    } catch { setWeights([]); }
  };

  const openEdit = (rabbit: Rabbit) => {
    setEditingRabbit(rabbit);
    form.setFieldsValue({ ...rabbit, birth_date: dayjs(rabbit.birth_date) });
    setModalOpen(true);
  };

  const columns: ColumnsType<Rabbit> = [
    { title: 'ID', dataIndex: 'rabbit_id', key: 'rabbit_id', width: 100 },
    {
      title: 'Кличка', dataIndex: 'name', key: 'name',
      render: (name: string, r: Rabbit) => (
        <a onClick={() => openDrawer(r)}>{name || 'Без имени'}</a>
      ),
    },
    { title: 'Пол', dataIndex: 'gender', key: 'gender', render: (g: string) => g === 'M' ? '♂ Самец' : '♀ Самка', width: 100 },
    { title: 'Возраст', dataIndex: 'age_months', key: 'age', render: (a: number) => `${a} мес.`, width: 90 },
    {
      title: 'Статус', dataIndex: 'status', key: 'status', width: 120,
      render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>,
    },
    { title: 'Порода', dataIndex: 'breed', key: 'breed' },
    { title: 'Клетка', dataIndex: 'current_cage', key: 'cage', render: (c: string) => c || '—' },
    {
      title: 'Действия', key: 'actions', width: 150,
      render: (_: any, r: Rabbit) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDrawer(r)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Удалить кролика?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const motherOptions = rabbits.filter(r => r.gender === 'F');
  const fatherOptions = rabbits.filter(r => r.gender === 'M');

  return (
    <div>
      <Card
        title={<Title level={3} style={{ margin: 0 }}>🐇 Кролики</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRabbit(null); form.resetFields(); setModalOpen(true); }}>Добавить</Button>}
      >
        <Table columns={columns} dataSource={rabbits} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      <Modal
        title={editingRabbit ? 'Редактировать кролика' : 'Добавить кролика'}
        open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ gender: 'F', status: 'BREEDING' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Кличка" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="Пол" rules={[{ required: true }]}>
                <Select>
                  <Option value="M">Самец</Option>
                  <Option value="F">Самка</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="birth_date" label="Дата рождения" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="breed" label="Порода">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Статус">
                <Select>
                  {Object.entries(statusLabels).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="mother" label="Мать">
                <Select allowClear showSearch optionFilterProp="children" placeholder="Выберите мать">
                  {motherOptions.map(r => <Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="father" label="Отец">
                <Select allowClear showSearch optionFilterProp="children" placeholder="Выберите отца">
                  {fatherOptions.map(r => <Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Примечания">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title={selectedRabbit ? `🐰 ${selectedRabbit.name || 'Без имени'} (${selectedRabbit.rabbit_id})` : ''}
        open={drawerOpen} onClose={() => setDrawerOpen(false)} width={500}
      >
        {selectedRabbit && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="ID">{selectedRabbit.rabbit_id}</Descriptions.Item>
              <Descriptions.Item label="Пол">{selectedRabbit.gender === 'M' ? '♂ Самец' : '♀ Самка'}</Descriptions.Item>
              <Descriptions.Item label="Дата рождения">{selectedRabbit.birth_date}</Descriptions.Item>
              <Descriptions.Item label="Возраст">{selectedRabbit.age_months} мес.</Descriptions.Item>
              <Descriptions.Item label="Статус"><Tag color={statusColors[selectedRabbit.status]}>{statusLabels[selectedRabbit.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="Порода">{selectedRabbit.breed || '—'}</Descriptions.Item>
              <Descriptions.Item label="Клетка">{selectedRabbit.current_cage || '—'}</Descriptions.Item>
              <Descriptions.Item label="Потомков">{selectedRabbit.offspring_count || 0}</Descriptions.Item>
              <Descriptions.Item label="Мать">{selectedRabbit.mother_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Отец">{selectedRabbit.father_name || '—'}</Descriptions.Item>
            </Descriptions>

            <Card title={<><LineChartOutlined /> История взвешиваний</>} size="small">
              <List
                size="small"
                dataSource={weights}
                renderItem={(w: any) => (
                  <List.Item>{w.weight} г — {dayjs(w.measured_at).format('DD.MM.YYYY')} ({w.method || '—'})</List.Item>
                )}
                locale={{ emptyText: 'Нет данных' }}
              />
            </Card>

            {selectedRabbit.notes && (
              <Card title="Примечания" size="small">
                <p>{selectedRabbit.notes}</p>
              </Card>
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default RabbitsPage;
