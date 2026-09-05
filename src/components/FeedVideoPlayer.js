import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

export const FeedVideoPlayer = ({
  sourceUrl,
  style,
  resizeMode = ResizeMode.COVER,
  isLooping = true,
  autoPlay = true,
  showMuteButton = true,
}) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [loading, setLoading] = useState(true);

  const handleTogglePlayMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={[styles.container, style]}
      onPress={handleTogglePlayMute}
    >
      <Video
        ref={videoRef}
        source={{ uri: sourceUrl }}
        style={StyleSheet.absoluteFillObject}
        resizeMode={resizeMode}
        isLooping={isLooping}
        shouldPlay={isPlaying}
        isMuted={isMuted}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={(err) => {
          console.log('Video play error:', err);
          setLoading(false);
        }}
      />

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}

      {showMuteButton && (
        <View style={styles.muteBadge}>
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={14}
            color="#FFFFFF"
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  muteBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
