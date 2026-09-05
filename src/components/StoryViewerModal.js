import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';

const { width, height } = Dimensions.get('window');

export const StoryViewerModal = ({
  visible,
  story,
  stories = [],
  initialIndex = 0,
  onClose,
  onReply,
  onShare,
}) => {
  const insets = useSafeAreaInsets();
  const storyList = stories && stories.length > 0 ? stories : (story ? [story] : []);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [replyText, setReplyText] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex || 0);
    }
  }, [visible, initialIndex, story]);

  useEffect(() => {
    if (!visible || storyList.length === 0) return;

    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        handleNext();
      }
    });

    return () => animation.stop();
  }, [visible, currentIndex, storyList.length]);

  if (!visible || storyList.length === 0) return null;

  const currentStory = storyList[currentIndex] || storyList[0];
  const authorName = currentStory.user?.user_name || currentStory.authorName || 'User';
  const authorAvatar = currentStory.user?.avatar || currentStory.avatar;

  const handleNext = () => {
    if (currentIndex < storyList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      progressAnim.setValue(0);
    }
  };

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
          source={{ uri: currentStory.mediaUrl }}
          style={styles.storyImage}
          resizeMode="cover"
        />

        {/* Touch zones: Left 40% (Previous) and Right 60% (Next) */}
        <View style={styles.touchOverlay}>
          <TouchableOpacity
            style={styles.touchLeft}
            activeOpacity={1}
            onPress={handlePrev}
          />
          <TouchableOpacity
            style={styles.touchRight}
            activeOpacity={1}
            onPress={handleNext}
          />
        </View>

        {/* Top Section: Strictly Pinned at the Very Top */}
        <View style={[styles.topSection, { paddingTop: Math.max(insets.top, 14) }]}>
          {/* Progress Bars (Multi-segment Instagram style) */}
          <View style={styles.progressContainer}>
            {storyList.map((_, idx) => (
              <View key={`prog_${idx}`} style={styles.progressBarBg}>
                {idx === currentIndex ? (
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
                ) : (
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: idx < currentIndex ? '100%' : '0%' },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* User Info Header: Directly below progress bar */}
          <View style={styles.header}>
            <Avatar uri={authorAvatar} name={authorName} size={36} showStoryRing={false} />
            <Text style={styles.username} numberOfLines={1}>
              {authorName}
            </Text>
            <Text style={styles.timeText}>1h</Text>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Section: Reply Bar Pinned to Bottom */}
        <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
              handleNext();
            }}
          >
            <Ionicons name="heart-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              if (replyText.trim()) {
                if (onReply) onReply(replyText.trim());
                setReplyText('');
                handleNext();
              } else if (onShare) {
                onShare(currentStory);
              }
            }}
          >
            <Ionicons name="paper-plane-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
    top: 90,
    bottom: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 5,
  },
  touchLeft: {
    flex: 2,
  },
  touchRight: {
    flex: 3,
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  progressBarBg: {
    flex: 1,
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
  },
  username: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    maxWidth: width * 0.55,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
  },
  closeBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  heartBtn: {
    padding: 4,
  },
  sendBtn: {
    padding: 4,
  },
});
