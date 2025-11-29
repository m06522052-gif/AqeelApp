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
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';

interface Statistics {
  totalWorkers: number;
  activeWorkers: number;
  totalBatches: number;
  totalDistributions: number;
  totalProduction: number;
  totalPayments: number;
  totalAmount: number;
  pendingDistributions: number;
}

export default function ReportsScreen() {
  const [stats, setStats] = useState<Statistics>({
    totalWorkers: 0,
    activeWorkers: 0,
    totalBatches: 0,
    totalDistributions: 0,
    totalProduction: 0,
    totalPayments: 0,
    totalAmount: 0,
    pendingDistributions: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const db = await getDatabase();

      // عدد العمال
      const workersCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM workers') as any;
      const activeWorkersCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM workers WHERE status = "active"') as any;

      // عدد الدفعات
      const batchesCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM batches') as any;

      // عدد التوزيعات
      const distributionsCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM distributions') as any;
      const pendingDistCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM distributions WHERE status = "pending"') as any;

      // عدد الإنتاج
      const productionCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM production') as any;

      // المدفوعات
      const paymentsData = await db.getFirstAsync('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments') as any;

      setStats({
        totalWorkers: workersCount.count || 0,
        activeWorkers: activeWorkersCount.count || 0,
        totalBatches: batchesCount.count || 0,
        totalDistributions: distributionsCount.count || 0,
        totalProduction: productionCount.count || 0,
        totalPayments: paymentsData.count || 0,
        totalAmount: paymentsData.total || 0,
        pendingDistributions: pendingDistCount.count || 0,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التقارير والإحصائيات</Text>
      </View>

      <View style={styles.content}>
        {/* قسم العمال */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>العمال</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons name="people-outline" size={32} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.totalWorkers}</Text>
              <Text style={styles.statLabel}>إجمالي العمال</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: `${theme.colors.success}15` }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color={theme.colors.success} />
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.activeWorkers}</Text>
              <Text style={styles.statLabel}>عمال نشطون</Text>
            </View>
          </View>
        </View>

        {/* قسم المخزون */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={24} color={theme.colors.secondary} />
            <Text style={styles.sectionTitle}>المخزون</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: `${theme.colors.secondary}15` }]}>
              <Ionicons name="cube-outline" size={32} color={theme.colors.secondary} />
              <Text style={[styles.statValue, { color: theme.colors.secondary }]}>{stats.totalBatches}</Text>
              <Text style={styles.statLabel}>إجمالي الدفعات</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: `${theme.colors.warning}15` }]}>
              <Ionicons name="share-social-outline" size={32} color={theme.colors.warning} />
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.totalDistributions}</Text>
              <Text style={styles.statLabel}>التوزيعات</Text>
            </View>
          </View>
        </View>

        {/* قسم الإنتاج */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={24} color={theme.colors.info} />
            <Text style={styles.sectionTitle}>الإنتاج</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: `${theme.colors.info}15` }]}>
              <Ionicons name="construct-outline" size={32} color={theme.colors.info} />
              <Text style={[styles.statValue, { color: theme.colors.info }]}>{stats.totalProduction}</Text>
              <Text style={styles.statLabel}>إجمالي الإنتاج</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: `${theme.colors.error}15` }]}>
              <Ionicons name="time-outline" size={32} color={theme.colors.error} />
              <Text style={[styles.statValue, { color: theme.colors.error }]}>{stats.pendingDistributions}</Text>
              <Text style={styles.statLabel}>توزيعات معلقة</Text>
            </View>
          </View>
        </View>

        {/* قسم المدفوعات */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={24} color={theme.colors.success} />
            <Text style={styles.sectionTitle}>المدفوعات</Text>
          </View>
          <View style={styles.bigStatCard}>
            <Ionicons name="wallet-outline" size={48} color={theme.colors.success} />
            <Text style={[styles.bigStatValue, { color: theme.colors.success }]}>
              {stats.totalAmount.toFixed(2)}
            </Text>
            <Text style={styles.bigStatLabel}>إجمالي المدفوعات (ريال يمني)</Text>
            <View style={styles.divider} />
            <Text style={styles.paymentsCount}>
              عدد المدفوعات: {stats.totalPayments}
            </Text>
          </View>
        </View>

        {/* أزرار التقارير التفصيلية */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>تقارير تفصيلية</Text>
          </View>
          
          <TouchableOpacity style={styles.reportButton}>
            <View style={styles.reportButtonContent}>
              <View style={styles.reportButtonLeft}>
                <Ionicons name="bar-chart" size={24} color={theme.colors.primary} />
                <View>
                  <Text style={styles.reportButtonTitle}>تقرير إنتاجية العمال</Text>
                  <Text style={styles.reportButtonSubtitle}>إحصائيات أداء العمال</Text>
                </View>
              </View>
              <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportButton}>
            <View style={styles.reportButtonContent}>
              <View style={styles.reportButtonLeft}>
                <Ionicons name="analytics" size={24} color={theme.colors.secondary} />
                <View>
                  <Text style={styles.reportButtonTitle}>تقرير المخزون</Text>
                  <Text style={styles.reportButtonSubtitle}>حالة المخزون والدفعات</Text>
                </View>
              </View>
              <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportButton}>
            <View style={styles.reportButtonContent}>
              <View style={styles.reportButtonLeft}>
                <Ionicons name="cash" size={24} color={theme.colors.success} />
                <View>
                  <Text style={styles.reportButtonTitle}>التقرير المالي</Text>
                  <Text style={styles.reportButtonSubtitle}>المدفوعات والحسابات</Text>
                </View>
              </View>
              <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
            </View>
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
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
    textAlign: 'center',
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    marginVertical: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  bigStatCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bigStatValue: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    marginVertical: theme.spacing.md,
  },
  bigStatLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  paymentsCount: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  reportButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reportButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  reportButtonTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  reportButtonSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
