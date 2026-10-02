import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { MusicBottomTabNavigator } from './MusicBottomTabNavigator';
import { PlaylistDetailScreen } from '../screens/music/PlaylistDetailScreen';
import { LikedSongsScreen } from '../screens/music/LikedSongsScreen';
import { ArtistDetailScreen } from '../screens/music/ArtistDetailScreen';

const Stack = createNativeStackNavigator();

export const MusicNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'android' ? 'fade' : 'slide_from_right',
        contentStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="MusicTabs" component={MusicBottomTabNavigator} />
      <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
      <Stack.Screen name="LikedSongs" component={LikedSongsScreen} />
      <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
    </Stack.Navigator>
  );
};
