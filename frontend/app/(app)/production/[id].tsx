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
import EditProductionModal from '@/components/EditProductionModal';
import { format } from 'date-fns';

interface ProductionDetails {
  id: number;
  distribution_id: number;
  distribution_number: string;
  worker_name: string;
  quantity: number;
  production_date: string;
  quality: string;
  warehouse_id: number;
  warehouse_name?: string;
  notes: string;
  batch_number: string;
}

export default function ProductionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [production, setProduction] = useState<ProductionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    loadProductionDetails();
  }, [id]);

  const loadProductionDetails = async () => {
    try {
      const db = await getDatabase();
      
      const prodData = await db.getFirstAsync(`
        SELECT p.*, d.distribution_number, w.name as worker_name, 
               wh.name as warehouse_name, b.batch_number
        FROM production p
        LEFT JOIN distributions d ON p.distribution_id = d.id
        LEFT JOIN workers w ON d.worker_id = w.id
        LEFT JOIN warehouses wh ON p.warehouse_id = wh.id
        LEFT JOIN batches b ON d.batch_id = b.id
        WHERE p.id = ?
      `, parseInt(id as string)) as any;

      setProduction(prodData);
    } catch (error) {
      console.error('Error loading production details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات الإنتاج');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف هذا الإنتاج؟\n\nملاحظة: سيتم تغيير حالة التوزيع إلى معلق.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM production WHERE id = ?', parseInt(id as string));
              
              // تحديث حالة التوزيع
              if (production?.distribution_id) {
                await db.runAsync(
                  'UPDATE distributions SET status = "pending" WHERE id = ?',
                  production.distribution_id
                );
              }
              
              Alert.alert('نجاح', 'تم حذف الإنتاج بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting production:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف الإنتاج');
            }
          },
        },
      ]
    );
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'ممتاز': return theme.colors.success;
      case 'جيد': return theme.colors.primary;
      case 'مقبول': return theme.colors.warning;
      case 'مرفوض': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'ممتاز': return 'star';
      case 'جيد': return 'thumbs-up';
      case 'مقبول': return 'checkmark-circle';
      case 'مرفوض': return 'close-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!production) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>لم يتم العثور على الإنتاج</Text>
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
        <Text style={styles.headerTitle}>تفاصيل الإنتاج</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.qualityHeader}>
            <View style={[styles.qualityBadge, { backgroundColor: `${getQualityColor(production.quality)}20` }]}>
              <Ionicons name={getQualityIcon(production.quality) as any} size={24} color={getQualityColor(production.quality)} />
              <Text style={[styles.qualityText, { color: getQualityColor(production.quality) }]}>
                {production.quality}
              </Text>
            </View>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityValue}>{production.quantity}</Text>
              <Text style={styles.quantityLabel}>الكمية المنتجة</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>معلومات الإنتاج</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{production.worker_name}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="person" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>العامل</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{production.distribution_number}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="share-social" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>رقم التوزيع</Text>
            </View>
          </View>

          {production.batch_number && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{production.batch_number}</Text>
              <View style={styles.infoLabel}>
                <Ionicons name="cube" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>رقم الدفعة</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {format(new Date(production.production_date), 'yyyy-MM-dd')}
            </Text>
            <View style={styles.infoLabel}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>تاريخ الإنتاج</Text>
            </View>
          </View>

          {production.warehouse_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{production.warehouse_name}</Text>
              <View style={styles.infoLabel}>
                <Ionicons name="business" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>المخزن</Text>
              </View>
            </View>
          )}
        </View>

        {production.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <Text style={styles.notesText}>{production.notes}</Text>
          </View>
        )}

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="create" size={20} color={theme.colors.surface} />
            <Text style={styles.editButtonText}>تعديل الإنتاج</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={theme.colors.surface} />
            <Text style={styles.deleteButtonText}>حذف الإنتاج</Text>
          </TouchableOpacity>
        </View>
      </View>

      {production && (
        <EditProductionModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onSuccess={loadProductionDetails}
          productionId={production.id}
          currentData={{
            distribution_id: production.distribution_id,
            quantity: production.quantity,
            production_date: production.production_date,
            quality: production.quality,
            warehouse_id: production.warehouse_id,
            notes: production.notes || '',
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
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  qualityText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  quantityContainer: {
    alignItems: 'flex-end',
  },
  quantityValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  quantityLabel: {
    fontSize: theme.fontSize.sm,
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
