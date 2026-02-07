import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../src/context/LanguageContext';
import { resetUserPassword } from '../../src/services/adminService';

export default function AdminForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('error') || 'Error', t('pleaseEnterEmail') || 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('error') || 'Error', t('invalidEmail') || 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(email.trim());
      Alert.alert(
        t('success') || 'Success',
        t('resetLinkSent') || 'A password reset link has been sent to your email.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      let msg = t('resetError') || 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        msg = t('userNotFound') || 'No user found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        msg = t('invalidEmail') || 'Invalid email format.';
      }
      Alert.alert(t('error') || 'Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBg}>
              <Text style={styles.lockIcon}>📧</Text>
            </View>
            <Text style={styles.title}>{t('resetPassword') || 'Reset Password'}</Text>
            <Text style={styles.subtitle}>
              {t('resetPasswordSubtitle') || 'Enter your registered email to receive a password reset link.'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder={t('email') || 'Email'}
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.resetButtonText}>
                  {t('sendResetLink') || 'Send Reset Link'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backToLogin}>{t('backToLogin') || 'Back to Login'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  // Header
  header: { alignItems: 'center', marginBottom: 48 },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockIcon: { fontSize: 44 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center' },

  // Form
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
  },
  inputIcon: { fontSize: 18, marginRight: 12, width: 24, textAlign: 'center' },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#ffffff' },
  resetButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  resetButtonDisabled: { backgroundColor: '#475569', shadowOpacity: 0 },
  resetButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },

  // Footer
  footer: { marginTop: 48, alignItems: 'center' },
  backToLogin: { color: '#8b5cf6', fontSize: 15, fontWeight: '500' },
});
