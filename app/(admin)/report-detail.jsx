import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { departments, categories, statusColors, statuses } from '../../src/data/departments';

export default function AdminReportDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getReport, updateReportStatus, assignDepartment } = useApp();
  const { t } = useLanguage();

  const report = getReport(Number(params.id));

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

  const statusStyle = statusColors[report.status] || statusColors.Pending;
  const categoryIcon = categories.find((c) => c.id === report.category)?.icon || '📋';

  const handleAssignDepartment = (deptId) => {
    assignDepartment(report.id, deptId);
    Alert.alert(t('success'), `${t('assignedTo')} ${t(deptId)} ${t('department')}`);
  };

  const handleUpdateStatus = (status) => {
    updateReportStatus(report.id, status);
    Alert.alert(t('success'), `${t('statusUpdatedTo')} ${t(getStatusKey(status))}`);
  };

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
        <Text style={styles.headerTitle}>{t('manageReport')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {t(getStatusKey(report.status))}
              </Text>
            </View>
          </View>

          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportDescription}>{report.description}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📍 {report.location}</Text>
            <Text style={styles.metaText}>📅 {report.createdAt}</Text>
          </View>
        </View>

        {/* Assign Department */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>{t('assignDepartment')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.deptRow}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.deptChip,
                    report.department === dept.id && styles.deptChipActive,
                  ]}
                  onPress={() => handleAssignDepartment(dept.id)}
                >
                  <Text style={styles.deptChipIcon}>{dept.icon}</Text>
                  <Text
                    style={[
                      styles.deptChipLabel,
                      report.department === dept.id && styles.deptChipLabelActive,
                    ]}
                  >
                    {t(dept.id)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Update Status */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>{t('updateStatus')}</Text>
          <View style={styles.statusGrid}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  report.status === status && styles.statusButtonActive,
                ]}
                onPress={() => handleUpdateStatus(status)}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    report.status === status && styles.statusButtonTextActive,
                  ]}
                >
                  {t(getStatusKey(status))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.actionTitle}>{t('timeline')}</Text>
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

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    color: '#94a3b8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryIcon: {
    fontSize: 44,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  actionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 14,
  },
  deptRow: {
    flexDirection: 'row',
    gap: 10,
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  deptChipActive: {
    backgroundColor: '#8b5cf6',
  },
  deptChipIcon: {
    fontSize: 18,
  },
  deptChipLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  deptChipLabelActive: {
    color: '#ffffff',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusButton: {
    width: '48%',
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  timelineCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
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
    height: 44,
    backgroundColor: '#334155',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 20,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  timelineDate: {
    fontSize: 10,
    color: '#64748b',
  },
  timelineNote: {
    fontSize: 13,
    color: '#94a3b8',
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
    color: '#94a3b8',
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: '#8b5cf6',
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
