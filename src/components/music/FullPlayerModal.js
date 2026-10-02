import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';

const { width, height } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(width - 48, height * 0.38);

export const FullPlayerModal = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    loopMode,
    isShuffle,
    likedSongIds,
    isFullPlayerVisible,
    togglePlayPause,
    seekTo,
    nextSong,
    prevSong,
    toggleLoop,
    toggleShuffle,
    toggleLike,
    setIsFullPlayerVisible,
  } = useMusicPlayer();

  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);

  if (!currentSong) return null;

  const isLiked = likedSongIds.has((currentSong._id || currentSong.id)?.toString());

  const formatTime = (secs) => {
    const total = Math.max(0, Math.floor(secs || 0));
    const mins = Math.floor(total / 60);
    const rem = total % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const handleProgressBarPress = (e) => {
    const { locationX } = e.nativeEvent;
    const barWidth = width - 48;
    const ratio = Math.max(0, Math.min(1, locationX / barWidth));
    seekTo(ratio * duration);
  };

  return (
    <Modal
      visible={isFullPlayerVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setIsFullPlayerVisible(false)}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsFullPlayerVisible(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>PLAYING FROM FOMO</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentSong.album || 'FOMO Music'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => setIsAddToPlaylistOpen(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Album Artwork */}
          <View style={styles.artworkContainer}>
            <Image
              source={{ uri: currentSong.coverUrl }}
              style={styles.artworkImage}
            />
          </View>

          {/* Song Info Row */}
          <View style={styles.infoRow}>
            <View style={styles.titleArtistBox}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {currentSong.artist}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => toggleLike(currentSong._id || currentSong.id)}
              activeOpacity={0.7}
              style={styles.likeButton}
            >
              {isLiked ? (
                <Ionicons name="heart" size={28} color="#0084FF" />
              ) : (
                <Ionicons name="heart-outline" size={28} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Scrubber Progress Bar */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleProgressBarPress}
            style={styles.scrubberWrapper}
          >
            <View style={styles.scrubberTrack}>
              <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.scrubberThumb, { left: `${progress * 100}%` }]} />
            </View>
          </TouchableOpacity>

          {/* Time Labels */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Playback Controls */}
          <View style={styles.controlsRow}>
            {/* Shuffle */}
            <TouchableOpacity
              style={styles.controlIconBtn}
              activeOpacity={0.7}
              onPress={toggleShuffle}
            >
              <Ionicons
                name="shuffle"
                size={26}
                color={isShuffle ? '#00D2FF' : '#A5B4FC'}
              />
              {isShuffle && <View style={styles.activeDot} />}
            </TouchableOpacity>

            {/* Previous */}
            <TouchableOpacity
              style={styles.controlIconBtn}
              activeOpacity={0.7}
              onPress={prevSong}
            >
              <Ionicons name="play-skip-back" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Play / Pause Big Button */}
            <TouchableOpacity
              style={styles.playPauseBtn}
              activeOpacity={0.8}
              onPress={togglePlayPause}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={34}
                color="#FFFFFF"
                style={!isPlaying ? { marginLeft: 3 } : null}
              />
            </TouchableOpacity>

            {/* Next */}
            <TouchableOpacity
              style={styles.controlIconBtn}
              activeOpacity={0.7}
              onPress={nextSong}
            >
              <Ionicons name="play-skip-forward" size={32} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Loop / Repeat Mode */}
            <TouchableOpacity
              style={styles.controlIconBtn}
              activeOpacity={0.7}
              onPress={toggleLoop}
            >
              {loopMode === 'one' ? (
                <MaterialCommunityIcons name="repeat-once" size={26} color="#00D2FF" />
              ) : (
                <Ionicons
                  name="repeat"
                  size={26}
                  color={loopMode === 'all' ? '#0084FF' : '#A5B4FC'}
                />
              )}
              {loopMode !== 'off' && <View style={styles.activeDot} />}
            </TouchableOpacity>
          </View>

          {/* Footer Utilities */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.footerBtn} activeOpacity={0.7}>
              <MaterialIcons name="speaker-group" size={22} color="#B3B3B3" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerBtn}
              activeOpacity={0.7}
              onPress={() => setIsAddToPlaylistOpen(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#B3B3B3" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerBtn} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={22} color="#B3B3B3" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Add To Playlist Modal */}
        <AddToPlaylistModal
          visible={isAddToPlaylistOpen}
          song={currentSong}
          onClose={() => setIsAddToPlaylistOpen(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5B4FC',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  artworkContainer: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 14,
    alignSelf: 'center',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: '#162347',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  titleArtistBox: {
    flex: 1,
    marginRight: 16,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  songArtist: {
    fontSize: 16,
    color: '#A5B4FC',
    marginTop: 4,
    fontWeight: '500',
  },
  likeButton: {
    padding: 6,
  },
  scrubberWrapper: {
    marginTop: 22,
    paddingVertical: 10,
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    justifyContent: 'center',
  },
  scrubberFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00D2FF',
  },
  scrubberThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#A5B4FC',
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 8,
  },
  controlIconBtn: {
    padding: 10,
    position: 'relative',
    alignItems: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00D2FF',
    position: 'absolute',
    bottom: 2,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 8,
  },
  footerBtn: {
    padding: 8,
  },
});
