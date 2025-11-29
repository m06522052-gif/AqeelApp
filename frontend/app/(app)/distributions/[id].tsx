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
import EditDistributionModal from '@/components/EditDistributionModal';

interface DistributionDetails {
  id: number;
  distribution_number: string;
  worker_id: number;
  worker_name: string;
  batch_id: number;
  batch_number: string;
  quantity: number;
  distribution_date: string;
  expected_completion_date: string;
  status: string;
  production_quantity: number;
  production_quality?: string;
}

export default function DistributionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [distribution, setDistribution] = useState<DistributionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    loadDistributionDetails();
  }, [id]);

  const loadDistributionDetails = async () => {
    try {
      const db = await getDatabase();
      
      const distData = await db.getFirstAsync(`
        SELECT d.*, w.name as worker_name, b.batch_number
        FROM distributions d
        LEFT JOIN workers w ON d.worker_id = w.id
        LEFT JOIN batches b ON d.batch_id = b.id
        WHERE d.id = ?
      `, parseInt(id as string)) as any;

      const prodData = await db.getFirstAsync(
        'SELECT SUM(quantity) as total, quality FROM production WHERE distribution_id = ? GROUP BY quality',
        parseInt(id as string)
      ) as any;

      setDistribution({
        ...distData,
        production_quantity: prodData?.total || 0,
        production_quality: prodData?.quality,
      });
    } catch (error) {
      console.error('Error loading distribution details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات التوزيع');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف التوزيع ${distribution?.distribution_number}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM distributions WHERE id = ?', parseInt(id as string));
              Alert.alert('نجاح', 'تم حذف التوزيع بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting distribution:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف التوزيع');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'completed': return theme.colors.success;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'معلق';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!distribution) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>لم يتم العثور على التوزيع</Text>
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
        <Text style={styles.headerTitle}>تفاصيل التوزيع</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.distHeader}>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(distribution.status)}20` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(distribution.status) }]}>
                {getStatusText(distribution.status)}
              </Text>
            </View>
            <Text style={styles.distNumber}>{distribution.distribution_number}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>معلومات التوزيع</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{distribution.worker_name}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="person" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>العامل</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{distribution.batch_number}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="cube" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>الدفعة</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{distribution.quantity}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="layers" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>الكمية</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {format(new Date(distribution.distribution_date), 'yyyy-MM-dd')}
            </Text>
            <View style={styles.infoLabel}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>تاريخ التوزيع</Text>
            </View>
          </View>

          {distribution.expected_completion_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>
                {format(new Date(distribution.expected_completion_date), 'yyyy-MM-dd')}
              </Text>
              <View style={styles.infoLabel}>
                <Ionicons name="time" size={18} color={theme.colors.warning} />
                <Text style={styles.infoLabelText}>التاريخ المتوقع</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>حالة الإنتاج</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {distribution.production_quantity}
              </Text>
              <Text style={styles.statLabel}>الكمية المنتجة</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                {distribution.quantity - distribution.production_quantity}
              </Text>
              <Text style={styles.statLabel}>المتبقية</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {distribution.quantity > 0 
                  ? ((distribution.production_quantity / distribution.quantity) * 100).toFixed(0)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>نسبة الإنجاز</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="create" size={20} color={theme.colors.surface} />
            <Text style={styles.editButtonText}>تعديل التوزيع</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={theme.colors.surface} />
            <Text style={styles.deleteButtonText}>حذف التوزيع</Text>
          </TouchableOpacity>
        </View>
      </View>

      {distribution && (
        <EditDistributionModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onSuccess={loadDistributionDetails}
          distributionId={distribution.id}
          currentData={{
            distribution_number: distribution.distribution_number,
            worker_id: distribution.worker_id,
            batch_id: distribution.batch_id,
            quantity: distribution.quantity,
            distribution_date: distribution.distribution_date,
            expected_completion_date: distribution.expected_completion_date,
            status: distribution.status,
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
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
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
