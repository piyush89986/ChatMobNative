import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/Avatar';
import { CommentsModal } from '../../components/CommentsModal';

const { width, height } = Dimensions.get('window');

const SAMPLE_REELS = [
  {
    id: 'reel_1',
    user: { user_name: 'areeyyawr', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    caption: 'Kya crazy fark padh raha hai yarr... 😂 vibes on peak! #FOMO #reels',
    likes: '1.1M',
    comments: '4.2K',
    audio: 'Original Audio - areeyyawr',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800',
    isLiked: false,
  },
  {
    id: 'reel_2',
    user: { user_name: 'sumit_rajput', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    caption: 'Typa songs I\'d be listening at 7 am in the morning without giving my day a chance 🌅',
    likes: '691K',
    comments: '1.8K',
    audio: 'Arijit Singh • Slowed & Reverb',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    isLiked: false,
  },
  {
    id: 'reel_3',
    user: { user_name: 'manglesh_maurya', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    caption: 'Food journey in Indore! You MUST try this once in your life 🔥🥞 #indore #foodie',
    likes: '7.9M',
    comments: '18.4K',
    audio: 'Trending Beats • Geeta Jhala',
    thumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    isLiked: true,
  },
];

export const ReelsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [reels, setReels] = useState(SAMPLE_REELS);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);

  const toggleLike = (id) => {
    setReels(prev =>
      prev.map(r => (r.id === id ? { ...r, isLiked: !r.isLiked } : r))
    );
  };

  const renderReel = ({ item }) => {
    return (
      <View style={[styles.reelContainer, { height: height - 56 - insets.bottom }]}>
        <Image source={{ uri: item.thumbnail }} style={styles.backgroundImage} resizeMode="cover" />
        <View style={styles.dimOverlay} />

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => toggleLike(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isLiked ? 'heart' : 'heart-outline'}
              size={32}
              color={item.isLiked ? '#FF2D55' : '#FFFFFF'}
            />
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setActiveCommentsPost({ _id: item.id, comments: [] })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={28} color="#FFFFFF" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('DirectMessages')}
            activeOpacity={0.7}
          >
            <Ionicons name="paper-plane-outline" size={28} color="#FFFFFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Details */}
        <View style={[styles.bottomDetails, { paddingBottom: 16 }]}>
          <View style={styles.authorRow}>
            <Avatar uri={item.user.avatar} name={item.user.user_name} size={36} showStoryRing={true} />
            <Text style={styles.authorName}>{item.user.user_name}</Text>
            <TouchableOpacity style={styles.followPill}>
              <Text style={styles.followPillText}>Follow</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.captionText} numberOfLines={2}>
            {item.caption}
          </Text>

          <View style={styles.audioRow}>
            <Ionicons name="musical-notes" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.audioText} numberOfLines={1}>
              {item.audio}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reels</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
          <Ionicons name="camera-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reels}
        renderItem={renderReel}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
      />

      {/* Comments Modal */}
      {activeCommentsPost && (
        <CommentsModal
          visible={!!activeCommentsPost}
          post={activeCommentsPost}
          onClose={() => setActiveCommentsPost(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  reelContainer: {
    width,
    position: 'relative',
    justifyContent: 'flex-end',
    backgroundColor: '#121212',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 80,
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomDetails: {
    paddingHorizontal: 16,
    width: width * 0.8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 10,
    marginRight: 10,
  },
  followPill: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  followPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  captionText: {
    color: '#F5F5F5',
    fontSize: 13,
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
});
