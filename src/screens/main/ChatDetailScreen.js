import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMessages, sendMessage, acceptChatRequest, declineChatRequest } from '../../api/chat';
import { MessageBubble } from '../../components/MessageBubble';
import { Avatar } from '../../components/Avatar';
import { TypingIndicator } from '../../components/TypingIndicator';
import { MediaViewerModal } from '../../components/MediaViewerModal';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export const ChatDetailScreen = ({ route, navigation }) => {
  const { chatId, chatData, recipient, autoCamera } = route.params || {};
  const { user } = useAuth();
  const {
    socket,
    joinChatRoom,
    sendTyping,
    stopTyping,
    markDelivered,
    isUserOnline,
  } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [chatStatus, setChatStatus] = useState(chatData?.status || 'accepted');
  const [requestedBy, setRequestedBy] = useState(chatData?.requestedBy || null);

  // Selected media state (photo, video, audio, document)
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showAttachTray, setShowAttachTray] = useState(false);

  // Lightbox Media Viewer Modal state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerType, setViewerType] = useState('image');
  const [viewerTitle, setViewerTitle] = useState('');

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Compute recipient details
  const isGroup = chatData?.isGroupChat;
  let otherMember = recipient;
  if (!otherMember && chatData && !isGroup) {
    otherMember = chatData.members?.find((m) => (m._id || m) !== user?._id);
  }

  const chatTitle = isGroup
    ? chatData?.groupName || 'Group'
    : otherMember?.user_name || 'Chat';

  const avatarUri = isGroup ? chatData?.groupIcon : otherMember?.avatar;
  const isOtherOnline = !isGroup && otherMember?._id ? isUserOnline(otherMember._id) : false;

  // 1. Join socket room & fetch messages
  useEffect(() => {
    if (!chatId) return;

    joinChatRoom(chatId);

    const fetchHistory = async () => {
      try {
        const res = await getMessages(chatId, 1, 150);
        if (res && res.data) {
          setMessages(res.data);
          res.data.forEach((msg) => {
            if (msg.sender?._id !== user?._id && !msg.delivered) {
              markDelivered(msg._id, chatId);
            }
          });
        }
      } catch (err) {
        console.log('Error fetching messages:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [chatId, joinChatRoom, markDelivered, user?._id]);

  // Handle auto-camera navigation if passed
  useEffect(() => {
    if (autoCamera) {
      handleLaunchCamera();
    }
  }, [autoCamera]);

  // 2. Socket event listeners for this specific chat
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (newMsg.chatId === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        if (newMsg.sender?._id !== user?._id) {
          markDelivered(newMsg._id, chatId);
        }
      }
    };

    const handleTyping = ({ chatId: tChatId, userId: tUserId, userName: tUserName }) => {
      if (tChatId === chatId && tUserId !== user?._id) {
        setTypingUser(tUserName || 'Someone');
      }
    };

    const handleStopTyping = ({ chatId: tChatId, userId: tUserId }) => {
      if (tChatId === chatId && tUserId !== user?._id) {
        setTypingUser(null);
      }
    };

    const handleDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, delivered: true } : m
        )
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('delivered', handleDelivered);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('delivered', handleDelivered);
    };
  }, [socket, chatId, user?._id, markDelivered]);

  // 3. Handle typing events with debounce
  const handleInputChange = (text) => {
    setInputText(text);

    if (text.length > 0) {
      sendTyping(chatId);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(chatId);
      }, 1500);
    } else {
      stopTyping(chatId);
    }
  };

  // 4. Send message handler (supports text, heart, and all media types)
  const handleSendMessage = async (textOverride = null, mediaOverride = null) => {
    let textToSend = textOverride !== null ? textOverride : inputText.trim();
    const mediaToSend = mediaOverride !== null ? mediaOverride : selectedMedia;

    if (!textToSend && !mediaToSend) return;

    // If only media is being sent with no text, provide default fallback text
    if (!textToSend && mediaToSend) {
      textToSend = mediaToSend.message || (mediaToSend.file_type === 'image' ? '📷 Photo' : '📎 Attachment');
    }

    stopTyping(chatId);
    setSending(true);

    const attachmentPayload = mediaToSend
      ? {
          url: mediaToSend.uri,
          file_type: mediaToSend.file_type || 'image',
          file_size: mediaToSend.file_size || 0,
          message: mediaToSend.message || textToSend,
        }
      : null;

    // Optimistic message
    const tempId = 'temp_' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      chatId,
      sender: {
        _id: user._id,
        user_name: user.user_name,
        avatar: user.avatar,
      },
      message: textToSend,
      attechment: attachmentPayload ? [attachmentPayload] : [],
      createdAt: new Date().toISOString(),
      delivered: false,
      seen: [],
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setSelectedMedia(null);

    try {
      const res = await sendMessage({
        chatId,
        message: textToSend,
        attachment: attachmentPayload,
      });

      if (res && res.data) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.data : m))
        );
      }
    } catch (err) {
      console.log('Error sending message:', err.message);
      Alert.alert('Send Error', err.message || 'Could not send message');
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // 5. Media Pickers
  // 5a. Launch Camera
  const handleLaunchCamera = async () => {
    setShowAttachTray(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/'));
        setSelectedMedia({
          uri: asset.base64 ? `data:${asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg')};base64,${asset.base64}` : asset.uri,
          file_type: isVideo ? 'video' : 'image',
          file_size: asset.fileSize,
          message: asset.fileName || (isVideo ? 'Video' : 'Photo'),
          previewUri: asset.uri,
        });
      }
    } catch (e) {
      console.log('Error taking photo:', e);
    }
  };

  // 5b. Pick from Gallery (Photos & Videos)
  const handlePickFromGallery = async () => {
    setShowAttachTray(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || (asset.mimeType && asset.mimeType.startsWith('video/'));
        setSelectedMedia({
          uri: asset.base64 ? `data:${asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg')};base64,${asset.base64}` : asset.uri,
          file_type: isVideo ? 'video' : 'image',
          file_size: asset.fileSize,
          message: asset.fileName || (isVideo ? 'Video' : 'Photo'),
          previewUri: asset.uri,
        });
      }
    } catch (e) {
      console.log('Error picking gallery media:', e);
    }
  };

  // 5c. Pick Document / File
  const handlePickDocument = async () => {
    setShowAttachTray(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          file_type: 'document',
          file_size: asset.size,
          message: asset.name || 'Document',
          previewUri: null,
        });
      }
    } catch (e) {
      console.log('Error picking document:', e);
    }
  };

  // 5d. Pick Audio / Voice Note
  const handlePickAudio = async () => {
    setShowAttachTray(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          file_type: 'audio',
          file_size: asset.size,
          message: asset.name || 'Audio Clip',
          previewUri: null,
        });
      }
    } catch (e) {
      console.log('Error picking audio:', e);
    }
  };

  // 6. Media Viewer Trigger
  const handleMediaPress = (url, type, msg) => {
    setViewerUrl(url);
    setViewerType(type);
    setViewerTitle(msg?.sender?.user_name || chatTitle);
    setViewerVisible(true);
  };

  // 7. Accept / Decline chat requests
  const handleAccept = async () => {
    try {
      await acceptChatRequest(chatId);
      setChatStatus('accepted');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDecline = async () => {
    try {
      await declineChatRequest(chatId);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const isPending = chatStatus === 'pending';
  const isIncomingRequest = isPending && requestedBy !== user?._id;
  const isOutgoingRequest = isPending && requestedBy === user?._id;
  const hasTextOrMedia = Boolean(inputText.trim() || selectedMedia);

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={styles.container}
      >
        {/* 1. Instagram Direct Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerProfile}
            activeOpacity={0.8}
            onPress={() => {
              if (otherMember) {
                // View other user
              }
            }}
          >
            <Avatar
              uri={avatarUri}
              name={chatTitle}
              size={36}
              isOnline={isOtherOnline}
              showOnlineBadge={!isGroup && isOtherOnline}
            />

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {chatTitle}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {typingUser
                  ? `${typingUser} is typing...`
                  : isGroup
                  ? `${chatData?.members?.length || ''} members`
                  : isOtherOnline
                  ? 'Active now'
                  : 'Active recently'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="call-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="videocam-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Request Warning Bar */}
        {isIncomingRequest && (
          <View style={styles.requestBanner}>
            <Text style={styles.requestBannerTitle}>
              Message Request from {chatTitle}
            </Text>
            <Text style={styles.requestBannerSubtitle}>
              If you accept, they will be able to message and see when you are active.
            </Text>
            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                <Text style={styles.declineBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isOutgoingRequest && (
          <View style={styles.pendingNoticeBanner}>
            <Ionicons name="time-outline" size={15} color={COLORS.pendingBadge} />
            <Text style={styles.pendingNoticeText}>
              Invitation sent. Waiting for {chatTitle} to accept.
            </Text>
          </View>
        )}

        {/* Messages List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => (item._id ? `${item._id}_${index}` : String(index))}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwnMessage={item.sender?._id === user?._id}
                showSenderName={isGroup}
                onMediaPress={handleMediaPress}
              />
            )}
            contentContainerStyle={styles.messagesListContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Typing Indicator */}
        {typingUser && <TypingIndicator userName={typingUser} />}

        {/* Selected Media Preview Chip */}
        {selectedMedia && (
          <View style={styles.mediaPreviewBar}>
            {selectedMedia.previewUri ? (
              <Image
                source={{ uri: selectedMedia.previewUri }}
                style={styles.mediaThumbnail}
              />
            ) : (
              <View style={styles.docThumbnailPill}>
                <Ionicons
                  name={selectedMedia.file_type === 'audio' ? 'musical-notes' : 'document-text'}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            )}

            <View style={styles.mediaPreviewInfo}>
              <Text style={styles.mediaPreviewTitle} numberOfLines={1}>
                {selectedMedia.message || selectedMedia.file_type.toUpperCase()}
              </Text>
              <Text style={styles.mediaPreviewSubtitle}>
                Ready to send · Tap send below
              </Text>
            </View>

            <TouchableOpacity
              style={styles.removeMediaBtn}
              onPress={() => setSelectedMedia(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color="#A8A8A8" />
            </TouchableOpacity>
          </View>
        )}

        {/* 2. Instagram Direct Bottom Input Bar */}
        <View style={styles.inputContainer}>
          {/* Blue Camera Pill Button */}
          <TouchableOpacity
            style={styles.blueCameraBtn}
            onPress={handleLaunchCamera}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Plus / Media Tray Trigger */}
          <TouchableOpacity
            style={styles.plusBtn}
            onPress={() => setShowAttachTray(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Pill TextInput */}
          <View style={styles.pillInputWrapper}>
            <TextInput
              value={inputText}
              onChangeText={handleInputChange}
              placeholder="Message..."
              placeholderTextColor="#737373"
              style={styles.textInput}
              multiline
              maxLength={1000}
            />

            {/* Right inside pill actions when empty: Gallery icon & Mic icon */}
            {!hasTextOrMedia && (
              <View style={styles.inputInnerActions}>
                <TouchableOpacity
                  onPress={handlePickAudio}
                  style={styles.innerActionBtn}
                >
                  <Ionicons name="mic-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickFromGallery}
                  style={styles.innerActionBtn}
                >
                  <Ionicons name="image-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Right Action: Heart (when empty) vs Send (when active) */}
          {hasTextOrMedia ? (
            <TouchableOpacity
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage()}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#0095F6" />
              ) : (
                <Text style={styles.sendBtnText}>Send</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => handleSendMessage('❤️', null)}
              activeOpacity={0.7}
            >
              <Ionicons name="heart-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Media Attachment Action Sheet Tray Modal */}
        <Modal
          visible={showAttachTray}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAttachTray(false)}
        >
          <TouchableOpacity
            style={styles.trayBackdrop}
            activeOpacity={1}
            onPress={() => setShowAttachTray(false)}
          >
            <View style={styles.traySheet}>
              <View style={styles.trayDragHandle} />
              <Text style={styles.trayTitle}>Share Content</Text>

              <View style={styles.trayGrid}>
                {/* 1. Camera */}
                <TouchableOpacity style={styles.trayOption} onPress={handleLaunchCamera}>
                  <View style={[styles.trayIconCircle, { backgroundColor: '#0095F6' }]}>
                    <Ionicons name="camera" size={26} color="#FFFFFF" />
                  </View>
                  <Text style={styles.trayOptionLabel}>Camera</Text>
                </TouchableOpacity>

                {/* 2. Photos & Videos */}
                <TouchableOpacity style={styles.trayOption} onPress={handlePickFromGallery}>
                  <View style={[styles.trayIconCircle, { backgroundColor: '#833AB4' }]}>
                    <Ionicons name="images" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.trayOptionLabel}>Photos/Videos</Text>
                </TouchableOpacity>

                {/* 3. Documents */}
                <TouchableOpacity style={styles.trayOption} onPress={handlePickDocument}>
                  <View style={[styles.trayIconCircle, { backgroundColor: '#FD1D1D' }]}>
                    <Ionicons name="document-text" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.trayOptionLabel}>Document</Text>
                </TouchableOpacity>

                {/* 4. Audio */}
                <TouchableOpacity style={styles.trayOption} onPress={handlePickAudio}>
                  <View style={[styles.trayIconCircle, { backgroundColor: '#00BA7C' }]}>
                    <Ionicons name="musical-notes" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.trayOptionLabel}>Audio Clip</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.trayCancelBtn}
                onPress={() => setShowAttachTray(false)}
              >
                <Text style={styles.trayCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 4. Lightbox Full-screen Media Viewer */}
        <MediaViewerModal
          visible={viewerVisible}
          mediaUrl={viewerUrl}
          mediaType={viewerType}
          title={viewerTitle}
          onClose={() => setViewerVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F1F1F',
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#737373',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 6,
  },
  headerIconBtn: {
    padding: 4,
  },
  requestBanner: {
    backgroundColor: '#121212',
    padding: 16,
    borderBottomWidth: 0.5,
    borderColor: '#262626',
  },
  requestBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  requestBannerSubtitle: {
    fontSize: 12,
    color: '#A8A8A8',
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#262626',
    alignItems: 'center',
  },
  declineBtnText: {
    color: '#ED4956',
    fontWeight: '600',
    fontSize: 13,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0095F6',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  pendingNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  pendingNoticeText: {
    color: COLORS.pendingBadge,
    fontSize: 12,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesListContent: {
    paddingVertical: 12,
  },
  // Media preview bar before sending
  mediaPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    padding: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#303030',
  },
  mediaThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  docThumbnailPill: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreviewInfo: {
    flex: 1,
    marginLeft: 10,
  },
  mediaPreviewTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  mediaPreviewSubtitle: {
    color: '#737373',
    fontSize: 11,
    marginTop: 2,
  },
  removeMediaBtn: {
    padding: 6,
  },
  // Bottom Input Bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#000000',
    gap: 6,
  },
  blueCameraBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 40,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    paddingVertical: 8,
  },
  inputInnerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 6,
  },
  innerActionBtn: {
    padding: 3,
  },
  sendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#0095F6',
    fontSize: 15,
    fontWeight: '700',
  },
  heartBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tray Modal Sheet
  trayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  traySheet: {
    backgroundColor: '#1C1C1C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  trayDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444444',
    alignSelf: 'center',
    marginBottom: 14,
  },
  trayTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  trayGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  trayOption: {
    alignItems: 'center',
    gap: 8,
  },
  trayIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  trayOptionLabel: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '500',
  },
  trayCancelBtn: {
    backgroundColor: '#262626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  trayCancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
