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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Direct Header matching Screenshot 3 */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={{ marginRight: 10, padding: 4 }}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.accountSelector}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerUsername} numberOfLines={1}>
              {user?.user_name || 'Direct'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
            <View style={styles.directRedBadgeDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('SearchUsers')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Search or ask Meta AI matching Screenshot 3 */}
      <TouchableOpacity
        style={styles.searchBar}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SearchUsers')}
      >
        <Ionicons name="search" size={18} color="#8E8E8E" style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search or ask Meta AI</Text>
      </TouchableOpacity>

      {/* 3. Notes Tray matching Screenshot 3 */}
      <View style={styles.notesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.notesListContent}
        >
          {/* User's own Note with "Just curious..." bubble */}
          <TouchableOpacity
            style={styles.noteItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.noteAvatarWrapper}>
              <View style={styles.noteSpeechBubble}>
                <Text style={styles.noteSpeechText} numberOfLines={2}>
                  Just curious...
                </Text>
              </View>
              <Avatar uri={user?.avatar} name={user?.user_name || 'Me'} size={68} />
            </View>
            <Text style={styles.noteUserName} numberOfLines={1}>
              Your note
            </Text>
            <Text style={styles.noteSubtitle}>📍 Location off</Text>
          </TouchableOpacity>

          {/* Friend Note 1: Manglesh */}
          <TouchableOpacity
            style={styles.noteItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SearchUsers')}
          >
            <View style={styles.noteAvatarWrapper}>
              <View style={styles.noteSpeechBubble}>
                <Text style={styles.noteSpeechText} numberOfLines={2}>
                  || Tamara..{'\n'}Geeta Jhal.. 😊
                </Text>
              </View>
              <Avatar
                uri="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
                name="Manglesh"
                size={68}
                showStoryRing={true}
              />
            </View>
            <Text style={styles.noteUserName} numberOfLines={1}>
              मंगलेश सिंह मौर्य 🔱
            </Text>
          </TouchableOpacity>

          {/* Friend Note 2: Sumit */}
          <TouchableOpacity
            style={styles.noteItem}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SearchUsers')}
          >
            <View style={styles.noteAvatarWrapper}>
              <View style={styles.noteSpeechBubble}>
                <Text style={styles.noteSpeechText} numberOfLines={2}>
                  || Legacy{'\n'}Vikram Sar...
                </Text>
              </View>
              <Avatar
                uri="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                name="Sumit"
                size={68}
                showStoryRing={true}
              />
            </View>
            <Text style={styles.noteUserName} numberOfLines={1}>
              SUMIT 🔱
            </Text>
          </TouchableOpacity>

          {/* Dynamic contacts */}
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
              </View>
              <Text style={styles.noteUserName} numberOfLines={1}>
                {contact.user.user_name?.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 4. Filter Tabs: Messages vs Requests */}
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
            <Text style={[styles.tabTitle, { color: '#0095F6' }]}>
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
  directRedBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF2D55',
    marginLeft: 6,
  },
  noteSpeechBubble: {
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    maxWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#383838',
  },
  noteSpeechText: {
    color: '#D4D4D4',
    fontSize: 9.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  noteSubtitle: {
    color: '#8E8E8E',
    fontSize: 9,
    marginTop: 1,
    textAlign: 'center',
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
