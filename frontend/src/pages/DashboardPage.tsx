import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, List, Tag, Table } from 'antd';
import { BugOutlined as RabbitOutlined, HomeOutlined, MedicineBoxOutlined, ExperimentOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { rabbitService, Rabbit } from '../services/rabbitService';
import { breedingService, Kindling } from '../services/breedingService';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [kindlings, setKindlings] = useState<Kindling[]>([]);
  const [stats, setStats] = useState({ total: 0, breeding: 0, meat: 0, female: 0, male: 0 });

  useEffect(() => {
    Promise.all([
      rabbitService.list({ page_size: '100' }),
      breedingService.listKindlings().catch(() => []),
    ]).then(([rabbitData, kindlingData]) => {
      const rabbitResults = rabbitData.results || rabbitData;
      const kindlingResults = Array.isArray(kindlingData) ? kindlingData : (kindlingData.results || []);
      setRabbits(rabbitResults);
      setKindlings(kindlingResults);
      setStats({
        total: rabbitResults.length,
        breeding: rabbitResults.filter((r: Rabbit) => r.status === 'BREEDING').length,
        meat: rabbitResults.filter((r: Rabbit) => r.status === 'MEAT').length,
        female: rabbitResults.filter((r: Rabbit) => r.gender === 'F').length,
        male: rabbitResults.filter((r: Rabbit) => r.gender === 'M').length,
      });
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const breedColumns: ColumnsType<Rabbit> = [
    { title: 'ID', dataIndex: 'rabbit_id', key: 'rabbit_id', width: 100 },
    { title: 'Кличка', dataIndex: 'name', key: 'name', render: (n: string) => n || '—' },
    { title: 'Пол', dataIndex: 'gender', key: 'gender', render: (g: string) => g === 'M' ? '♂' : '♀', width: 50 },
    { title: 'Возраст (мес)', dataIndex: 'age_months', key: 'age', width: 100 },
    { title: 'Порода', dataIndex: 'breed', key: 'breed' },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (s: string) => {
      const colors: Record<string, string> = { BREEDING: 'green', MEAT: 'red', PET: 'blue', DECEASED: 'default', SOLD: 'orange' };
      return <Tag color={colors[s] || 'default'}>{s}</Tag>;
    }},
  ];

  const kindlingColumns: ColumnsType<Kindling> = [
    { title: 'Самка', dataIndex: 'female_name', key: 'female' },
    { title: 'Дата', dataIndex: 'kindling_date', key: 'date' },
    { title: 'Помет', dataIndex: 'litter_size', key: 'litter' },
    { title: 'Живых', dataIndex: 'live_born', key: 'live' },
    { title: 'Выживаемость', dataIndex: 'survival_rate', key: 'survival', render: (r: number) => `${r}%` },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Title level={3}>📊 Дашборд</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Всего кроликов" value={stats.total} prefix={<RabbitOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Племенные" value={stats.breeding} valueStyle={{ color: '#3f8600' }} prefix={<ArrowUpOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Мясные" value={stats.meat} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Самки ♀" value={stats.female} valueStyle={{ color: '#eb2f96' }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Самцы ♂" value={stats.male} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card><Statistic title="Последние окоты" value={kindlings.length} prefix={<ExperimentOutlined />} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="🐇 Племенное стадо">
            <Table
              columns={breedColumns}
              dataSource={rabbits.filter(r => r.status === 'BREEDING')}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🐣 Последние окоты">
            <Table
              columns={kindlingColumns}
              dataSource={kindlings.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
