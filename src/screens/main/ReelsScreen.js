import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/Avatar';
import { CommentsModal } from '../../components/CommentsModal';
import { getFeedPosts, toggleLike } from '../../api/post';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export const ReelsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);

  const fetchReels = useCallback(async () => {
    try {
      const res = await getFeedPosts(1, 50);
      if (res && res.data && res.data.length > 0) {
        // Filter posts that are marked as reels or videos, or include all feed posts if few reels
        const reelPosts = res.data.filter((p) => p.isReel || p.mediaType === 'video');
        setReels(reelPosts.length > 0 ? reelPosts : res.data);
      } else {
        setReels([]);
      }
    } catch (err) {
      console.log('Error fetching reels:', err.message);
      setReels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReels();
    }, [fetchReels])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReels();
  };

  const handleToggleLike = async (post) => {
    try {
      setReels((prev) =>
        prev.map((r) =>
          r._id === post._id
            ? {
                ...r,
                isLikedByMe: !r.isLikedByMe,
                likesCount: r.isLikedByMe ? Math.max(0, r.likesCount - 1) : r.likesCount + 1,
              }
            : r
        )
      );
      await toggleLike(post._id);
    } catch (e) {
      console.log('Like error on reel:', e);
    }
  };

  const renderReel = ({ item }) => {
    const author = item.author || {};
    const likesCount = item.likesCount !== undefined ? item.likesCount : (item.likes?.length || 0);
    const commentsCount = item.commentsCount !== undefined ? item.commentsCount : (item.comments?.length || 0);

    return (
      <View style={[styles.reelContainer, { height: height - 52 - insets.bottom }]}>
        <Image source={{ uri: item.mediaUrl }} style={styles.backgroundImage} resizeMode="cover" />
        <View style={styles.dimOverlay} />

        {/* Right Side Action Buttons */}
        <View style={[styles.rightActions, { bottom: 90 }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleToggleLike(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isLikedByMe ? 'heart' : 'heart-outline'}
              size={34}
              color={item.isLikedByMe ? '#FF2D55' : '#FFFFFF'}
            />
            <Text style={styles.actionText}>{likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setActiveCommentsPost(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={30} color="#FFFFFF" />
            <Text style={styles.actionText}>{commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('DirectMessages', { sharedPost: item })}
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane-outline" size={30} color="#FFFFFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Metadata (Author, Caption, Audio) */}
        <View style={[styles.bottomInfo, { bottom: 20 }]}>
          <TouchableOpacity
            style={styles.authorRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile', { targetUser: author })}
          >
            <Avatar uri={author.avatar} name={author.user_name} size={36} showStoryRing={true} />
            <Text style={styles.authorName} numberOfLines={1}>
              {author.user_name || 'fomo_user'}
            </Text>
            <TouchableOpacity
              style={styles.followPill}
              activeOpacity={0.8}
            >
              <Text style={styles.followPillText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {item.caption ? (
            <Text style={styles.caption} numberOfLines={2}>
              {item.caption}
            </Text>
          ) : null}

          <View style={styles.audioRow}>
            <Ionicons name="musical-notes" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.audioText} numberOfLines={1}>
              Original Audio · {author.user_name || 'FOMO'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Reels</Text>
        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={() => navigation.navigate('CreatePost', { initialType: 'reel' })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="camera-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0095F6" />
        </View>
      ) : reels.length > 0 ? (
        <FlatList
          data={reels}
          keyExtractor={(item) => item._id}
          renderItem={renderReel}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height - 52 - insets.bottom}
          snapToAlignment="start"
          decelerationRate="fast"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#0095F6']}
            />
          }
        />
      ) : (
        /* Clean Empty State when zero reels exist */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="play-circle-outline" size={54} color="#FFFFFF" />
          </View>
          <Text style={styles.emptyTitle}>No Reels Yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share a reel with friends on FOMO!
          </Text>
          <TouchableOpacity
            style={styles.createReelBtn}
            onPress={() => navigation.navigate('CreatePost', { initialType: 'reel' })}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam" size={18} color="#FFFFFF" />
            <Text style={styles.createReelBtnText}>Create Reel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Comments Modal for Reels */}
      <CommentsModal
        visible={Boolean(activeCommentsPost)}
        postId={activeCommentsPost?._id}
        initialComments={activeCommentsPost?.comments || []}
        onClose={() => setActiveCommentsPost(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cameraBtn: {
    padding: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelContainer: {
    width: width,
    backgroundColor: '#000000',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 18,
    zIndex: 10,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomInfo: {
    position: 'absolute',
    left: 14,
    right: 70,
    zIndex: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  followPill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 4,
  },
  followPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 8,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#8E8E8E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createReelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0095F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createReelBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
