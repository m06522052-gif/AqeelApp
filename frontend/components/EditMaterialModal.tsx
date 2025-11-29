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

interface EditMaterialModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materialId: number;
  currentData: {
    material_number: string;
    name: string;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number;
    supplier: string;
    warehouse_id: number;
    minimum_stock: number;
    notes: string;
  };
}

export default function EditMaterialModal({ visible, onClose, onSuccess, materialId, currentData }: EditMaterialModalProps) {
  const [formData, setFormData] = useState({
    material_number: '',
    name: '',
    description: '',
    unit: 'كجم',
    quantity: '',
    unit_price: '',
    supplier: '',
    warehouse_id: 1,
    minimum_stock: '',
    notes: '',
  });
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadWarehouses();
      if (currentData) {
        setFormData({
          material_number: currentData.material_number,
          name: currentData.name,
          description: currentData.description || '',
          unit: currentData.unit,
          quantity: currentData.quantity.toString(),
          unit_price: currentData.unit_price.toString(),
          supplier: currentData.supplier || '',
          warehouse_id: currentData.warehouse_id,
          minimum_stock: currentData.minimum_stock?.toString() || '',
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
    if (!formData.material_number.trim() || !formData.name.trim() || !formData.quantity || !formData.unit_price) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE materials SET material_number = ?, name = ?, description = ?, unit = ?, quantity = ?, unit_price = ?, supplier = ?, warehouse_id = ?, minimum_stock = ?, notes = ? WHERE id = ?',
        formData.material_number.trim(),
        formData.name.trim(),
        formData.description.trim(),
        formData.unit,
        parseFloat(formData.quantity),
        parseFloat(formData.unit_price),
        formData.supplier.trim(),
        formData.warehouse_id,
        formData.minimum_stock ? parseFloat(formData.minimum_stock) : null,
        formData.notes.trim(),
        materialId
      );

      Alert.alert('نجاح', 'تم تحديث المادة بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating material:', error);
      if (error.message && error.message.includes('UNIQUE')) {
        Alert.alert('خطأ', 'رقم المادة موجود مسبقاً');
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث المادة');
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
            <Text style={styles.modalTitle}>تعديل المادة</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>رقم المادة *</Text>
            <TextInput
              style={styles.input}
              value={formData.material_number}
              onChangeText={(text) => setFormData({ ...formData, material_number: text })}
              placeholder="أدخل رقم المادة"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>اسم المادة *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="أدخل اسم المادة"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>الوصف</Text>
            <TextInput
              style={styles.input}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="أدخل وصف المادة"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>الوحدة *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                style={styles.picker}
              >
                <Picker.Item label="كجم" value="كجم" />
                <Picker.Item label="متر" value="متر" />
                <Picker.Item label="قطعة" value="قطعة" />
                <Picker.Item label="علبة" value="علبة" />
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

            <Text style={styles.label}>سعر الوحدة (ريال يمني) *</Text>
            <TextInput
              style={styles.input}
              value={formData.unit_price}
              onChangeText={(text) => setFormData({ ...formData, unit_price: text })}
              placeholder="أدخل سعر الوحدة"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />

            <Text style={styles.label}>المورد</Text>
            <TextInput
              style={styles.input}
              value={formData.supplier}
              onChangeText={(text) => setFormData({ ...formData, supplier: text })}
              placeholder="أدخل اسم المورد"
              placeholderTextColor={theme.colors.textSecondary}
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

            <Text style={styles.label}>الحد الأدنى للمخزون</Text>
            <TextInput
              style={styles.input}
              value={formData.minimum_stock}
              onChangeText={(text) => setFormData({ ...formData, minimum_stock: text })}
              placeholder="أدخل الحد الأدنى"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />

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