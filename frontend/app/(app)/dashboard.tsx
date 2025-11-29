import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { getDatabase } from '../../database/schema';
import { useRouter } from 'expo-router';

interface DashboardStats {
  totalBatches: number;
  totalWorkers: number;
  activeDistributions: number;
  totalProduction: number;
  totalPayments: number;
  totalWarehouses: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalBatches: 0,
    totalWorkers: 0,
    activeDistributions: 0,
    totalProduction: 0,
    totalPayments: 0,
    totalWarehouses: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const db = await getDatabase();

      const batchesResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM batches') as any;
      const workersResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM workers WHERE status = "active"') as any;
      const distributionsResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM distributions WHERE status = "pending"') as any;
      const productionResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM production') as any;
      const paymentsResult = await db.getFirstAsync('SELECT COALESCE(SUM(amount), 0) as total FROM payments') as any;
      const warehousesResult = await db.getFirstAsync('SELECT COUNT(*) as count FROM warehouses WHERE status = 1') as any;

      setStats({
        totalBatches: batchesResult?.count || 0,
        totalWorkers: workersResult?.count || 0,
        activeDistributions: distributionsResult?.count || 0,
        totalProduction: productionResult?.count || 0,
        totalPayments: paymentsResult?.total || 0,
        totalWarehouses: warehousesResult?.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const StatCard = ({ icon, title, value, color, onPress }: any) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ icon, title, color, onPress }: any) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مرحباً بك</Text>
        <Text style={styles.headerSubtitle}>إليك نظرة عامة على نظام الإدارة</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="cube"
          title="إجمالي الدفعات"
          value={stats.totalBatches}
          color={theme.colors.primary}
          onPress={() => router.push('/(app)/batches')}
        />
        <StatCard
          icon="people"
          title="عمال نشطين"
          value={stats.totalWorkers}
          color={theme.colors.success}
          onPress={() => router.push('/(app)/workers')}
        />
        <StatCard
          icon="share-social"
          title="توزيعات معلقة"
          value={stats.activeDistributions}
          color={theme.colors.warning}
          onPress={() => router.push('/(app)/distributions')}
        />
        <StatCard
          icon="construct"
          title="إجمالي الإنتاج"
          value={stats.totalProduction}
          color={theme.colors.secondary}
          onPress={() => router.push('/(app)/production')}
        />
        <StatCard
          icon="cash"
          title="إجمالي المدفوعات"
          value={`${stats.totalPayments.toFixed(2)} دينار`}
          color={theme.colors.error}
          onPress={() => router.push('/(app)/payments')}
        />
        <StatCard
          icon="business"
          title="مخازن نشطة"
          value={stats.totalWarehouses}
          color={theme.colors.accent}
          onPress={() => router.push('/(app)/warehouses')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            icon="add-circle"
            title="دفعة جديدة"
            color={theme.colors.primary}
            onPress={() => router.push('/(app)/batches')}
          />
          <QuickAction
            icon="person-add"
            title="عامل جديد"
            color={theme.colors.success}
            onPress={() => router.push('/(app)/workers')}
          />
          <QuickAction
            icon="share"
            title="توزيع جديد"
            color={theme.colors.warning}
            onPress={() => router.push('/(app)/distributions')}
          />
          <QuickAction
            icon="bar-chart"
            title="التقارير"
            color={theme.colors.secondary}
            onPress={() => router.push('/(app)/reports')}
          />
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
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.surface,
    opacity: 0.9,
    textAlign: 'right',
  },
  statsContainer: {
    padding: theme.spacing.md,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'right',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickActionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    textAlign: 'center',
  },
});
