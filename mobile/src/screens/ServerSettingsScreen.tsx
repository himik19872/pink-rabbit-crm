import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useServer } from '../contexts/ServerContext';

interface Props {
  onBack: () => void;
}

const ServerSettingsScreen: React.FC<Props> = ({ onBack }) => {
  const { serverUrl, setServerUrl } = useServer();
  const [inputValue, setInputValue] = useState(serverUrl);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    let url = inputValue.trim();
    if (!url) {
      Alert.alert('Ошибка', 'Введите адрес сервера');
      return;
    }
    // Автоматически добавляем http:// если нет протокола
    if (!url.startsWith('http')) {
      url = 'http://' + url;
    }
    // Убираем /api и конечный /
    if (url.endsWith('/api')) url = url.slice(0, -4);
    if (url.endsWith('/')) url = url.slice(0, -1);

    setSaving(true);
    try {
      await setServerUrl(url);
      setInputValue(url);
      Alert.alert('✅', `Сервер сохранён:\n${url}`, [
        { text: 'OK', onPress: onBack },
      ]);
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.icon}>⚙️</Text>
        <Text style={styles.title}>Настройка сервера</Text>
        <Text style={styles.subtitle}>
          Введите IP-адрес и порт сервера RabbitCRM
        </Text>

        <Text style={styles.label}>Адрес сервера</Text>
        <TextInput
          style={styles.input}
          placeholder="192.168.1.73:8000"
          placeholderTextColor="#999"
          value={inputValue}
          onChangeText={setInputValue}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          textContentType="URL"
        />
        <Text style={styles.hint}>
          Пример: 192.168.1.73:8000{'\n'}
          Можно с http:// или без
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Сохранение...' : 'Сохранить и подключиться'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Назад</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1890ff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 24, textAlign: 'center' },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 18,
  },
  saveBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#52c41a',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backBtn: {
    paddingVertical: 8,
  },
  backBtnText: { color: '#1890ff', fontSize: 15 },
});

export default ServerSettingsScreen;
