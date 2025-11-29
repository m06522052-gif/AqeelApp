import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import { format } from 'date-fns';
import AddBatchModal from '@/components/AddBatchModal';

interface Batch {
  id: number;
  batch_number: string;
  supplier: string;
  receive_date: string;
  bag_type: string;
  quantity: number;
  price: number;
  warehouse_id: number;
  status: string;
}

export default function BatchesScreen() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadBatches = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync('SELECT * FROM batches ORDER BY created_at DESC') as Batch[];
      setBatches(result);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const getBagTypeColor = (type: string) => {
    return type === '4' ? theme.colors.primary : theme.colors.success;
  };

  const renderBatchItem = ({ item }: { item: Batch }) => (
    <View style={styles.batchCard}>
      <View style={styles.batchHeader}>
        <View style={[styles.bagTypeBadge, { backgroundColor: `${getBagTypeColor(item.bag_type)}20` }]}>
          <Text style={[styles.bagTypeText, { color: getBagTypeColor(item.bag_type) }]}>
            نوع {item.bag_type}
          </Text>
        </View>
        <View style={styles.batchInfo}>
          <Text style={styles.batchNumber}>{item.batch_number}</Text>
          <Text style={styles.supplier}>المورد: {item.supplier}</Text>
        </View>
      </View>

      <View style={styles.batchDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.quantity}</Text>
          <Text style={styles.detailLabel}>الكمية:</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.price.toFixed(2)} دينار</Text>
          <Text style={styles.detailLabel}>السعر:</Text>
        </View>
      </View>

      <View style={styles.batchFooter}>
        <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{item.status === 'active' ? 'نشط' : 'غير نشط'}</Text>
        </View>
        <Text style={styles.date}>{format(new Date(item.receive_date), 'yyyy-MM-dd')}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الدفعات</Text>
      </View>

      <FlatList
        data={batches}
        renderItem={renderBatchItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا توجد دفعات</Text>
            <Text style={styles.emptySubtext}>اضغط على زر + لإضافة دفعة جديدة</Text>
          </View>
        }
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
  batchCard: {
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
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  batchInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  batchNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  supplier: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  bagTypeBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  bagTypeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  batchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  batchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusActive: {
    backgroundColor: `${theme.colors.success}20`,
  },
  statusInactive: {
    backgroundColor: `${theme.colors.textSecondary}20`,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
  date: {
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
