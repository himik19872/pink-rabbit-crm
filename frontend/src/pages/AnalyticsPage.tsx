import React from 'react';
import { Card, Typography, Row, Col, Statistic, List, Tag } from 'antd';
import { BugOutlined as RabbitOutlined, HeartOutlined, MedicineBoxOutlined, ExperimentOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const AnalyticsPage: React.FC = () => {
  return (
    <div>
      <Title level={3}>📈 Аналитика</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={<><RabbitOutlined /> Поголовье</>}>
            <Statistic title="Всего кроликов" value={0} />
            <Statistic title="Племенных" value={0} valueStyle={{ color: '#3f8600' }} />
            <Statistic title="Мясных" value={0} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<><HeartOutlined /> Разведение</>}>
            <Statistic title="Активных пар" value={0} />
            <Statistic title="Окотов за месяц" value={0} />
            <Statistic title="Средний помёт" value={0} suffix="крольчат" />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={<><MedicineBoxOutlined /> Здоровье</>}>
            <Statistic title="Мероприятий за месяц" value={0} />
            <Statistic title="Срочных" value={0} valueStyle={{ color: '#cf1322' }} />
            <Statistic title="Выживаемость" value={0} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="📋 Сводный отчёт">
            <Paragraph>
              Для получения детальной аналитики необходимо настроить серверную часть модуля аналитики
              и заполнить базу данных реальными показателями.
            </Paragraph>
            <Paragraph>
              Аналитика будет включать:
            </Paragraph>
            <ul>
              <li>Динамику поголовья по месяцам</li>
              <li>Эффективность разведения (плодовитость, выживаемость)</li>
              <li>Расход кормов и воды</li>
              <li>Ветеринарную статистику</li>
              <li>Финансовые показатели</li>
            </ul>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
