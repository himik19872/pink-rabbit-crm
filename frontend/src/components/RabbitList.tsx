import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Card, Typography, Spin, Alert, Modal, Form, Input, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import dayjs from 'dayjs';
import { BugOutlined as RabbitOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

interface Rabbit {
  id: number;
  rabbit_id: string;
  name: string;
  gender: 'M' | 'F';
  birth_date: string;
  age_months: number;
  status: string;
  breed: string;
  mother: number | null;
  father: number | null;
  mother_name?: string;
  father_name?: string;
  current_cage?: string;
  is_breeding_stock: boolean;
  created_at: string;
}

const RabbitList: React.FC = () => {
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRabbits();
  }, []);

  const fetchRabbits = async () => {
    try {
      const response = await axios.get('/api/rabbits/rabbits/');
      setRabbits(response.data);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки данных о кроликах');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRabbit = async (values: any) => {
    try {
      await axios.post('/api/rabbits/rabbits/', {
        ...values,
        birth_date: dayjs(values.birth_date).format('YYYY-MM-DD'),
      });
      setIsModalOpen(false);
      form.resetFields();
      fetchRabbits();
    } catch (err) {
      setError('Ошибка добавления кролика');
      console.error(err);
    }
  };

  const columns: ColumnsType<Rabbit> = [
    {
      title: 'ID',
      dataIndex: 'rabbit_id',
      key: 'rabbit_id',
      width: 100,
    },
    {
      title: 'Кличка',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <RabbitOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'Пол',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender) => (
        <Tag color={gender === 'M' ? 'blue' : 'pink'}>
          {gender === 'M' ? '♂ Самец' : '♀ Самка'}
        </Tag>
      ),
    },
    {
      title: 'Возраст',
      dataIndex: 'age_months',
      key: 'age_months',
      render: (age) => `${age} мес.`,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap: Record<string, string> = {
          BREEDING: 'green',
          MEAT: 'orange',
          PET: 'cyan',
          DECEASED: 'red',
          SOLD: 'gray',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Порода',
      dataIndex: 'breed',
      key: 'breed',
    },
    {
      title: 'Родословная',
      key: 'family',
      render: (_, record) => (
        <Space size="small">
          {record.mother_name && <span>Mother: {record.mother_name}</span>}
          {record.father_name && <span>Father: {record.father_name}</span>}
        </Space>
      ),
    },
    {
      title: 'Клетка',
      dataIndex: 'current_cage',
      key: 'current_cage',
    },
    {
      title: 'Племенной',
      key: 'is_breeding_stock',
      render: (_, record) => (
        <Tag color={record.is_breeding_stock ? 'green' : 'default'}>
          {record.is_breeding_stock ? 'Да' : 'Нет'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<FileTextOutlined />} size="small" />
          <Button icon={<EditOutlined />} size="small" />
          <Button icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  if (loading) {
    return <Spin size="large" tip="Загрузка данных..." />;
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Кролики</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Добавить кролика
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rabbits}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="Добавить кролика"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleAddRabbit}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Кличка"
            rules={[{ required: true, message: 'Введите кличку' }]}
          >
            <Input placeholder="Например: Белочка" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Пол"
            rules={[{ required: true, message: 'Выберите пол' }]}
          >
            <Select placeholder="Выберите пол">
              <Option value="M">♂ Самец</Option>
              <Option value="F">♀ Самка</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="birth_date"
            label="Дата рождения"
            rules={[{ required: true, message: 'Выберите дату' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Статус"
            initialValue="BREEDING"
          >
            <Select>
              <Option value="BREEDING">Племенной</Option>
              <Option value="MEAT">Мясной</Option>
              <Option value="PET">Декоративный</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="breed"
            label="Порода"
          >
            <Input placeholder="Например: Белый волшебник" />
          </Form.Item>

          <Form.Item
            name="mother"
            label="Мать (ID)"
          >
            <Input placeholder="ID матери (опционально)" />
          </Form.Item>

          <Form.Item
            name="father"
            label="Отец (ID)"
          >
            <Input placeholder="ID отца (опционально)" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Сохранить
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RabbitList;
