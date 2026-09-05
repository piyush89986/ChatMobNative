import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { ChatDetailScreen } from '../screens/main/ChatDetailScreen';
import { CreatePostScreen } from '../screens/main/CreatePostScreen';
import { NotificationsScreen } from '../screens/main/NotificationsScreen';
import { SearchUsersScreen } from '../screens/main/SearchUsersScreen';
import { CreateGroupScreen } from '../screens/main/CreateGroupScreen';
import { ChatsListScreen } from '../screens/main/ChatsListScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

import { Platform } from 'react-native';

const Stack = createNativeStackNavigator();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'android' ? 'fade' : 'slide_from_right',
        contentStyle: { backgroundColor: '#000000' },
        detachPreviousScreen: false,
      }}
    >
      <Stack.Screen name="BottomTabs" component={BottomTabNavigator} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="DirectMessages" component={ChatsListScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="SearchUsers" component={SearchUsersScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};
