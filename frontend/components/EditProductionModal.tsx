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

interface EditProductionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productionId: number;
  currentData: {
    distribution_id: number;
    quantity: number;
    production_date: string;
    quality: string;
    warehouse_id: number;
    notes: string;
  };
}

export default function EditProductionModal({ visible, onClose, onSuccess, productionId, currentData }: EditProductionModalProps) {
  const [formData, setFormData] = useState({
    distribution_id: 1,
    quantity: '',
    production_date: '',
    quality: 'good',
    warehouse_id: 1,
    notes: '',
  });
  const [distributions, setDistributions] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
      if (currentData) {
        setFormData({
          distribution_id: currentData.distribution_id,
          quantity: currentData.quantity.toString(),
          production_date: currentData.production_date,
          quality: currentData.quality,
          warehouse_id: currentData.warehouse_id || 1,
          notes: currentData.notes || '',
        });
      }
    }
  }, [visible, currentData]);

  const loadData = async () => {
    try {
      const db = await getDatabase();
      const distData = await db.getAllAsync('SELECT id, distribution_number FROM distributions') as any[];
      const whData = await db.getAllAsync('SELECT id, name FROM warehouses WHERE status = 1') as any[];
      setDistributions(distData);
      setWarehouses(whData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.quantity || !formData.production_date || !formData.quality) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE production SET distribution_id = ?, quantity = ?, production_date = ?, quality = ?, warehouse_id = ?, notes = ? WHERE id = ?',
        formData.distribution_id,
        parseInt(formData.quantity),
        formData.production_date,
        formData.quality,
        formData.warehouse_id,
        formData.notes.trim(),
        productionId
      );

      Alert.alert('نجاح', 'تم تحديث الإنتاج بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating production:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الإنتاج');
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
            <Text style={styles.modalTitle}>تعديل الإنتاج</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>التوزيع *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.distribution_id}
                onValueChange={(value) => setFormData({ ...formData, distribution_id: value })}
                style={styles.picker}
              >
                {distributions.map((dist) => (
                  <Picker.Item key={dist.id} label={dist.distribution_number} value={dist.id} />
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

            <Text style={styles.label}>تاريخ الإنتاج *</Text>
            <TextInput
              style={styles.input}
              value={formData.production_date}
              onChangeText={(text) => setFormData({ ...formData, production_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>الجودة *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.quality}
                onValueChange={(value) => setFormData({ ...formData, quality: value })}
                style={styles.picker}
              >
                <Picker.Item label="ممتاز" value="excellent" />
                <Picker.Item label="جيد" value="good" />
                <Picker.Item label="مقبول" value="acceptable" />
                <Picker.Item label="ضعيف" value="poor" />
              </Picker>
            </View>

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