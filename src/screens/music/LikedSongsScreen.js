import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchLikedSongs } from '../../api/music';
import { SongRowItem } from '../../components/music/SongRowItem';
import { useMusicPlayer } from '../../context/MusicPlayerContext';

const MOOD_TAGS = ['All', 'Love', 'Soft', 'Quiet', 'Slow', 'Mellow', 'Peace'];

export const LikedSongsScreen = ({ navigation }) => {
  const { playSong, toggleShuffle, isShuffle, likedSongIds } = useMusicPlayer();
  const [songs, setSongs] = useState([]);
  const [activeMood, setActiveMood] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadLiked = async () => {
    try {
      const data = await fetchLikedSongs();
      if (data && data.songs) {
        setSongs(data.songs);
      }
    } catch (e) {
      console.log('Error loading liked songs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiked();
  }, [likedSongIds]);

  const filteredSongs = activeMood === 'All'
    ? songs
    : songs.filter((s) => s.tags?.some((t) => t.toLowerCase() === activeMood.toLowerCase()));

  const handlePlayAll = () => {
    if (filteredSongs.length === 0) return;
    playSong(filteredSongs[0], filteredSongs);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2C5B" />

      {/* Top Gradient Header in Royal Blue & Midnight */}
      <LinearGradient
        colors={['#0047BA', '#0A183D', '#080E1E']}
        style={styles.gradientHeader}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Liked Songs</Text>
          <Text style={styles.songCountText}>
            {songs.length} songs
          </Text>
        </View>

        {/* Action Controls Row matching Screenshot 5 */}
        <View style={styles.actionControlsRow}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-down-circle-outline" size={24} color="#A5B4FC" />
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={toggleShuffle}
            >
              <Ionicons
                name="shuffle"
                size={26}
                color={isShuffle ? '#00D2FF' : '#A5B4FC'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bigBluePlayBtn}
              activeOpacity={0.8}
              onPress={handlePlayAll}
            >
              <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mood Tags matching Screenshot 5 (Love, Soft, Quiet, Slow, Mellow, Peace) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodScroll}
        >
          {MOOD_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.moodPill, activeMood === tag && styles.activeMoodPill]}
              onPress={() => setActiveMood(tag)}
            >
              <Text style={[styles.moodText, activeMood === tag && styles.activeMoodText]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0084FF" />
        </View>
      ) : (
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => (item._id || item.id).toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <SongRowItem
              song={item}
              queue={filteredSongs}
              index={index}
            />
          )}
          ListHeaderComponent={
            /* "+ Add to this playlist" button matching Screenshot 5 */
            <TouchableOpacity
              style={styles.addToListBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Search')}
            >
              <View style={styles.addPlusBox}>
                <Ionicons name="add" size={28} color="#B3B3B3" />
              </View>
              <Text style={styles.addToListText}>Add to this playlist</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeMood !== 'All'
                  ? `No liked songs found with tag "${activeMood}"`
                  : 'No liked songs yet. Explore songs and tap the heart icon!'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1E',
  },
  gradientHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
  },
  titleSection: {
    marginTop: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  songCountText: {
    fontSize: 13,
    color: '#A5B4FC',
    marginTop: 6,
    fontWeight: '500',
  },
  actionControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  iconBtn: {
    padding: 6,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bigBluePlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  moodScroll: {
    gap: 8,
    marginTop: 18,
    paddingBottom: 4,
  },
  moodPill: {
    backgroundColor: '#121D38',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeMoodPill: {
    backgroundColor: '#0084FF',
    borderColor: '#0084FF',
  },
  moodText: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '600',
  },
  activeMoodText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 160,
  },
  addToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
  },
  addPlusBox: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#121D38',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addToListText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 30,
  },
  emptyText: {
    color: '#B3B3B3',
    fontSize: 14,
    textAlign: 'center',
  },
});
