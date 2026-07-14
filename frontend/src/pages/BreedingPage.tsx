import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Table, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message,
  Row, Col, Statistic, Tabs, Popconfirm, Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, HeartOutlined, ExperimentOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  breedingService, BreedingPair, Mating, Pregnancy, Kindling, GenealogicalLine,
} from '../services/breedingService';
import { rabbitService, Rabbit } from '../services/rabbitService';

const { Title } = Typography;

const PAIR_STATUS: Record<string, string> = { ACTIVE: 'Активна', INACTIVE: 'Неактивна', SEPARATED: 'Разделены', COMPLETED: 'Завершена' };
const PAIR_COLORS: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'default', SEPARATED: 'orange', COMPLETED: 'blue' };
const LINE_TYPES: Record<string, string> = { MALE: '♂ Отцовская', FEMALE: '♀ Материнская' };

const BreedingPage: React.FC = () => {
  const [pairs, setPairs] = useState<BreedingPair[]>([]);
  const [matings, setMatings] = useState<Mating[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [kindlings, setKindlings] = useState<Kindling[]>([]);
  const [lines, setLines] = useState<GenealogicalLine[]>([]);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairModalOpen, setPairModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<BreedingPair | null>(null);
  const [lineModalOpen, setLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<GenealogicalLine | null>(null);
  const [kindlingModalOpen, setKindlingModalOpen] = useState(false);
  const [matingModalOpen, setMatingModalOpen] = useState(false);
  const [pedigreeModalOpen, setPedigreeModalOpen] = useState(false);
  const [pedigreeRabbit, setPedigreeRabbit] = useState<Rabbit | null>(null);
  const [pedigreeData, setPedigreeData] = useState<any>(null);
  const [pairForm] = Form.useForm();
  const [lineForm] = Form.useForm();
  const [kindlingForm] = Form.useForm();
  const [matingForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
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

  const handleDeletePair = async (id: number) => {
    try { await breedingService.deletePair(id); message.success('Пара удалена'); fetchData(); }
    catch (err: any) { message.error(err?.response?.data?.detail || 'Ошибка удаления'); }
  };
  const handleDeleteLine = async (id: number) => {
    try { await breedingService.deleteLine(id); message.success('Линия удалена'); fetchData(); }
    catch (err: any) { message.error('Ошибка удаления'); }
  };
  const handleDeleteKindling = async (id: number) => {
    try { await breedingService.deleteKindling(id); message.success('Окот удалён'); fetchData(); }
    catch (err: any) { message.error('Ошибка удаления'); }
  };

  const handlePromoteYoung = async () => {
    try { const r = await breedingService.promoteYoung('MEAT'); message.success(`Переведено в мясные: ${r.promoted} крольчат`); fetchData(); }
    catch { message.error('Ошибка'); }
  };

  const openEditPair = (pair: BreedingPair) => {
    setEditingPair(pair);
    pairForm.setFieldsValue(pair);
    setPairModalOpen(true);
  };

  const openEditLine = (line: GenealogicalLine) => {
    setEditingLine(line);
    lineForm.setFieldsValue(line);
    setLineModalOpen(true);
  };

  const openPedigree = async (rabbit: Rabbit) => {
    setPedigreeRabbit(rabbit);
    setPedigreeModalOpen(true);
    try {
      // Собираем родословную из API: parents recursively
      const fetchPedigree = async (r: Rabbit, depth = 0): Promise<any> => {
        if (depth > 3) return null;
        const node: any = { name: r.name || r.rabbit_id, id: r.rabbit_id, status: r.status };
        if (r.mother && depth < 3) {
          try { const m = await rabbitService.get(r.mother); node.mother = await fetchPedigree(m, depth + 1); } catch {}
        }
        if (r.father && depth < 3) {
          try { const f = await rabbitService.get(r.father); node.father = await fetchPedigree(f, depth + 1); } catch {}
        }
        return node;
      };
      const p = await fetchPedigree(rabbit);
      setPedigreeData(p);
    } catch { setPedigreeData(null); }
  };

  const STATUS_COLORS: Record<string, string> = { YOUNG: 'orange', BREEDING: 'green', MEAT: 'red', PET: 'blue', DECEASED: 'default', SOLD: 'orange' };

  // ---------- Mermaid граф для родословной ----------
  const renderPedigreeMermaid = (node: any): string => {
    if (!node) return 'graph TD\n  A[Нет данных]';
    const edges: string[] = [];
    let id = 0;
    const walk = (n: any, parentId: string | null) => {
      const currentId = `N${++id}`;
      const status = n.status === 'BREEDING' ? '🟢' : n.status === 'MEAT' ? '🔴' : n.status === 'YOUNG' ? '🟠' : '⚪';
      edges.push(`${currentId}[${status} ${n.name}\\n${n.id}]`);
      if (parentId) edges.push(`${parentId} --> ${currentId}`);
      if (n.mother) walk(n.mother, currentId);
      if (n.father) walk(n.father, currentId);
    };
    walk(node, null);
    return 'graph TD\n' + edges.join('\n');
  };

  const pairColumns: ColumnsType<BreedingPair> = [
    { title: 'Самец', dataIndex: 'male_name', key: 'male', render: (n: string) => `♂ ${n}` },
    { title: 'Самка', dataIndex: 'female_name', key: 'female', render: (n: string) => `♀ ${n}` },
    { title: 'Начало', dataIndex: 'started_at', key: 'start', width: 110 },
    {
      title: 'Статус', dataIndex: 'status', key: 'status', width: 120,
      render: (s: string) => <Tag color={PAIR_COLORS[s]}>{PAIR_STATUS[s]}</Tag>,
    },
    {
      title: '', key: 'actions', width: 100,
      render: (_: any, r: BreedingPair) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditPair(r)} />
          <Popconfirm title="Удалить пару?" onConfirm={() => handleDeletePair(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const kindlingColumns: ColumnsType<Kindling> = [
    { title: 'Самка', dataIndex: 'female_name', key: 'f' },
    { title: 'Дата', dataIndex: 'kindling_date', key: 'd', width: 110 },
    { title: 'Помет', dataIndex: 'litter_size', key: 'l', width: 70 },
    { title: 'Живых', dataIndex: 'live_born', key: 'lb', width: 70 },
    { title: 'Мёртвых', dataIndex: 'stillborn', key: 'sb', width: 80 },
    {
      title: 'Выживаемость', dataIndex: 'survival_rate', key: 'sr', width: 110,
      render: (r: number) => <span style={{ color: r >= 80 ? 'green' : r >= 50 ? 'orange' : 'red' }}>{r}%</span>,
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_: any, r: Kindling) => (
        <Popconfirm title="Удалить окот?" onConfirm={() => handleDeleteKindling(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const lineColumns: ColumnsType<GenealogicalLine> = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Тип', dataIndex: 'line_type', key: 'type', width: 140, render: (t: string) => LINE_TYPES[t] },
    { title: 'Основатель', dataIndex: 'founder_name', key: 'founder' },
    { title: 'Участников', dataIndex: 'member_count', key: 'count', width: 100 },
    {
      title: 'Статус', dataIndex: 'is_active', key: 'active', width: 80,
      render: (a: boolean) => <Tag color={a ? 'green' : 'default'}>{a ? 'Активна' : 'Нет'}</Tag>,
    },
    {
      title: '', key: 'actions', width: 100,
      render: (_: any, r: GenealogicalLine) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditLine(r)} />
          <Popconfirm title="Удалить линию?" onConfirm={() => handleDeleteLine(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const youngCount = rabbits.filter(r => r.status === 'YOUNG').length;

  const matingColumns: ColumnsType<Mating> = [
    { title: 'Пара', dataIndex: 'pair_info', key: 'p' },
    { title: 'Дата', dataIndex: 'mating_date', key: 'd', width: 110 },
    {
      title: 'Успех', dataIndex: 'success', key: 's', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '✅ Да' : '❌ Нет'}</Tag>,
    },
    { title: 'Метод', dataIndex: 'method', key: 'm', width: 100 },
  ];

  const pregnancyColumns: ColumnsType<Pregnancy> = [
    { title: 'Самка', dataIndex: 'female_name', key: 'f' },
    { title: 'Самец', dataIndex: 'male_name', key: 'm', render: (n: string) => n || '?' },
    { title: 'Случена', dataIndex: 'mating_date', key: 'md', width: 110 },
    { title: 'Ожид. окот', dataIndex: 'expected_due_date', key: 'edd', width: 120 },
    {
      title: 'Осталось', dataIndex: 'remaining_days', key: 'rd', width: 100,
      render: (d: number | null) => {
        if (d === null) return <Tag>—</Tag>;
        if (d < 0) return <Tag color="orange">+{Math.abs(d)} дн</Tag>;
        if (d === 0) return <Tag color="red">Сегодня!</Tag>;
        return <Tag color={d <= 3 ? 'volcano' : d <= 7 ? 'gold' : 'green'}>{d} дн</Tag>;
      },
    },
    {
      title: '', key: 'act', width: 60,
      render: (_: any, r: Pregnancy) => (
        <Popconfirm title="Завершить беременность?" onConfirm={async () => { await breedingService.updatePregnancy(r.id, { is_complete: true }); fetchData(); }}>
          <Button size="small">✓</Button>
        </Popconfirm>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'pairs', label: 'Племенные пары', children: (
        <Card extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setEditingPair(null); pairForm.resetFields(); setPairModalOpen(true); }}>Создать пару</Button>}>
          <Table columns={pairColumns} dataSource={pairs} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
        </Card>
      ),
    },
    {
      key: 'matings', label: 'Случки', children: (
        <Card extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setMatingModalOpen(true); }}>Записать случку</Button>}>
          <Table columns={matingColumns} dataSource={matings} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
        </Card>
      ),
    },
    {
      key: 'pregnancies', label: `🤰 Беременности (${pregnancies.filter(p => !p.is_complete).length})`, children: (
        <Card>
          <Table
            columns={pregnancyColumns}
            dataSource={pregnancies.filter(p => !p.is_complete).sort((a, b) => {
              const da = a.remaining_days ?? 999;
              const db = b.remaining_days ?? 999;
              return da - db;
            })}
            rowKey="id" pagination={{ pageSize: 10 }} size="small"
            locale={{ emptyText: 'Нет активных беременностей. Запишите случку с ✅ успехом.' }}
          />
        </Card>
      ),
    },
    {
      key: 'kindlings', label: 'Окоты', children: (
        <Card extra={<Space>
          <Button size="small" onClick={handlePromoteYoung}>🔄 Перевести молодняк 30+ в мясные</Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { kindlingForm.resetFields(); setKindlingModalOpen(true); }}>Записать окот</Button>
        </Space>}>
          <Table columns={kindlingColumns} dataSource={kindlings} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
        </Card>
      ),
    },
    {
      key: 'lines', label: 'Генеалогические линии', children: (
        <Card extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => { setEditingLine(null); lineForm.resetFields(); setLineModalOpen(true); }}>Создать линию</Button>}>
          <Table columns={lineColumns} dataSource={lines} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
        </Card>
      ),
    },
    {
      key: 'young', label: `🐣 Молодняк (${youngCount})`, children: (
        <Table
          columns={[
            { title: 'ID', dataIndex: 'rabbit_id', width: 110 },
            { title: 'Кличка', dataIndex: 'name' },
            { title: 'Пол', dataIndex: 'gender', width: 80, render: (g: string) => g === 'M' ? '♂' : '♀' },
            { title: 'Возраст', dataIndex: 'age_months', width: 80, render: (a: number) => `${a} мес.` },
            { title: 'Порода', dataIndex: 'breed' },
            { title: 'Мать', dataIndex: 'mother_name', render: (n: string) => n || '—' },
            {
              title: 'Родословная', key: 'pedigree', width: 100,
              render: (_: any, r: Rabbit) => (
                <Button size="small" icon={<ApartmentOutlined />} onClick={() => openPedigree(r)}>Граф</Button>
              ),
            },
          ]}
          dataSource={rabbits.filter(r => r.status === 'YOUNG')}
          rowKey="id" pagination={{ pageSize: 10 }} size="small"
        />
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={4}><Card><Statistic title="Пар" value={pairs.length} prefix={<HeartOutlined />} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="Окотов" value={kindlings.length} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="Крольчат" value={kindlings.reduce((s, k) => s + k.litter_size, 0)} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="Линий" value={lines.length} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="Молодняк" value={youngCount} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="Всего кроликов" value={rabbits.length} /></Card></Col>
      </Row>

      <Title level={3}>🧬 Разведение</Title>

      <Tabs items={tabItems} />

      {/* Pair Modal — create/edit */}
      <Modal title={editingPair ? 'Редактировать пару' : 'Создать пару'} open={pairModalOpen} onCancel={() => setPairModalOpen(false)} onOk={() => pairForm.submit()}>
        <Form form={pairForm} layout="vertical" onFinish={async (v) => {
          if (editingPair) { await breedingService.updatePair(editingPair.id, v); message.success('Обновлено'); }
          else { await breedingService.createPair(v); message.success('Создано'); }
          setPairModalOpen(false); setEditingPair(null); fetchData();
        }}>
          <Form.Item name="male" label="Самец" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">{males.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="female" label="Самка" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">{females.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}</Select>
          </Form.Item>
          {editingPair && (
            <Form.Item name="status" label="Статус">
              <Select>{Object.entries(PAIR_STATUS).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Kindling Modal */}
      <Modal title="Записать окот" open={kindlingModalOpen} onCancel={() => setKindlingModalOpen(false)} onOk={() => kindlingForm.submit()}>
        <Form form={kindlingForm} layout="vertical" onFinish={async (v) => { await breedingService.createKindling({ ...v, kindling_date: dayjs(v.kindling_date).format('YYYY-MM-DD') }); message.success('Окот записан, крольчата созданы как Молодняк 🐣'); setKindlingModalOpen(false); fetchData(); }}>
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

      {/* Mating Modal */}
      <Modal title="Записать случку" open={matingModalOpen} onCancel={() => setMatingModalOpen(false)} onOk={() => {
        const form = document.getElementById('mating-form') as any;
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }}>
        <Form id="mating-form" layout="vertical" onFinish={async (v: any) => {
          await breedingService.createMating({ ...v, mating_date: dayjs(v.mating_date).format('YYYY-MM-DD') });
          if (v.success) message.success('Случка записана ✅ → создана беременность (ожидаемый окот через 31 день)');
          else message.success('Случка записана');
          setMatingModalOpen(false); fetchData();
        }}>
          <Form.Item name="pair" label="Пара" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {pairs.filter(p => p.status === 'ACTIVE').map(p => <Select.Option key={p.id} value={p.id}>♂{p.male_name} × ♀{p.female_name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="mating_date" label="Дата случки" initialValue={dayjs()}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="success" label="Успех" initialValue={true}>
            <Select>{[{ k: true, v: '✅ Успешно (создать беременность)' }, { k: false, v: '❌ Неудачно' }].map(x => <Select.Option key={String(x.k)} value={x.k}>{x.v}</Select.Option>)}</Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Line Modal — create/edit */}
      <Modal title={editingLine ? 'Редактировать линию' : 'Создать линию'} open={lineModalOpen} onCancel={() => setLineModalOpen(false)} onOk={() => lineForm.submit()}>
        <Form form={lineForm} layout="vertical" onFinish={async (v) => {
          if (editingLine) { await breedingService.updateLine(editingLine.id, v); message.success('Обновлено'); }
          else { await breedingService.createLine(v); message.success('Создано'); }
          setLineModalOpen(false); setEditingLine(null); fetchData();
        }}>
          <Form.Item name="name" label="Название" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="line_type" label="Тип" rules={[{ required: true }]} initialValue="MALE">
            <Select>{Object.entries(LINE_TYPES).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="founder" label="Основатель" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">{rabbits.map(r => <Select.Option key={r.id} value={r.id}>{r.rabbit_id} — {r.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="description" label="Описание"><Input.TextArea rows={2} /></Form.Item>
          {editingLine && (
            <Form.Item name="is_active" label="Активна" valuePropName="checked">
              <Select>{[{ k: true, v: 'Да' }, { k: false, v: 'Нет' }].map(x => <Select.Option key={String(x.k)} value={x.k}>{x.v}</Select.Option>)}</Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Pedigree Graph Modal */}
      <Modal title={`📊 Родословная: ${pedigreeRabbit?.name || ''} (${pedigreeRabbit?.rabbit_id || ''})`} open={pedigreeModalOpen} onCancel={() => setPedigreeModalOpen(false)} footer={null} width={700}>
        {pedigreeData ? (
          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', maxHeight: 500, overflow: 'auto' }}>
            {renderPedigreeMermaid(pedigreeData)}
          </div>
        ) : (
          <p>Загрузка родословной...</p>
        )}
        <Descriptions style={{ marginTop: 16 }} column={2} size="small" bordered>
          <Descriptions.Item label="Статус"><Tag color={STATUS_COLORS[pedigreeRabbit?.status || '']}>{pedigreeRabbit?.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="Пол">{pedigreeRabbit?.gender === 'M' ? '♂ Самец' : '♀ Самка'}</Descriptions.Item>
          <Descriptions.Item label="Возраст">{pedigreeRabbit?.age_months} мес.</Descriptions.Item>
          <Descriptions.Item label="Порода">{pedigreeRabbit?.breed || '—'}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};

export default BreedingPage;
