import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import { format } from 'date-fns';
import AddProductionModal from '@/components/AddProductionModal';

interface Production {
  id: number;
  distribution_id: number;
  quantity: number;
  production_date: string;
  quality: string;
  warehouse_id: number;
  notes: string;
  distribution_number?: string;
  worker_name?: string;
}

export default function ProductionScreen() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadProductions = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync(`
        SELECT p.*, d.distribution_number, w.name as worker_name
        FROM production p
        LEFT JOIN distributions d ON p.distribution_id = d.id
        LEFT JOIN workers w ON d.worker_id = w.id
        ORDER BY p.created_at DESC
      `) as Production[];
      setProductions(result);
    } catch (error) {
      console.error('Error loading productions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProductions();
    setRefreshing(false);
  };

  const handleDelete = (production: Production) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف هذا الإنتاج؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM production WHERE id = ?', production.id);
              await loadProductions();
              Alert.alert('نجاح', 'تم حذف الإنتاج بنجاح');
            } catch (error) {
              console.error('Error deleting production:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف الإنتاج');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadProductions();
  }, []);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'ممتاز':
        return theme.colors.success;
      case 'جيد':
        return theme.colors.primary;
      case 'مقبول':
        return theme.colors.warning;
      case 'مرفوض':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'ممتاز':
        return 'star';
      case 'جيد':
        return 'thumbs-up';
      case 'مقبول':
        return 'checkmark-circle';
      case 'مرفوض':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderProductionItem = ({ item }: { item: Production }) => (
    <View style={styles.productionCard}>
      <View style={styles.productionHeader}>
        <View style={[styles.qualityBadge, { backgroundColor: `${getQualityColor(item.quality)}20` }]}>
          <Ionicons name={getQualityIcon(item.quality) as any} size={16} color={getQualityColor(item.quality)} />
          <Text style={[styles.qualityText, { color: getQualityColor(item.quality) }]}>
            {item.quality}
          </Text>
        </View>
        <View style={styles.productionInfo}>
          <Text style={styles.workerName}>{item.worker_name || 'غير محدد'}</Text>
          <Text style={styles.distributionNumber}>توزيع: {item.distribution_number || '-'}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.quantityCard}>
          <Ionicons name="cube" size={24} color={theme.colors.primary} />
          <Text style={styles.quantityValue}>{item.quantity}</Text>
          <Text style={styles.quantityLabel}>الكمية المنتجة</Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Ionicons name="document-text" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.productionFooter}>
        <TouchableOpacity 
          style={[styles.deleteButton, { backgroundColor: `${theme.colors.error}20` }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color={theme.colors.error} />
        </TouchableOpacity>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.dateText}>
            {format(new Date(item.production_date), 'yyyy-MM-dd')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الإنتاج</Text>
      </View>

      <FlatList
        data={productions}
        renderItem={renderProductionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا يوجد إنتاج</Text>
            <Text style={styles.emptySubtext}>اضغط على زر + لإضافة إنتاج جديد</Text>
          </View>
        }
      />

      <AddProductionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={loadProductions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  productionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  productionInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  workerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  distributionNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
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
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  detailsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  quantityCard: {
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginVertical: theme.spacing.xs,
  },
  quantityLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  notesText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    textAlign: 'right',
  },
  productionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
