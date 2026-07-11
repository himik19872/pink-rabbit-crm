import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout, theme } from 'antd';
import RabbitList from './components/RabbitList';

const { Header, Content, Footer } = Layout;

function App() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: colorBgContainer }}>
          <h1 style={{ color: '#1890ff', margin: 0 }}>🐰 RabbitCRM</h1>
        </Header>
        <Content style={{ padding: '24px' }}>
          <div
            style={{
              minHeight: 360,
              padding: 24,
              borderRadius: borderRadiusLG,
              background: colorBgContainer,
            }}
          >
            <Routes>
              <Route path="/" element={<RabbitList />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          RabbitCRM ©2026 - CRM для коммерческого кролиководства
        </Footer>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
