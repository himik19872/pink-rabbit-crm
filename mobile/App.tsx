// Инициализация нативных модулей до всего остального
import 'react-native-screens';

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ============ Простой API без контекстов ============
const STORAGE_KEYS = {
  SERVER: 'server_url',
  TOKEN: 'access_token',
  REFRESH: 'refresh_token',
};

const DEFAULT_SERVER = 'http://192.168.1.73:8000';

let _baseUrl = DEFAULT_SERVER;

const createApi = (server: string) => axios.create({
  baseURL: `${server}/api`,
  timeout: 10000,
});

let api = createApi(_baseUrl);

// ============ Экран логина + настроек сервера ============
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [server, setServer] = useState(DEFAULT_SERVER);
  const [serverInput, setServerInput] = useState(DEFAULT_SERVER);
  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initDone, setInitDone] = useState(false);

  // Загружаем сохранённый сервер при старте
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.SERVER).then((saved) => {
      if (saved) {
        setServer(saved);
        setServerInput(saved);
        _baseUrl = saved;
        api = createApi(saved);
      }
      setInitDone(true);
    }).catch(() => setInitDone(true));
  }, []);

  if (!initDone) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={{ marginTop: 12, color: '#fff' }}>Загрузка...</Text>
      </View>
    );
  }

  const saveServer = async () => {
    let url = serverInput.trim();
    if (!url) return;
    if (!url.startsWith('http')) url = 'http://' + url;
    if (url.endsWith('/api')) url = url.slice(0, -4);
    if (url.endsWith('/')) url = url.slice(0, -1);
    await AsyncStorage.setItem(STORAGE_KEYS.SERVER, url);
    setServer(url);
    _baseUrl = url;
    api = createApi(url);
    setShowSettings(false);
    Alert.alert('✅', `Сервер: ${url}`);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Ошибка', 'Введите логин и пароль');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/jwt/create/', { username, password });
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.data.access);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH, res.data.refresh);
      onLogin();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Не удалось подключиться к серверу';
      Alert.alert('Ошибка входа', msg);
    } finally {
      setLoading(false);
    }
  };

  // Экран настроек сервера
  if (showSettings) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.card}>
          <Text style={styles.icon}>⚙️</Text>
          <Text style={styles.title}>Настройка сервера</Text>
          <Text style={styles.subtitle}>IP-адрес и порт RabbitCRM</Text>
          <TextInput
            style={styles.input}
            placeholder="192.168.1.73:8000"
            placeholderTextColor="#999"
            value={serverInput}
            onChangeText={setServerInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>Пример: 192.168.1.73:8000</Text>
          <TouchableOpacity style={styles.button} onPress={saveServer}>
            <Text style={styles.buttonText}>Сохранить и подключиться</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setShowSettings(false)}>
            <Text style={styles.linkText}>← Назад</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Экран логина
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <Text style={styles.logo}>🐰</Text>
        <Text style={styles.title}>RabbitCRM</Text>
        <Text style={styles.subtitle}>Мобильный сканер</Text>
        <TextInput
          style={styles.input}
          placeholder="Имя пользователя"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.button, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Войти</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.serverRow} onPress={() => { setServerInput(server); setShowSettings(true); }}>
          <Text style={styles.serverLabel}>🔗 Сервер: </Text>
          <Text style={styles.serverUrl} numberOfLines={1}>{server}</Text>
          <Text style={styles.serverEdit}> ⚙️</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ============ Главный компонент ============
export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.TOKEN).then((t) => {
      setIsAuth(!!t);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1890ff" />
      </View>
    );
  }

  if (!isAuth) {
    return <LoginScreen onLogin={() => setIsAuth(true)} />;
  }

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.REFRESH]);
    setIsAuth(false);
  };

  return <HomeScreen onLogout={handleLogout} />;
}

