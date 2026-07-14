import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { rabbitService, Rabbit } from '../services/rabbitService';

interface Props {
  onScanSuccess: (rabbit: Rabbit, cageInfo: any) => void;
  onClose: () => void;
}

const QRScanner: React.FC<Props> = ({ onScanSuccess, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      // QR-формат: RABBITCRM:CAGE:123:Адрес
      // Штрих-код: CAGE000021
      let cageId: number | null = null;

      const qrMatch = data.match(/RABBITCRM:CAGE:(\d+)/);
      if (qrMatch) {
        cageId = parseInt(qrMatch[1], 10);
      } else {
        const bcMatch = data.match(/CAGE(\d+)/i);
        if (bcMatch) {
          cageId = parseInt(bcMatch[1], 10);
        } else {
          const numMatch = data.match(/^(\d+)$/);
          if (numMatch) cageId = parseInt(numMatch[1], 10);
        }
      }

      if (!cageId) {
        Alert.alert('Ошибка', 'QR/штрих-код не распознан как код клетки RabbitCRM');
        setScanned(false);
        setLoading(false);
        return;
      }

      const cageData = await rabbitService.getByCage(cageId);

      if (!cageData.current_rabbit || !cageData.rabbit_info) {
        Alert.alert('Пустая клетка', `Клетка ${cageData.shelf_address} — Клетка ${cageData.number} пуста.`);
        setScanned(false);
        setLoading(false);
        return;
      }

      onScanSuccess(cageData.rabbit_info as Rabbit, cageData);
    } catch (err: any) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные кролика: ' + (err?.message || ''));
      setScanned(false);
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Запрос разрешения камеры...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Нет доступа к камере</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Разрешить</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonOutline} onPress={onClose}>
          <Text style={styles.buttonOutlineText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Text style={styles.scanHint}>Наведите на QR-код клетки</Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕ Закрыть</Text>
          </TouchableOpacity>
          {scanned && !loading && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.buttonText}>Сканировать снова</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 24,
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#1890ff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  scanHint: { color: '#fff', fontSize: 14, textAlign: 'center' },
  text: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 12,
  },
  closeButtonText: { color: '#fff', fontSize: 18 },
  rescanButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  button: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonOutlineText: { color: '#fff', fontSize: 16 },
});

export default QRScanner;
