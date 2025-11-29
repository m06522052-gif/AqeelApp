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
import { format } from 'date-fns';
import EditUserModal from '@/components/EditUserModal';

interface UserDetails {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  is_active: number;
  created_at: string;
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserDetails();
  }, [id]);

  const loadUserDetails = async () => {
    try {
      const db = await getDatabase();
      const userData = await db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        parseInt(id as string)
      ) as any;
      setUser(userData);
    } catch (error) {
      console.error('Error loading user details:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف المستخدم ${user?.username}؟\n\nتحذير: لا يمكن التراجع عن هذه العملية!`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('DELETE FROM users WHERE id = ?', parseInt(id as string));
              Alert.alert('نجاح', 'تم حذف المستخدم بنجاح');
              router.back();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المستخدم');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return theme.colors.primary;
      case 'employee': return theme.colors.success;
      case 'admin': return theme.colors.error; // للمستخدم الافتراضي القديم
      default: return theme.colors.textSecondary;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'manager': return 'مدير';
      case 'employee': return 'موظف';
      case 'admin': return 'مدير'; // للمستخدم الافتراضي القديم
      default: return role;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>لم يتم العثور على المستخدم</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-forward" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المستخدم</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color={theme.colors.primary} />
          </View>
          <Text style={styles.userName}>{user.username}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(user.role)}20` }]}>
            <Ionicons name="shield-checkmark" size={16} color={getRoleColor(user.role)} />
            <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
              {getRoleText(user.role)}
            </Text>
          </View>
          <View style={[styles.statusBadge, user.is_active === 1 ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{user.is_active === 1 ? 'نشط' : 'غير نشط'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{user.email}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="mail" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>البريد الإلكتروني</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{user.phone || 'غير محدد'}</Text>
            <View style={styles.infoLabel}>
              <Ionicons name="call" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>رقم الهاتف</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {format(new Date(user.created_at), 'yyyy-MM-dd')}
            </Text>
            <View style={styles.infoLabel}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <Text style={styles.infoLabelText}>تاريخ التسجيل</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color={theme.colors.surface} />
            <Text style={styles.deleteButtonText}>حذف المستخدم</Text>
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
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  userName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  roleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
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
