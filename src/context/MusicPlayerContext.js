import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createVideoPlayer, VideoView } from 'expo-video';
import { toggleLikeSong, fetchLikedSongs } from '../api/music';

const MusicPlayerContext = createContext({
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  loopMode: 'off', // 'off' | 'all' | 'one'
  isShuffle: false,
  likedSongIds: new Set(),
  isFullPlayerVisible: false,
  playSong: () => {},
  togglePlayPause: () => {},
  seekTo: () => {},
  nextSong: () => {},
  prevSong: () => {},
  toggleLoop: () => {},
  toggleShuffle: () => {},
  toggleLike: () => {},
  setIsFullPlayerVisible: () => {},
  addToQueue: () => {},
  setQueue: () => {},
});

export const MusicPlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loopMode, setLoopMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isShuffle, setIsShuffle] = useState(false);
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);

  // References
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const loopModeRef = useRef(loopMode);
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const isShuffleRef = useRef(isShuffle);

  loopModeRef.current = loopMode;
  queueRef.current = queue;
  currentIndexRef.current = currentIndex;
  isShuffleRef.current = isShuffle;

  // Load initial liked songs
  useEffect(() => {
    const loadLikes = async () => {
      try {
        const res = await fetchLikedSongs();
        if (res && res.songs) {
          const ids = new Set(res.songs.map((s) => (s._id || s.id).toString()));
          setLikedSongIds(ids);
        }
      } catch (err) {
        // Silently fail if not logged in yet
      }
    };
    loadLikes();
  }, []);

  // Initialize or cleanup VideoPlayer instance
  useEffect(() => {
    try {
      const initialSource = currentSong?.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      const player = createVideoPlayer(initialSource);
      player.loop = loopModeRef.current === 'one';
      playerRef.current = player;

      const playingSub = player.addListener('playingChange', ({ isPlaying: playing }) => {
        setIsPlaying(playing);
      });

      const playToEndSub = player.addListener('playToEnd', () => {
        handleTrackFinished();
      });

      const statusSub = player.addListener('statusChange', (status) => {
        if (player.duration) {
          setDuration(player.duration);
        }
      });

      return () => {
        playingSub?.remove();
        playToEndSub?.remove();
        statusSub?.remove();
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } catch (e) {
      console.log('Error creating VideoPlayer:', e);
    }
  }, []);

  // Position poll interval when playing
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          setCurrentTime(playerRef.current.currentTime || 0);
          if (playerRef.current.duration && playerRef.current.duration > 0) {
            setDuration(playerRef.current.duration);
          }
        }
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const handleTrackFinished = () => {
    if (loopModeRef.current === 'one') {
      if (playerRef.current) {
        playerRef.current.currentTime = 0;
        playerRef.current.play();
      }
      return;
    }

    const q = queueRef.current;
    const idx = currentIndexRef.current;

    if (q.length > 0) {
      if (idx < q.length - 1 || loopModeRef.current === 'all') {
        nextSong();
      } else {
        setIsPlaying(false);
        if (playerRef.current) {
          playerRef.current.pause();
          playerRef.current.currentTime = 0;
        }
      }
    }
  };

  const playSong = async (song, newQueue = null) => {
    if (!song) return;

    let targetQueue = newQueue || (queue.length > 0 ? queue : [song]);
    let targetIndex = targetQueue.findIndex(
      (s) => (s._id || s.id)?.toString() === (song._id || song.id)?.toString()
    );

    if (targetIndex === -1) {
      targetQueue = [song, ...targetQueue];
      targetIndex = 0;
    }

    setQueueState(targetQueue);
    setCurrentIndex(targetIndex);
    setCurrentSong(song);
    setCurrentTime(0);
    setDuration(song.duration || 180);

    try {
      if (playerRef.current) {
        playerRef.current.replace(song.audioUrl);
        playerRef.current.loop = loopModeRef.current === 'one';
        playerRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Error playing song:', e);
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('togglePlayPause error:', e);
    }
  };

  const seekTo = (seconds) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    } catch (e) {
      console.log('seekTo error:', e);
    }
  };

  const nextSong = () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    let nextIdx = 0;
    if (isShuffleRef.current && q.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * q.length);
      } while (nextIdx === currentIndexRef.current);
    } else {
      nextIdx = (currentIndexRef.current + 1) % q.length;
    }

    const nextTrack = q[nextIdx];
    playSong(nextTrack, q);
  };

  const prevSong = () => {
    const q = queueRef.current;
    if (q.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    const prevIdx = (currentIndexRef.current - 1 + q.length) % q.length;
    const prevTrack = q[prevIdx];
    playSong(prevTrack, q);
  };

  const toggleLoop = () => {
    setLoopMode((prev) => {
      let nextMode = 'off';
      if (prev === 'off') nextMode = 'all';
      else if (prev === 'all') nextMode = 'one';
      else nextMode = 'off';

      if (playerRef.current) {
        playerRef.current.loop = nextMode === 'one';
      }
      return nextMode;
    });
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleLike = async (songId) => {
    if (!songId) return;
    const idStr = songId.toString();

    // Optimistic UI update
    setLikedSongIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(idStr)) {
        copy.delete(idStr);
      } else {
        copy.add(idStr);
      }
      return copy;
    });

    try {
      const res = await toggleLikeSong(idStr);
      if (res && res.likedSongIds) {
        setLikedSongIds(new Set(res.likedSongIds.map((id) => id.toString())));
      }
    } catch (e) {
      console.log('toggleLike error:', e);
    }
  };

  const addToQueue = (song) => {
    setQueueState((prev) => [...prev, song]);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration: duration || (currentSong?.duration || 180),
        queue,
        currentIndex,
        loopMode,
        isShuffle,
        likedSongIds,
        isFullPlayerVisible,
        playSong,
        togglePlayPause,
        seekTo,
        nextSong,
        prevSong,
        toggleLoop,
        toggleShuffle,
        toggleLike,
        setIsFullPlayerVisible,
        addToQueue,
        setQueue: setQueueState,
      }}
    >
      {children}
      {/* Invisible VideoView to maintain native audio pipeline lifecycle */}
      {playerRef.current && (
        <View style={styles.hiddenPlayer} pointerEvents="none">
          <VideoView player={playerRef.current} style={styles.hiddenVideo} />
        </View>
      )}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => useContext(MusicPlayerContext);

const styles = StyleSheet.create({
  hiddenPlayer: {
    width: 0,
    height: 0,
    position: 'absolute',
    opacity: 0,
    overflow: 'hidden',
  },
  hiddenVideo: {
    width: 1,
    height: 1,
  },
});
