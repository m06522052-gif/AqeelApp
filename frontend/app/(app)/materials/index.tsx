import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { getDatabase } from '@/database/schema';
import { useRouter } from 'expo-router';
import AddMaterialModal from '@/components/AddMaterialModal';

interface Material {
  id: number;
  material_number: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  warehouse_id: number;
  minimum_stock: number;
  status: string;
}

export default function MaterialsScreen() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadMaterials = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync('SELECT * FROM materials ORDER BY created_at DESC') as Material[];
      setMaterials(result);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaterials();
    setRefreshing(false);
  };

  const handleDelete = (material: Material) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف المادة ${material.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM materials WHERE id = ?', material.id);
              await loadMaterials();
              Alert.alert('نجاح', 'تم حذف المادة بنجاح');
            } catch (error) {
              console.error('Error deleting material:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المادة');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const isLowStock = (quantity: number, minStock: number) => {
    return minStock && quantity <= minStock;
  };

  const renderMaterialItem = ({ item }: { item: Material }) => (
    <TouchableOpacity 
      style={styles.materialCard}
      onPress={() => router.push(`/materials/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.materialHeader}>
        {isLowStock(item.quantity, item.minimum_stock) && (
          <View style={styles.alertBadge}>
            <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
            <Text style={styles.alertText}>مخزون منخفض</Text>
          </View>
        )}
        <View style={styles.materialInfo}>
          <Text style={styles.materialName}>{item.name}</Text>
          <Text style={styles.materialNumber}>{item.material_number}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      )}

      <View style={styles.materialDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.quantity} {item.unit}</Text>
          <Text style={styles.detailLabel}>الكمية:</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.unit_price.toFixed(2)} ريال</Text>
          <Text style={styles.detailLabel}>سعر الوحدة:</Text>
        </View>
      </View>

      <View style={styles.materialFooter}>
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: `${theme.colors.error}20` }]}
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item);
          }}
        >
          <Ionicons name="trash" size={16} color={theme.colors.error} />
        </TouchableOpacity>
        {item.supplier && (
          <View style={styles.supplierContainer}>
            <Text style={styles.supplierText}>{item.supplier}</Text>
            <Ionicons name="person" size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المواد الخام</Text>
      </View>

      <FlatList
        data={materials}
        renderItem={renderMaterialItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="layers-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا توجد مواد</Text>
            <Text style={styles.emptySubtext}>اضغط على زر + لإضافة مادة جديدة</Text>
          </View>
        }
      />

      <AddMaterialModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={loadMaterials}
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
  materialCard: {
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
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  materialInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  materialName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  materialNumber: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.error}20`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  alertText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.bold,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'right',
  },
  materialDetails: {
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
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  materialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supplierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supplierText: {
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
