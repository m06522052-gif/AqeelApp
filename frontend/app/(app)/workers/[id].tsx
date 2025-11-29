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
import EditWorkerModal from '@/components/EditWorkerModal';

interface WorkerDetails {
  id: number;
  name: string;
  phone: string;
  address: string;
  registration_date: string;
  status: string;
  total_distributions: number;
  total_production: number;
  total_payments: number;
}

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [worker, setWorker] = useState<WorkerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    loadWorkerDetails();
  }, [id]);

  const loadWorkerDetails = async () => {
    try {
      const db = await getDatabase();
      
      const workerData = await db.getFirstAsync(
        'SELECT * FROM workers WHERE id = ?',
        parseInt(id as string)
      ) as any;

      const distCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM distributions WHERE worker_id = ?',
        parseInt(id as string)
      ) as any;

      const prodCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM production p JOIN distributions d ON p.distribution_id = d.id WHERE d.worker_id = ?',
        parseInt(id as string)
      ) as any;

      const paySum = await db.getFirstAsync(
        'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE worker_id = ?',
        parseInt(id as string)
      ) as any;

      setWorker({
        ...workerData,
        total_distributions: distCount?.count || 0,
        total_production: prodCount?.count || 0,
        total_payments: paySum?.total || 0,
      });
    } catch (error) {
      console.error('Error loading worker details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات العامل');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!worker) return;
    
    const newStatus = worker.status === 'active' ? 'inactive' : 'active';
    const statusText = newStatus === 'active' ? 'تنشيط' : 'تعطيل';
    
    Alert.alert(
      'تأكيد',
      `هل أنت متأكد من ${statusText} العامل ${worker.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: statusText,
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('UPDATE workers SET status = ? WHERE id = ?', newStatus, worker.id);
              Alert.alert('نجاح', `تم ${statusText} العامل بنجاح`);
              loadWorkerDetails();
            } catch (error) {
              console.error('Error toggling worker status:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة العامل');
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف العامل ${worker?.name}؟\n\nملاحظة: سيتم حذف جميع البيانات المرتبطة به.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM workers WHERE id = ?', parseInt(id as string));
              Alert.alert('نجاح', 'تم حذف العامل بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting worker:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف العامل');
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

  if (!worker) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>لم يتم العثور على العامل</Text>
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
        <Text style={styles.headerTitle}>تفاصيل العامل</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color={theme.colors.primary} />
          </View>
          <Text style={styles.workerName}>{worker.name}</Text>
          <View style={[styles.statusBadge, worker.status === 'active' ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{worker.status === 'active' ? 'نشط' : 'غير نشط'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{worker.phone || 'غير محدد'}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="call" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>رقم الهاتف</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{worker.address || 'غير محدد'}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="location" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>العنوان</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {format(new Date(worker.registration_date), 'yyyy-MM-dd')}
            </Text>
            <View style={styles.infoLabel}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>تاريخ التسجيل</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>الإحصائيات</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="share-social" size={32} color={theme.colors.primary} />
              <Text style={styles.statValue}>{worker.total_distributions}</Text>
              <Text style={styles.statLabel}>التوزيعات</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="construct" size={32} color={theme.colors.success} />
              <Text style={styles.statValue}>{worker.total_production}</Text>
              <Text style={styles.statLabel}>الإنتاج</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="cash" size={32} color={theme.colors.error} />
              <Text style={styles.statValue}>{worker.total_payments.toFixed(2)}</Text>
              <Text style={styles.statLabel}>المدفوعات (ريال)</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="create" size={20} color={theme.colors.surface} />
            <Text style={styles.editButtonText}>تعديل البيانات</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={theme.colors.surface} />
            <Text style={styles.deleteButtonText}>حذف العامل</Text>
          </TouchableOpacity>
        </View>
      </View>

      {worker && (
        <EditWorkerModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onSuccess={loadWorkerDetails}
          workerId={worker.id}
          currentData={{
            name: worker.name,
            phone: worker.phone,
            address: worker.address,
            registration_date: worker.registration_date,
          }}
        />
      )}
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
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  workerName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusActive: {
    backgroundColor: `${theme.colors.success}20`,
  },
  statusInactive: {
    backgroundColor: `${theme.colors.textSecondary}20`,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
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
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionsCard: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  editButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
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
