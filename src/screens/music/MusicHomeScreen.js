import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchHomeMusic, searchMusic } from '../../api/music';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { useAuth } from '../../context/AuthContext';
import { ProfileDrawerModal } from '../../components/music/ProfileDrawerModal';
import { AddToPlaylistModal } from '../../components/music/AddToPlaylistModal';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

// Format seconds into MM:SS
const formatTime = (secs) => {
  if (!secs || isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const MusicHomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    playSong,
    togglePlayPause,
    seekTo,
    toggleLike,
    likedSongIds,
  } = useMusicPlayer();

  const [loading, setLoading] = useState(true);
  const [songsList, setSongsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Exact calculated initial height for feed
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const tabBarHeight = 52 + bottomInset;
  const initialFeedHeight = WINDOW_HEIGHT - (insets.top || 24) - tabBarHeight;
  const [feedHeight, setFeedHeight] = useState(initialFeedHeight);

  const [activeTab, setActiveTab] = useState('forYou'); // 'forYou' | 'trending'
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [playlistModalSong, setPlaylistModalSong] = useState(null);

  const flatListRef = useRef(null);
  const songsListRef = useRef([]);
  const currentIndexRef = useRef(0);

  // Keep refs synchronized to prevent stale closures during swiping
  useEffect(() => {
    songsListRef.current = songsList;
  }, [songsList]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Vinyl Spin Animation
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoopRef.current.start();
    } else {
      spinAnim.stopAnimation();
    }

    return () => {
      spinAnim.stopAnimation();
    };
  }, [isPlaying]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animated Visualizer Bars (Equalizer wave)
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(14)).current;
  const bar3 = useRef(new Animated.Value(10)).current;
  const bar4 = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    if (isPlaying) {
      const createBarAnim = (val, min, max, duration) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: max, duration, easing: Easing.ease, useNativeDriver: false }),
            Animated.timing(val, { toValue: min, duration, easing: Easing.ease, useNativeDriver: false }),
          ])
        );

      const a1 = createBarAnim(bar1, 4, 18, 420);
      const a2 = createBarAnim(bar2, 6, 22, 380);
      const a3 = createBarAnim(bar3, 4, 16, 450);
      const a4 = createBarAnim(bar4, 8, 24, 340);

      a1.start();
      a2.start();
      a3.start();
      a4.start();

      return () => {
        a1.stop();
        a2.stop();
        a3.stop();
        a4.stop();
      };
    }
  }, [isPlaying]);

  const [errorMessage, setErrorMessage] = useState(null);

  // Load feed songs
  const loadFeed = async () => {
    setLoading(true);
    setErrorMessage(null);
    let unique = [];
    const seen = new Set();

    try {
      try {
        const data = await fetchHomeMusic();
        if (data) {
          const pool = [
            ...(data.allSongs || []),
            ...(data.jumpBackIn || []),
            ...(data.recommended || []),
          ];

          for (const s of pool) {
            const sid = (s._id || s.id || '').toString();
            if (sid && !seen.has(sid)) {
              unique.push(s);
              seen.add(sid);
            }
          }
        }
      } catch (homeErr) {
        console.log('fetchHomeMusic error, trying fallback:', homeErr?.message);
      }

      // If fewer than 10 tracks, supplement with live JioSaavn hits
      if (unique.length < 10) {
        try {
          const res = await searchMusic('trending 2024');
          const fallbackSongs = res?.songs || res?.data || (Array.isArray(res) ? res : []);
          for (const s of fallbackSongs) {
            const sid = (s._id || s.id || '').toString();
            if (sid && !seen.has(sid)) {
              unique.push(s);
              seen.add(sid);
            }
          }
        } catch (e) {
          console.log('searchMusic fallback error:', e?.message);
        }
      }

      if (unique.length > 0) {
        setSongsList(unique);
        songsListRef.current = unique;

        // Auto-play the first song if nothing is currently playing
        if (!currentSong) {
          playSong(unique[0], unique);
        } else {
          // Match index to current song if already in feed
          const curIdx = unique.findIndex(
            (s) => (s._id || s.id)?.toString() === (currentSong._id || currentSong.id)?.toString()
          );
          if (curIdx >= 0) {
            setCurrentIndex(curIdx);
            currentIndexRef.current = curIdx;
          }
        }
      } else {
        setErrorMessage('Unable to load music. Check server connection.');
      }
    } catch (e) {
      console.log('Error loading music feed:', e);
      setErrorMessage(e?.message || 'Error loading music feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // Switch to specific song index (Resso instant auto-play on swipe)
  const changeToSong = useCallback(
    (index) => {
      const list = songsListRef.current;
      if (!list || index < 0 || index >= list.length) return;

      setCurrentIndex(index);
      currentIndexRef.current = index;

      const targetSong = list[index];
      if (targetSong) {
        playSong(targetSong, list);
      }
    },
    [playSong]
  );

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const list = songsListRef.current;
    if (list && list.length > 0) {
      if (tab === 'trending') {
        const sorted = [...list].sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0));
        setSongsList(sorted);
        songsListRef.current = sorted;
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        changeToSong(0);
      } else {
        loadFeed();
      }
    }
  };

  // Detect snapped reel index on scroll
  const handleScrollEnd = (e) => {
    if (feedHeight <= 0) return;
    const offsetY = e.nativeEvent.contentOffset.y;
    const targetIndex = Math.round(offsetY / feedHeight);
    if (
      targetIndex >= 0 &&
      targetIndex < songsListRef.current.length &&
      targetIndex !== currentIndexRef.current
    ) {
      changeToSong(targetIndex);
    }
  };

  // Next / Previous Buttons
  const handleNextTrack = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < songsList.length) {
      flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      changeToSong(nextIdx);
    }
  };

  const handlePrevTrack = () => {
    const prevIdx = currentIndex - 1;
    if (prevIdx >= 0) {
      flatListRef.current?.scrollToIndex({ index: prevIdx, animated: true });
      changeToSong(prevIdx);
    }
  };

  const handleShare = async (song) => {
    try {
      await Share.share({
        message: `Listening to "${song.title}" by ${song.artist} on FOMO Music! 🎧🔥`,
      });
    } catch (e) {
      // ignore
    }
  };

  // Scrubber / Seek Handler
  const handleSeek = (e) => {
    if (duration > 0) {
      const { locationX } = e.nativeEvent;
      const progressWidth = WINDOW_WIDTH - 32;
      const ratio = Math.max(0, Math.min(1, locationX / progressWidth));
      seekTo(ratio * duration);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const userInitial = user?.user_name ? user.user_name.charAt(0).toUpperCase() : 'F';

  // Render a Single Resso Reel Card
  const renderReelItem = ({ item, index }) => {
    const isCurrent =
      (currentSong?._id || currentSong?.id)?.toString() ===
      (item._id || item.id)?.toString();
    const isLiked = likedSongIds.has((item._id || item.id)?.toString());

    return (
      <View style={[styles.reelSlide, { height: feedHeight }]}>
        {/* Full Screen Cinematic Blurred Background Artwork */}
        <Image
          source={{ uri: item.coverUrl }}
          style={styles.backgroundImage}
          blurRadius={Platform.OS === 'ios' ? 26 : 20}
        />

        {/* Deep Atmospheric Dark Gradients */}
        <LinearGradient
          colors={['rgba(8, 14, 30, 0.45)', 'rgba(8, 14, 30, 0.82)', '#080E1E']}
          locations={[0, 0.55, 1]}
          style={styles.gradientOverlay}
        />

        {/* Top spacer to ensure album art never touches top header */}
        <View style={styles.topHeaderSpacer} />

        {/* Center Stage: Album Cover Card with Peeking Vinyl (Naturally flex-centered!) */}
        <View style={styles.centerStage}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={togglePlayPause}
            style={styles.centerCardContainer}
          >
            {/* Spinning Vinyl Record peeking out from sleeve (Resso iconic look) */}
            <Animated.View
              style={[
                styles.vinylPeekingDisc,
                isCurrent && isPlaying
                  ? { transform: [{ rotate: spinInterpolate }] }
                  : {},
              ]}
            >
              <View style={styles.vinylGrooveRing1}>
                <View style={styles.vinylGrooveRing2}>
                  <Image source={{ uri: item.coverUrl }} style={styles.vinylCenterThumb} />
                  <View style={styles.vinylCenterPin} />
                </View>
              </View>
            </Animated.View>

            {/* Front Album Artwork Sleeve */}
            <View style={styles.albumCoverCard}>
              <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />

              {/* Glassmorphic Play/Pause Overlay Badge */}
              {(!isPlaying || !isCurrent) && (
                <View style={styles.playPauseBadge}>
                  <Ionicons name="play" size={36} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Equalizer Live Visualizer Wave */}
          <View style={styles.equalizerRow}>
            <Animated.View style={[styles.eqBar, { height: bar1 }]} />
            <Animated.View style={[styles.eqBar, { height: bar2 }]} />
            <Animated.View style={[styles.eqBar, { height: bar3 }]} />
            <Animated.View style={[styles.eqBar, { height: bar4 }]} />
            <Text style={styles.equalizerText}>
              {isPlaying && isCurrent ? 'NOW PLAYING' : 'TAP TO PLAY'}
            </Text>
          </View>
        </View>

        {/* Right Side Action Column (Resso / Reels Style) */}
        <View style={styles.rightActionsColumn}>
          {/* Like Heart Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => toggleLike(item)}
          >
            <View style={[styles.actionIconBox, isLiked && styles.actionIconBoxLiked]}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={26}
                color={isLiked ? '#FF2D55' : '#FFFFFF'}
              />
            </View>
            <Text style={[styles.actionCount, isLiked && { color: '#FF2D55' }]}>
              {isLiked ? 'Liked' : (item.likesCount ? (item.likesCount > 999 ? `${(item.likesCount/1000).toFixed(1)}k` : item.likesCount) : 'Like')}
            </Text>
          </TouchableOpacity>

          {/* Add to Playlist Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setPlaylistModalSong(item)}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="add-circle-outline" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCount}>Playlist</Text>
          </TouchableOpacity>

          {/* Lyrics / Vibe Mode Toggle */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setShowLyricsModal((prev) => !prev)}
          >
            <View style={[styles.actionIconBox, showLyricsModal && styles.actionIconBoxActive]}>
              <Ionicons
                name={showLyricsModal ? 'chatbubble' : 'chatbubble-ellipses-outline'}
                size={23}
                color={showLyricsModal ? '#00D2FF' : '#FFFFFF'}
              />
            </View>
            <Text style={[styles.actionCount, showLyricsModal && { color: '#00D2FF' }]}>
              Lyrics
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => handleShare(item)}
          >
            <View style={styles.actionIconBox}>
              <Ionicons name="arrow-redo-outline" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>

          {/* Bottom Spinning Mini Vinyl in Corner */}
          <Animated.View
            style={[
              styles.cornerMiniDisc,
              isCurrent && isPlaying ? { transform: [{ rotate: spinInterpolate }] } : {},
            ]}
          >
            <Image source={{ uri: item.coverUrl }} style={styles.cornerMiniDiscImage} />
          </Animated.View>
        </View>

        {/* Floating Lyrics Overlay Card (If Opened) */}
        {showLyricsModal && (
          <View style={styles.lyricsCardOverlay}>
            <View style={styles.lyricsHeader}>
              <Text style={styles.lyricsTitle}>Lyrics Preview</Text>
              <TouchableOpacity onPress={() => setShowLyricsModal(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.lyricsActiveLine}>
              "♪ Feel the rhythm in your heart, let the music take over..."
            </Text>
            <Text style={styles.lyricsSubLine}>
              "{item.title} — {item.artist}"
            </Text>
          </View>
        )}

        {/* Bottom Details & Player Controls (In normal flex flow, zero overlap!) */}
        <View style={styles.bottomInfoContainer}>
          {/* Genre / Trending Pill */}
          <View style={styles.tagPill}>
            <Ionicons name="flame" size={13} color="#FF6B00" style={{ marginRight: 4 }} />
            <Text style={styles.tagText}>{item.genre || 'Trending on FOMO'}</Text>
          </View>

          {/* Song Title */}
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>

          {/* Artist Name with Verified Badge */}
          <View style={styles.artistRow}>
            <Text style={styles.artistName} numberOfLines={1}>
              {item.artist}
            </Text>
            <Ionicons name="checkmark-circle" size={14} color="#0084FF" style={{ marginLeft: 5 }} />
            {item.album && item.album !== 'Single' && (
              <Text style={styles.albumText} numberOfLines={1}>
                {' '}• {item.album}
              </Text>
            )}
          </View>

          {/* Progress Bar / Scrubber */}
          <TouchableOpacity
            style={styles.progressBarWrapper}
            activeOpacity={1}
            onPress={handleSeek}
          >
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={['#00D2FF', '#0084FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
              <View
                style={[
                  styles.progressThumb,
                  { left: `${Math.max(0, Math.min(97, progressPercent))}%` },
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* Timeline and Quick Play Controls Row */}
          <View style={styles.controlsRow}>
            <Text style={styles.timeText}>
              {formatTime(currentTime)} / {formatTime(duration || item.duration)}
            </Text>

            <View style={styles.playerButtonsRow}>
              {/* Previous Song */}
              <TouchableOpacity
                onPress={handlePrevTrack}
                style={styles.secondaryBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="play-skip-back" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Main Play / Pause Button */}
              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.mainPlayBtn}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#00D2FF', '#0084FF']}
                  style={styles.mainPlayGradient}
                >
                  <Ionicons
                    name={isPlaying && isCurrent ? 'pause' : 'play'}
                    size={22}
                    color="#FFFFFF"
                    style={isPlaying && isCurrent ? {} : { marginLeft: 2 }}
                  />
                </LinearGradient>
              </TouchableOpacity>

              {/* Next Song */}
              <TouchableOpacity
                onPress={handleNextTrack}
                style={styles.secondaryBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="play-skip-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Top Header (Resso Style Minimalist Header) */}
      <View style={[styles.floatingHeader, { top: Math.max(insets.top, 10) }]}>
        {/* User Profile Avatar */}
        <TouchableOpacity
          style={styles.avatarCircle}
          activeOpacity={0.8}
          onPress={() => setIsProfileDrawerOpen(true)}
        >
          <Text style={styles.avatarText}>{userInitial}</Text>
        </TouchableOpacity>

        {/* Center Tabs: For You | Trending */}
        <View style={styles.headerTabsContainer}>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'forYou' && styles.headerTabActive]}
            onPress={() => handleTabChange('forYou')}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerTabText, activeTab === 'forYou' && styles.headerTabTextActive]}>
              For You
            </Text>
            {activeTab === 'forYou' && <View style={styles.headerTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'trending' && styles.headerTabActive]}
            onPress={() => handleTabChange('trending')}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerTabText, activeTab === 'trending' && styles.headerTabTextActive]}>
              Trending
            </Text>
            {activeTab === 'trending' && <View style={styles.headerTabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Search Navigation Button */}
        <TouchableOpacity
          style={styles.searchHeaderBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Feed Container */}
      <View
        style={styles.feedWrapper}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 200 && Math.abs(h - feedHeight) > 1) {
            setFeedHeight(h);
          }
        }}
      >
        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#0084FF" />
            <Text style={styles.loaderText}>Loading music vibes...</Text>
          </View>
        ) : songsList.length === 0 ? (
          <View style={styles.loaderCenter}>
            <Ionicons name="musical-notes-outline" size={52} color="#666" />
            <Text style={[styles.loaderText, { marginTop: 12, fontSize: 16 }]}>
              {errorMessage || 'No songs found'}
            </Text>
            <TouchableOpacity
              onPress={loadFeed}
              style={{
                marginTop: 18,
                backgroundColor: '#0084FF',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 24,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={songsList}
            keyExtractor={(item, idx) => (item._id || item.id || idx).toString()}
            renderItem={renderReelItem}
            pagingEnabled={true}
            showsVerticalScrollIndicator={false}
            snapToInterval={feedHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            initialNumToRender={2}
            maxToRenderPerBatch={3}
            windowSize={5}
            getItemLayout={(data, index) => ({
              length: feedHeight,
              offset: feedHeight * index,
              index,
            })}
          />
        )}
      </View>

      {/* Profile Drawer */}
      <ProfileDrawerModal
        visible={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        visible={!!playlistModalSong}
        song={playlistModalSong}
        onClose={() => setPlaylistModalSong(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1E',
  },
  feedWrapper: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  headerTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 14, 30, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
  },
  headerTabActive: {},
  headerTabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headerTabIndicator: {
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#00D2FF',
    marginTop: 2,
  },
  searchHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 14, 30, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
  reelSlide: {
    width: WINDOW_WIDTH,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: WINDOW_WIDTH,
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topHeaderSpacer: {
    height: 60,
  },

  // Center Stage (Naturally centered by flex: 1)
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCardContainer: {
    width: 270,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Peeking Vinyl Disc
  vinylPeekingDisc: {
    position: 'absolute',
    right: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#111625',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  vinylGrooveRing1: {
    width: 155,
    height: 155,
    borderRadius: 77.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylGrooveRing2: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylCenterThumb: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  vinylCenterPin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#080E1E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  // Front Album Sleeve Card
  albumCoverCard: {
    position: 'absolute',
    left: 8,
    width: 195,
    height: 195,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F1A35',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playPauseBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Equalizer
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(8, 14, 30, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eqBar: {
    width: 3.5,
    backgroundColor: '#00D2FF',
    borderRadius: 2,
    marginRight: 4,
  },
  equalizerText: {
    color: '#00D2FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 6,
  },

  // Right Reels Action Column
  rightActionsColumn: {
    position: 'absolute',
    right: 12,
    bottom: 85,
    alignItems: 'center',
    zIndex: 20,
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 14,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(8, 14, 30, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionIconBoxLiked: {
    backgroundColor: 'rgba(255, 45, 85, 0.18)',
    borderColor: '#FF2D55',
  },
  actionIconBoxActive: {
    backgroundColor: 'rgba(0, 210, 255, 0.18)',
    borderColor: '#00D2FF',
  },
  actionCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  cornerMiniDisc: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111625',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00D2FF',
    elevation: 4,
    marginTop: 2,
  },
  cornerMiniDiscImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },

  // Floating Lyrics
  lyricsCardOverlay: {
    position: 'absolute',
    left: 16,
    right: 68,
    top: 65,
    backgroundColor: 'rgba(8, 14, 30, 0.94)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
    zIndex: 30,
  },
  lyricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lyricsTitle: {
    color: '#00D2FF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  lyricsActiveLine: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  lyricsSubLine: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Bottom Info Container (In normal flow with zero overlap!)
  bottomInfoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingRight: 68, // Leave space for right reels column
    zIndex: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    marginBottom: 6,
  },
  tagText: {
    color: '#FF6B00',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  artistName: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  albumText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  progressBarWrapper: {
    paddingVertical: 5,
    width: WINDOW_WIDTH - 32,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0084FF',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: WINDOW_WIDTH - 32,
    marginTop: 4,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  playerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(8, 14, 30, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainPlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    marginHorizontal: 3,
    elevation: 4,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  mainPlayGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
