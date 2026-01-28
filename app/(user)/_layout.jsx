import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedTabIcon from '../components/AnimatedTabIcon.js';
import PressableTabIcon from '../components/PressableTabIcon.js';
const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabItem}>
    <Text style={styles.tabIcon}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
  </View>
);

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,      
        tabBarActiveTintColor: 'blue',
        tabBarStyle: {                
          height: 90,
          paddingBottom: 9,
        },
        // headerShown: false,
        // tabBarStyle: styles.tabBar,
        // tabBarShowLabel: false,
      }}
    >
      
      {/* <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} />,
        }}
      /> */}
      <Tabs.Screen 
        name="home" // This must match the filename 'home.tsx'
        // options={{
        //   tabBarIcon: ({ focused }) => (
        //     <PressableTabIcon name="grid" focused={focused} />
        //   ),
        // }}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />
        }}
      />
      {/* <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Reports" focused={focused} />,
        }}
      /> */}
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports", 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "clipboard" : "clipboard-outline"} size={26} color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={styles.createButton}>
              <Ionicons name="add" size={50} color="white" />
            </View>
          ),
        }}
      />
      {/* <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: () => (
            <View style={styles.createButton}>
              <Text style={styles.createIcon}>➕</Text>
            </View>
          ),
        }}
      /> */}
      {/* <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} />,
        }}
      /> */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "notifications" : "notifications-outline"} size={26} color={color} 
            />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Alerts" focused={focused} />,
        }}
      /> */}
      <Tabs.Screen
        name="report-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    color: '#9ca3af',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#22c55e',
  },
  // createButton: {
  //   backgroundColor: '#22c55e',
  //   width: 56,
  //   height: 56,
  //   borderRadius: 28,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginTop: -20,
  //   shadowColor: '#22c55e',
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 8,
  //   elevation: 8,
  // },
  createButton: {
    width: 60,
    height: 60,
    borderRadius: 16, 
    backgroundColor: '#22c55e', 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30, 
    elevation: 8,             
    shadowColor: '#22c55e',   
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,       
    shadowRadius: 4,         
  },
  createIcon: {
    fontSize: 28,
  },
});
