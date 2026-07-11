import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadServerUrl, saveServerUrl, updateApiBaseUrl } from '../services/api';

interface ServerContextType {
  serverUrl: string;
  setServerUrl: (url: string) => Promise<void>;
  loading: boolean;
}

const ServerContext = createContext<ServerContextType>({
  serverUrl: 'http://192.168.1.73:8000',
  setServerUrl: async () => {},
  loading: true,
});

export const useServer = () => useContext(ServerContext);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrlState] = useState('http://192.168.1.73:8000');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServerUrl().then((url) => {
      setServerUrlState(url);
      setLoading(false);
    });
  }, []);

  const handleSetServerUrl = async (url: string) => {
    // Нормализуем URL: убираем /api и конечный слеш
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/api')) {
      cleanUrl = cleanUrl.slice(0, -4);
    }
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    await saveServerUrl(cleanUrl);
    updateApiBaseUrl(cleanUrl);
    setServerUrlState(cleanUrl);
  };

  return (
    <ServerContext.Provider value={{ serverUrl, setServerUrl: handleSetServerUrl, loading }}>
      {children}
    </ServerContext.Provider>
  );
};
