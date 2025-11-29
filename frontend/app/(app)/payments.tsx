import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import { format } from 'date-fns';

interface Payment {
  id: number;
  worker_id: number;
  distribution_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
  worker_name?: string;
}

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const loadPayments = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync(`
        SELECT p.*, w.name as worker_name
        FROM payments p
        LEFT JOIN workers w ON p.worker_id = w.id
        ORDER BY p.created_at DESC
      `) as Payment[];
      setPayments(result);

      const total = result.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={[
          styles.methodBadge,
          { backgroundColor: item.payment_method === 'نقدي' ? `${theme.colors.success}20` : `${theme.colors.primary}20` }
        ]}>
          <Ionicons
            name={item.payment_method === 'نقدي' ? 'cash' : 'card'}
            size={16}
            color={item.payment_method === 'نقدي' ? theme.colors.success : theme.colors.primary}
          />
          <Text style={[
            styles.methodText,
            { color: item.payment_method === 'نقدي' ? theme.colors.success : theme.colors.primary }
          ]}>
            {item.payment_method}
          </Text>
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.workerName}>{item.worker_name || 'غير محدد'}</Text>
          <Text style={styles.paymentDate}>{format(new Date(item.payment_date), 'yyyy-MM-dd')}</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <View style={styles.amountCard}>
          <Text style={styles.amountValue}>{item.amount.toFixed(2)}</Text>
          <Text style={styles.amountLabel}>ريال</Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Ionicons name="document-text" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المدفوعات</Text>
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalContent}>
          <View>
            <Text style={styles.totalLabel}>إجمالي المدفوعات</Text>
            <Text style={styles.totalValue}>{totalAmount.toFixed(2)} ريال</Text>
          </View>
          <View style={styles.totalIcon}>
            <Ionicons name="wallet" size={32} color={theme.colors.primary} />
          </View>
        </View>
      </View>

      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا توجد مدفوعات</Text>
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
  totalCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'right',
  },
  totalValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  totalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  paymentInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  workerName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  paymentDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  methodText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  amountCard: {
    alignItems: 'center',
  },
  amountValue: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,
  },
  amountLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
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
