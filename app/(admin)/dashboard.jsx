import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { departments, categories, statusColors } from '../../src/data/departments';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { reports, getStats, getDepartmentStats, isLoading, setIsAdmin } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const stats = getStats();
  const deptStats = getDepartmentStats();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  const handleSwitchToUser = () => {
    setIsAdmin(false);
    router.replace('/(user)/home');
  };

  const handleReportPress = (id) => {
    router.push({ pathname: '/(admin)/report-detail', params: { id } });
  };

  const renderRecentReport = ({ item }) => {
    const statusStyle = statusColors[item.status] || statusColors.Pending;
    const categoryIcon = categories.find((c) => c.id === item.category)?.icon || '📋';

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

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => handleReportPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.reportRow}>
          <Text style={styles.reportIcon}>{categoryIcon}</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.reportLocation}>{item.location}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {t(getStatusKey(item.status))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('dashboard')}</Text>
            <Text style={styles.subtitle}>{t('welcomeAdmin')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
              <Text style={styles.langButtonText}>{language === 'en' ? 'اردو' : 'EN'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatar} onPress={handleSwitchToUser}>
              <Text style={styles.avatarText}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{t('totalReports')}</Text>
              <Text style={styles.statIcon}>📊</Text>
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statChange}>+3 {t('today')}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{t('pending')}</Text>
              <Text style={styles.statIcon}>⏳</Text>
            </View>
            <Text style={[styles.statNumber, styles.statOrange]}>{stats.pending}</Text>
            <Text style={[styles.statChange, styles.statOrange]}>{t('needsAttention')}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{t('inProgress')}</Text>
              <Text style={styles.statIcon}>🔄</Text>
            </View>
            <Text style={[styles.statNumber, styles.statBlue]}>{stats.inProgress}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>{t('resolved')}</Text>
              <Text style={styles.statIcon}>✅</Text>
            </View>
            <Text style={[styles.statNumber, styles.statGreen]}>{stats.resolved}</Text>
          </View>
        </View>

        {/* Department Stats */}
        <Text style={styles.sectionTitle}>{t('byDepartment')}</Text>
        <View style={styles.deptCard}>
          {departments.slice(0, 5).map((dept) => {
            const count = deptStats[dept.id] || 0;
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

            return (
              <View key={dept.id} style={styles.deptRow}>
                <Text style={styles.deptIcon}>{dept.icon}</Text>
                <View style={styles.deptInfo}>
                  <View style={styles.deptHeader}>
                    <Text style={styles.deptName}>{t(dept.id)}</Text>
                    <Text style={styles.deptCount}>{count}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percentage}%`, backgroundColor: dept.color },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Reports */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recentReports')}</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/reports')}>
            <Text style={styles.viewAll}>{t('viewAll')} →</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={reports.slice(0, 4)}
          renderItem={renderRecentReport}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.reportsList}
        />

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  langButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  statIcon: {
    fontSize: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statOrange: {
    color: '#f59e0b',
  },
  statBlue: {
    color: '#3b82f6',
  },
  statGreen: {
    color: '#22c55e',
  },
  statChange: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  deptCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  deptIcon: {
    fontSize: 24,
  },
  deptInfo: {
    flex: 1,
  },
  deptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  deptName: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  deptCount: {
    fontSize: 14,
    color: '#94a3b8',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  reportsList: {
    gap: 10,
  },
  reportCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportIcon: {
    fontSize: 28,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  reportLocation: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 100,
  },
});
