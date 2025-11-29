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

interface EditWorkerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workerId: number;
  currentData: {
    name: string;
    phone: string;
    address: string;
    registration_date: string;
  };
}

export default function EditWorkerModal({ visible, onClose, onSuccess, workerId, currentData }: EditWorkerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    registration_date: '',
  });

  useEffect(() => {
    if (visible && currentData) {
      setFormData({
        name: currentData.name,
        phone: currentData.phone || '',
        address: currentData.address || '',
        registration_date: currentData.registration_date,
      });
    }
  }, [visible, currentData]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.registration_date) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE workers SET name = ?, phone = ?, address = ?, registration_date = ? WHERE id = ?',
        formData.name.trim(),
        formData.phone.trim(),
        formData.address.trim(),
        formData.registration_date,
        workerId
      );

      Alert.alert('نجاح', 'تم تحديث بيانات العامل بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating worker:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث بيانات العامل');
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
            <Text style={styles.modalTitle}>تعديل بيانات العامل</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>اسم العامل *</Text>
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
              style={styles.input}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="أدخل العنوان"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>تاريخ التسجيل *</Text>
            <TextInput
              style={styles.input}
              value={formData.registration_date}
              onChangeText={(text) => setFormData({ ...formData, registration_date: text })}
              placeholder="YYYY-MM-DD"
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