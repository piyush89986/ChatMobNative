import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ReelsScreen } from '../screens/main/ReelsScreen';
import { ChatsListScreen } from '../screens/main/ChatsListScreen';
import { SearchUsersScreen } from '../screens/main/SearchUsersScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: '#000000' },
        tabBarStyle: [
          styles.tabBar,
          {
            height: 52 + (insets.bottom > 0 ? insets.bottom : 8),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          },
        ],
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8E8E8E',
      }}
    >
      {/* 1. Home Feed */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Reels (Matching Screenshot Tab 2) */}
      <Tab.Screen
        name="ReelsTab"
        component={ReelsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'play-circle' : 'play-circle-outline'}
              size={27}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Direct Messages (Matching Screenshot Tab 3 with red unread dot) */}
      <Tab.Screen
        name="DirectTab"
        component={ChatsListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={focused ? 'paper-plane' : 'paper-plane-outline'}
                size={25}
                color={color}
              />
              <View style={styles.directRedDot} />
            </View>
          ),
        }}
      />

      {/* 4. Explore / Search (Matching Screenshot Tab 4) */}
      <Tab.Screen
        name="SearchTab"
        component={SearchUsersScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* 5. Profile (Matching Screenshot Tab 5) */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.profileTabIconWrapper, focused && styles.profileTabActive]}>
              <Avatar
                uri={user?.avatar}
                name={user?.user_name || 'Me'}
                size={25}
                showStoryRing={false}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: '#262626',
    paddingTop: 6,
    elevation: 8,
  },
  directRedDot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF2D55',
  },
  profileTabIconWrapper: {
    borderRadius: 15,
    padding: 1,
  },
  profileTabActive: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
