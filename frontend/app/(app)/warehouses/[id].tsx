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
import EditWarehouseModal from '@/components/EditWarehouseModal';
import { getDatabase } from '@/database/schema';

interface WarehouseDetails {
  id: number;
  name: string;
  location: string;
  type: string;
  responsible: string;
  status: number;
  total_batches: number;
  total_materials: number;
  total_movements: number;
}

export default function WarehouseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [warehouse, setWarehouse] = useState<WarehouseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    loadWarehouseDetails();
  }, [id]);

  const loadWarehouseDetails = async () => {
    try {
      const db = await getDatabase();
      
      const warehouseData = await db.getFirstAsync(
        'SELECT * FROM warehouses WHERE id = ?',
        parseInt(id as string)
      ) as any;

      const batchCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM batches WHERE warehouse_id = ?',
        parseInt(id as string)
      ) as any;

      const materialCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM materials WHERE warehouse_id = ?',
        parseInt(id as string)
      ) as any;

      const movementCount = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM inventory_movements WHERE from_warehouse_id = ? OR to_warehouse_id = ?',
        parseInt(id as string),
        parseInt(id as string)
      ) as any;

      setWarehouse({
        ...warehouseData,
        total_batches: batchCount?.count || 0,
        total_materials: materialCount?.count || 0,
        total_movements: movementCount?.count || 0,
      });
    } catch (error) {
      console.error('Error loading warehouse details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات المخزن');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المخزن ${warehouse?.name}؟\n\nملاحظة: لا يمكن حذف المخزن إذا كان يحتوي على دفعات أو مواد.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM warehouses WHERE id = ?', parseInt(id as string));
              Alert.alert('نجاح', 'تم حذف المخزن بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting warehouse:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المخزن. قد يحتوي على بيانات مرتبطة.');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async () => {
    const newStatus = warehouse?.status === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? 'تفعيل' : 'تعطيل';

    Alert.alert(
      'تأكيد',
      `هل تريد ${statusText} المخزن ${warehouse?.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('UPDATE warehouses SET status = ? WHERE id = ?', newStatus, parseInt(id as string));
              await loadWarehouseDetails();
              Alert.alert('نجاح', `تم ${statusText} المخزن بنجاح`);
            } catch (error) {
              console.error('Error updating warehouse status:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة المخزن');
            }
          },
        },
      ]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'رئيسي': return theme.colors.primary;
      case 'مواد خام': return theme.colors.warning;
      case 'مواد جاهزة': return theme.colors.success;
      case 'مؤقت': return theme.colors.textSecondary;
      default: return theme.colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!warehouse) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>لم يتم العثور على المخزن</Text>
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
        <Text style={styles.headerTitle}>تفاصيل المخزن</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.warehouseHeader}>
            <View style={[styles.statusDot, { backgroundColor: warehouse.status === 1 ? theme.colors.success : theme.colors.error }]} />
            <View style={styles.warehouseInfo}>
              <Text style={styles.warehouseName}>{warehouse.name}</Text>
              <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(warehouse.type)}20` }]}>
                <Text style={[styles.typeText, { color: getTypeColor(warehouse.type) }]}>{warehouse.type}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>معلومات المخزن</Text>
          
          {warehouse.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{warehouse.location}</Text>
              <View style={styles.infoLabel}>
                <Ionicons name="location" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>الموقع</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{warehouse.type}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="business" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>نوع المخزن</Text>
            </View>
          </View>

          {warehouse.responsible && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{warehouse.responsible}</Text>
              <View style={styles.infoLabel}>
                <Ionicons name="person" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>المسؤول</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={[styles.infoValue, { color: warehouse.status === 1 ? theme.colors.success : theme.colors.error }]}>
              {warehouse.status === 1 ? 'نشط' : 'غير نشط'}
            </Text>
            <View style={styles.infoLabel}>
              <Ionicons name="power" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>الحالة</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>الإحصائيات</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="cube" size={32} color={theme.colors.primary} />
              <Text style={styles.statValue}>{warehouse.total_batches}</Text>
              <Text style={styles.statLabel}>الدفعات</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="layers" size={32} color={theme.colors.success} />
              <Text style={styles.statValue}>{warehouse.total_materials}</Text>
              <Text style={styles.statLabel}>المواد</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="swap-horizontal" size={32} color={theme.colors.warning} />
              <Text style={styles.statValue}>{warehouse.total_movements}</Text>
              <Text style={styles.statLabel}>الحركات</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: warehouse.status === 1 ? theme.colors.warning : theme.colors.success }]}
            onPress={handleToggleStatus}
          >
            <Ionicons name={warehouse.status === 1 ? 'pause-circle' : 'play-circle'} size={20} color={theme.colors.surface} />
            <Text style={styles.actionButtonText}>
              {warehouse.status === 1 ? 'تعطيل المخزن' : 'تفعيل المخزن'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={theme.colors.surface} />
            <Text style={styles.deleteButtonText}>حذف المخزن</Text>
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
  warehouseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: theme.spacing.md,
  },
  warehouseInfo: {
    alignItems: 'flex-end',
  },
  warehouseName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  typeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
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
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  actionButtonText: {
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
