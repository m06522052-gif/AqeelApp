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

interface EditBatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batchId: number;
  currentData: {
    batch_number: string;
    supplier: string;
    receive_date: string;
    bag_type: string;
    quantity: number;
    price: number;
    warehouse_id: number;
    notes: string;
  };
}

export default function EditBatchModal({ visible, onClose, onSuccess, batchId, currentData }: EditBatchModalProps) {
  const [formData, setFormData] = useState({
    batch_number: '',
    supplier: '',
    receive_date: '',
    bag_type: '4',
    quantity: '',
    price: '',
    warehouse_id: 1,
    notes: '',
  });
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadWarehouses();
      if (currentData) {
        setFormData({
          batch_number: currentData.batch_number,
          supplier: currentData.supplier,
          receive_date: currentData.receive_date,
          bag_type: currentData.bag_type,
          quantity: currentData.quantity.toString(),
          price: currentData.price.toString(),
          warehouse_id: currentData.warehouse_id,
          notes: currentData.notes || '',
        });
      }
    }
  }, [visible, currentData]);

  const loadWarehouses = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync('SELECT id, name FROM warehouses WHERE status = 1') as any[];
      setWarehouses(result);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.batch_number.trim() || !formData.supplier.trim() || !formData.quantity || !formData.price) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE batches SET batch_number = ?, supplier = ?, receive_date = ?, bag_type = ?, quantity = ?, price = ?, warehouse_id = ?, notes = ? WHERE id = ?',
        formData.batch_number.trim(),
        formData.supplier.trim(),
        formData.receive_date,
        formData.bag_type,
        parseInt(formData.quantity),
        parseFloat(formData.price),
        formData.warehouse_id,
        formData.notes.trim(),
        batchId
      );

      Alert.alert('نجاح', 'تم تحديث الدفعة بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating batch:', error);
      if (error.message && error.message.includes('UNIQUE')) {
        Alert.alert('خطأ', 'رقم الدفعة موجود مسبقاً');
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الدفعة');
      }
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
            <Text style={styles.modalTitle}>تعديل الدفعة</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>رقم الدفعة *</Text>
            <TextInput
              style={styles.input}
              value={formData.batch_number}
              onChangeText={(text) => setFormData({ ...formData, batch_number: text })}
              placeholder="أدخل رقم الدفعة"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>المورد *</Text>
            <TextInput
              style={styles.input}
              value={formData.supplier}
              onChangeText={(text) => setFormData({ ...formData, supplier: text })}
              placeholder="أدخل اسم المورد"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>تاريخ الاستلام *</Text>
            <TextInput
              style={styles.input}
              value={formData.receive_date}
              onChangeText={(text) => setFormData({ ...formData, receive_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>نوع الكيس *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.bag_type}
                onValueChange={(value) => setFormData({ ...formData, bag_type: value })}
                style={styles.picker}
              >
                <Picker.Item label="نوع 4" value="4" />
                <Picker.Item label="نوع 5" value="5" />
                <Picker.Item label="نوع 6" value="6" />
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

            <Text style={styles.label}>السعر (ريال يمني) *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="أدخل السعر"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />

            <Text style={styles.label}>المخزن</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.warehouse_id}
                onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
                style={styles.picker}
              >
                {warehouses.map((warehouse) => (
                  <Picker.Item key={warehouse.id} label={warehouse.name} value={warehouse.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>ملاحظات</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="أدخل ملاحظات (اختياري)"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlign="right"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>حفظ التعديلات</Text>
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
    minHeight: 100,
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
