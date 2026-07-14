import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Tag, Table } from 'antd';
import { BugOutlined as RabbitOutlined, ExperimentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { rabbitService, Rabbit } from '../services/rabbitService';
import { breedingService, Kindling, Pregnancy } from '../services/breedingService';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [kindlings, setKindlings] = useState<Kindling[]>([]);
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [stats, setStats] = useState<{
    total: number; breeding: number; meat: number; young: number;
    female: number; male: number; activePreg: number; expectedOkrol: number;
    topFather: Rabbit | null; topMother: Rabbit | null;
  }>({
    total: 0, breeding: 0, meat: 0, young: 0, female: 0, male: 0,
    activePreg: 0, expectedOkrol: 0, topFather: null, topMother: null,
  });

  useEffect(() => {
    Promise.all([
      rabbitService.list({ page_size: '100' }),
      breedingService.listKindlings().catch(() => ({ results: [] })),
      breedingService.listPregnancies({ is_complete: 'false' }).catch(() => ({ results: [] })),
    ]).then(([rabbitData, kindlingData, pregData]) => {
      const rabbitResults = rabbitData.results || rabbitData;
      const kindlingResults = Array.isArray(kindlingData) ? kindlingData : (kindlingData.results || []);
      const pregResults = Array.isArray(pregData) ? pregData : (pregData.results || []);
      setRabbits(rabbitResults);
      setKindlings(kindlingResults);
      setPregnancies(pregResults.filter((p: Pregnancy) => !p.is_complete));

      // Считаем сколько окотов ожидается в ближайшие 5 дней (просроченные тоже)
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const dueSoon = pregResults.filter((p: Pregnancy) => {
        if (p.is_complete) return false;
        const due = new Date(p.expected_due_date);
        const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
        return diff <= 5;
      });

      // Топ-производители
      const males = rabbitResults.filter((r: Rabbit) => r.gender === 'M');
      const females = rabbitResults.filter((r: Rabbit) => r.gender === 'F');
      const topFather = males.reduce((best: Rabbit | null, r: Rabbit) =>
        !best || (r.total_offspring || 0) > (best.total_offspring || 0) ? r : best, null);
      const topMother = females.reduce((best: Rabbit | null, r: Rabbit) =>
        !best || (r.offspring_count || 0) > (best.offspring_count || 0) ? r : best, null);

      setStats({
        total: rabbitResults.length,
        breeding: rabbitResults.filter((r: Rabbit) => r.status === 'BREEDING').length,
        meat: rabbitResults.filter((r: Rabbit) => r.status === 'MEAT').length,
        young: rabbitResults.filter((r: Rabbit) => r.status === 'YOUNG').length,
        female: females.length,
        male: males.length,
        activePreg: pregResults.filter((p: Pregnancy) => !p.is_complete).length,
        expectedOkrol: dueSoon.length,
        topFather,
        topMother,
      });
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const kindlingColumns: ColumnsType<Kindling> = [
    { title: 'Самка', dataIndex: 'female_name', key: 'female' },
    { title: 'Дата', dataIndex: 'kindling_date', key: 'date' },
    { title: 'Помет', dataIndex: 'litter_size', key: 'litter' },
    { title: 'Живых', dataIndex: 'live_born', key: 'live' },
    { title: 'Выживаемость', dataIndex: 'survival_rate', key: 'survival', render: (r: number) => `${r}%` },
  ];

  const pregnancyColumns: ColumnsType<Pregnancy> = [
    { title: 'Самка', dataIndex: 'female_name', key: 'f' },
    { title: 'Самец', dataIndex: 'male_name', key: 'm', render: (n: string) => n || '?' },
    { title: 'Случена', dataIndex: 'mating_date', key: 'md', width: 110 },
    { title: 'Ожидаемый окот', dataIndex: 'expected_due_date', key: 'edd', width: 120 },
    {
      title: 'Осталось', dataIndex: 'remaining_days', key: 'rd', width: 100,
      render: (d: number | null) => {
        if (d === null) return <Tag>—</Tag>;
        if (d < 0) return <Tag color="orange">Просрочен ({Math.abs(d)} дн)</Tag>;
        if (d === 0) return <Tag color="red">Сегодня!</Tag>;
        if (d <= 3) return <Tag color="volcano">{d} дн</Tag>;
        if (d <= 7) return <Tag color="gold">{d} дн</Tag>;
        return <Tag color="green">{d} дн</Tag>;
      },
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Title level={3}>📊 Дашборд</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}><Card><Statistic title="Всего кроликов" value={stats.total} prefix={<RabbitOutlined />} /></Card></Col>
        <Col xs={12} sm={8} lg={4}><Card><Statistic title="Племенные" value={stats.breeding} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col xs={12} sm={8} lg={4}><Card><Statistic title="Молодняк" value={stats.young} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={8} lg={4}><Card><Statistic title="Самки ♀" value={stats.female} valueStyle={{ color: '#eb2f96' }} /></Card></Col>
        <Col xs={12} sm={8} lg={4}><Card><Statistic title="Самцы ♂" value={stats.male} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={12} sm={8} lg={4}><Card><Statistic title="Беременны" value={stats.activePreg} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col xs={12} sm={8} lg={4}>
          <Card>
            <Statistic
              title="Ожидается окотов (≤5 дн)"
              value={stats.expectedOkrol}
              valueStyle={{ color: stats.expectedOkrol > 0 ? '#fa541c' : '#8c8c8c' }}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}><Card><Statistic title="Окотов всего" value={kindlings.length} /></Card></Col>
        {stats.topFather && (
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic title="♂ Лучший самец" value={stats.topFather.rabbit_id} valueStyle={{ fontSize: 16 }} />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>Потомков: {stats.topFather.total_offspring || stats.topFather.offspring_count || 0}</div>
            </Card>
          </Col>
        )}
        {stats.topMother && (
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Statistic title="♀ Лучшая самка" value={stats.topMother.rabbit_id} valueStyle={{ fontSize: 16 }} />
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>Потомков: {stats.topMother.offspring_count || 0}</div>
            </Card>
          </Col>
        )}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="🤰 Ожидаемые окоты (беременности)">
            <Table
              columns={pregnancyColumns}
              dataSource={pregnancies.sort((a, b) => {
                const da = a.remaining_days ?? 999;
                const db = b.remaining_days ?? 999;
                return da - db;
              })}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
              locale={{ emptyText: 'Нет активных беременностей. Запишите случку.' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="🐣 Последние окоты">
            <Table
              columns={kindlingColumns}
              dataSource={kindlings.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: 'Нет записей об окотах' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
