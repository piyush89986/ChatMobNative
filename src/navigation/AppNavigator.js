import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useAppMode } from '../context/AppModeContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { MusicNavigator } from './MusicNavigator';
import { AppModeSelectScreen } from '../screens/main/AppModeSelectScreen';
import { Ionicons } from '@expo/vector-icons';

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#000000',
    border: '#1F1F1F',
    text: '#FFFFFF',
  },
};

export const AppNavigator = () => {
  const { token, isLoading } = useAuth();
  const { appMode } = useAppMode();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <LinearGradient
          colors={['#833AB4', '#FD1D1D', '#FCAF45']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={styles.logoBadge}
        >
          <Ionicons name="paper-plane" size={40} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.splashTitle}>FOMO</Text>
        <ActivityIndicator
          size="small"
          color="#1DB954"
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  const renderContent = () => {
    if (!token) {
      return <AuthNavigator />;
    }

    if (appMode === 'choice') {
      return <AppModeSelectScreen />;
    }

    if (appMode === 'music') {
      return <MusicNavigator />;
    }

    return <MainNavigator />;
  };

  return (
    <NavigationContainer theme={customDarkTheme}>
      {renderContent()}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
    letterSpacing: -0.5,
  },
});
