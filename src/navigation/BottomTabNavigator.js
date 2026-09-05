import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/main/HomeScreen';
import { SearchUsersScreen } from '../screens/main/SearchUsersScreen';
import { ChatsListScreen } from '../screens/main/ChatsListScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { CreatePostScreen } from '../screens/main/CreatePostScreen';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#737373',
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

      {/* 2. Explore / Search Users */}
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

      {/* 3. Create Post / Reels */}
      <Tab.Screen
        name="CreateTab"
        component={CreatePostScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={29}
              color={color}
            />
          ),
        }}
      />

      {/* 4. Direct Messages */}
      <Tab.Screen
        name="DirectTab"
        component={ChatsListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'paper-plane' : 'paper-plane-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.profileTabIconWrapper, focused && styles.profileTabActive]}>
              <Avatar
                uri={user?.avatar}
                name={user?.user_name || 'Me'}
                size={26}
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
    height: 54,
    paddingBottom: 4,
    paddingTop: 6,
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
