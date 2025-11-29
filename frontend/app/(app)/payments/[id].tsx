import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import EditPaymentModal from '@/components/EditPaymentModal';
import { format } from 'date-fns';

interface PaymentDetails {
  id: number;
  worker_id: number;
  worker_name: string;
  distribution_id?: number;
  distribution_number?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
}

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentDetails();
  }, [id]);

  const loadPaymentDetails = async () => {
    try {
      const db = await getDatabase();
      
      const paymentData = await db.getFirstAsync(`
        SELECT p.*, w.name as worker_name, d.distribution_number
        FROM payments p
        LEFT JOIN workers w ON p.worker_id = w.id
        LEFT JOIN distributions d ON p.distribution_id = d.id
        WHERE p.id = ?
      `, parseInt(id as string)) as any;

      setPayment(paymentData);
    } catch (error) {
      console.error('Error loading payment details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات الدفعة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف هذه الدفعة بمبلغ ${payment?.amount.toFixed(2)} ريال؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM payments WHERE id = ?', parseInt(id as string));
              Alert.alert('نجاح', 'تم حذف الدفعة بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting payment:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف الدفعة');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>لم يتم العثور على الدفعة</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTransfer = payment.payment_method === 'تحويل بنكي';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الدفعة</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.amountContainer}>
            <View style={[styles.methodBadge, { backgroundColor: isTransfer ? `${theme.colors.primary}20` : `${theme.colors.success}20` }]}>
              <Ionicons 
                name={isTransfer ? 'card' : 'cash'} 
                size={24} 
                color={isTransfer ? theme.colors.primary : theme.colors.success} 
              />
              <Text style={[styles.methodText, { color: isTransfer ? theme.colors.primary : theme.colors.success }]}>
                {payment.payment_method}
              </Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountValue}>{payment.amount.toFixed(2)}</Text>
              <Text style={styles.amountCurrency}>ريال يمني</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>معلومات الدفعة</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{payment.worker_name}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="person" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>العامل</Text>
            </View>
          </View>

          {payment.distribution_number && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{payment.distribution_number}</Text>
              <View style={styles.infoLabel}>
                <Ionicons name="share-social" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>رقم التوزيع</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {format(new Date(payment.payment_date), 'yyyy-MM-dd')}
            </Text>
            <View style={styles.infoLabel}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>تاريخ الدفع</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{payment.payment_method}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="wallet" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>طريقة الدفع</Text>
            </View>
          </View>
        </View>

        {payment.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </View>
        )}

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={theme.colors.surface} />
            <Text style={styles.deleteButtonText}>حذف الدفعة</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  backBtn: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  methodText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,
  },
  amountCurrency: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoLabelText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  notesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'right',
  },
  actionsCard: {
    marginBottom: theme.spacing.xl,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  deleteButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
