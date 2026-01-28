import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PressableTabIcon({ name, focused }) {
  return (
    <Pressable
      android_ripple={{
        color: 'rgba(88, 252, 82, 0.25)', // light green ripple
        radius: 28,
      }}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressedIOS, // iOS highlight
      ]}
    >
      <Ionicons
        name={focused ? name : `${name}-outline`}
        size={24}
        color={focused ? 'blue' : '#9ca3af'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedIOS: {
    backgroundColor: 'rgba(88, 252, 82, 0.15)',
  },
});
