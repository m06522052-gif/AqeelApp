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
import { format } from 'date-fns';
import EditBatchModal from '@/components/EditBatchModal';

interface BatchDetails {
  id: number;
  batch_number: string;
  supplier: string;
  receive_date: string;
  bag_type: string;
  quantity: number;
  price: number;
  warehouse_id: number;
  warehouse_name?: string;
  notes: string;
  status: string;
  distributed_quantity: number;
  remaining_quantity: number;
}

export default function BatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [batch, setBatch] = useState<BatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    loadBatchDetails();
  }, [id]);

  const loadBatchDetails = async () => {
    try {
      const db = await getDatabase();
      
      const batchData = await db.getFirstAsync(`
        SELECT b.*, w.name as warehouse_name
        FROM batches b
        LEFT JOIN warehouses w ON b.warehouse_id = w.id
        WHERE b.id = ?
      `, parseInt(id as string)) as any;

      const distSum = await db.getFirstAsync(
        'SELECT COALESCE(SUM(quantity), 0) as total FROM distributions WHERE batch_id = ?',
        parseInt(id as string)
      ) as any;

      setBatch({
        ...batchData,
        distributed_quantity: distSum?.total || 0,
        remaining_quantity: batchData.quantity - (distSum?.total || 0),
      });
    } catch (error) {
      console.error('Error loading batch details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات الدفعة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف الدفعة ${batch?.batch_number}؟\n\nملاحظة: لا يمكن حذف الدفعة إذا كان لها توزيعات مرتبطة.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM batches WHERE id = ?', parseInt(id as string));
              Alert.alert('نجاح', 'تم حذف الدفعة بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting batch:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف الدفعة. قد تكون هناك بيانات مرتبطة.');
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

  if (!batch) {
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
          <View style={styles.batchHeader}>
            <View style={[styles.bagTypeBadge, { backgroundColor: batch.bag_type === '4' ? `${theme.colors.primary}20` : `${theme.colors.success}20` }]}>
              <Text style={[styles.bagTypeText, { color: batch.bag_type === '4' ? theme.colors.primary : theme.colors.success }]}>
                نوع {batch.bag_type}
              </Text>
            </View>
            <Text style={styles.batchNumber}>{batch.batch_number}</Text>
          </View>
          <Text style={styles.supplier}>المورد: {batch.supplier}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>معلومات الدفعة</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{batch.quantity}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="cube" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>الكمية الإجمالية</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{batch.price.toFixed(2)} ريال</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="cash" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>السعر</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {format(new Date(batch.receive_date), 'yyyy-MM-dd')}
            </Text>
            <View style={styles.infoLabel}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>تاريخ الاستلام</Text>
            </View>
          </View>

          {batch.warehouse_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{batch.warehouse_name}</Text>
              <View style={styles.infoLabel}>
                <Ionicons name="business" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>المخزن</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>حالة التوزيع</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>{batch.distributed_quantity}</Text>
              <Text style={styles.statLabel}>موزعة</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{batch.remaining_quantity}</Text>
              <Text style={styles.statLabel}>متبقية</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {batch.quantity > 0 ? ((batch.distributed_quantity / batch.quantity) * 100).toFixed(0) : 0}%
              </Text>
              <Text style={styles.statLabel}>نسبة التوزيع</Text>
            </View>
          </View>
        </View>

        {batch.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <Text style={styles.notesText}>{batch.notes}</Text>
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
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  batchNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  bagTypeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  bagTypeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  supplier: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'right',
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
  statsCard: {
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
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
