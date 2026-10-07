import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MusicHomeScreen } from '../screens/music/MusicHomeScreen';
import { MusicSearchScreen } from '../screens/music/MusicSearchScreen';
import { MusicLibraryScreen } from '../screens/music/MusicLibraryScreen';
import { UploadMusicScreen } from '../screens/music/UploadMusicScreen';
import { MiniPlayerBar } from '../components/music/MiniPlayerBar';
import { FullPlayerModal } from '../components/music/FullPlayerModal';

const Tab = createBottomTabNavigator();

export const MusicBottomTabNavigator = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentTab, setCurrentTab] = useState('Home');

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 52 + bottomInset;

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenListeners={{
          state: (e) => {
            const state = e.data.state;
            if (state && state.routes && state.index !== undefined) {
              const routeName = state.routes[state.index]?.name;
              if (routeName) setCurrentTab(routeName);
            }
          },
        }}
        screenOptions={{
          headerShown: false,
          sceneContainerStyle: { backgroundColor: '#080E1E' },
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabBarHeight,
              paddingBottom: bottomInset,
            },
          ],
          tabBarActiveTintColor: '#0084FF',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        {/* 1. Home - Resso Style Vertical Reels Feed */}
        <Tab.Screen
          name="Home"
          component={MusicHomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'musical-notes' : 'musical-notes-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* 2. Search */}
        <Tab.Screen
          name="Search"
          component={MusicSearchScreen}
          options={{
            tabBarLabel: 'Search',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* 3. Your Library */}
        <Tab.Screen
          name="YourLibrary"
          component={MusicLibraryScreen}
          options={{
            tabBarLabel: 'Your Library',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'library' : 'library-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* 4. Upload Your Fav Music */}
        <Tab.Screen
          name="UploadMusic"
          component={UploadMusicScreen}
          options={{
            tabBarLabel: 'Upload',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'cloud-upload' : 'cloud-upload-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Mini-Player only on Search, Library & Upload tabs (Home is full-screen Resso reel) */}
      {currentTab !== 'Home' && (
        <View
          style={[
            styles.miniPlayerWrapper,
            { bottom: tabBarHeight },
          ]}
        >
          <MiniPlayerBar />
        </View>
      )}

      {/* Global Full Player Modal */}
      <FullPlayerModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1E',
  },
  tabBar: {
    backgroundColor: '#060C1B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  miniPlayerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
});
