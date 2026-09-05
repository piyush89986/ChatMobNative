import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MessageBubble = ({
  message,
  isOwnMessage,
  showSenderName = false,
  onMediaPress,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [liked, setLiked] = useState(false);

  const time = formatMessageTime(message.createdAt);
  const senderName = message.sender?.user_name;
  const attachment = message.attechment?.[0];
  const fileType = (attachment?.file_type || '').toLowerCase();

  const handleDocumentPress = async (url) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.log('Error opening document:', e);
    }
  };

  const isLikeMessage = message.message === '❤️' && !attachment;

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.senderContainer : styles.receiverContainer,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onLongPress={() => setLiked(!liked)}
        style={[
          styles.bubbleWrapper,
          isOwnMessage ? styles.senderBubbleWrapper : styles.receiverBubbleWrapper,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isLikeMessage && styles.heartBubble,
            isOwnMessage ? styles.senderBubble : styles.receiverBubble,
          ]}
        >
          {/* Sender Name in Group Chat */}
          {showSenderName && !isOwnMessage && senderName && (
            <Text style={styles.senderNameText}>{senderName}</Text>
          )}

          {/* 1. Image Attachment */}
          {attachment?.url && (fileType === 'image' || fileType.startsWith('image/')) && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onMediaPress && onMediaPress(attachment.url, 'image', message)}
              style={styles.imageContainer}
            >
              <Image
                source={{ uri: attachment.url }}
                style={styles.attachmentImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {/* 2. Video Attachment */}
          {attachment?.url && (fileType === 'video' || fileType.startsWith('video/')) && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onMediaPress && onMediaPress(attachment.url, 'video', message)}
              style={styles.videoContainer}
            >
              <View style={styles.videoOverlay}>
                <View style={styles.playButtonPill}>
                  <Ionicons name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
                <View style={styles.videoTagPill}>
                  <Ionicons name="videocam" size={12} color="#FFFFFF" />
                  <Text style={styles.videoTagText}>Video</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* 3. Audio / Voice Note Attachment */}
          {attachment?.url && (fileType === 'audio' || fileType.startsWith('audio/')) && (
            <View style={styles.audioContainer}>
              <TouchableOpacity
                style={styles.audioPlayBtn}
                onPress={() => setIsPlayingAudio(!isPlayingAudio)}
              >
                <Ionicons
                  name={isPlayingAudio ? 'pause' : 'play'}
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <View style={styles.audioWaveformContainer}>
                <View style={styles.waveBarGroup}>
                  {[12, 22, 16, 26, 14, 20, 10, 18, 24, 15, 8, 20, 16, 12].map((height, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: height,
                          backgroundColor: isPlayingAudio && i < 8 ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.audioDurationText}>
                  {attachment.file_size ? formatFileSize(attachment.file_size) : 'Voice note'}
                </Text>
              </View>
            </View>
          )}

          {/* 4. Document Attachment */}
          {attachment?.url &&
            (fileType === 'document' ||
              fileType === 'file' ||
              (!['image', 'video', 'audio'].includes(fileType) && !fileType.startsWith('image/') && !fileType.startsWith('video/') && !fileType.startsWith('audio/'))) && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleDocumentPress(attachment.url)}
                style={styles.documentContainer}
              >
                <View style={styles.docIconPill}>
                  <Ionicons name="document-text" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName} numberOfLines={1}>
                    {attachment.message || 'Attached File'}
                  </Text>
                  <Text style={styles.docMeta}>
                    {attachment.file_size ? formatFileSize(attachment.file_size) : 'Document'} · Tap to open
                  </Text>
                </View>
                <Ionicons name="download-outline" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}

          {/* Text Message */}
          {Boolean(message.message) && (
            <Text
              style={[
                styles.messageText,
                isLikeMessage && styles.heartText,
                isOwnMessage ? styles.senderText : styles.receiverText,
              ]}
            >
              {message.message}
            </Text>
          )}

          {/* Footer with Timestamp and Receipt Status */}
          {!isLikeMessage && (
            <View style={styles.footer}>
              <Text
                style={[
                  styles.timeText,
                  isOwnMessage ? styles.senderTime : styles.receiverTime,
                ]}
              >
                {time}
              </Text>

              {isOwnMessage && (
                <Ionicons
                  name={
                    message.seen && message.seen.length > 0
                      ? 'checkmark-done'
                      : message.delivered
                      ? 'checkmark-done-outline'
                      : 'checkmark-outline'
                  }
                  size={14}
                  color={
                    message.seen && message.seen.length > 0
                      ? COLORS.accentCyan
                      : 'rgba(255,255,255,0.7)'
                  }
                  style={styles.checkIcon}
                />
              )}
            </View>
          )}
        </View>

        {/* Heart / Reaction badge */}
        {liked && (
          <View
            style={[
              styles.heartBadge,
              isOwnMessage ? styles.heartBadgeSender : styles.heartBadgeReceiver,
            ]}
          >
            <Text style={{ fontSize: 13 }}>❤️</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2.5,
    paddingHorizontal: 12,
    width: '100%',
    flexDirection: 'row',
  },
  senderContainer: {
    justifyContent: 'flex-end',
  },
  receiverContainer: {
    justifyContent: 'flex-start',
  },
  bubbleWrapper: {
    maxWidth: '78%',
    position: 'relative',
  },
  senderBubbleWrapper: {
    alignItems: 'flex-end',
  },
  receiverBubbleWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 1,
  },
  heartBubble: {
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 2,
    elevation: 0,
  },
  senderBubble: {
    backgroundColor: COLORS.bubbleSender,
    borderBottomRightRadius: 5,
  },
  receiverBubble: {
    backgroundColor: COLORS.bubbleReceiver,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#303030',
  },
  senderNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
    marginBottom: 4,
  },
  // 1. Image Styling
  imageContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 4,
  },
  attachmentImage: {
    width: 220,
    height: 200,
    borderRadius: 15,
  },
  // 2. Video Styling
  videoContainer: {
    width: 220,
    height: 160,
    borderRadius: 15,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  videoOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playButtonPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTagPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  videoTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  // 3. Audio Styling
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 10,
    minWidth: 180,
  },
  audioPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveformContainer: {
    flex: 1,
  },
  waveBarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  audioDurationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  // 4. Document Styling
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 14,
    marginBottom: 4,
    gap: 10,
    minWidth: 200,
  },
  docIconPill: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  docMeta: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  // Text
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  heartText: {
    fontSize: 44,
    lineHeight: 48,
  },
  senderText: {
    color: '#FFFFFF',
  },
  receiverText: {
    color: '#F5F5F5',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  timeText: {
    fontSize: 10.5,
  },
  senderTime: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  receiverTime: {
    color: '#8E8E8E',
  },
  checkIcon: {
    marginLeft: 1,
  },
  heartBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#000000',
    elevation: 3,
  },
  heartBadgeSender: {
    right: 6,
  },
  heartBadgeReceiver: {
    left: 6,
  },
});
