import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message,
  Row, Col, Statistic, Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, HeartOutlined, ExperimentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  breedingService, BreedingPair, Mating, Pregnancy, Kindling, GenealogicalLine,
} from '../services/breedingService';
import { rabbitService, Rabbit } from '../services/rabbitService';

const { Title } = Typography;

const pairStatusLabels: Record<string, string> = {
  ACTIVE: 'Активна', INACTIVE: 'Неактивна', SEPARATED: 'Разделены', COMPLETED: 'Завершена',
};
const lineTypeLabels: Record<string, string> = { MALE: '♂ Отцовская', FEMALE: '♀ Материнская' };

const BreedingPage: React.FC = () => {
  const [pairs, setPairs] = useState<BreedingPair[]>([]);
  const [matings, setMatings] = useState<Mating[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [kindlings, setKindlings] = useState<Kindling[]>([]);
  const [lines, setLines] = useState<GenealogicalLine[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairModalOpen, setPairModalOpen] = useState(false);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [matingModalOpen, setMatingModalOpen] = useState(false);
  const [kindlingModalOpen, setKindlingModalOpen] = useState(false);
  const [pairForm] = Form.useForm();
  const [lineForm] = Form.useForm();
  const [matingForm] = Form.useForm();
  const [kindlingForm] = Form.useForm();

  const fetchData = async () => {
    try {
      const [p, m, pr, k, l, r] = await Promise.all([
        breedingService.listPairs(), breedingService.listMatings(), breedingService.listPregnancies(),
        breedingService.listKindlings(), breedingService.listLines(), rabbitService.list(),
      ]);
      setPairs(p.results || p); setMatings(m.results || m); setPregnancies(pr.results || pr);
      setKindlings(k.results || k); setLines(l.results || l); setRabbits(r.results || r);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const males = rabbits.filter(r => r.gender === 'M');
  const females = rabbits.filter(r => r.gender === 'F');

  const pairColumns: ColumnsType<BreedingPair> = [
    { title: 'Самец', dataIndex: 'male_name', key: 'male', render: (n: string, r: BreedingPair) => `♂ ${n}` },
    { title: 'Самка', dataIndex: 'female_name', key: 'female', render: (n: string) => `♀ ${n}` },
    { title: 'Начало', dataIndex: 'started_at', key: 'start', width: 110 },
    {
      title: 'Статус', dataIndex: 'status', key: 'status', width: 120,
      render: (s: string) => {
        const colors: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'default', SEPARATED: 'orange', COMPLETED: 'blue' };
        return <Tag color={colors[s]}>{pairStatusLabels[s]}</Tag>;
      },
    },
  ];

  const kindlingColumns: ColumnsType<Kindling> = [
    { title: 'Самка', dataIndex: 'female_name', key: 'f' },
    { title: 'Дата', dataIndex: 'kindling_date', key: 'd', width: 110 },
    { title: 'Помет', dataIndex: 'litter_size', key: 'l', width: 80 },
    { title: 'Живых', dataIndex: 'live_born', key: 'lb', width: 80 },
    { title: 'Мёртвых', dataIndex: 'stillborn', key: 'sb', width: 80 },
    {
      title: 'Выживаемость', dataIndex: 'survival_rate', key: 'sr', width: 110,
      render: (r: number) => <span style={{ color: r >= 80 ? 'green' : r >= 50 ? 'orange' : 'red' }}>{r}%</span>,
    },
  ];

  const lineColumns: ColumnsType<GenealogicalLine> = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    {
      title: 'Тип', dataIndex: 'line_type', key: 'type', width: 140,
      render: (t: string) => lineTypeLabels[t],
    },
    { title: 'Основатель', dataIndex: 'founder_name', key: 'founder' },
    { title: 'Участников', dataIndex: 'member_count', key: 'count', width: 100 },
    {
      title: 'Статус', dataIndex: 'is_active', key: 'active', width: 80,
      render: (a: boolean) => <Tag color={a ? 'green' : 'default'}>{a ? 'Активна' : 'Нет'}</Tag>,
    },
  ];

  const tabItems = [
    {
      key: 'pairs', label: 'Племенные пары', children: (
        <Card extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { pairForm.resetFields(); setPairModalOpen(true); }}>Создать пару</Button>}>
          <Table columns={pairColumns} dataSource={pairs} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
        </Card>
      ),
    },
    {
      key: 'kindlings', label: 'Окоты', children: (
        <Card extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { kindlingForm.resetFields(); setKindlingModalOpen(true); }}>Записать окот</Button>}>
          <Table columns={kindlingColumns} dataSource={kindlings} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
        </Card>
      ),
    },
    {
      key: 'lines', label: 'Генеалогические линии', children: (
        <Card extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { lineForm.resetFields(); setLineModalOpen(true); }}>Создать линию</Button>}>
          <Table columns={lineColumns} dataSource={lines} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><Card><Statistic title="Пар" value={pairs.length} prefix={<HeartOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="Окотов" value={kindlings.length} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Всего крольчат" value={kindlings.reduce((s, k) => s + k.litter_size, 0)} />
          </Card>
        </Col>
        <Col xs={12} sm={6}><Card><Statistic title="Линий" value={lines.length} /></Card></Col>
      </Row>

      <Title level={3}>🧬 Разведение</Title>

      <Tabs items={tabItems} />

      {/* Pair Modal */}
      <Modal title="Создать племенную пару" open={pairModalOpen} onCancel={() => setPairModalOpen(false)} onOk={() => pairForm.submit()}>
        <Form form={pairForm} layout="vertical" onFinish={async (v) => { await breedingService.createPair(v); message.success('Пара создана'); setPairModalOpen(false); fetchData(); }}>
          <Form.Item name="male" label="Самец" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">{males.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="female" label="Самка" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">{females.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}</Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Kindling Modal */}
      <Modal title="Записать окот" open={kindlingModalOpen} onCancel={() => setKindlingModalOpen(false)} onOk={() => kindlingForm.submit()}>
        <Form form={kindlingForm} layout="vertical" onFinish={async (v) => { await breedingService.createKindling({ ...v, kindling_date: dayjs(v.kindling_date).format('YYYY-MM-DD') }); message.success('Окот записан'); setKindlingModalOpen(false); fetchData(); }}>
          <Form.Item name="female" label="Самка" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">{females.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="kindling_date" label="Дата окота" initialValue={dayjs()}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="litter_size" label="В помете" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item></Col>
            <Col span={8}><Form.Item name="live_born" label="Живых" rules={[{ required: true }]}><InputNumber min={0} /></Form.Item></Col>
            <Col span={8}><Form.Item name="stillborn" label="Мёртвых" initialValue={0}><InputNumber min={0} /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Примечания"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Line Modal */}
      <Modal title="Создать генеалогическую линию" open={lineModalOpen} onCancel={() => setLineModalOpen(false)} onOk={() => lineForm.submit()}>
        <Form form={lineForm} layout="vertical" onFinish={async (v) => { await breedingService.createLine(v); message.success('Линия создана'); setLineModalOpen(false); fetchData(); }}>
          <Form.Item name="name" label="Название" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="line_type" label="Тип" rules={[{ required: true }]} initialValue="MALE">
            <Select>{Object.entries(lineTypeLabels).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="founder" label="Основатель" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">{rabbits.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="description" label="Описание"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BreedingPage;
