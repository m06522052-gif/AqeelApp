import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color={theme.colors.surface} />
        </View>
        <Text style={styles.userName}>{user?.username}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.drawerSection}>
        <Text style={styles.sectionTitle}>عام</Text>
        <DrawerItem
          label="لوحة التحكم"
          icon={({ size, color }) => <Ionicons name="grid" size={size} color={color} />}
          onPress={() => router.push('/(app)/dashboard')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
        <DrawerItem
          label="الدفعات"
          icon={({ size, color }) => <Ionicons name="cube" size={size} color={color} />}
          onPress={() => router.push('/(app)/batches')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
        <DrawerItem
          label="العمال"
          icon={({ size, color }) => <Ionicons name="people" size={size} color={color} />}
          onPress={() => router.push('/(app)/workers')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
        <DrawerItem
          label="المخازن"
          icon={({ size, color }) => <Ionicons name="business" size={size} color={color} />}
          onPress={() => router.push('/(app)/warehouses')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
        <DrawerItem
          label="التوزيع"
          icon={({ size, color }) => <Ionicons name="share-social" size={size} color={color} />}
          onPress={() => router.push('/(app)/distributions')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
        <DrawerItem
          label="الإنتاج"
          icon={({ size, color }) => <Ionicons name="construct" size={size} color={color} />}
          onPress={() => router.push('/(app)/production')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
        <DrawerItem
          label="المدفوعات"
          icon={({ size, color }) => <Ionicons name="cash" size={size} color={color} />}
          onPress={() => router.push('/(app)/payments')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
      </View>

      <View style={styles.drawerSection}>
        <Text style={styles.sectionTitle}>المخزون</Text>
        <DrawerItem
          label="المواد"
          icon={({ size, color }) => <Ionicons name="layers" size={size} color={color} />}
          onPress={() => router.push('/(app)/materials')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
        <DrawerItem
          label="حركة المخزون"
          icon={({ size, color }) => <Ionicons name="swap-horizontal" size={size} color={color} />}
          onPress={() => router.push('/(app)/inventory')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
      </View>

      <View style={styles.drawerSection}>
        <Text style={styles.sectionTitle}>النظام</Text>
        <DrawerItem
          label="المستخدمون"
          icon={({ size, color }) => <Ionicons name="people-circle" size={size} color={color} />}
          onPress={() => router.push('/(app)/users')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
        <DrawerItem
          label="التقارير"
          icon={({ size, color }) => <Ionicons name="bar-chart" size={size} color={color} />}
          onPress={() => router.push('/(app)/reports')}
          labelStyle={styles.drawerItemLabel}
          style={styles.drawerItem}
        />
      </View>

      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'right',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: {
          fontWeight: theme.fontWeight.bold,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          drawerLabel: 'لوحة التحكم',
          title: 'لوحة التحكم',
        }}
      />
      <Drawer.Screen
        name="batches"
        options={{
          drawerLabel: 'الدفعات',
          title: 'الدفعات',
        }}
      />
      <Drawer.Screen
        name="workers"
        options={{
          drawerLabel: 'العمال',
          title: 'العمال',
        }}
      />
      <Drawer.Screen
        name="warehouses"
        options={{
          drawerLabel: 'المخازن',
          title: 'المخازن',
        }}
      />
      <Drawer.Screen
        name="distributions"
        options={{
          drawerLabel: 'التوزيع',
          title: 'التوزيع',
        }}
      />
      <Drawer.Screen
        name="production"
        options={{
          drawerLabel: 'الإنتاج',
          title: 'الإنتاج',
        }}
      />
      <Drawer.Screen
        name="payments"
        options={{
          drawerLabel: 'المدفوعات',
          title: 'المدفوعات',
        }}
      />
      <Drawer.Screen
        name="inventory"
        options={{
          drawerLabel: 'حركة المخزون',
          title: 'حركة المخزون',
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          drawerLabel: 'التقارير',
          title: 'التقارير',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  drawerHeader: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.surface,
    opacity: 0.8,
  },
  drawerSection: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    textAlign: 'right',
  },
  drawerItem: {
    marginHorizontal: theme.spacing.md,
  },
  drawerItemLabel: {
    textAlign: 'right',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 'auto',
    padding: theme.spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.error}10`,
  },
  logoutText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
