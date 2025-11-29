import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import { format } from 'date-fns';

interface Worker {
  id: number;
  name: string;
  phone: string;
  address: string;
  registration_date: string;
  status: string;
}

export default function WorkersScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const loadWorkers = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync('SELECT * FROM workers ORDER BY created_at DESC') as Worker[];
      setWorkers(result);
    } catch (error) {
      console.error('Error loading workers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkers();
    setRefreshing(false);
  };

  const handleAddWorker = async () => {
    if (!formData.name.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم العامل');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT INTO workers (name, phone, address, registration_date) VALUES (?, ?, ?, ?)',
        formData.name.trim(),
        formData.phone.trim(),
        formData.address.trim(),
        new Date().toISOString()
      );

      setModalVisible(false);
      setFormData({ name: '', phone: '', address: '' });
      await loadWorkers();
      Alert.alert('نجاح', 'تم إضافة العامل بنجاح');
    } catch (error) {
      console.error('Error adding worker:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة العامل');
    }
  };

  const handleToggleStatus = async (worker: Worker) => {
    const newStatus = worker.status === 'active' ? 'inactive' : 'active';
    const statusText = newStatus === 'active' ? 'تنشيط' : 'تعطيل';

    Alert.alert(
      'تأكيد',
      `هل تريد ${statusText} العامل ${worker.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('UPDATE workers SET status = ? WHERE id = ?', newStatus, worker.id);
              await loadWorkers();
            } catch (error) {
              console.error('Error updating worker status:', error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const renderWorkerItem = ({ item }: { item: Worker }) => (
    <View style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{item.status === 'active' ? 'نشط' : 'غير نشط'}</Text>
        </View>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{item.name}</Text>
          <View style={styles.workerDetail}>
            <Text style={styles.workerDetailText}>{item.phone || 'لا يوجد رقم'}</Text>
            <Ionicons name="call" size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
          </View>
        </View>
      </View>

      {item.address && (
        <View style={styles.workerAddress}>
          <Text style={styles.workerDetailText}>{item.address}</Text>
          <Ionicons name="location" size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
        </View>
      )}

      <View style={styles.workerFooter}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
          onPress={() => handleToggleStatus(item)}
        >
          <Ionicons
            name={item.status === 'active' ? 'pause-circle' : 'play-circle'}
            size={18}
            color={theme.colors.primary}
          />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
            {item.status === 'active' ? 'تعطيل' : 'تنشيط'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.registrationDate}>
          تاريخ التسجيل: {format(new Date(item.registration_date), 'yyyy-MM-dd')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة العمال</Text>
      </View>

      <FlatList
        data={workers}
        renderItem={renderWorkerItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا يوجد عمال</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة عامل جديد</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>الاسم *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="أدخل اسم العامل"
                placeholderTextColor={theme.colors.textSecondary}
                textAlign="right"
              />

              <Text style={styles.label}>رقم الهاتف</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="أدخل رقم الهاتف"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
                textAlign="right"
              />

              <Text style={styles.label}>العنوان</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="أدخل العنوان"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlign="right"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddWorker}>
                <Text style={styles.submitButtonText}>إضافة العامل</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  workerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  workerInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  workerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  workerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  workerAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusActive: {
    backgroundColor: `${theme.colors.success}20`,
  },
  statusInactive: {
    backgroundColor: `${theme.colors.textSecondary}20`,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  workerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  registrationDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  form: {
    gap: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'right',
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
});
