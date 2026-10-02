import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';

export const SongRowItem = ({ song, queue, index, showCover = true }) => {
  const { currentSong, isPlaying, playSong, toggleLike, likedSongIds } = useMusicPlayer();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const isCurrent = (currentSong?._id || currentSong?.id)?.toString() === (song?._id || song?.id)?.toString();
  const isLiked = likedSongIds.has((song?._id || song?.id)?.toString());

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainPressable}
        activeOpacity={0.7}
        onPress={() => playSong(song, queue)}
      >
        {showCover && (
          <Image
            source={{ uri: song.coverUrl }}
            style={styles.coverThumb}
          />
        )}

        <View style={styles.textContainer}>
          <Text
            style={[styles.songTitle, isCurrent && styles.activeSongTitle]}
            numberOfLines={1}
          >
            {song.title}
          </Text>
          <View style={styles.artistRow}>
            {song.tags?.includes('Explicit') && (
              <View style={styles.explicitBadge}>
                <Text style={styles.explicitText}>E</Text>
              </View>
            )}
            <Text style={styles.artistName} numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        {/* Like Heart Button */}
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => toggleLike(song._id || song.id)}
          activeOpacity={0.7}
        >
          {isLiked ? (
            <Ionicons name="heart" size={20} color="#0084FF" />
          ) : (
            <Ionicons name="heart-outline" size={20} color="#A5B4FC" />
          )}
        </TouchableOpacity>

        {/* 3-Dots Menu (Adds to playlist) */}
        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={() => setIsAddOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#A5B4FC" />
        </TouchableOpacity>
      </View>

      <AddToPlaylistModal
        visible={isAddOpen}
        song={song}
        onClose={() => setIsAddOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  coverThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#162347',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  activeSongTitle: {
    color: '#00D2FF',
    fontWeight: '700',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  explicitBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 6,
  },
  explicitText: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: '900',
  },
  artistName: {
    fontSize: 13,
    color: '#94A3B8',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    padding: 6,
    marginLeft: 4,
  },
});
