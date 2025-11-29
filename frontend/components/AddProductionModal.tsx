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

interface Distribution {
  id: number;
  distribution_number: string;
  worker_name?: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface AddProductionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductionModal({ visible, onClose, onSuccess }: AddProductionModalProps) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    distributionId: 0,
    quantity: '',
    quality: 'جيد',
    warehouseId: 0,
    notes: '',
  });

  const qualityOptions = ['ممتاز', 'جيد', 'مقبول', 'مرفوض'];

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const db = await getDatabase();
      const distResult = await db.getAllAsync(`
        SELECT d.id, d.distribution_number, w.name as worker_name
        FROM distributions d
        LEFT JOIN workers w ON d.worker_id = w.id
        WHERE d.status = 'pending'
      `) as Distribution[];
      const warehousesResult = await db.getAllAsync(
        'SELECT id, name FROM warehouses WHERE status = 1'
      ) as Warehouse[];
      
      setDistributions(distResult);
      setWarehouses(warehousesResult);
      
      // تعيين أول عنصر كقيمة افتراضية
      if (distResult.length > 0 && formData.distributionId === 0) {
        setFormData(prev => ({ ...prev, distributionId: distResult[0].id }));
      }
      if (warehousesResult.length > 0 && formData.warehouseId === 0) {
        setFormData(prev => ({ ...prev, warehouseId: warehousesResult[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.distributionId || !formData.quantity) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      const productionDate = new Date().toISOString();

      await db.runAsync(
        'INSERT INTO production (distribution_id, quantity, production_date, quality, warehouse_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
        parseInt(formData.distributionId),
        parseInt(formData.quantity),
        productionDate,
        formData.quality,
        formData.warehouseId ? parseInt(formData.warehouseId) : null,
        formData.notes.trim()
      );

      // تحديث حالة التوزيع
      await db.runAsync(
        'UPDATE distributions SET status = "completed" WHERE id = ?',
        parseInt(formData.distributionId)
      );

      Alert.alert('نجاح', 'تم إضافة الإنتاج بنجاح');
      setFormData({ distributionId: '', quantity: '', quality: 'جيد', warehouseId: '', notes: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding production:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الإنتاج');
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
            <Text style={styles.modalTitle}>إضافة إنتاج جديد</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>التوزيع *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.distributionId}
                onValueChange={(value) => setFormData({ ...formData, distributionId: value })}
                style={styles.picker}
              >
                <Picker.Item label="اختر التوزيع" value="" />
                {distributions.map((dist) => (
                  <Picker.Item 
                    key={dist.id} 
                    label={`${dist.distribution_number} - ${dist.worker_name || 'غير محدد'}`} 
                    value={dist.id.toString()} 
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>الكمية المنتجة *</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="أدخل الكمية"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />

            <Text style={styles.label}>تقييم الجودة *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.quality}
                onValueChange={(value) => setFormData({ ...formData, quality: value })}
                style={styles.picker}
              >
                {qualityOptions.map((quality) => (
                  <Picker.Item key={quality} label={quality} value={quality} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>المخزن</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.warehouseId}
                onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
                style={styles.picker}
              >
                <Picker.Item label="اختر المخزن" value="" />
                {warehouses.map((warehouse) => (
                  <Picker.Item key={warehouse.id} label={warehouse.name} value={warehouse.id.toString()} />
                ))}
              </Picker>
            </View>

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
              <Text style={styles.submitButtonText}>إضافة الإنتاج</Text>
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
