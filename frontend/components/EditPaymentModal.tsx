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

interface EditPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentId: number;
  currentData: {
    worker_id: number;
    distribution_id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    notes: string;
  };
}

export default function EditPaymentModal({ visible, onClose, onSuccess, paymentId, currentData }: EditPaymentModalProps) {
  const [formData, setFormData] = useState({
    worker_id: 1,
    distribution_id: 1,
    amount: '',
    payment_date: '',
    payment_method: 'cash',
    notes: '',
  });
  const [workers, setWorkers] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
      if (currentData) {
        setFormData({
          worker_id: currentData.worker_id,
          distribution_id: currentData.distribution_id || 1,
          amount: currentData.amount.toString(),
          payment_date: currentData.payment_date,
          payment_method: currentData.payment_method,
          notes: currentData.notes || '',
        });
      }
    }
  }, [visible, currentData]);

  const loadData = async () => {
    try {
      const db = await getDatabase();
      const workersData = await db.getAllAsync('SELECT id, name FROM workers') as any[];
      const distData = await db.getAllAsync('SELECT id, distribution_number FROM distributions') as any[];
      setWorkers(workersData);
      setDistributions(distData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.payment_date || !formData.payment_method) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE payments SET worker_id = ?, distribution_id = ?, amount = ?, payment_date = ?, payment_method = ?, notes = ? WHERE id = ?',
        formData.worker_id,
        formData.distribution_id,
        parseFloat(formData.amount),
        formData.payment_date,
        formData.payment_method,
        formData.notes.trim(),
        paymentId
      );

      Alert.alert('نجاح', 'تم تحديث الدفعة بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating payment:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الدفعة');
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
            <Text style={styles.label}>العامل *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.worker_id}
                onValueChange={(value) => setFormData({ ...formData, worker_id: value })}
                style={styles.picker}
              >
                {workers.map((worker) => (
                  <Picker.Item key={worker.id} label={worker.name} value={worker.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>التوزيع</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.distribution_id}
                onValueChange={(value) => setFormData({ ...formData, distribution_id: value })}
                style={styles.picker}
              >
                <Picker.Item label="بدون توزيع" value={null} />
                {distributions.map((dist) => (
                  <Picker.Item key={dist.id} label={dist.distribution_number} value={dist.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>المبلغ (ريال يمني) *</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="أدخل المبلغ"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />

            <Text style={styles.label}>تاريخ الدفع *</Text>
            <TextInput
              style={styles.input}
              value={formData.payment_date}
              onChangeText={(text) => setFormData({ ...formData, payment_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>طريقة الدفع *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                style={styles.picker}
              >
                <Picker.Item label="نقدي" value="cash" />
                <Picker.Item label="تحويل بنكي" value="bank_transfer" />
                <Picker.Item label="شيك" value="check" />
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