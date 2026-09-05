import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { FeedVideoPlayer } from './FeedVideoPlayer';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

export const PostCard = ({
  post,
  currentUser,
  isActive = true,
  onLikePress,
  onCommentPress,
  onSharePress,
  onUserPress,
}) => {
  const [liked, setLiked] = useState(post.isLikedByMe || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [saved, setSaved] = useState(post.isSavedByMe || false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  // Double-tap heart animation
  const lastTapRef = useRef(null);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  const triggerHeartAnimation = () => {
    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.2,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 350,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (!liked) {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
        if (onLikePress) onLikePress(post._id);
      }
      triggerHeartAnimation();
    } else {
      lastTapRef.current = now;
    }
  };

  const handleToggleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (nextLiked) triggerHeartAnimation();
    if (onLikePress) onLikePress(post._id);
  };

  const author = post.author || {};
  const authorName = author.user_name || 'Instagram User';
  const authorAvatar = author.avatar;

  const caption = post.caption || '';
  const isLongCaption = caption.length > 80;

  return (
    <View style={styles.card}>
      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          activeOpacity={0.8}
          onPress={() => onUserPress && onUserPress(author)}
        >
          <Avatar
            uri={authorAvatar}
            name={authorName}
            size={38}
            showStoryRing={true}
          />
          <View style={styles.headerUserText}>
            <Text style={styles.username} numberOfLines={1}>
              {authorName}
            </Text>
            {post.location ? (
              <Text style={styles.locationText} numberOfLines={1}>
                {post.location}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Media Image / Video with Double-Tap to Like */}
      <View style={styles.imageContainer}>
        {post.mediaType === 'video' || post.isReel || (post.mediaUrl && post.mediaUrl.match(/\.(mp4|mov|webm|mkv)/i)) ? (
          <FeedVideoPlayer
            sourceUrl={post.mediaUrl}
            style={styles.postImage}
            mode="feed"
            isActive={isActive}
            showMuteButton={true}
            onDoubleTap={handleDoubleTap}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleDoubleTap}
            style={styles.postImage}
          >
            <Image
              source={{ uri: post.mediaUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Bursting Heart Animation on Double Tap */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.burstHeartOverlay,
            {
              opacity: heartOpacity,
              transform: [{ scale: heartScale }],
            },
          ]}
        >
          <Ionicons name="heart" size={100} color="#ED4956" />
        </Animated.View>
      </View>

      {/* 3. Action Buttons Row */}
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={handleToggleLike}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={27}
              color={liked ? '#ED4956' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => onCommentPress && onCommentPress(post)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => onSharePress && onSharePress(post)}
          >
            <Ionicons name="paper-plane-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => setSaved(!saved)}
        >
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* 4. Likes Count */}
      <View style={styles.likesContainer}>
        <Text style={styles.likesText}>
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </Text>
      </View>

      {/* 5. Caption */}
      {caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            <Text style={styles.captionUsername}>{authorName} </Text>
            {showFullCaption || !isLongCaption ? caption : `${caption.slice(0, 80)}...`}
            {isLongCaption && !showFullCaption && (
              <Text
                style={styles.moreText}
                onPress={() => setShowFullCaption(true)}
              >
                {' '}more
              </Text>
            )}
          </Text>
        </View>
      ) : null}

      {/* 6. Comments Preview / View all comments */}
      {post.commentsCount > 0 && (
        <TouchableOpacity
          style={styles.commentsLink}
          onPress={() => onCommentPress && onCommentPress(post)}
        >
          <Text style={styles.commentsLinkText}>
            View all {post.commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      {/* 7. Timestamp */}
      <Text style={styles.timestamp}>
        {new Date(post.createdAt || Date.now()).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        }).toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#000000',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerUserText: {
    marginLeft: 10,
    flex: 1,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  locationText: {
    color: '#A8A8A8',
    fontSize: 11,
    marginTop: 1,
  },
  moreBtn: {
    padding: 6,
  },
  imageContainer: {
    width: width,
    height: width, // Square aspect ratio
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  postImage: {
    width: width,
    height: width,
  },
  burstHeartOverlay: {
    position: 'absolute',
    alignSelf: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconBtn: {
    padding: 2,
  },
  likesContainer: {
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  likesText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  captionContainer: {
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  captionText: {
    color: '#F5F5F5',
    fontSize: 13,
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moreText: {
    color: '#737373',
    fontWeight: '500',
  },
  commentsLink: {
    paddingHorizontal: 14,
    marginTop: 2,
    marginBottom: 4,
  },
  commentsLinkText: {
    color: '#737373',
    fontSize: 13,
  },
  timestamp: {
    paddingHorizontal: 14,
    color: '#737373',
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
