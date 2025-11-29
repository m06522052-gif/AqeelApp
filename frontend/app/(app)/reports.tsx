import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export default function ReportsScreen() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'workers',
      title: 'تقرير إنتاجية العمال',
      description: 'تقييم أداء العمال وإنتاجيتهم',
      icon: 'people',
      color: theme.colors.primary,
    },
    {
      id: 'inventory',
      title: 'تقرير المخزون',
      description: 'حالة المخزون والحركات',
      icon: 'cube',
      color: theme.colors.success,
    },
    {
      id: 'financial',
      title: 'تقرير الحسابات المالية',
      description: 'تتبع التدفقات المالية والمدفوعات',
      icon: 'cash',
      color: theme.colors.error,
    },
    {
      id: 'production',
      title: 'تقرير الإنتاج',
      description: 'إحصائيات الإنتاج والجودة',
      icon: 'construct',
      color: theme.colors.secondary,
    },
    {
      id: 'distributions',
      title: 'تقرير التوزيع',
      description: 'حالة التوزيعات ومعدلات الإنجاز',
      icon: 'share-social',
      color: theme.colors.warning,
    },
  ];

  const ReportCard = ({ report }: any) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => setSelectedReport(report.id)}
    >
      <View style={[styles.reportIcon, { backgroundColor: `${report.color}20` }]}>
        <Ionicons name={report.icon} size={32} color={report.color} />
      </View>
      <View style={styles.reportContent}>
        <Text style={styles.reportTitle}>{report.title}</Text>
        <Text style={styles.reportDescription}>{report.description}</Text>
      </View>
      <Ionicons name="chevron-back" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التقارير</Text>
        <Text style={styles.headerSubtitle}>اختر نوع التقرير لعرضه</Text>
      </View>

      <View style={styles.content}>
        {reportTypes.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
        <Text style={styles.infoText}>
          يمكنك تحديد فترة زمنية للتقرير وطباعته أو مشاركته
        </Text>
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
  content: {
    padding: theme.spacing.md,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  reportIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  reportContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  reportTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  reportDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary}10`,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    textAlign: 'right',
  },
});
