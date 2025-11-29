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

interface Worker {
  id: number;
  name: string;
}

interface Distribution {
  id: number;
  distribution_number: string;
}

interface AddPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPaymentModal({ visible, onClose, onSuccess }: AddPaymentModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [formData, setFormData] = useState({
    workerId: 0,
    distributionId: 0,
    amount: '',
    paymentMethod: 'نقدي',
    notes: '',
  });

  const paymentMethods = ['نقدي', 'تحويل بنكي'];

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const db = await getDatabase();
      const workersResult = await db.getAllAsync(
        'SELECT id, name FROM workers WHERE status = "active"'
      ) as Worker[];
      setWorkers(workersResult);
      
      // تعيين أول عامل كقيمة افتراضية
      if (workersResult.length > 0 && formData.workerId === 0) {
        setFormData(prev => ({ ...prev, workerId: workersResult[0].id }));
        loadWorkerDistributions(workersResult[0].id.toString());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadWorkerDistributions = async (workerId: string) => {
    if (!workerId) {
      setDistributions([]);
      return;
    }
    
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync(
        'SELECT id, distribution_number FROM distributions WHERE worker_id = ? AND status = "completed"',
        parseInt(workerId)
      ) as Distribution[];
      setDistributions(result);
    } catch (error) {
      console.error('Error loading distributions:', error);
    }
  };

  const handleWorkerChange = (workerId: string) => {
    setFormData({ ...formData, workerId, distributionId: '' });
    loadWorkerDistributions(workerId);
  };

  const handleSubmit = async () => {
    if (!formData.workerId || !formData.amount) {
      Alert.alert('خطأ', 'الرجاء إدخال العامل والمبلغ على الأقل');
      return;
    }

    try {
      const db = await getDatabase();
      const paymentDate = new Date().toISOString();

      await db.runAsync(
        'INSERT INTO payments (worker_id, distribution_id, amount, payment_date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?)',
        parseInt(formData.workerId),
        formData.distributionId ? parseInt(formData.distributionId) : null,
        parseFloat(formData.amount),
        paymentDate,
        formData.paymentMethod,
        formData.notes.trim()
      );

      Alert.alert('نجاح', 'تم إضافة الدفعة بنجاح');
      setFormData({ workerId: '', distributionId: '', amount: '', paymentMethod: 'نقدي', notes: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الدفعة');
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
            <Text style={styles.modalTitle}>إضافة دفعة جديدة</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>العامل *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.workerId}
                onValueChange={handleWorkerChange}
                style={styles.picker}
              >
                <Picker.Item label="اختر العامل" value="" />
                {workers.map((worker) => (
                  <Picker.Item key={worker.id} label={worker.name} value={worker.id.toString()} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>التوزيع (اختياري)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.distributionId}
                onValueChange={(value) => setFormData({ ...formData, distributionId: value })}
                style={styles.picker}
                enabled={formData.workerId !== ''}
              >
                <Picker.Item label="اختر التوزيع" value="" />
                {distributions.map((dist) => (
                  <Picker.Item key={dist.id} label={dist.distribution_number} value={dist.id.toString()} />
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

            <Text style={styles.label}>طريقة الدفع *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                style={styles.picker}
              >
                {paymentMethods.map((method) => (
                  <Picker.Item key={method} label={method} value={method} />
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
              <Text style={styles.submitButtonText}>إضافة الدفعة</Text>
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
