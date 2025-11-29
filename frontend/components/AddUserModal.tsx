import React, { useState } from 'react';
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
import { hashPassword, validatePasswordStrength, sanitizeInput, validateEmail } from '@/utils/security';

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({ visible, onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });

  const roles = [
    { value: 'manager', label: 'مدير' },
    { value: 'employee', label: 'موظف' },
  ];

  const handleSubmit = async () => {
    // التحقق من الحقول الفارغة
    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول المطلوبة');
      return;
    }

    // التحقق من صحة البريد الإلكتروني
    if (!validateEmail(formData.email)) {
      Alert.alert('خطأ', 'البريد الإلكتروني غير صحيح');
      return;
    }

    // التحقق من تطابق كلمتي المرور
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    // التحقق من قوة كلمة المرور
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'كلمة مرور ضعيفة',
        'يجب أن تحتوي كلمة المرور على:\n' + passwordValidation.errors.join('\n')
      );
      return;
    }

    try {
      const db = await getDatabase();
      
      // تنظيف المدخلات
      const cleanUsername = sanitizeInput(formData.username);
      const cleanEmail = sanitizeInput(formData.email);
      const cleanPhone = sanitizeInput(formData.phone);
      
      // تشفير كلمة المرور
      const hashedPassword = await hashPassword(formData.password);
      
      await db.runAsync(
        'INSERT INTO users (username, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
        cleanUsername,
        cleanEmail,
        cleanPhone,
        hashedPassword,
        formData.role
      );

      Alert.alert('نجاح', 'تم إضافة المستخدم بنجاح');
      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding user:', error);
      if (error.message && error.message.includes('UNIQUE')) {
        Alert.alert('خطأ', 'اسم المستخدم أو البريد الإلكتروني موجود مسبقاً');
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المستخدم. يرجى المحاولة مرة أخرى.');
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
            <Text style={styles.modalTitle}>إضافة مستخدم جديد</Text>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>اسم المستخدم *</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholder="أدخل اسم المستخدم"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              textAlign="right"
            />

            <Text style={styles.label}>البريد الإلكتروني *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="أدخل البريد الإلكتروني"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
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

            <Text style={styles.label}>كلمة المرور *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="أدخل كلمة المرور"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              textAlign="right"
            />

            <Text style={styles.label}>تأكيد كلمة المرور *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder="أعد إدخال كلمة المرور"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry
              textAlign="right"
            />

            <Text style={styles.label}>الصلاحية *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                style={styles.picker}
              >
                {roles.map((role) => (
                  <Picker.Item key={role.value} label={role.label} value={role.value} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>إضافة المستخدم</Text>
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
