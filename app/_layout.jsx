import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '../src/context/AppContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import CustomSplashScreen from './components/CustomSplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this to error */
});

function RootLayoutNav() {
  const { isLoading } = useApp();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        if (!isLoading) {
          // Show splash screen for at least 3 seconds
          await new Promise(resolve => setTimeout(resolve, 3000));
          setAppReady(true);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        if (!isLoading) {
          await SplashScreen.hideAsync().catch(() => {
            /* ignore errors */
          });
        }
      }
    }

    prepare();
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
