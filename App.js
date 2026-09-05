import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { AppNavigator } from './src/navigation/AppNavigator';

import { View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
        <AuthProvider>
          <SocketProvider>
            <StatusBar style="light" backgroundColor="#000000" />
            <AppNavigator />
          </SocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </View>
  );
}
