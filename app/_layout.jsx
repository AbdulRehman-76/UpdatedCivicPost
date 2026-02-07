import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '../src/context/AppContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import CustomSplashScreen from './components/CustomSplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading } = useApp();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Show splash screen for at least 3 seconds
      const timer = setTimeout(() => {
        setAppReady(true);
        SplashScreen.hideAsync();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!appReady) {
    return <CustomSplashScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(user)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
