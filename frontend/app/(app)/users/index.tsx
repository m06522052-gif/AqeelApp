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
import AddUserModal from '@/components/AddUserModal';

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  is_active: number;
  created_at: string;
}

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadUsers = async () => {
    try {
      const db = await getDatabase();
      const result = await db.getAllAsync('SELECT * FROM users ORDER BY created_at DESC') as User[];
      setUsers(result);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.is_active === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? 'تفعيل' : 'تعطيل';

    Alert.alert(
      'تأكيد',
      `هل تريد ${statusText} المستخدم ${user.username}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.runAsync('UPDATE users SET is_active = ? WHERE id = ?', newStatus, user.id);
              await loadUsers();
            } catch (error) {
              console.error('Error updating user status:', error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return theme.colors.error;
      case 'manager': return theme.colors.primary;
      case 'user': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير نظام';
      case 'manager': return 'مدير';
      case 'user': return 'مستخدم';
      default: return role;
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => router.push(`/users/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.userHeader}>
        <View style={[styles.statusDot, { backgroundColor: item.is_active === 1 ? theme.colors.success : theme.colors.error }]} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>

      <View style={styles.userDetails}>
        <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(item.role)}20` }]}>
          <Ionicons name="shield-checkmark" size={14} color={getRoleColor(item.role)} />
          <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
            {getRoleText(item.role)}
          </Text>
        </View>
        {item.phone && (
          <View style={styles.phoneContainer}>
            <Text style={styles.phoneText}>{item.phone}</Text>
            <Ionicons name="call" size={14} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
          </View>
        )}
      </View>

      <View style={styles.userFooter}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}20` }]}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleStatus(item);
          }}
        >
          <Ionicons
            name={item.is_active === 1 ? 'pause-circle' : 'play-circle'}
            size={16}
            color={theme.colors.primary}
          />
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
            {item.is_active === 1 ? 'تعطيل' : 'تفعيل'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المستخدمين</Text>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا يوجد مستخدمين</Text>
          </View>
        }
      />

      <AddUserModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={loadUsers}
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginLeft: theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  roleText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
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
