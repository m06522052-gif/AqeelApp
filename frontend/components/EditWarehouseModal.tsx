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

interface EditWarehouseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  warehouseId: number;
  currentData: {
    name: string;
    location: string;
    type: string;
    responsible: string;
  };
}

export default function EditWarehouseModal({ visible, onClose, onSuccess, warehouseId, currentData }: EditWarehouseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'main',
    responsible: '',
  });

  useEffect(() => {
    if (visible && currentData) {
      setFormData({
        name: currentData.name,
        location: currentData.location || '',
        type: currentData.type,
        responsible: currentData.responsible || '',
      });
    }
  }, [visible, currentData]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.type) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE warehouses SET name = ?, location = ?, type = ?, responsible = ? WHERE id = ?',
        formData.name.trim(),
        formData.location.trim(),
        formData.type,
        formData.responsible.trim(),
        warehouseId
      );

      Alert.alert('نجاح', 'تم تحديث المخزن بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating warehouse:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث المخزن');
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
            <Text style={styles.modalTitle}>تعديل المخزن</Text>
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
              placeholder="أدخل الموقع"
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
                <Picker.Item label="مخزن رئيسي" value="main" />
                <Picker.Item label="مخزن فرعي" value="secondary" />
                <Picker.Item label="مخزن مؤقت" value="temporary" />
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