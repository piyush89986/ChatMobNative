import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatsListScreen } from '../screens/main/ChatsListScreen';
import { ChatDetailScreen } from '../screens/main/ChatDetailScreen';
import { SearchUsersScreen } from '../screens/main/SearchUsersScreen';
import { CreateGroupScreen } from '../screens/main/CreateGroupScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const Stack = createNativeStackNavigator();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ChatsList" component={ChatsListScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="SearchUsers" component={SearchUsersScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};
