import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { searchUsers } from '../../api/user';
import { accessOrCreateChat } from '../../api/chat';
import { Avatar } from '../../components/Avatar';
import { useSocket } from '../../context/SocketContext';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 4) / 3;

const EXPLORE_ITEMS = [
  { id: 'ex_1', views: '1.1M', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500', isVideo: true },
  { id: 'ex_2', views: '691K', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500', isVideo: true },
  { id: 'ex_3', views: '7.9M', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500', isVideo: true },
  { id: 'ex_4', views: '1M', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500', isVideo: true },
  { id: 'ex_5', views: '289K', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500', isVideo: false },
  { id: 'ex_6', views: '171K', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', isVideo: true },
  { id: 'ex_7', views: '261K', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500', isVideo: true },
  { id: 'ex_8', views: '3.8M', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500', isVideo: false },
  { id: 'ex_9', views: '884K', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500', isVideo: true },
  { id: 'ex_10', views: '190K', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500', isVideo: true },
  { id: 'ex_11', views: '1.7M', image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500', isVideo: true },
  { id: 'ex_12', views: '379K', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500', isVideo: false },
];

export const SearchUsersScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState(null);
  const { isUserOnline } = useSocket();

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
    return (
      <TouchableOpacity
        style={styles.exploreItemWrapper}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ReelsTab')}
      >
        <Image source={{ uri: item.image }} style={styles.exploreImage} resizeMode="cover" />
        <View style={styles.viewBadge}>
          <Ionicons name="eye-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.viewBadgeText}>{item.views}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Search with Meta AI Input Bar matching Screenshot 2 */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E8E" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search with Meta AI"
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

      {/* 2. Body Content: Search Results OR Trending Explore Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : query.trim() ? (
        <FlatList
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
        /* Explore 3-Column Grid matching Screenshot 2 */
        <FlatList
          data={EXPLORE_ITEMS}
          keyExtractor={(item) => item.id}
          renderItem={renderExploreItem}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.exploreGridContent}
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
    paddingBottom: 20,
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
  viewBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  userSubtext: {
    color: '#8E8E8E',
    fontSize: 13,
  },
  chatButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    color: '#737373',
    fontSize: 15,
    marginTop: 12,
  },
});
