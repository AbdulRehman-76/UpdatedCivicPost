import React, { useEffect } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../../src/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabItem}>
    <Text style={styles.tabIcon}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
  </View>
);

export default function AdminLayout() {
  const { isAdmin } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Basic redirect logic
    const isLoginPage = segments.includes('login');

    if (!isAdmin && !isLoginPage) {
      // Use setImmediate or setTimeout to ensure navigation happens after render
      const timeout = setTimeout(() => {
        router.replace('/(admin)/login');
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isAdmin, segments]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="login"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title : "Dashboard",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={26}
              color={focused ? '#58fc52' : '#9ca3af'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title : "Reports",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={26}
              color={focused ? 'yellow' : '#9ca3af'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="teams"
        options={{
          title : "Teams",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={26}
              color={focused ? '#4f46e5' : '#9ca3af'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title : "Settings",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={26}
              color={focused ? 'red' : 'white'}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="report-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>

    // <Tabs
    //   screenOptions={{
    //     headerShown: false,
    //     tabBarStyle: styles.tabBar,
    //     tabBarShowLabel: false,
    //   }}
    // >
    //   <Tabs.Screen
    //     name="login"
    //     options={{
    //       href: null,
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="dashboard"
    //     options={{
    //       tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Dashboard" focused={focused} />,
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="reports"
    //     options={{
    //       tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Reports" focused={focused} />,
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="teams"
    //     options={{
    //       tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Teams" focused={focused} />,
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="settings"
    //     options={{
    //       tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="Settings" focused={focused} />,
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="report-detail"
    //     options={{
    //       href: null,
    //     }}
    //   />
    // </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    height: 80,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#a78bfa',
  },
});
