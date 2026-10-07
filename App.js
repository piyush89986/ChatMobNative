import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { AppModeProvider } from './src/context/AppModeContext';
import { MusicPlayerProvider } from './src/context/MusicPlayerContext';
import { AppNavigator } from './src/navigation/AppNavigator';

import { View } from 'react-native';

export default function App() {
  useEffect(() => {
    async function checkAndApplyUpdates() {
      try {
        if (__DEV__) return;
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.log('Update check error:', error?.message || error);
      }
    }
    checkAndApplyUpdates();
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
        <AuthProvider>
          <SocketProvider>
            <AppModeProvider>
              <MusicPlayerProvider>
                <StatusBar style="light" backgroundColor="#000000" />
                <AppNavigator />
              </MusicPlayerProvider>
            </AppModeProvider>
          </SocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </View>
  );
}
