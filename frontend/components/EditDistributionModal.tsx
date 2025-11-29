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

interface EditDistributionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  distributionId: number;
  currentData: {
    distribution_number: string;
    worker_id: number;
    batch_id: number;
    quantity: number;
    distribution_date: string;
    expected_completion_date: string;
    status: string;
  };
}

export default function EditDistributionModal({ visible, onClose, onSuccess, distributionId, currentData }: EditDistributionModalProps) {
  const [formData, setFormData] = useState({
    distribution_number: '',
    worker_id: 1,
    batch_id: 1,
    quantity: '',
    distribution_date: '',
    expected_completion_date: '',
    status: 'pending',
  });
  const [workers, setWorkers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
      if (currentData) {
        setFormData({
          distribution_number: currentData.distribution_number,
          worker_id: currentData.worker_id,
          batch_id: currentData.batch_id,
          quantity: currentData.quantity.toString(),
          distribution_date: currentData.distribution_date,
          expected_completion_date: currentData.expected_completion_date || '',
          status: currentData.status,
        });
      }
    }
  }, [visible, currentData]);

  const loadData = async () => {
    try {
      const db = await getDatabase();
      const workersData = await db.getAllAsync('SELECT id, name FROM workers WHERE status = "active"') as any[];
      const batchesData = await db.getAllAsync('SELECT id, batch_number FROM batches WHERE status = "active"') as any[];
      setWorkers(workersData);
      setBatches(batchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.distribution_number.trim() || !formData.quantity || !formData.distribution_date) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE distributions SET distribution_number = ?, worker_id = ?, batch_id = ?, quantity = ?, distribution_date = ?, expected_completion_date = ?, status = ? WHERE id = ?',
        formData.distribution_number.trim(),
        formData.worker_id,
        formData.batch_id,
        parseInt(formData.quantity),
        formData.distribution_date,
        formData.expected_completion_date || null,
        formData.status,
        distributionId
      );

      Alert.alert('نجاح', 'تم تحديث التوزيع بنجاح');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating distribution:', error);
      if (error.message && error.message.includes('UNIQUE')) {
        Alert.alert('خطأ', 'رقم التوزيع موجود مسبقاً');
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث التوزيع');
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
            <Text style={styles.modalTitle}>تعديل التوزيع</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>رقم التوزيع *</Text>
            <TextInput
              style={styles.input}
              value={formData.distribution_number}
              onChangeText={(text) => setFormData({ ...formData, distribution_number: text })}
              placeholder="أدخل رقم التوزيع"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

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

            <Text style={styles.label}>الدفعة *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.batch_id}
                onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
                style={styles.picker}
              >
                {batches.map((batch) => (
                  <Picker.Item key={batch.id} label={batch.batch_number} value={batch.id} />
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

            <Text style={styles.label}>تاريخ التوزيع *</Text>
            <TextInput
              style={styles.input}
              value={formData.distribution_date}
              onChangeText={(text) => setFormData({ ...formData, distribution_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>تاريخ الإنجاز المتوقع</Text>
            <TextInput
              style={styles.input}
              value={formData.expected_completion_date}
              onChangeText={(text) => setFormData({ ...formData, expected_completion_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textSecondary}
              textAlign="right"
            />

            <Text style={styles.label}>الحالة *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                style={styles.picker}
              >
                <Picker.Item label="معلق" value="pending" />
                <Picker.Item label="قيد العمل" value="in_progress" />
                <Picker.Item label="مكتمل" value="completed" />
              </Picker>
            </View>

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