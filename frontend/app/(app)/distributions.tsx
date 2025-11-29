import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import { format } from 'date-fns';
import AddDistributionModal from '@/components/AddDistributionModal';

interface Distribution {
  id: number;
  distribution_number: string;
  worker_id: number;
  batch_id: number;
  quantity: number;
  distribution_date: string;
  expected_completion_date: string;
  status: string;
  worker_name?: string;
  batch_number?: string;
}

export default function DistributionsScreen() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadDistributions = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync(`
        SELECT d.*, w.name as worker_name, b.batch_number
        FROM distributions d
        LEFT JOIN workers w ON d.worker_id = w.id
        LEFT JOIN batches b ON d.batch_id = b.id
        ORDER BY d.created_at DESC
      `) as Distribution[];
      setDistributions(result);
    } catch (error) {
      console.error('Error loading distributions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDistributions();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDistributions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'معلق';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغى';
      default:
        return status;
    }
  };

  const renderDistributionItem = ({ item }: { item: Distribution }) => (
    <View style={styles.distributionCard}>
      <View style={styles.distributionHeader}>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        <View style={styles.distributionInfo}>
          <Text style={styles.distributionNumber}>{item.distribution_number}</Text>
          <Text style={styles.workerName}>العامل: {item.worker_name || 'غير محدد'}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.batch_number || '-'}</Text>
          <Text style={styles.detailLabel}>رقم الدفعة:</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.quantity}</Text>
          <Text style={styles.detailLabel}>الكمية:</Text>
        </View>
      </View>

      <View style={styles.distributionFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.dateText}>
            {format(new Date(item.distribution_date), 'yyyy-MM-dd')}
          </Text>
        </View>
        {item.expected_completion_date && (
          <View style={styles.dateContainer}>
            <Ionicons name="time" size={14} color={theme.colors.warning} />
            <Text style={styles.dateText}>
              المتوقع: {format(new Date(item.expected_completion_date), 'yyyy-MM-dd')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة التوزيع</Text>
      </View>

      <FlatList
        data={distributions}
        renderItem={renderDistributionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="share-social-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا توجد توزيعات</Text>
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
  distributionCard: {
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
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  distributionInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  distributionNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  workerName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  detailsContainer: {
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
  distributionFooter: {
    gap: theme.spacing.sm,
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
  },
});