// HomeScreen — без внешних зависимостей
const HomeScreen: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [scanned, setScanned] = useState<any>(null);
  const [qrid, setQrid] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [weightVal, setWeightVal] = useState('');
  const [showWeight, setShowWeight] = useState(false);

  const scanCage = async (cageId: string) => {
    try {
      const res = await api.get('/housing/cages/scan/', { params: { cage_id: cageId } });
      setScanned(res.data);
    } catch { Alert.alert('Ошибка', 'Клетка не найдена'); }
  };

  const doAction = async (url: string, body: any, ok: string) => {
    try { await api.post(url, body); Alert.alert('✅', ok); } catch { Alert.alert('❌', 'Ошибка'); }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.REFRESH]);
    onLogout();
  };

  if (showInput) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
        <Text style={{ fontSize: 16, color: '#fff', marginBottom: 16 }}>Введите ID клетки</Text>
        <TextInput style={[styles.input, { width: 200, color: '#333', backgroundColor: '#fff' }]} placeholder="ID клетки" placeholderTextColor="#999" value={qrid} onChangeText={setQrid} keyboardType="numeric" />
        <TouchableOpacity style={[styles.button, { width: 200, marginTop: 12 }]} onPress={async () => { await scanCage(qrid); setShowInput(false); setQrid(''); }}>
          <Text style={styles.buttonText}>Найти</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => setShowInput(false)}><Text style={styles.linkText}>← Назад</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1890ff', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>🐰 RabbitCRM</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Выход</Text>
        </TouchableOpacity>
      </View>

      {scanned ? (
        <View style={{ margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 3 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{scanned.rabbit_info?.name || 'Без имени'}</Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>ID: {scanned.rabbit_info?.rabbit_id}</Text>
          <Text style={{ fontSize: 14, color: '#555', marginTop: 2 }}>Клетка: {scanned.shelf_address || scanned.id}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' }}>
            {[
              ['⚖️', 'Вес', () => setShowWeight(true)],
              ['🍽️', 'Корм', () => doAction('/feeding/distributions/', { rabbit: scanned.rabbit_info?.id, feed: 1, quantity: 100, time_of_day: 'MORNING', distribution_date: new Date().toISOString().split('T')[0] }, 'Кормление записано')],
              ['🩺', 'Осмотр', () => doAction('/health/events/', { rabbit: scanned.rabbit_info?.id, description: 'Плановый', event_type: 'CHECKUP', date: new Date().toISOString().split('T')[0], risk_level: 'LOW' }, 'Осмотр записан')],
              ['💧', 'Вода', () => doAction('/housing/water/', { cage: scanned.id, amount_ml: 500, date: new Date().toISOString().split('T')[0] }, 'Вода записана')],
            ].map(([ico, label, action], i) => (
              <TouchableOpacity key={i} style={{ alignItems: 'center', padding: 8 }} onPress={action as any}>
                <Text style={{ fontSize: 28 }}>{ico}</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>📷</Text>
          <Text style={{ fontSize: 18, color: '#999', textAlign: 'center' }}>Отсканируйте QR-код{'\n'}на клетке кролика</Text>
        </View>
      )}

      <TouchableOpacity style={{ margin: 16, backgroundColor: '#1890ff', borderRadius: 12, padding: 18, alignItems: 'center' }} onPress={() => setShowInput(true)}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>📷 Ввести ID клетки</Text>
      </TouchableOpacity>

      {showWeight && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Вес</Text>
            <TextInput style={[styles.input, { marginBottom: 16 }]} placeholder="Вес (г)" keyboardType="numeric" value={weightVal} onChangeText={setWeightVal} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowWeight(false)}><Text style={{ padding: 10 }}>Отмена</Text></TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#1890ff', padding: 10, paddingHorizontal: 20, borderRadius: 8 }} onPress={async () => {
                if (!weightVal || !scanned?.rabbit_info) return;
                try {
                  await api.post('/health/weight/', { rabbit: scanned.rabbit_info.id, weight: parseFloat(weightVal), date: new Date().toISOString().split('T')[0] });
                  Alert.alert('✅', `Вес ${weightVal} г`);
                  setShowWeight(false); setWeightVal('');
                } catch { Alert.alert('Ошибка'); }
              }}><Text style={{ color: '#fff' }}>OK</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
