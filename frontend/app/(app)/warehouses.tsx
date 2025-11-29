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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '../../database/schema';
import { Picker } from '@react-native-picker/picker';

interface Warehouse {
  id: number;
  name: string;
  location: string;
  type: string;
  responsible: string;
  status: number;
}

export default function WarehousesScreen() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'رئيسي',
    responsible: '',
  });

  const warehouseTypes = ['رئيسي', 'مواد خام', 'مواد جاهزة', 'مؤقت'];

  const loadWarehouses = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync('SELECT * FROM warehouses ORDER BY created_at DESC') as Warehouse[];
      setWarehouses(result);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWarehouses();
    setRefreshing(false);
  };

  const handleAddWarehouse = async () => {
    if (!formData.name.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم المخزن');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT INTO warehouses (name, location, type, responsible) VALUES (?, ?, ?, ?)',
        formData.name.trim(),
        formData.location.trim(),
        formData.type,
        formData.responsible.trim()
      );

      setModalVisible(false);
      setFormData({ name: '', location: '', type: 'رئيسي', responsible: '' });
      await loadWarehouses();
      Alert.alert('نجاح', 'تم إضافة المخزن بنجاح');
    } catch (error) {
      console.error('Error adding warehouse:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المخزن');
    }
  };

  const handleToggleStatus = async (warehouse: Warehouse) => {
    const newStatus = warehouse.status === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? 'تفعيل' : 'تعطيل';

    Alert.alert(
      'تأكيد',
      `هل تريد ${statusText} المخزن ${warehouse.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('UPDATE warehouses SET status = ? WHERE id = ?', newStatus, warehouse.id);
              await loadWarehouses();
            } catch (error) {
              console.error('Error updating warehouse status:', error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'رئيسي':
        return theme.colors.primary;
      case 'مواد خام':
        return theme.colors.warning;
      case 'مواد جاهزة':
        return theme.colors.success;
      case 'مؤقت':
        return theme.colors.textSecondary;
      default:
        return theme.colors.primary;
    }
  };

  const renderWarehouseItem = ({ item }: { item: Warehouse }) => (
    <View style={styles.warehouseCard}>
      <View style={styles.warehouseHeader}>
        <View style={[styles.statusDot, { backgroundColor: item.status === 1 ? theme.colors.success : theme.colors.error }]} />
        <View style={styles.warehouseInfo}>
          <Text style={styles.warehouseName}>{item.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(item.type)}20` }]}>
            <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>{item.type}</Text>
          </View>
        </View>
      </View>

      {item.location && (
        <View style={styles.warehouseDetail}>
          <Text style={styles.detailText}>{item.location}</Text>
          <Ionicons name="location" size={16} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
        </View>
      )}

      {item.responsible && (
        <View style={styles.warehouseDetail}>
          <Text style={styles.detailText}>{item.responsible}</Text>
          <Ionicons name="person" size={16} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
        </View>
      )}

      <View style={styles.warehouseFooter}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
          onPress={() => handleToggleStatus(item)}
        >
          <Ionicons
            name={item.status === 1 ? 'close-circle' : 'checkmark-circle'}
            size={18}
            color={theme.colors.primary}
          />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
            {item.status === 1 ? 'تعطيل' : 'تفعيل'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المخازن</Text>
      </View>

      <FlatList
        data={warehouses}
        renderItem={renderWarehouseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا توجد مخازن</Text>
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
              <Text style={styles.modalTitle}>إضافة مخزن جديد</Text>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>اسم المخزن *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="أدخل اسم المخزن"
                placeholderTextColor={theme.colors.textSecondary}
                textAlign="right"
              />

              <Text style={styles.label}>الموقع</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="أدخل موقع المخزن"
                placeholderTextColor={theme.colors.textSecondary}
                textAlign="right"
              />

              <Text style={styles.label}>نوع المخزن *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  style={styles.picker}
                >
                  {warehouseTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>المسؤول</Text>
              <TextInput
                style={styles.input}
                value={formData.responsible}
                onChangeText={(text) => setFormData({ ...formData, responsible: text })}
                placeholder="أدخل اسم المسؤول"
                placeholderTextColor={theme.colors.textSecondary}
                textAlign="right"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleAddWarehouse}>
                <Text style={styles.submitButtonText}>إضافة المخزن</Text>
              </TouchableOpacity>
            </ScrollView>
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
  warehouseCard: {
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
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  warehouseInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  warehouseName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  typeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginLeft: theme.spacing.sm,
  },
  warehouseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    justifyContent: 'flex-end',
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  warehouseFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    minHeight: '75%',
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
    flex: 1,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
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
  pickerContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  submitButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
});
