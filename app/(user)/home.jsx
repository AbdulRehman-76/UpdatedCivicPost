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
import { categories, statusColors } from '../../src/data/departments';

export default function HomeScreen() {
  const router = useRouter();
  const { getUserReports, getUserStats, isLoading } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const userReports = getUserReports();
  const stats = getUserStats();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  const getStatusKey = (status) => {
    const map = {
      Pending: 'pending',
      Assigned: 'assigned',
      'In Progress': 'inProgress',
      Resolved: 'resolved',
      Closed: 'closed',
    };
    return map[status] || status.toLowerCase();
  };

  const getCategoryKey = (cat) => {
    const map = {
      Streetlights: 'streetLights',
      Garbage: 'garbageCollection',
      Water: 'waterSupply',
      Roads: 'roadMaintenance',
      Gas: 'gasProblems',
      Electricity: 'electricity',
      Sewerage: 'sewerageIssues',
      'Animal Rescue': 'animalRescue',
      'Public Safety': 'publicSafety',
      Other: 'other',
    };
    return map[cat] || cat.toLowerCase();
  };

  const handleCategoryPress = (categoryId) => {
    router.push({ pathname: '/(user)/create', params: { category: categoryId } });
  };

  const handleReportPress = (reportId) => {
    router.push({ pathname: '/(user)/report-detail', params: { id: reportId } });
  };

  const renderRecentReport = ({ item }) => {
    const statusStyle = statusColors[item.status] || statusColors.Pending;
    const categoryIcon = categories.find((c) => c.id === item.category)?.icon || '📋';

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => handleReportPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.reportHeader}>
          <View style={styles.reportTitleRow}>
            <Text style={styles.reportIcon}>{categoryIcon}</Text>
            <Text style={styles.reportTitle} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{t(getStatusKey(item.status))}</Text>
          </View>
        </View>
        <Text style={styles.reportLocation}>📍 {item.location}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }} 
                  style={styles.scrollView} 
                  showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('reportTrackResolve')}</Text>
          </View>
          <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
            <Text style={styles.langButtonText}>{language === 'en' ? 'اردو' : 'EN'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t('myReports')}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardOrange]}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>{t('pending')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => router.push('/(user)/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.reportButtonIcon}>📝</Text>
          <Text style={styles.reportButtonText}>{t('reportNewIssue')}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('quickCategories')}</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryLabel}>{t(getCategoryKey(category.id))}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
        {userReports.length > 0 ? (
          <FlatList
            data={userReports.slice(0, 3)}
            renderItem={renderRecentReport}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.reportsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>{t('noReportsYet')}</Text>
            <Text style={styles.emptySubtext}>{t('startReporting')}</Text>
          </View>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    marginTop: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  langButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
  },
  statCardBlue: {
    backgroundColor: '#3b82f6',
  },
  statCardOrange: {
    backgroundColor: '#f59e0b',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  reportButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    marginBottom: 24,
    gap: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reportButtonIcon: {
    fontSize: 24,
  },
  reportButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 10,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reportIcon: {
    fontSize: 24,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reportLocation: {
    fontSize: 13,
    color: '#6b7280',
  },
  reportsList: {
    paddingBottom: 80,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
  },
  bottomSpacer: {
    height: 40,
  },
});
