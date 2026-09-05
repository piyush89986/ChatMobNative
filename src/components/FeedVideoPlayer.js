import React, { useState, useEffect, useRef, Component } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Animated,
  Text,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

// Safe Error Boundary to prevent any native issues from showing a red screen
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
            <Ionicons name="play-circle-outline" size={48} color="rgba(255,255,255,0.7)" />
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
  mode = 'feed', // 'feed' or 'reel'
  isActive = true,
  contentFit = 'cover',
  isLooping = true,
  autoPlay = true,
  showMuteButton = true,
  onDoubleTap = null,
}) => {
  const isFocused = useIsFocused();
  const [isMuted, setIsMuted] = useState(mode === 'feed');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const centerIconAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);

  // Initialize expo-video player
  const player = useVideoPlayer(sourceUrl || '', (p) => {
    try {
      p.loop = isLooping;
      p.muted = mode === 'feed'; // Instagram feed videos start muted
      p.volume = mode === 'feed' ? 0 : 1.0;
      if (autoPlay && isActive && isFocused) {
        p.play();
      }
    } catch (e) {
      console.log('Video setup error:', e?.message);
    }
  });

  // Handle screen focus and active item changes (stops audio when leaving screen or scrolling away)
  useEffect(() => {
    if (!player) return;
    try {
      if (isFocused && isActive) {
        if (isPlaying) {
          player.play();
        }
      } else {
        player.pause();
      }
    } catch (e) {
      console.log('Focus/Active pause error:', e?.message);
    }
  }, [isFocused, isActive, isPlaying, player]);

  // Animated Play/Pause indicator in center of screen
  const triggerCenterFeedback = (playing) => {
    setShowCenterIcon(true);
    centerIconAnim.setValue(0);
    Animated.sequence([
      Animated.spring(centerIconAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(centerIconAnim, {
        toValue: 0,
        duration: 350,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCenterIcon(false);
    });
  };

  // Tap handler (handles single-tap play/pause and double-tap like)
  const handleContainerPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (onDoubleTap && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double Tap Detected
      lastTapRef.current = 0;
      onDoubleTap();
      return;
    }
    lastTapRef.current = now;

    setTimeout(() => {
      if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY - 50 && lastTapRef.current !== 0) {
        // Single Tap
        if (!player) return;
        try {
          if (mode === 'reel') {
            // In Reels: Single tap toggles play/pause
            if (player.playing) {
              player.pause();
              setIsPlaying(false);
              triggerCenterFeedback(false);
            } else {
              player.play();
              setIsPlaying(true);
              triggerCenterFeedback(true);
            }
          } else {
            // In Feed: Single tap toggles mute/unmute
            toggleMute();
          }
        } catch (e) {
          console.log('Tap toggle error:', e?.message);
        }
      }
    }, DOUBLE_TAP_DELAY);
  };

  const toggleMute = () => {
    if (!player) return;
    try {
      const nextMuted = !isMuted;
      player.muted = nextMuted;
      player.volume = nextMuted ? 0 : 1.0;
      setIsMuted(nextMuted);
    } catch (e) {
      console.log('Mute toggle error:', e?.message);
    }
  };

  if (!sourceUrl) {
    return <View style={[styles.container, style]} />;
  }

  return (
    <TouchableWithoutFeedback onPress={handleContainerPress}>
      <View style={[styles.container, style]}>
        {/* Native Video Surface with TextureView to avoid Android black-outs */}
        <VideoView
          style={styles.videoView}
          player={player}
          surfaceType="textureView"
          contentFit={contentFit}
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />

        {/* Big Animated Center Indicator (Play / Pause) */}
        {showCenterIcon && (
          <Animated.View
            style={[
              styles.centerIconOverlay,
              {
                opacity: centerIconAnim,
                transform: [
                  {
                    scale: centerIconAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1.2],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.centerIconCircle}>
              <Ionicons
                name={isPlaying ? 'play' : 'pause'}
                size={38}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 4 : 0 }}
              />
            </View>
          </Animated.View>
        )}

        {/* Dedicated Mute/Unmute Button (Always clickable with high hit-slop and zIndex) */}
        {showMuteButton && (
          <TouchableOpacity
            style={styles.muteBadge}
            activeOpacity={0.7}
            onPress={toggleMute}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={15}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
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
    position: 'relative',
    overflow: 'hidden',
  },
  videoView: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
    pointerEvents: 'none',
  },
  centerIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  muteBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});


