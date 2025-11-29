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
import { useRouter } from 'expo-router';

interface WarehouseStats {
  id: number;
  name: string;
  type: string;
  batches_count: number;
  materials_count: number;
  total_value: number;
}

export default function WarehouseDashboardScreen() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<WarehouseStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalWarehouses: 0,
    totalBatches: 0,
    totalMaterials: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadWarehouseStats();
  }, []);

  const loadWarehouseStats = async () => {
    try {
      const db = await getDatabase();
      
      // جلب إحصائيات المخازن
      const warehousesData = await db.getAllAsync(`
        SELECT 
          w.id,
          w.name,
          w.type,
          COUNT(DISTINCT b.id) as batches_count,
          COUNT(DISTINCT m.id) as materials_count,
          COALESCE(SUM(b.price), 0) + COALESCE(SUM(m.unit_price * m.quantity), 0) as total_value
        FROM warehouses w
        LEFT JOIN batches b ON w.id = b.warehouse_id
        LEFT JOIN materials m ON w.id = m.warehouse_id
        WHERE w.status = 1
        GROUP BY w.id, w.name, w.type
      `) as any[];

      setWarehouses(warehousesData);

      // حساب الإجماليات
      const totals = warehousesData.reduce((acc, wh) => ({
        totalWarehouses: acc.totalWarehouses + 1,
        totalBatches: acc.totalBatches + (wh.batches_count || 0),
        totalMaterials: acc.totalMaterials + (wh.materials_count || 0),
        totalValue: acc.totalValue + (wh.total_value || 0),
      }), {
        totalWarehouses: 0,
        totalBatches: 0,
        totalMaterials: 0,
        totalValue: 0,
      });

      setTotalStats(totals);
    } catch (error) {
      console.error('Error loading warehouse stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWarehouseStats();
    setRefreshing(false);
  };

  const getWarehouseTypeLabel = (type: string) => {
    switch (type) {
      case 'main': return 'رئيسي';
      case 'secondary': return 'فرعي';
      case 'temporary': return 'مؤقت';
      default: return type;
    }
  };

  const getWarehouseTypeColor = (type: string) => {
    switch (type) {
      case 'main': return theme.colors.primary;
      case 'secondary': return theme.colors.secondary;
      case 'temporary': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة تحكم المخازن</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* الإحصائيات الإجمالية */}
        <View style={styles.totalStatsCard}>
          <Text style={styles.sectionTitle}>نظرة عامة</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="business" size={32} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{totalStats.totalWarehouses}</Text>
              <Text style={styles.statLabel}>مخزن</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cube" size={32} color={theme.colors.secondary} />
              <Text style={[styles.statValue, { color: theme.colors.secondary }]}>{totalStats.totalBatches}</Text>
              <Text style={styles.statLabel}>دفعة</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="layers" size={32} color={theme.colors.success} />
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{totalStats.totalMaterials}</Text>
              <Text style={styles.statLabel}>مادة</Text>
            </View>
          </View>
          <View style={styles.totalValueContainer}>
            <Text style={styles.totalValueLabel}>القيمة الإجمالية</Text>
            <Text style={styles.totalValue}>{totalStats.totalValue.toFixed(2)} ريال</Text>
          </View>
        </View>

        {/* قائمة المخازن */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المخازن</Text>
          {warehouses.map((warehouse) => (
            <TouchableOpacity
              key={warehouse.id}
              style={styles.warehouseCard}
              onPress={() => router.push(`/warehouses/${warehouse.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.warehouseHeader}>
                <View style={[styles.typeBadge, { backgroundColor: `${getWarehouseTypeColor(warehouse.type)}20` }]}>
                  <Text style={[styles.typeText, { color: getWarehouseTypeColor(warehouse.type) }]}>
                    {getWarehouseTypeLabel(warehouse.type)}
                  </Text>
                </View>
                <Text style={styles.warehouseName}>{warehouse.name}</Text>
              </View>

              <View style={styles.warehouseStats}>
                <View style={styles.warehouseStatItem}>
                  <Ionicons name="cube-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.warehouseStatValue}>{warehouse.batches_count}</Text>
                  <Text style={styles.warehouseStatLabel}>دفعات</Text>
                </View>
                <View style={styles.warehouseStatItem}>
                  <Ionicons name="layers-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.warehouseStatValue}>{warehouse.materials_count}</Text>
                  <Text style={styles.warehouseStatLabel}>مواد</Text>
                </View>
                <View style={styles.warehouseStatItem}>
                  <Ionicons name="cash-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.warehouseStatValue}>{warehouse.total_value.toFixed(0)}</Text>
                  <Text style={styles.warehouseStatLabel}>ريال</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* روابط سريعة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/inventory')}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="swap-horizontal" size={24} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>حركة المخزون</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/materials')}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="layers" size={24} color={theme.colors.secondary} />
              <Text style={styles.actionButtonText}>المواد</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/batches')}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="cube" size={24} color={theme.colors.success} />
              <Text style={styles.actionButtonText}>الدفعات</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textSecondary} />
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
  totalStatsCard: {
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
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    marginVertical: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  totalValueContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    alignItems: 'center',
  },
  totalValueLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  totalValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success,
  },
  warehouseCard: {
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
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  warehouseName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  typeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  typeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  warehouseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  warehouseStatItem: {
    alignItems: 'center',
  },
  warehouseStatValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginVertical: theme.spacing.xs,
  },
  warehouseStatLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  actionButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
});
