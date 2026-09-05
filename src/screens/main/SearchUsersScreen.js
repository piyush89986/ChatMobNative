import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchUsers } from '../../api/user';
import { accessOrCreateChat } from '../../api/chat';
import { getFeedPosts } from '../../api/post';
import { Avatar } from '../../components/Avatar';
import { useSocket } from '../../context/SocketContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 4) / 3;

export const SearchUsersScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState(null);
  const { isUserOnline } = useSocket();

  const fetchExplorePosts = useCallback(async () => {
    try {
      const res = await getFeedPosts(1, 40);
      if (res && res.data && res.data.length > 0) {
        setExplorePosts(res.data);
      } else {
        setExplorePosts([]);
      }
    } catch (e) {
      console.log('Error fetching explore posts:', e.message);
      setExplorePosts([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchExplorePosts();
    }, [fetchExplorePosts])
  );

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsers(query.trim());
        if (res && res.data) {
          setResults(res.data);
        }
      } catch (err) {
        console.log('Search error:', err.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleStartChat = async (targetUser) => {
    setStartingChatId(targetUser._id);
    try {
      const res = await accessOrCreateChat(targetUser._id);
      if (res && res.data) {
        navigation.navigate('ChatDetail', {
          chatId: res.data._id,
          chatData: res.data,
          recipient: targetUser,
        });
      }
    } catch (e) {
      console.log('Error starting chat', e);
    } finally {
      setStartingChatId(null);
    }
  };

  const renderUserItem = ({ item }) => {
    const isOnline = isUserOnline(item._id);
    const isStarting = startingChatId === item._id;

    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.7}
        onPress={() => handleStartChat(item)}
      >
        <Avatar
          uri={item.avatar}
          name={item.user_name}
          size={50}
          isOnline={isOnline}
          showStoryRing={true}
        />

        <View style={styles.userInfo}>
          <Text style={styles.userNameText} numberOfLines={1}>
            {item.user_name}
          </Text>
          <Text style={styles.userSubtext} numberOfLines={1}>
            {item.bio || 'FOMO friend'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleStartChat(item)}
          disabled={isStarting}
        >
          {isStarting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.chatButtonText}>Chat</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderExploreItem = ({ item }) => {
    const isVideo = item.mediaType === 'video' || item.isReel;
    return (
      <TouchableOpacity
        style={styles.exploreItemWrapper}
        activeOpacity={0.8}
        onPress={() => {
          if (isVideo) {
            navigation.navigate('ReelsTab');
          } else {
            navigation.navigate('HomeTab');
          }
        }}
      >
        <Image source={{ uri: item.mediaUrl }} style={styles.exploreImage} resizeMode="cover" />
        {isVideo && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={14} color="#FFFFFF" />
          </View>
        )}
        <View style={styles.viewBadge}>
          <Ionicons name="heart" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.viewBadgeText}>{item.likesCount || item.likes?.length || 0}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E8E" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users or friends..."
            placeholderTextColor="#8E8E8E"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color="#8E8E8E" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Body: Search Results vs Real Explore Posts Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : query.trim() ? (
        /* Single column list with distinct key */
        <FlatList
          key="search-users-list-single"
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#333333" />
              <Text style={styles.emptyText}>No users found for "{query}"</Text>
            </View>
          }
        />
      ) : (
        /* 3-Column Explore Grid of REAL database posts with distinct key */
        <FlatList
          key="explore-real-posts-grid-3"
          data={explorePosts}
          keyExtractor={(item) => item._id}
          renderItem={renderExploreItem}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.exploreGridContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={56} color="#333333" />
              <Text style={styles.emptyText}>No posts yet on FOMO</Text>
              <Text style={styles.emptySubtext}>
                Photos and reels shared on FOMO will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 0,
  },
  exploreGridContent: {
    paddingBottom: 24,
  },
  exploreItemWrapper: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH * 1.35,
    margin: 0.7,
    position: 'relative',
    backgroundColor: '#1C1C1E',
  },
  exploreImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  viewBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userSubtext: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  chatButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 68,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#737373',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
