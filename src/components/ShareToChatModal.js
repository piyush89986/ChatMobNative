import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Share,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { getMyChats, sendMessage } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const { width, height } = Dimensions.get('window');

export const ShareToChatModal = ({
  visible,
  item,
  itemType = 'post', // 'post' | 'reel' | 'story'
  onClose,
}) => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentMap, setSentMap] = useState({}); // { [chatId]: true }
  const [sendingMap, setSendingMap] = useState({}); // { [chatId]: true }

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSentMap({});
      return;
    }

    const loadChats = async () => {
      setLoading(true);
      try {
        const res = await getMyChats();
        if (res && res.data) {
          // Filter accepted or valid active chats
          const active = res.data.filter((c) => c.status !== 'pending');
          setChats(active.length > 0 ? active : res.data);
        }
      } catch (err) {
        console.log('Error loading chats for share:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [visible]);

  const handleSendToChat = async (chat) => {
    if (!item || sentMap[chat._id] || sendingMap[chat._id]) return;

    setSendingMap((prev) => ({ ...prev, [chat._id]: true }));

    const mediaUrl = item.mediaUrl || item.avatar || '';
    const isVideo = item.mediaType === 'video' || item.isReel || Boolean(mediaUrl.match(/\.(mp4|mov|webm)/i));
    const label = itemType === 'reel' ? 'Reel' : itemType === 'story' ? 'Story' : 'Post';

    const attachmentPayload = {
      url: mediaUrl,
      file_type: isVideo ? 'video' : 'image',
      message: item.caption || `Shared ${label}`,
    };

    try {
      await sendMessage({
        chatId: chat._id,
        message: `Shared a ${label}`,
        attachment: attachmentPayload,
      });

      setSentMap((prev) => ({ ...prev, [chat._id]: true }));
    } catch (err) {
      console.log('Error sending post to chat:', err.message);
    } finally {
      setSendingMap((prev) => ({ ...prev, [chat._id]: false }));
    }
  };

  const handleExternalShare = async () => {
    if (!item) return;
    try {
      const url = item.mediaUrl || '';
      const label = itemType === 'reel' ? 'Reel' : itemType === 'story' ? 'Story' : 'Post';
      await Share.share({
        title: `FOMO ${label}`,
        message: `Check out this ${label} on FOMO: ${url}`,
        url: url,
      });
    } catch (e) {
      console.log('External share error:', e);
    }
  };

  // Extract contact info for each chat
  const filteredChats = chats.filter((chat) => {
    let name = chat.chatName || '';
    if (!chat.isGroupChat && chat.members) {
      const other = chat.members.find((m) => (m._id || m) !== user?._id);
      if (other) {
        name = other.user_name || other.name || other.email || name;
      }
    }
    return name.toLowerCase().includes(searchQuery.trim().toLowerCase());
  });

  const renderChatItem = ({ item: chat }) => {
    let chatTitle = chat.chatName || 'Chat';
    let chatAvatar = null;
    let isOnline = false;

    if (!chat.isGroupChat && chat.members) {
      const other = chat.members.find((m) => (m._id || m) !== user?._id);
      if (other) {
        chatTitle = other.user_name || other.name || other.email || 'Friend';
        chatAvatar = other.avatar;
        isOnline = isUserOnline ? isUserOnline(other._id) : false;
      }
    }

    const isSent = Boolean(sentMap[chat._id]);
    const isSending = Boolean(sendingMap[chat._id]);

    return (
      <View style={styles.chatRow}>
        <View style={styles.chatLeft}>
          <Avatar
            uri={chatAvatar}
            name={chatTitle}
            size={48}
            isOnline={isOnline}
            showOnlineBadge={isOnline}
          />
          <View style={styles.chatInfo}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {chatTitle}
            </Text>
            <Text style={styles.chatSubtitle} numberOfLines={1}>
              {chat.isGroupChat ? 'Group' : isOnline ? 'Active now' : 'FOMO Direct'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            isSent ? styles.sentBtn : styles.activeSendBtn,
          ]}
          disabled={isSent || isSending}
          onPress={() => handleSendToChat(chat)}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isSent ? (
            <View style={styles.sentContent}>
              <Ionicons name="checkmark" size={16} color="#00BA88" style={{ marginRight: 4 }} />
              <Text style={styles.sentBtnText}>Sent</Text>
            </View>
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Top Handle Bar */}
          <View style={styles.dragPill} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Share to FOMO Chat</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={17} color="#8E8E93" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search friends..."
              placeholderTextColor="#8E8E93"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          {/* Chats / Friends List */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#0095F6" />
            </View>
          ) : filteredChats.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={44} color="#555555" />
              <Text style={styles.emptyText}>No recent chats found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredChats}
              keyExtractor={(item) => item._id}
              renderItem={renderChatItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Bottom Actions Row: External Share (WhatsApp, Instagram etc) */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.externalShareBtn}
              onPress={handleExternalShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.externalShareText}>Share via other apps...</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    height: height * 0.68,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555555',
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2C2C2E',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  chatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  chatInfo: {
    marginLeft: 12,
    flex: 1,
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  chatSubtitle: {
    color: '#8E8E93',
    fontSize: 12.5,
    marginTop: 2,
  },
  sendBtn: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 76,
  },
  activeSendBtn: {
    backgroundColor: '#0095F6',
  },
  sentBtn: {
    backgroundColor: '#2C2C2E',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  sentBtnText: {
    color: '#00BA88',
    fontSize: 13.5,
    fontWeight: '600',
  },
  sentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  bottomBar: {
    borderTopWidth: 0.5,
    borderTopColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E1E1E',
  },
  externalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
    paddingVertical: 12,
  },
  externalShareText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
