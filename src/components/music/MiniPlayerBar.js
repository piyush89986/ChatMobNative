import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useMusicPlayer } from '../../context/MusicPlayerContext';

export const MiniPlayerBar = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    toggleLike,
    likedSongIds,
    setIsFullPlayerVisible,
  } = useMusicPlayer();

  if (!currentSong) return null;

  const isLiked = likedSongIds.has((currentSong._id || currentSong.id)?.toString());
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setIsFullPlayerVisible(true)}
        style={styles.innerCard}
      >
        {/* Left: Thumbnail */}
        <Image
          source={{ uri: currentSong.coverUrl }}
          style={styles.coverImage}
        />

        {/* Center: Title & Artist */}
        <View style={styles.infoContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.artistText} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        {/* Right Action Icons */}
        <View style={styles.actionsContainer}>
          {/* Device / Cast icon */}
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <MaterialIcons name="speaker-group" size={20} color="#A5B4FC" />
          </TouchableOpacity>

          {/* Like / Blue Check Circle */}
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => toggleLike(currentSong._id || currentSong.id)}
          >
            {isLiked ? (
              <View style={styles.blueCheckCircle}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            ) : (
              <Ionicons name="heart-outline" size={22} color="#A5B4FC" />
            )}
          </TouchableOpacity>

          {/* Play / Pause button */}
          <TouchableOpacity
            style={[styles.actionBtn, { marginRight: 2 }]}
            activeOpacity={0.7}
            onPress={togglePlayPause}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  innerCard: {
    backgroundColor: '#0E1B38', // Sleek Oceanic Midnight Blue card
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 132, 255, 0.25)',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  coverImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1C2A4A',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  artistText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0084FF', // Electric Blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#00D2FF', // Cyan / Electric Blue highlight
  },
});
