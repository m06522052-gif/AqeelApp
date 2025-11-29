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

interface Batch {
  id: number;
  batch_number: string;
  quantity: number;
}

interface AddDistributionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDistributionModal({ visible, onClose, onSuccess }: AddDistributionModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    workerId: '',
    batchId: '',
    quantity: '',
    expectedDays: '7',
  });

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
      const batchesResult = await db.getAllAsync(
        'SELECT id, batch_number, quantity FROM batches WHERE status = "active"'
      ) as Batch[];
      
      setWorkers(workersResult);
      setBatches(batchesResult);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateDistributionNumber = () => {
    const timestamp = Date.now();
    return `DIST-${timestamp}`;
  };

  const handleSubmit = async () => {
    if (!formData.workerId || !formData.batchId || !formData.quantity) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    try {
      const db = await getDatabase();
      const distributionNumber = generateDistributionNumber();
      const distributionDate = new Date().toISOString();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + parseInt(formData.expectedDays));

      await db.runAsync(
        'INSERT INTO distributions (distribution_number, worker_id, batch_id, quantity, distribution_date, expected_completion_date) VALUES (?, ?, ?, ?, ?, ?)',
        distributionNumber,
        parseInt(formData.workerId),
        parseInt(formData.batchId),
        parseInt(formData.quantity),
        distributionDate,
        expectedDate.toISOString()
      );

      Alert.alert('نجاح', 'تم إضافة التوزيع بنجاح');
      setFormData({ workerId: '', batchId: '', quantity: '', expectedDays: '7' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding distribution:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة التوزيع');
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
            <Text style={styles.modalTitle}>إضافة توزيع جديد</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>العامل *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.workerId}
                onValueChange={(value) => setFormData({ ...formData, workerId: value })}
                style={styles.picker}
              >
                <Picker.Item label="اختر العامل" value="" />
                {workers.map((worker) => (
                  <Picker.Item key={worker.id} label={worker.name} value={worker.id.toString()} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>الدفعة *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.batchId}
                onValueChange={(value) => setFormData({ ...formData, batchId: value })}
                style={styles.picker}
              >
                <Picker.Item label="اختر الدفعة" value="" />
                {batches.map((batch) => (
                  <Picker.Item 
                    key={batch.id} 
                    label={`${batch.batch_number} (متبقي: ${batch.quantity})`} 
                    value={batch.id.toString()} 
                  />
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

            <Text style={styles.label}>أيام الإنجاز المتوقعة</Text>
            <TextInput
              style={styles.input}
              value={formData.expectedDays}
              onChangeText={(text) => setFormData({ ...formData, expectedDays: text })}
              placeholder="أدخل عدد الأيام"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              textAlign="right"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>إضافة التوزيع</Text>
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
    maxHeight: '85%',
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
