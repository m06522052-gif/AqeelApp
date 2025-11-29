import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import { Picker } from '@react-native-picker/picker';

interface Warehouse {
  id: number;
  name: string;
}

interface Batch {
  id: number;
  batch_number: string;
}

interface AddInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddInventoryModal({ visible, onClose, onSuccess }: AddInventoryModalProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    movementType: 'تحويل',
    fromWarehouseId: '',
    toWarehouseId: '',
    batchId: '',
    quantity: '',
    responsible: '',
    notes: '',
  });

  const movementTypes = ['تحويل', 'إدخال', 'إخراج', 'تعديل'];

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const db = await getDatabase();
      const warehousesResult = await db.getAllAsync(
        'SELECT id, name FROM warehouses WHERE status = 1'
      ) as Warehouse[];
      const batchesResult = await db.getAllAsync(
        'SELECT id, batch_number FROM batches WHERE status = "active"'
      ) as Batch[];
      
      setWarehouses(warehousesResult);
      setBatches(batchesResult);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.quantity) {
      Alert.alert('خطأ', 'الرجاء إدخال الكمية');
      return;
    }

    if (formData.movementType === 'تحويل' && (!formData.fromWarehouseId || !formData.toWarehouseId)) {
      Alert.alert('خطأ', 'الرجاء اختيار المخزن المصدر والمخزن الوجهة للتحويل');
      return;
    }

    try {
      const db = await getDatabase();
      const movementDate = new Date().toISOString();

      await db.runAsync(
        'INSERT INTO inventory_movements (movement_type, from_warehouse_id, to_warehouse_id, batch_id, quantity, responsible, notes, movement_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        formData.movementType,
        formData.fromWarehouseId ? parseInt(formData.fromWarehouseId) : null,
        formData.toWarehouseId ? parseInt(formData.toWarehouseId) : null,
        formData.batchId ? parseInt(formData.batchId) : null,
        parseInt(formData.quantity),
        formData.responsible.trim(),
        formData.notes.trim(),
        movementDate
      );

      Alert.alert('نجاح', 'تم إضافة حركة المخزون بنجاح');
      setFormData({
        movementType: 'تحويل',
        fromWarehouseId: '',
        toWarehouseId: '',
        batchId: '',
        quantity: '',
        responsible: '',
        notes: '',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding inventory movement:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة حركة المخزون');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>إضافة حركة مخزون</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>نوع الحركة *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.movementType}
                onValueChange={(value) => setFormData({ ...formData, movementType: value })}
                style={styles.picker}
              >
                {movementTypes.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>

            {formData.movementType === 'تحويل' && (
              <>
                <Text style={styles.label}>من مخزن *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.fromWarehouseId}
                    onValueChange={(value) => setFormData({ ...formData, fromWarehouseId: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="اختر المخزن" value="" />
                    {warehouses.map((warehouse) => (
                      <Picker.Item key={warehouse.id} label={warehouse.name} value={warehouse.id.toString()} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.label}>إلى مخزن *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.toWarehouseId}
                    onValueChange={(value) => setFormData({ ...formData, toWarehouseId: value })}
                    style={styles.picker}
                  >
                    <Picker.Item label="اختر المخزن" value="" />
                    {warehouses.map((warehouse) => (
                      <Picker.Item key={warehouse.id} label={warehouse.name} value={warehouse.id.toString()} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <Text style={styles.label}>الدفعة (اختياري)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.batchId}
                onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                style={styles.picker}
              >
                <Picker.Item label="اختر الدفعة" value="" />
                {batches.map((batch) => (
                  <Picker.Item key={batch.id} label={batch.batch_number} value={batch.id.toString()} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>الكمية *</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="أدخل الكمية"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />

            <Text style={styles.label}>المسؤول</Text>
            <TextInput
              style={styles.input}
              value={formData.responsible}
              onChangeText={(text) => setFormData({ ...formData, responsible: text })}
              placeholder="أدخل اسم المسؤول"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>ملاحظات</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="أدخل ملاحظات"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlign="right"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>إضافة الحركة</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '90%',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
