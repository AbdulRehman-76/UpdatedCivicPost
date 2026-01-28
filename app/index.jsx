import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { useLanguage } from '../src/context/LanguageContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { setIsAdmin } = useApp();
  const { t } = useLanguage();

  const handleCitizenMode = () => {
    setIsAdmin(false);
    router.push('/(user)/home');
  };

  const handleAdminMode = () => {
    router.push('/(admin)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🏛️</Text>
          <Text style={styles.title}>CitizenConnect</Text>
          <Text style={styles.subtitle}>{t('reportTrackResolve')}</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📝</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('reportInstantly')}</Text>
              <Text style={styles.featureDesc}>{t('quickReporting')}</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('selectLocation')}</Text>
              <Text style={styles.featureDesc}>{t('tapToSelect')}</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔄</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{t('realTimeUpdates')}</Text>
              <Text style={styles.featureDesc}>{t('trackStatus')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.citizenButton}
            onPress={handleCitizenMode}
          >
            <Text style={styles.buttonIcon}>👤</Text>
            <Text style={styles.buttonText}>{t('getStarted')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adminButton}
            onPress={handleAdminMode}
          >
            <Text style={styles.buttonIcon}>🔐</Text>
            <Text style={styles.adminButtonText}>{t('adminDashboard')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  features: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttons: {
    gap: 12,
  },
  citizenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  adminButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 32,
    fontSize: 12,
  },
});
