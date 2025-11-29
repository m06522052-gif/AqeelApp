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
import { getDatabase } from '@/database/schema';
import EditMaterialModal from '@/components/EditMaterialModal';

interface MaterialDetails {
  id: number;
  material_number: string;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  warehouse_id: number;
  warehouse_name?: string;
  minimum_stock: number;
  status: string;
}

export default function MaterialDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [material, setMaterial] = useState<MaterialDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    loadMaterialDetails();
  }, [id]);

  const loadMaterialDetails = async () => {
    try {
      const db = await getDatabase();
      
      const materialData = await db.getFirstAsync(`
        SELECT m.*, w.name as warehouse_name
        FROM materials m
        LEFT JOIN warehouses w ON m.warehouse_id = w.id
        WHERE m.id = ?
      `, parseInt(id as string)) as any;

      setMaterial(materialData);
    } catch (error) {
      console.error('Error loading material details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات المادة');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المادة ${material?.name}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM materials WHERE id = ?', parseInt(id as string));
              Alert.alert('نجاح', 'تم حذف المادة بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting material:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المادة');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!material) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>لم يتم العثور على المادة</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLowStock = material.minimum_stock && material.quantity <= material.minimum_stock;
  const totalValue = material.quantity * material.unit_price;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المادة</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.materialHeader}>
            {isLowStock && (
              <View style={styles.alertBadge}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={styles.alertText}>مخزون منخفض</Text>
              </View>
            )}
            <View style={styles.materialInfo}>
              <Text style={styles.materialName}>{material.name}</Text>
              <Text style={styles.materialNumber}>{material.material_number}</Text>
            </View>
          </View>
          {material.description && (
            <Text style={styles.description}>{material.description}</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>معلومات المادة</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{material.quantity} {material.unit}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="layers" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>الكمية المتوفرة</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{material.unit_price.toFixed(2)} ريال</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="pricetag" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>سعر الوحدة</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{material.unit}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="scale" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>الوحدة</Text>
            </View>
          </View>

          {material.supplier && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{material.supplier}</Text>
              <View style={styles.infoLabel}>
                <Ionicons name="person" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>المورد</Text>
              </View>
            </View>
          )}

          {material.warehouse_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{material.warehouse_name}</Text>
              <View style={styles.infoLabel}>
                <Ionicons name="business" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>المخزن</Text>
              </View>
            </View>
          )}

          {material.minimum_stock && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoValue, { color: isLowStock ? theme.colors.error : theme.colors.text }]}>
                {material.minimum_stock} {material.unit}
              </Text>
              <View style={styles.infoLabel}>
                <Ionicons name="warning" size={18} color={theme.colors.primary} />
                <Text style={styles.infoLabelText}>الحد الأدنى</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>القيمة الإجمالية</Text>
          <View style={styles.totalValueContainer}>
            <Text style={styles.totalValue}>{totalValue.toFixed(2)}</Text>
            <Text style={styles.totalCurrency}>ريال يمني</Text>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={theme.colors.surface} />
            <Text style={styles.deleteButtonText}>حذف المادة</Text>
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
    fontSize: theme.fontSize.xxl,
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  alertText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.bold,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    textAlign: 'right',
    lineHeight: 22,
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
  totalValueContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  totalCurrency: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  actionsCard: {
    marginBottom: theme.spacing.xl,
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
