import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import { format } from 'date-fns';
import AddInventoryModal from '@/components/AddInventoryModal';

interface InventoryMovement {
  id: number;
  movement_type: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  batch_id: number;
  quantity: number;
  responsible: string;
  notes: string;
  movement_date: string;
}

export default function InventoryScreen() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadMovements = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync('SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 50') as InventoryMovement[];
      setMovements(result);
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMovements();
    setRefreshing(false);
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case 'تحويل':
        return { icon: 'swap-horizontal', color: theme.colors.primary, label: 'تحويل بين مخازن' };
      case 'إدخال':
        return { icon: 'arrow-down-circle', color: theme.colors.success, label: 'إدخال' };
      case 'إخراج':
        return { icon: 'arrow-up-circle', color: theme.colors.warning, label: 'إخراج' };
      case 'تعديل':
        return { icon: 'create', color: theme.colors.secondary, label: 'تعديل' };
      default:
        return { icon: 'help-circle', color: theme.colors.textSecondary, label: type };
    }
  };

  const renderMovementItem = ({ item }: { item: InventoryMovement }) => {
    const typeInfo = getMovementTypeInfo(item.movement_type);

    return (
      <View style={styles.movementCard}>
        <View style={styles.movementHeader}>
          <View style={[styles.typeIcon, { backgroundColor: `${typeInfo.color}20` }]}>
            <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          </View>
          <View style={styles.movementInfo}>
            <Text style={styles.movementType}>{typeInfo.label}</Text>
            <Text style={styles.movementDate}>
              {format(new Date(item.movement_date), 'yyyy-MM-dd HH:mm')}
            </Text>
          </View>
        </View>

        <View style={styles.movementDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{item.quantity}</Text>
            <Text style={styles.detailLabel}>الكمية:</Text>
          </View>
          {item.responsible && (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{item.responsible}</Text>
              <Text style={styles.detailLabel}>المسؤول:</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Ionicons name="document-text" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>حركة المخزون</Text>
      </View>

      <FlatList
        data={movements}
        renderItem={renderMovementItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا توجد حركات</Text>
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
  movementCard: {
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
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  movementInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  movementType: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  movementDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  movementDetails: {
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
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  notesText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
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
