import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, Table, Tag, Button, Space, Modal, Form, Input, Switch,
  message, Popconfirm, Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, TeamOutlined,
} from '@ant-design/icons';
import { userService, UserInfo } from '../services/userService';
import dayjs from 'dayjs';

const { Title } = Typography;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      await userService.create(values);
      message.success('Пользователь создан');
      setCreateOpen(false);
      createForm.resetFields();
      fetchUsers();
    } catch (err: any) {
      const detail = err?.response?.data;
      const msg = typeof detail === 'object'
        ? Object.values(detail).flat().join(', ')
        : 'Ошибка создания';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: any) => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await userService.update(selectedUser.id, values);
      message.success('Пользователь обновлён');
      setEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      message.error('Ошибка обновления');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (values: { password: string }) => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await userService.changePassword(selectedUser.id, values.password);
      message.success('Пароль изменён');
      setPasswordOpen(false);
      passwordForm.resetFields();
    } catch (err: any) {
      message.error('Ошибка смены пароля');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await userService.delete(id);
      message.success('Пользователь удалён');
      fetchUsers();
    } catch (err) {
      message.error('Ошибка удаления');
    }
  };

  const columns: ColumnsType<UserInfo> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: 'Имя пользователя', dataIndex: 'username',
      render: (u: string, r: UserInfo) => (
        <Space>
          <span>{u}</span>
          {r.is_staff && <Tag color="blue">Админ</Tag>}
        </Space>
      ),
    },
    {
      title: 'Email', dataIndex: 'email',
      render: (e: string) => e || <span style={{ color: '#ccc' }}>—</span>,
    },
    {
      title: 'Статус', dataIndex: 'is_active',
      render: (a: boolean) => a ? <Tag color="green">Активен</Tag> : <Tag color="red">Отключён</Tag>,
    },
    {
      title: 'Создан', dataIndex: 'date_joined',
      render: (d: string) => dayjs(d).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Последний вход', dataIndex: 'last_login',
      render: (d: string | null) => d ? dayjs(d).format('DD.MM.YYYY HH:mm') : '—',
    },
    {
      title: '', key: 'actions', width: 200,
      render: (_: any, user: UserInfo) => (
        <Space>
          <Button
            size="small" icon={<EditOutlined />}
            onClick={() => { setSelectedUser(user); editForm.setFieldsValue(user); setEditOpen(true); }}
          />
          <Button
            size="small" icon={<LockOutlined />}
            onClick={() => { setSelectedUser(user); passwordForm.resetFields(); setPasswordOpen(true); }}
          />
          <Popconfirm
            title="Удалить пользователя?"
            description={`Вы уверены, что хотите удалить «${user.username}»?`}
            onConfirm={() => handleDelete(user.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Card
        title={<Title level={3} style={{ margin: 0 }}><TeamOutlined /> Пользователи</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateOpen(true); }}>
            Добавить пользователя
          </Button>
        }
      >
        <Table columns={columns} dataSource={users} rowKey="id" pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      {/* Create User Modal */}
      <Modal
        title="Добавить пользователя"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={submitting}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} initialValues={{ is_staff: false }}>
          <Form.Item name="username" label="Имя пользователя" rules={[{ required: true, message: 'Обязательное поле' }]}>
            <Input placeholder="Логин" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" placeholder="user@example.com" />
          </Form.Item>
          <Form.Item
            name="password" label="Пароль"
            rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}
          >
            <Input.Password placeholder="Пароль" />
          </Form.Item>
          <Form.Item name="is_staff" label="Администратор" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title={`Редактировать: ${selectedUser?.username || ''}`}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={submitting}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="username" label="Имя пользователя" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="is_staff" label="Администратор" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="is_active" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={`Смена пароля: ${selectedUser?.username || ''}`}
        open={passwordOpen}
        onCancel={() => setPasswordOpen(false)}
        onOk={() => passwordForm.submit()}
        confirmLoading={submitting}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="password" label="Новый пароль"
            rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}
          >
            <Input.Password placeholder="Новый пароль" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
