import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RabbitsPage from './pages/RabbitsPage';
import HousingPage from './pages/HousingPage';
import FeedingPage from './pages/FeedingPage';
import HealthPage from './pages/HealthPage';
import BreedingPage from './pages/BreedingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { Spin } from 'antd';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '200px auto' }} />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<DashboardPage />} />
      <Route path="/rabbits" element={<RabbitsPage />} />
      <Route path="/housing" element={<HousingPage />} />
      <Route path="/feeding" element={<FeedingPage />} />
      <Route path="/health" element={<HealthPage />} />
      <Route path="/breeding" element={<BreedingPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

function App() {
  return (
    <ConfigProvider locale={ruRU} theme={{ token: { colorPrimary: '#1890ff' } }}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
