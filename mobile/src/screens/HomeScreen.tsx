import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import QRScanner from './QRScanner';
import { Rabbit } from '../services/rabbitService';
import { feedingService } from '../services/feedingService';
import { healthService } from '../services/healthService';
import { housingService } from '../services/housingService';
import { rabbitService } from '../services/rabbitService';

const STATUS_LABELS: Record<string, string> = {
  BREEDING: 'Племенной', MEAT: 'Мясной', PET: 'Декоративный', DECEASED: 'Умер', SOLD: 'Продан',
};

const HomeScreen: React.FC = () => {
  const { logout } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [rabbit, setRabbit] = useState<Rabbit | null>(null);
  const [cageInfo, setCageInfo] = useState<any>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showCheckupModal, setShowCheckupModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [weightValue, setWeightValue] = useState('');
  const [feedQty, setFeedQty] = useState('');
  const [checkupNote, setCheckupNote] = useState('');
  const [waterQty, setWaterQty] = useState('');

  const handleScanSuccess = (r: Rabbit, cage: any) => {
    setRabbit(r);
    setCageInfo(cage);
    setShowScanner(false);
  };

  const handleAddWeight = async () => {
    if (!rabbit || !weightValue) return;
    try {
      await rabbitService.addWeight({
        rabbit: rabbit.id,
        weight: parseFloat(weightValue),
      });
      Alert.alert('✅', `Вес ${weightValue} г записан`);
      setShowWeightModal(false);
      setWeightValue('');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось записать вес');
    }
  };

  const handleLogFeed = async () => {
    if (!rabbit || !feedQty) return;
    try {
      await feedingService.logDistribution({
        rabbit: rabbit.id,
        feed: 1, // Базовый комбикорм
        quantity: parseFloat(feedQty),
      });
      Alert.alert('✅', `Кормление ${feedQty} г записано`);
      setShowFeedModal(false);
      setFeedQty('');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось записать кормление');
    }
  };

  const handleLogCheckup = async () => {
    if (!rabbit) return;
    try {
      await healthService.logCheckup({
        rabbit: rabbit.id,
        description: checkupNote || 'Визуальный осмотр',
      });
      Alert.alert('✅', 'Осмотр записан');
      setShowCheckupModal(false);
      setCheckupNote('');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось записать осмотр');
    }
  };

  const handleLogWater = async () => {
    if (!cageInfo || !waterQty) return;
    try {
      await housingService.logWater(cageInfo.id, parseInt(waterQty, 10));
      Alert.alert('✅', `Расход воды ${waterQty} мл записан`);
      setShowWaterModal(false);
      setWaterQty('');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось записать расход воды');
    }
  };

  const handleLogCleaning = async () => {
    if (!cageInfo) return;
    try {
      await housingService.logCleaning(cageInfo.id);
      Alert.alert('✅', 'Уборка клетки отмечена');
    } catch (err) {
      Alert.alert('Ошибка', 'Не удалось отметить уборку');
    }
  };

  if (showScanner) {
    return (
      <QRScanner
        onScanSuccess={handleScanSuccess}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐰 RabbitCRM</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Scan CTA */}
        <TouchableOpacity style={styles.scanButton} onPress={() => setShowScanner(true)}>
          <Text style={styles.scanButtonIcon}>📷</Text>
          <Text style={styles.scanButtonText}>Сканировать QR-код клетки</Text>
        </TouchableOpacity>

        {/* Rabbit Profile */}
        {rabbit && (
          <View style={styles.profileCard}>
            {/* Basic Info */}
            <View style={styles.profileHeader}>
              <Text style={styles.rabbitEmoji}>{rabbit.gender === 'M' ? '🐰' : '🐇'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rabbitName}>{rabbit.name || 'Без имени'}</Text>
                <Text style={styles.rabbitId}>{rabbit.rabbit_id}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{STATUS_LABELS[rabbit.status] || rabbit.status}</Text>
              </View>
            </View>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Пол</Text>
                <Text style={styles.infoValue}>{rabbit.gender === 'M' ? '♂ Самец' : '♀ Самка'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Возраст</Text>
                <Text style={styles.infoValue}>{rabbit.age_months} мес.</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Порода</Text>
                <Text style={styles.infoValue}>{rabbit.breed || '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Дата рожд.</Text>
                <Text style={styles.infoValue}>{rabbit.birth_date}</Text>
              </View>
            </View>

            {/* Cage Info */}
            {cageInfo && (
              <View style={styles.cageBox}>
                <Text style={styles.cageTitle}>📍 Клетка</Text>
                <Text style={styles.cageAddress}>
                  {cageInfo.shelf_address} — Клетка {cageInfo.number}
                </Text>
              </View>
            )}

            {/* Quick Actions */}
            <Text style={styles.actionsTitle}>⚡ Быстрые действия</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowWeightModal(true)}>
                <Text style={styles.actionIcon}>⚖️</Text>
                <Text style={styles.actionText}>Вес</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowFeedModal(true)}>
                <Text style={styles.actionIcon}>🍽️</Text>
                <Text style={styles.actionText}>Корм</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCheckupModal(true)}>
                <Text style={styles.actionIcon}>🏥</Text>
                <Text style={styles.actionText}>Осмотр</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowWaterModal(true)}>
                <Text style={styles.actionIcon}>💧</Text>
                <Text style={styles.actionText}>Вода</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLogCleaning}>
                <Text style={styles.actionIcon}>🧹</Text>
                <Text style={styles.actionText}>Уборка</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!rabbit && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyTitle}>Отсканируйте QR-код</Text>
            <Text style={styles.emptyText}>
              Нажмите кнопку выше и наведите камеру на QR-код клетки, чтобы увидеть информацию о кролике
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Weight Modal */}
      <Modal visible={showWeightModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚖️ Взвешивание</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Вес (граммы)"
              keyboardType="numeric"
              value={weightValue}
              onChangeText={setWeightValue}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowWeightModal(false)}>
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOkBtn} onPress={handleAddWeight}>
                <Text style={styles.modalOkText}>Записать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feed Modal */}
      <Modal visible={showFeedModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🍽️ Кормление</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Количество (граммы)"
              keyboardType="numeric"
              value={feedQty}
              onChangeText={setFeedQty}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowFeedModal(false)}>
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOkBtn} onPress={handleLogFeed}>
                <Text style={styles.modalOkText}>Записать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Checkup Modal */}
      <Modal visible={showCheckupModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🏥 Осмотр</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Примечания (опционально)"
              multiline
              value={checkupNote}
              onChangeText={setCheckupNote}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCheckupModal(false)}>
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOkBtn} onPress={handleLogCheckup}>
                <Text style={styles.modalOkText}>Записать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Water Modal */}
      <Modal visible={showWaterModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💧 Расход воды</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Количество (мл)"
              keyboardType="numeric"
              value={waterQty}
              onChangeText={setWaterQty}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowWaterModal(false)}>
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOkBtn} onPress={handleLogWater}>
                <Text style={styles.modalOkText}>Записать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1890ff',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  logoutText: { color: '#fff', fontSize: 14 },

  content: { flex: 1 },

  // Scan Button
  scanButton: {
    backgroundColor: '#1890ff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scanButtonIcon: { fontSize: 28 },
  scanButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  rabbitEmoji: { fontSize: 40 },
  rabbitName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  rabbitId: { fontSize: 14, color: '#666' },
  statusBadge: {
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { color: '#1890ff', fontSize: 13, fontWeight: '600' },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    width: '47%',
  },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#333', fontWeight: '600' },

  // Cage
  cageBox: {
    backgroundColor: '#f0f5ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  cageTitle: { fontSize: 13, color: '#1890ff', fontWeight: '600', marginBottom: 4 },
  cageAddress: { fontSize: 15, color: '#333' },

  // Actions
  actionsTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    backgroundColor: '#f0f0f0',
    width: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionText: { fontSize: 13, color: '#333', fontWeight: '500' },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalCancelText: { color: '#666', fontSize: 16 },
  modalOkBtn: {
    flex: 1,
    backgroundColor: '#1890ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalOkText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default HomeScreen;
