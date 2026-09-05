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
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { PostCard } from '../../components/PostCard';
import { CommentsModal } from '../../components/CommentsModal';
import { StoryViewerModal } from '../../components/StoryViewerModal';
import { getFeedPosts, toggleLike, getStories } from '../../api/post';
import { useFocusEffect } from '@react-navigation/native';

// Fallback high-quality curated posts if user hasn't posted anything yet
const FALLBACK_POSTS = [
  {
    _id: 'seed_post_1',
    author: {
      _id: 'seed_user_1',
      user_name: 'caaiitgandhinagar_pg',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    mediaType: 'image',
    caption: 'Walked in to upskill. Walked out as an AI Developer through IIT Gandhinagar residential program! 🚀✨',
    location: 'IIT Gandhinagar',
    likesCount: 33,
    commentsCount: 4,
    comments: [
      {
        _id: 'c1',
        user: { user_name: 'arun_dev', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100' },
        text: 'Incredible journey! Congrats man! 🎉',
        createdAt: new Date().toISOString(),
      },
    ],
    isLikedByMe: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'seed_post_2',
    author: {
      _id: 'seed_user_2',
      user_name: 'maisamayhoon',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    mediaType: 'image',
    caption: 'Sunset in the Himalayas. Time stops here. 🏔️🌅 #nature #peace #travel',
    location: 'Manali, Himachal Pradesh',
    likesCount: 142,
    commentsCount: 9,
    comments: [],
    isLikedByMe: true,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

const FALLBACK_STORIES = [
  {
    _id: 's1',
    user: { user_name: 'vikas_2607__', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    caption: 'Weekend coding vibe ☕',
  },
  {
    _id: 's2',
    user: { user_name: 'maisamayhoon', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    mediaUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    caption: 'On the road again 🚗',
  },
  {
    _id: 's3',
    user: { user_name: 'lakshyamal', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150' },
    mediaUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    caption: 'Starlit sky tonight ✨',
  },
];

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Story Viewer Modal
  const [selectedStory, setSelectedStory] = useState(null);

  // Active Comments Modal
  const [commentPost, setCommentPost] = useState(null);

  const fetchFeed = useCallback(async () => {
    try {
      const [postRes, storyRes] = await Promise.allSettled([
        getFeedPosts(1, 20),
        getStories(),
      ]);

      if (postRes.status === 'fulfilled' && postRes.value?.data && postRes.value.data.length > 0) {
        setPosts(postRes.value.data);
      } else {
        setPosts(FALLBACK_POSTS);
      }

      if (storyRes.status === 'fulfilled' && storyRes.value?.data && storyRes.value.data.length > 0) {
        setStories(storyRes.value.data);
      } else {
        setStories(FALLBACK_STORIES);
      }
    } catch (err) {
      console.log('Error fetching feed:', err.message);
      setPosts(FALLBACK_POSTS);
      setStories(FALLBACK_STORIES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const handleLike = async (postId) => {
    try {
      await toggleLike(postId);
    } catch (err) {
      console.log('Like error:', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. FOMO Home Top Bar */}
      <View style={styles.topBar}>
        {/* Create Post Icon (+) */}
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => navigation.navigate('CreatePost')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add-circle-outline" size={27} color="#FFFFFF" />
        </TouchableOpacity>

        {/* FOMO Script Brand Title */}
        <Text style={styles.logoText}>FOMO</Text>

        {/* Right Icons: Notifications (Heart) & Direct Messages (Paperplane) */}
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="heart-outline" size={26} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={() => navigation.navigate('DirectMessages')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="paper-plane-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Feed with Stories Tray at top */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUser={user}
              onLikePress={handleLike}
              onCommentPress={(p) => setCommentPost(p)}
              onSharePress={(p) => navigation.navigate('DirectMessages', { sharedPost: p })}
              onUserPress={(author) => navigation.navigate('Profile', { targetUser: author })}
            />
          )}
          ListHeaderComponent={
            <View style={styles.storiesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesScroll}
              >
                {/* Your Story item */}
                <TouchableOpacity
                  style={styles.storyItem}
                  onPress={() => navigation.navigate('CreatePost')}
                  activeOpacity={0.8}
                >
                  <View style={styles.myStoryWrapper}>
                    <Avatar
                      uri={user?.avatar}
                      name={user?.user_name || 'Me'}
                      size={68}
                      showStoryRing={false}
                    />
                    <View style={styles.myStoryPlus}>
                      <Ionicons name="add" size={13} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.storyUsername} numberOfLines={1}>
                    Your story
                  </Text>
                </TouchableOpacity>

                {/* Friend Stories with gradient rings */}
                {stories.map((story) => (
                  <TouchableOpacity
                    key={story._id}
                    style={styles.storyItem}
                    onPress={() => setSelectedStory(story)}
                    activeOpacity={0.8}
                  >
                    <Avatar
                      uri={story.user?.avatar}
                      name={story.user?.user_name || 'User'}
                      size={68}
                      showStoryRing={true}
                    />
                    <Text style={styles.storyUsername} numberOfLines={1}>
                      {story.user?.user_name || 'friend'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#0095F6']}
            />
          }
          contentContainerStyle={styles.feedContent}
        />
      )}

      {/* 3. Story Viewer Lightbox Modal */}
      <StoryViewerModal
        visible={Boolean(selectedStory)}
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
        onReply={(text) => {
          Alert.alert('Story Reply Sent', `Sent "${text}" to ${selectedStory?.user?.user_name}`);
        }}
      />

      {/* 4. Comments Bottom Sheet Modal */}
      <CommentsModal
        visible={Boolean(commentPost)}
        postId={commentPost?._id}
        initialComments={commentPost?.comments || []}
        currentUser={user}
        onClose={() => setCommentPost(null)}
        onCommentAdded={(updatedComments) => {
          setPosts((prev) =>
            prev.map((p) =>
              p._id === commentPost._id
                ? { ...p, comments: updatedComments, commentsCount: updatedComments.length }
                : p
            )
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  topIconBtn: {
    padding: 4,
    position: 'relative',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : undefined,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ED4956',
  },
  storiesContainer: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 10,
    marginBottom: 4,
  },
  storiesScroll: {
    paddingHorizontal: 14,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  myStoryWrapper: {
    position: 'relative',
  },
  myStoryPlus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#0095F6',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  storyUsername: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContent: {
    paddingBottom: 24,
  },
});
