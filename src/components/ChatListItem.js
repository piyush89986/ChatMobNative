import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
};

export const ChatListItem = ({
  chat,
  currentUserId,
  isOnline = false,
  onPress,
  onCameraPress,
}) => {
  // Determine if group or 1-on-1
  const isGroup = chat.isGroupChat;
  let title = 'Chat';
  let avatarUri = null;
  let otherUser = null;

  if (isGroup) {
    title = chat.groupName || 'Group Chat';
    avatarUri = chat.groupIcon;
  } else {
    // 1-on-1: Find other member
    otherUser = chat.members?.find((m) => (m._id || m) !== currentUserId);
    if (otherUser) {
      title = otherUser.user_name || 'User';
      avatarUri = otherUser.avatar;
    }
  }

  const lastMsg = chat.lastMessage;
  const isLastMsgFromMe = lastMsg?.sender === currentUserId || lastMsg?.sender?._id === currentUserId;

  let lastMsgPreview = 'Say hello! 👋';
  if (lastMsg) {
    const attachment = lastMsg.attechment?.[0];
    const prefix = isLastMsgFromMe ? 'You: ' : '';
    if (attachment) {
      const type = (attachment.file_type || '').toLowerCase();
      if (type === 'image' || type.startsWith('image/')) {
        lastMsgPreview = `${prefix}📷 Photo`;
      } else if (type === 'video' || type.startsWith('video/')) {
        lastMsgPreview = `${prefix}🎥 Video`;
      } else if (type === 'audio' || type.startsWith('audio/')) {
        lastMsgPreview = `${prefix}🎵 Voice note`;
      } else {
        lastMsgPreview = `${prefix}📄 Document`;
      }
    } else if (lastMsg.message === '❤️') {
      lastMsgPreview = `${prefix}❤️ Liked`;
    } else if (lastMsg.message) {
      if (lastMsg.message.match(/\.(jpeg|jpg|png|gif|webp)$/i)) {
        lastMsgPreview = `${prefix}📷 Photo`;
      } else if (lastMsg.message.match(/\.(mp4|mov|webm|mkv)$/i)) {
        lastMsgPreview = `${prefix}🎥 Video`;
      } else {
        lastMsgPreview = `${prefix}${lastMsg.message}`;
      }
    }
  }

  const time = formatTime(chat.updatedAt || chat.createdAt);
  const isPending = chat.status === 'pending';
  const isRequestedByMe = chat.requestedBy === currentUserId;
  const isUnread = !isLastMsgFromMe && lastMsg && (!lastMsg.seen || lastMsg.seen.length === 0);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <Avatar
        uri={avatarUri}
        name={title}
        size={58}
        isOnline={isOnline}
        showOnlineBadge={!isGroup && isOnline}
        showStoryRing={!isGroup && isOnline}
      />

      <View style={styles.content}>
        <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.messagePreview,
              isUnread ? styles.unreadPreview : styles.readPreview,
              isPending && styles.pendingText,
            ]}
            numberOfLines={1}
          >
            {isPending
              ? isRequestedByMe
                ? 'Request sent · Waiting for approval'
                : '📩 Sent you a message request'
              : lastMsgPreview}
          </Text>

          <Text style={styles.separatorDot}>·</Text>
          <Text style={[styles.time, isUnread && styles.unreadTime]}>{time}</Text>

          {isPending && (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>
                {isRequestedByMe ? 'Pending' : 'New'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Trailing: Camera Quick Action or Unread Dot */}
      <View style={styles.trailingContainer}>
        {isUnread ? (
          <View style={styles.unreadDot} />
        ) : (
          <TouchableOpacity
            style={styles.cameraReplyBtn}
            onPress={onCameraPress || onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="camera-outline" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  messagePreview: {
    fontSize: 13.5,
    maxWidth: '75%',
  },
  readPreview: {
    color: '#A8A8A8',
    fontWeight: '400',
  },
  unreadPreview: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  separatorDot: {
    color: '#737373',
    marginHorizontal: 4,
    fontSize: 13,
  },
  time: {
    fontSize: 12.5,
    color: '#737373',
  },
  unreadTime: {
    color: '#0095F6',
    fontWeight: '600',
  },
  pendingText: {
    color: COLORS.pendingBadge,
    fontStyle: 'italic',
  },
  requestBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  requestBadgeText: {
    color: COLORS.pendingBadge,
    fontSize: 10,
    fontWeight: '700',
  },
  trailingContainer: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0095F6',
  },
  cameraReplyBtn: {
    padding: 4,
  },
});
