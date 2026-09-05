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

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Stories for Lightbox Modal
  const [activeStoryList, setActiveStoryList] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Active Comments Modal
  const [commentPost, setCommentPost] = useState(null);

  const fetchFeed = useCallback(async () => {
    try {
      const [postRes, storyRes] = await Promise.allSettled([
        getFeedPosts(1, 30),
        getStories(),
      ]);

      if (postRes.status === 'fulfilled' && postRes.value?.data) {
        setPosts(postRes.value.data);
      } else {
        setPosts([]);
      }

      if (storyRes.status === 'fulfilled' && storyRes.value?.data) {
        setStories(storyRes.value.data);
      } else {
        setStories([]);
      }
    } catch (err) {
      console.log('Error fetching feed:', err.message);
      setPosts([]);
      setStories([]);
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

  // Separate current user's stories from other users' stories
  const myStories = stories.filter(
    (s) => s.user?._id === user?._id || s.user === user?._id
  );

  // Group other users' stories by user ID
  const otherStoriesByUser = {};
  stories
    .filter((s) => s.user?._id !== user?._id && s.user !== user?._id)
    .forEach((s) => {
      const authorId = s.user?._id || s.user;
      if (!otherStoriesByUser[authorId]) {
        otherStoriesByUser[authorId] = [];
      }
      otherStoriesByUser[authorId].push(s);
    });

  const otherUsersList = Object.values(otherStoriesByUser);

  const handleOpenMyStory = () => {
    if (myStories.length > 0) {
      setActiveStoryList(myStories);
      setActiveStoryIndex(0);
    } else {
      navigation.navigate('CreatePost', { initialType: 'story' });
    }
  };

  const handleOpenUserStories = (userStories) => {
    setActiveStoryList(userStories);
    setActiveStoryIndex(0);
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

        {/* FOMO Brand Title */}
        <Text style={styles.brandTitle}>FOMO</Text>

        {/* Right Top Actions (Heart + Messenger) */}
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="heart-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topIconBtn}
            onPress={() => navigation.navigate('DirectMessages')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="paper-plane-outline" size={25} color="#FFFFFF" />
              <View style={styles.unreadBadgeDot} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Feed with Real Stories Tray Header */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#0095F6" />
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
                <View style={styles.storyItem}>
                  <TouchableOpacity
                    onPress={handleOpenMyStory}
                    activeOpacity={0.8}
                    style={styles.myStoryWrapper}
                  >
                    <Avatar
                      uri={user?.avatar}
                      name={user?.user_name || 'Me'}
                      size={68}
                      showStoryRing={myStories.length > 0}
                    />
                    <TouchableOpacity
                      style={styles.myStoryPlus}
                      onPress={() => navigation.navigate('CreatePost', { initialType: 'story' })}
                      activeOpacity={0.8}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="add" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                  <Text style={styles.storyUsername} numberOfLines={1}>
                    Your story
                  </Text>
                </View>

                {/* Real other users' stories from DB */}
                {otherUsersList.map((userStoryGroup) => {
                  const firstStory = userStoryGroup[0];
                  const author = firstStory.user;
                  return (
                    <TouchableOpacity
                      key={firstStory._id}
                      style={styles.storyItem}
                      onPress={() => handleOpenUserStories(userStoryGroup)}
                      activeOpacity={0.8}
                    >
                      <Avatar
                        uri={author?.avatar}
                        name={author?.user_name || 'User'}
                        size={68}
                        showStoryRing={true}
                      />
                      <Text style={styles.storyUsername} numberOfLines={1}>
                        {author?.user_name || 'friend'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyFeedBox}>
              <Ionicons name="images-outline" size={56} color="#333333" />
              <Text style={styles.emptyFeedTitle}>Welcome to FOMO</Text>
              <Text style={styles.emptyFeedSubtitle}>
                Your feed is currently empty. Be the first to share a post or story!
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => navigation.navigate('CreatePost')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.emptyCreateBtnText}>Create First Post</Text>
              </TouchableOpacity>
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

      {/* 3. Story Viewer Lightbox Modal with Next/Previous navigation */}
      <StoryViewerModal
        visible={activeStoryList.length > 0}
        stories={activeStoryList}
        initialIndex={activeStoryIndex}
        onClose={() => setActiveStoryList([])}
        onReply={(text) => {
          Alert.alert('Story Reply Sent', `Sent "${text}"`);
        }}
      />

      {/* 4. Comments Bottom Sheet Modal */}
      <CommentsModal
        visible={Boolean(commentPost)}
        postId={commentPost?._id}
        initialComments={commentPost?.comments || []}
        onClose={() => setCommentPost(null)}
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
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#121212',
  },
  topIconBtn: {
    padding: 4,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-medium',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: -1,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContent: {
    paddingBottom: 24,
  },
  storiesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#181818',
    backgroundColor: '#000000',
  },
  storiesScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 7,
    width: 72,
  },
  myStoryWrapper: {
    position: 'relative',
  },
  myStoryPlus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0095F6',
    borderWidth: 2,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUsername: {
    color: '#FFFFFF',
    fontSize: 11.5,
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 70,
  },
  emptyFeedBox: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyFeedTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyFeedSubtitle: {
    color: '#737373',
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0095F6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
