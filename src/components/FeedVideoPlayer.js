import React, { useState, Component } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

// Error Boundary to prevent any native video crashes from blocking the UI
class VideoErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.log('[VideoPlayer Error Caught]:', error?.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={[styles.container, this.props.style]}>
          <Image
            source={{ uri: this.props.sourceUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={styles.errorOverlay}>
            <Ionicons name="play-circle-outline" size={42} color="rgba(255,255,255,0.7)" />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const VideoPlayerInner = ({
  sourceUrl,
  style,
  contentFit = 'cover',
  isLooping = true,
  autoPlay = true,
  showMuteButton = true,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  const player = useVideoPlayer(sourceUrl || '', (p) => {
    try {
      p.loop = isLooping;
      p.muted = false;
      if (autoPlay) {
        p.play();
      }
    } catch (e) {
      console.log('Player init error:', e?.message);
    }
  });

  const handleToggleMute = () => {
    if (!player) return;
    try {
      const nextMuted = !player.muted;
      player.muted = nextMuted;
      setIsMuted(nextMuted);
    } catch (e) {
      console.log('Toggle mute error:', e?.message);
    }
  };

  if (!sourceUrl) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={[styles.container, style]}
      onPress={handleToggleMute}
    >
      <VideoView
        style={StyleSheet.absoluteFillObject}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit={contentFit}
        nativeControls={false}
      />

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

export const FeedVideoPlayer = (props) => {
  return (
    <VideoErrorBoundary style={props.style} sourceUrl={props.sourceUrl}>
      <VideoPlayerInner {...props} />
    </VideoErrorBoundary>
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
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});

