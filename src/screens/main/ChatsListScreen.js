import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMyChats } from '../../api/chat';
import { ChatListItem } from '../../components/ChatListItem';
import { Avatar } from '../../components/Avatar';
import { useFocusEffect } from '@react-navigation/native';

export const ChatsListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { socket, isConnected, isUserOnline } = useSocket();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'requests'

  const fetchChats = useCallback(async () => {
    try {
      const res = await getMyChats();
      if (res && res.data) {
        setChats(res.data);
      }
    } catch (err) {
      console.log('Error fetching chats:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((c) => c._id === newMsg.chatId);
        if (chatIndex >= 0) {
          const updatedChat = {
            ...prevChats[chatIndex],
            lastMessage: newMsg,
            updatedAt: new Date().toISOString(),
          };
          const otherChats = prevChats.filter((c) => c._id !== newMsg.chatId);
          return [updatedChat, ...otherChats];
        } else {
          fetchChats();
          return prevChats;
        }
      });
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, fetchChats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const acceptedChats = chats.filter((c) => c.status !== 'pending');
  const pendingRequests = chats.filter(
    (c) => c.status === 'pending' && c.requestedBy !== user?._id
  );
  const mySentRequests = chats.filter(
    (c) => c.status === 'pending' && c.requestedBy === user?._id
  );

  const displayedChats =
    activeTab === 'chats' ? [...acceptedChats, ...mySentRequests] : pendingRequests;

  // Extract contacts for Instagram Notes & Active Reel
  const noteContacts = [];
  const seenUserIds = new Set();

  acceptedChats.forEach((chat) => {
    if (!chat.isGroupChat && chat.members) {
      const other = chat.members.find((m) => (m._id || m) !== user?._id);
      if (other && !seenUserIds.has(other._id)) {
        seenUserIds.add(other._id);
        noteContacts.push({
          user: other,
          chatId: chat._id,
          isOnline: isUserOnline(other._id),
        });
      }
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Instagram Direct Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.accountSelector}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.headerUsername} numberOfLines={1}>
            {user?.user_name || 'Direct'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? COLORS.online : COLORS.error },
            ]}
          />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('CreateGroup')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="people-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('SearchUsers')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Instagram Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SearchUsers')}
      >
        <Ionicons name="search" size={17} color={COLORS.textMuted} style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search</Text>
      </TouchableOpacity>

      {/* 3. Instagram Notes & Active Reel */}
      <View style={styles.notesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.notesListContent}
        >
          {/* User's own Note Pill */}
          <TouchableOpacity
            style={styles.noteItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.noteAvatarWrapper}>
              <Avatar uri={user?.avatar} name={user?.user_name || 'Me'} size={68} />
              <View style={styles.noteBubble}>
                <Text style={styles.noteBubbleText} numberOfLines={1}>
                  Your note
                </Text>
                <View style={styles.noteBubblePlus}>
                  <Ionicons name="add" size={12} color="#FFFFFF" />
                </View>
              </View>
            </View>
            <Text style={styles.noteUserName} numberOfLines={1}>
              Your note
            </Text>
          </TouchableOpacity>

          {/* Friends with Stories / Notes */}
          {noteContacts.map((contact) => (
            <TouchableOpacity
              key={contact.user._id}
              style={styles.noteItem}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('ChatDetail', {
                  chatId: contact.chatId,
                  recipient: contact.user,
                })
              }
            >
              <View style={styles.noteAvatarWrapper}>
                <Avatar
                  uri={contact.user.avatar}
                  name={contact.user.user_name}
                  size={68}
                  isOnline={contact.isOnline}
                  showOnlineBadge={contact.isOnline}
                  showStoryRing={true}
                />
                {contact.isOnline && (
                  <View style={styles.activeNoteBadge}>
                    <Text style={styles.activeNoteText}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.noteUserName} numberOfLines={1}>
                {contact.user.user_name?.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 4. Instagram Direct Filter Tabs: Messages vs Requests */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'chats' && styles.tabItemActive]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabTitle, activeTab === 'chats' && styles.tabTitleActive]}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'requests' && styles.tabItemActive]}
          onPress={() => setActiveTab('requests')}
        >
          <View style={styles.requestTabRow}>
            <Text style={[styles.tabTitle, activeTab === 'requests' && styles.tabTitleActive]}>
              Requests
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* 5. Chat List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : (
        <FlatList
          data={displayedChats}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isGroup = item.isGroupChat;
            let otherId = null;
            if (!isGroup && item.members) {
              const other = item.members.find((m) => (m._id || m) !== user?._id);
              otherId = other?._id;
            }

            return (
              <ChatListItem
                chat={item}
                currentUserId={user?._id}
                isOnline={isGroup ? false : isUserOnline(otherId)}
                onPress={() =>
                  navigation.navigate('ChatDetail', {
                    chatId: item._id,
                    chatData: item,
                  })
                }
                onCameraPress={() =>
                  navigation.navigate('ChatDetail', {
                    chatId: item._id,
                    chatData: item,
                    autoCamera: true,
                  })
                }
              />
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#0095F6']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={activeTab === 'chats' ? 'paper-plane-outline' : 'mail-unread-outline'}
                  size={46}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'chats' ? 'Your messages' : 'No message requests'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'chats'
                  ? 'Send a message or find friends to start chatting.'
                  : 'Requests from users not in your messages will appear here.'}
              </Text>
              {activeTab === 'chats' && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigation.navigate('SearchUsers')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyActionBtnText}>Find Friends</Text>
                </TouchableOpacity>
              )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#000000',
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUsername: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    maxWidth: 220,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  headerActionBtn: {
    padding: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 12,
    height: 38,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '400',
  },
  notesSection: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
    paddingBottom: 12,
  },
  notesListContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  noteItem: {
    alignItems: 'center',
    width: 74,
  },
  noteAvatarWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  noteBubble: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#363636',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 10,
    elevation: 3,
  },
  noteBubbleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  noteBubblePlus: {
    backgroundColor: '#0095F6',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNoteBadge: {
    position: 'absolute',
    top: -6,
    backgroundColor: '#262626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#363636',
  },
  activeNoteText: {
    color: COLORS.online,
    fontSize: 9.5,
    fontWeight: '700',
  },
  noteUserName: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 24,
  },
  tabItem: {
    paddingVertical: 6,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  tabTitle: {
    color: '#737373',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTitleActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  requestTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestsBadge: {
    backgroundColor: '#0095F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  requestsBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#A8A8A8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});
