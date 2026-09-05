import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { searchUsers } from '../../api/user';
import { accessOrCreateChat } from '../../api/chat';
import { Avatar } from '../../components/Avatar';
import { useSocket } from '../../context/SocketContext';

const QUICK_TAGS = ['Friends', 'Nearby', 'Developers', 'Music', 'Gaming', 'Photography'];

export const SearchUsersScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState(null);
  const [recentSearches, setRecentSearches] = useState(['Alex', 'Piyush', 'Sarah']);
  const { isUserOnline } = useSocket();

  // Load initial suggested users by searching a common prefix
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await searchUsers('a');
        if (res && res.data) {
          setSuggested(res.data.slice(0, 8));
        }
      } catch (err) {
        // Silent fallback
      }
    };
    fetchSuggestions();
  }, []);

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
    // Add to recents
    if (targetUser.user_name && !recentSearches.includes(targetUser.user_name)) {
      setRecentSearches((prev) => [targetUser.user_name, ...prev.slice(0, 4)]);
    }

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
          size={54}
          isOnline={isOnline}
          showOnlineBadge={isOnline}
          showStoryRing={true}
        />

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.user_name}
            </Text>
            {isOnline && <View style={styles.activeDot} />}
          </View>
          <Text style={styles.userHandle} numberOfLines={1}>
            {item.email || item.phone || '@instagram_user'}
          </Text>
          {item.bio ? (
            <Text style={styles.userBio} numberOfLines={1}>
              {item.bio}
            </Text>
          ) : (
            <Text style={styles.userBio} numberOfLines={1}>
              Active on Direct
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.messageBtn, isStarting && styles.messageBtnDisabled]}
          onPress={() => handleStartChat(item)}
          disabled={isStarting}
        >
          {isStarting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.messageBtnText}>Chat</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={17} color={COLORS.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search friends by name or username"
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* When query is empty: Show Suggested and Recent Searches */}
      {!query.trim() ? (
        <ScrollView style={styles.emptySearchScroll} showsVerticalScrollIndicator={false}>
          {/* Quick Categories */}
          <View style={styles.tagsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsContent}>
              {QUICK_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => setQuery(tag.toLowerCase())}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={() => setRecentSearches([])}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentTagsRow}>
                {recentSearches.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentPill}
                    onPress={() => setQuery(term)}
                  >
                    <Ionicons name="time-outline" size={14} color="#A8A8A8" />
                    <Text style={styles.recentPillText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Suggested For You */}
          {suggested.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Suggested For You</Text>
              {suggested.map((item) => (
                <View key={item._id}>{renderUserItem({ item })}</View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={54} color="#363636" />
              <Text style={styles.emptyText}>No accounts found for "{query}"</Text>
              <Text style={styles.emptySubText}>
                Check spelling or search for someone else by username.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '400',
  },
  tagsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F1F1F',
  },
  tagsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#303030',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptySearchScroll: {
    flex: 1,
  },
  sectionBlock: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  clearText: {
    color: '#0095F6',
    fontSize: 13,
    fontWeight: '600',
  },
  recentTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  recentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#303030',
  },
  recentPillText: {
    color: '#E0E0E0',
    fontSize: 13,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.online,
  },
  userHandle: {
    fontSize: 12.5,
    color: '#A8A8A8',
    marginTop: 1,
  },
  userBio: {
    fontSize: 11.5,
    color: '#737373',
    marginTop: 2,
  },
  messageBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  messageBtnDisabled: {
    opacity: 0.6,
  },
  messageBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubText: {
    color: '#737373',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
