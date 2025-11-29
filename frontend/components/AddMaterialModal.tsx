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

interface AddMaterialModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMaterialModal({ visible, onClose, onSuccess }: AddMaterialModalProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'كيلو',
    quantity: '',
    unitPrice: '',
    supplier: '',
    warehouseId: '',
    minimumStock: '',
  });

  const units = ['كيلو', 'متر', 'قطعة', 'لتر', 'صندوق', 'كيس'];

  useEffect(() => {
    if (visible) {
      loadWarehouses();
    }
  }, [visible]);

  const loadWarehouses = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync('SELECT id, name FROM warehouses WHERE status = 1') as Warehouse[];
      setWarehouses(result);
      if (result.length > 0 && !formData.warehouseId) {
        setFormData(prev => ({ ...prev, warehouseId: result[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const generateMaterialNumber = () => {
    const timestamp = Date.now();
    return `MAT-${timestamp}`;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.quantity || !formData.unitPrice) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      const materialNumber = generateMaterialNumber();

      await db.runAsync(
        'INSERT INTO materials (material_number, name, description, unit, quantity, unit_price, supplier, warehouse_id, minimum_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        materialNumber,
        formData.name.trim(),
        formData.description.trim(),
        formData.unit,
        parseFloat(formData.quantity),
        parseFloat(formData.unitPrice),
        formData.supplier.trim(),
        formData.warehouseId ? parseInt(formData.warehouseId) : null,
        formData.minimumStock ? parseFloat(formData.minimumStock) : null
      );

      Alert.alert('نجاح', 'تم إضافة المادة بنجاح');
      setFormData({
        name: '',
        description: '',
        unit: 'كيلو',
        quantity: '',
        unitPrice: '',
        supplier: '',
        warehouseId: '',
        minimumStock: '',
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding material:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المادة');
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
            <Text style={styles.modalTitle}>إضافة مادة جديدة</Text>
          </View>

          <ScrollView style={styles.form}>
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
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="أدخل وصف المادة"
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlign="right"
            />

            <Text style={styles.label}>الوحدة *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                style={styles.picker}
              >
                {units.map((unit) => (
                  <Picker.Item key={unit} label={unit} value={unit} />
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

            <Text style={styles.label}>سعر الوحدة (ريال يمني) *</Text>
            <TextInput
              style={styles.input}
              value={formData.unitPrice}
              onChangeText={(text) => setFormData({ ...formData, unitPrice: text })}
              placeholder="أدخل السعر"
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

            <Text style={styles.label}>الحد الأدنى للمخزون</Text>
            <TextInput
              style={styles.input}
              value={formData.minimumStock}
              onChangeText={(text) => setFormData({ ...formData, minimumStock: text })}
              placeholder="أدخل الحد الأدنى للتنبيه"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>إضافة المادة</Text>
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
