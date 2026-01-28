import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { departments, categories, statusColors } from '../../src/data/departments';

const filterOptions = ['all', 'Pending', 'Assigned', 'In Progress', 'Resolved'];

export default function AdminReportsScreen() {
  const router = useRouter();
  const { reports, isLoading } = useApp();
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

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

  const filteredReports = useMemo(() => {
    let result = [...reports];
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (deptFilter !== 'all') {
      result = result.filter((r) => r.category === deptFilter);
    }
    return result;
  }, [reports, statusFilter, deptFilter]);

  const handleReportPress = (id) => {
    router.push({ pathname: '/(admin)/report-detail', params: { id } });
  };

  const renderFilterButton = (filter) => {
    const isActive = statusFilter === filter;
    const label = filter === 'all' ? t('all') : t(getStatusKey(filter));

    return (
      <TouchableOpacity
        key={filter}
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setStatusFilter(filter)}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderReport = ({ item }) => {
    const statusStyle = statusColors[item.status] || statusColors.Pending;
    const categoryIcon = categories.find((c) => c.id === item.category)?.icon || '📋';

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => handleReportPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.reportHeader}>
          <Text style={styles.reportIcon}>{categoryIcon}</Text>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.reportMeta}>{t('id')}: #{item.id} • {item.createdAt}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {t(getStatusKey(item.status))}
            </Text>
          </View>
        </View>

        <View style={styles.reportFooter}>
          <Text style={styles.reportLocation}>📍 {item.location}</Text>
          <Text style={styles.reportDept}>
            {item.department ? `${t('assignedTo')} ${t(item.department)}` : t('unassigned')}
          </Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>{t('allReports')}</Text>
        <Text style={styles.subtitle}>{t('manageAndAssign')}</Text>
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={filterOptions}
          renderItem={({ item }) => renderFilterButton(item)}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Department Filter */}
      <View style={styles.pickerContainer}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>{t('department')}:</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              const depts = ['all', ...departments.map((d) => d.id)];
              const currentIndex = depts.indexOf(deptFilter);
              const nextIndex = (currentIndex + 1) % depts.length;
              setDeptFilter(depts[nextIndex]);
            }}
          >
            <Text style={styles.pickerButtonText}>
              {deptFilter === 'all' ? t('allDepartments') : t(deptFilter)}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.reportsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>{t('noReportsFound')}</Text>
          </View>
        }
      />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#334155',
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  pickerContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#ffffff',
  },
  pickerArrow: {
    fontSize: 10,
    color: '#94a3b8',
  },
  reportsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
  },
  reportCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
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
  reportMeta: {
    fontSize: 11,
    color: '#64748b',
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
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportLocation: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  reportDept: {
    fontSize: 11,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
});
