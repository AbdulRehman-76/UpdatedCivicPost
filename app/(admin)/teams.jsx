import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { departments } from '../../src/data/departments';
import { useLanguage } from '../../src/context/LanguageContext';

const initialTeams = [
  { id: 1, name: 'Street Lights Team A', department: 'Streetlights', members: 5, activeJobs: 3 },
  { id: 2, name: 'Garbage Collection Team', department: 'Garbage', members: 8, activeJobs: 5 },
  { id: 3, name: 'Water Repair Crew', department: 'Water', members: 6, activeJobs: 2 },
  { id: 4, name: 'Emergency Gas Response', department: 'Gas', members: 4, activeJobs: 1 },
  { id: 5, name: 'Roads Maintenance', department: 'Roads', members: 10, activeJobs: 4 },
  { id: 6, name: 'Electrical Services', department: 'Electricity', members: 7, activeJobs: 3 },
];

export default function TeamsScreen() {
  const { t } = useLanguage();
  const [teams, setTeams] = useState(initialTeams);
  const [isManageMode, setIsManageMode] = useState(false);

  const getDeptIcon = (deptId) => {
    return departments.find((d) => d.id === deptId)?.icon || '👥';
  };

  const handleAddTeam = () => {
    Alert.alert(t('addTeam'), t('comingSoon'));
  };

  const handleEditTeam = (team) => {
    Alert.alert(t('edit'), `${t('teamDetails')}: ${team.name}`);
  };

  const handleDeleteTeam = (id) => {
    Alert.alert(
      t('delete'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            setTeams(teams.filter(t => t.id !== id));
          }
        }
      ]
    );
  };

  const renderTeam = ({ item }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <View style={styles.teamIconContainer}>
          <Text style={styles.teamIcon}>{getDeptIcon(item.department)}</Text>
        </View>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.teamDept}>{t(item.department)}</Text>
        </View>
        {isManageMode && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => handleEditTeam(item)}
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]} 
              onPress={() => handleDeleteTeam(item.id)}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.teamStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.members}</Text>
          <Text style={styles.statLabel}>{t('members')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.activeValue]}>{item.activeJobs}</Text>
          <Text style={styles.statLabel}>{t('activeJobs')}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>{t('teams')}</Text>
            <Text style={styles.subtitle}>{t('manageTeams')}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.manageButton, isManageMode && styles.manageButtonActive]} 
              onPress={() => setIsManageMode(!isManageMode)}
            >
              <Text style={[styles.manageButtonText, isManageMode && styles.manageButtonTextActive]}>
                {isManageMode ? t('done') : t('manage')}
              </Text>
            </TouchableOpacity>
            {isManageMode && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddTeam}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.teamsList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  manageButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  manageButtonActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  manageButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  manageButtonTextActive: {
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  teamsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  teamCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#334155',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  teamIcon: {
    fontSize: 26,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  teamDept: {
    fontSize: 13,
    color: '#94a3b8',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#ef444420',
  },
  actionIcon: {
    fontSize: 16,
  },
  teamStats: {
    flexDirection: 'row',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  activeValue: {
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#475569',
    marginHorizontal: 14,
  },
});
