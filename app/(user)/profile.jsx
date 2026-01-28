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
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { currentUser, getUserStats, setIsAdmin } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const stats = getUserStats();

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => router.replace('/') },
    ]);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ur' : 'en';
    setLanguage(newLang);
  };

  const handleSwitchToAdmin = () => {
    router.replace('/(admin)/login');
  };

  const menuItems = [
    { 
      icon: '🌐', 
      label: language === 'en' ? 'اردو (Urdu)' : 'English', 
      onPress: toggleLanguage 
    },
    { 
      icon: '👤', 
      labelKey: 'switchToAdmin', 
      onPress: handleSwitchToAdmin 
    },
    { icon: '⚙️', labelKey: 'settings', onPress: () => Alert.alert(t('settings'), t('comingSoon')) },
    { icon: '🔔', labelKey: 'notifications', onPress: () => router.push('/(user)/notifications') },
    { icon: '🔒', labelKey: 'privacySecurity', onPress: () => Alert.alert(t('privacySecurity'), t('comingSoon')) },
    { icon: '❓', labelKey: 'helpSupport', onPress: () => Alert.alert(t('helpSupport'), t('comingSoon')) },
    { icon: '📄', labelKey: 'termsOfService', onPress: () => Alert.alert(t('termsOfService'), t('comingSoon')) },
    { icon: '🚪', labelKey: 'logout', onPress: handleLogout, danger: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>{currentUser.name}</Text>
          <Text style={styles.userEmail}>{currentUser.email}</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>{t('statistics')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statBlue]}>{stats.total}</Text>
              <Text style={styles.statLabel}>{t('total')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statGreen]}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>{t('resolved')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statOrange]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>{t('pending')}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/(user)/reports')}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionText}>{t('viewReports')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/(user)/create')}
          >
            <Text style={styles.quickActionIcon}>➕</Text>
            <Text style={styles.quickActionText}>{t('newReport')}</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={[styles.menuItemLabel, item.danger && styles.menuItemDanger]}>
                  {item.label || t(item.labelKey)}
                </Text>
              </View>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>🏛️ CitizenConnect</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 48,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: '#6b7280',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statBlue: {
    color: '#3b82f6',
  },
  statGreen: {
    color: '#22c55e',
  },
  statOrange: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuItemIcon: {
    fontSize: 22,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#374151',
  },
  menuItemDanger: {
    color: '#ef4444',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
  },
  appName: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    color: '#9ca3af',
  },
  bottomSpacer: {
    height: 100,
  },
});
