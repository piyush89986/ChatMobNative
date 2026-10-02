import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MusicHomeScreen } from '../screens/music/MusicHomeScreen';
import { MusicSearchScreen } from '../screens/music/MusicSearchScreen';
import { MusicLibraryScreen } from '../screens/music/MusicLibraryScreen';
import { MiniPlayerBar } from '../components/music/MiniPlayerBar';
import { FullPlayerModal } from '../components/music/FullPlayerModal';
import { CreatePlaylistModal } from '../components/music/CreatePlaylistModal';
import { useAppMode } from '../context/AppModeContext';

const Tab = createBottomTabNavigator();

// Placeholder screens for tab actions
const DummyScreen = () => <View style={{ flex: 1, backgroundColor: '#080E1E' }} />;

export const MusicBottomTabNavigator = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { switchToSocial } = useAppMode();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 52 + bottomInset;

  return (
    <View style={styles.container}>
      <Tab.Navigator
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
        {/* 1. Home matching Screenshot */}
        <Tab.Screen
          name="Home"
          component={MusicHomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />

        {/* 2. Search matching Screenshot */}
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

        {/* 3. Your Library matching Screenshot */}
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

        {/* 4. Premium / FOMO Social matching Screenshot */}
        <Tab.Screen
          name="Premium"
          component={DummyScreen}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              switchToSocial();
            },
          }}
          options={{
            tabBarLabel: 'Premium',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="spotify" size={24} color={color} />
            ),
          }}
        />

        {/* 5. Create matching Screenshot */}
        <Tab.Screen
          name="Create"
          component={DummyScreen}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsCreateOpen(true);
            },
          }}
          options={{
            tabBarLabel: 'Create',
            tabBarIcon: ({ color }) => (
              <Ionicons name="add" size={26} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Persistent Mini-Player Bar across all music tabs */}
      <View
        style={[
          styles.miniPlayerWrapper,
          { bottom: tabBarHeight },
        ]}
      >
        <MiniPlayerBar />
      </View>

      {/* Global Full Player Modal */}
      <FullPlayerModal />

      {/* Create Playlist Modal for the 'Create' tab */}
      <CreatePlaylistModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(pl) => {
          navigation.navigate('PlaylistDetail', { playlistId: pl._id, title: pl.name });
        }}
      />
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
