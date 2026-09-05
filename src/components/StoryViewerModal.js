import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';

const { width, height } = Dimensions.get('window');

export const StoryViewerModal = ({
  visible,
  story,
  onClose,
  onReply,
}) => {
  const [replyText, setReplyText] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });

    return () => animation.stop();
  }, [visible, story]);

  if (!visible || !story) return null;

  const authorName = story.user?.user_name || story.authorName || 'User';
  const authorAvatar = story.user?.avatar || story.avatar;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden={true} />
      <View style={styles.container}>
        {/* Story Background Image */}
        <Image
          source={{ uri: story.mediaUrl }}
          style={styles.storyImage}
          resizeMode="cover"
        />

        {/* Touch zones: Left (back) and Right (advance) */}
        <View style={styles.touchOverlay}>
          <TouchableOpacity
            style={styles.touchLeft}
            activeOpacity={1}
            onPress={() => onClose()}
          />
          <TouchableOpacity
            style={styles.touchRight}
            activeOpacity={1}
            onPress={() => onClose()}
          />
        </View>

        <SafeAreaView style={styles.contentOverlay}>
          {/* Top Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* User Info Header */}
          <View style={styles.header}>
            <Avatar uri={authorAvatar} name={authorName} size={36} showStoryRing={false} />
            <Text style={styles.username}>{authorName}</Text>
            <Text style={styles.timeText}>1h</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Bottom Reply Bar */}
          <View style={styles.bottomBar}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={`Reply to ${authorName}...`}
              placeholderTextColor="#B0B0B0"
              style={styles.replyInput}
            />
            <TouchableOpacity
              style={styles.heartBtn}
              onPress={() => {
                if (onReply) onReply('❤️');
                onClose();
              }}
            >
              <Ionicons name="heart-outline" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => {
                if (replyText.trim() && onReply) onReply(replyText.trim());
                onClose();
              }}
            >
              <Ionicons name="paper-plane-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  touchOverlay: {
    position: 'absolute',
    top: 60,
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 2,
  },
  contentOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
  },
  progressBarContainer: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  closeBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  heartBtn: {
    padding: 4,
  },
  sendBtn: {
    padding: 4,
  },
});
