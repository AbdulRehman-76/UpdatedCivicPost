import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { categories, statusColors } from '../../src/data/departments';

export default function ReportDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getReport } = useApp();
  const { t } = useLanguage();

  const report = getReport(Number(params.id));

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{t('reportNotFound')}</Text>
          <TouchableOpacity style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusKey = (status) => {
    const map = {
      'Pending': 'pending',
      'Assigned': 'assigned',
      'In Progress': 'inProgress',
      'Resolved': 'resolved',
      'Closed': 'closed'
    };
    return map[status] || status.toLowerCase();
  };

  const getCategoryKey = (categoryId) => {
    const map = {
      'streetlights': 'streetlights',
      'garbage': 'garbage',
      'water': 'water',
      'gas': 'gas',
      'roads': 'roads',
      'electricity': 'electricity'
    };
    return map[categoryId] || categoryId;
  };

  const statusKey = getStatusKey(report.status);
  const statusStyle = statusColors[report.status] || statusColors.Pending;
  const categoryIcon = categories.find((c) => c.id === report.category)?.icon || '📋';
  const categoryName = t(getCategoryKey(report.category));

  const getTimelineDotColor = (status) => {
    const colors = {
      Pending: '#f59e0b',
      Assigned: '#3b82f6',
      'In Progress': '#8b5cf6',
      Resolved: '#22c55e',
      Closed: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('reportDetails')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{t(statusKey)}</Text>
            </View>
          </View>

          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.categoryLabel}>{categoryName}</Text>

          <Text style={styles.description}>{report.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>{report.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{report.createdAt}</Text>
            </View>
          </View>

          {report.department && (
            <View style={styles.departmentBadge}>
              <Text style={styles.departmentText}>
                {t('assignedTo')}: {t(getCategoryKey(report.department))} {t('department')}
              </Text>
            </View>
          )}
        </View>

        {/* Photo Section */}
        {report.photo && (
          <View style={styles.photoCard}>
            <Text style={styles.sectionTitle}>{t('photoEvidence')}</Text>
            <View style={styles.photoContainer}>
              <Image source={{ uri: report.photo }} style={styles.photo} resizeMode="cover" />
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>{t('statusTimeline')}</Text>
          <View style={styles.timeline}>
            {report.timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[styles.timelineDot, { backgroundColor: getTimelineDotColor(item.status) }]}
                  />
                  {index < report.timeline.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineStatus}>{t(getStatusKey(item.status))}</Text>
                    <Text style={styles.timelineDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.timelineNote}>{item.note}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Report ID */}
        <View style={styles.reportIdCard}>
          <Text style={styles.reportIdLabel}>{t('reportId')}</Text>
          <Text style={styles.reportIdValue}>#{report.id.toString().padStart(6, '0')}</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 48,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  departmentBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  departmentText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  photoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    height: 180,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  timelineLine: {
    width: 2,
    height: 50,
    backgroundColor: '#e5e7eb',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  timelineDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  timelineNote: {
    fontSize: 14,
    color: '#6b7280',
  },
  reportIdCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportIdLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  reportIdValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  bottomSpacer: {
    height: 100,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
