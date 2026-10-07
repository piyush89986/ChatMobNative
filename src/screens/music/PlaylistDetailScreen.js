import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchPlaylistDetails, removeSongFromPlaylist, fetchCollectionSongs } from '../../api/music';
import { SongRowItem } from '../../components/music/SongRowItem';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width * 0.62;

export const PlaylistDetailScreen = ({ route, navigation }) => {
  const { playlistId, title, albumSearch, coverUrl, artist } = route.params || {};
  const { user } = useAuth();
  const { playSong, toggleShuffle, isShuffle } = useMusicPlayer();

  const [playlist, setPlaylist] = useState(null);
  const [durationText, setDurationText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDetails = async () => {
    try {
      if (albumSearch) {
        const data = await fetchCollectionSongs(albumSearch, title);
        if (data && data.songs) {
          setPlaylist({
            name: title || 'Album',
            songs: data.songs,
            coverUrl: coverUrl || data.songs[0]?.coverUrl,
            creator: { user_name: artist || 'Official Album' },
          });
          const totalSecs = data.songs.reduce((acc, s) => acc + (s.duration || 180), 0);
          const mins = Math.floor(totalSecs / 60);
          setDurationText(`${data.songs.length} songs • ${mins} min`);
        }
        return;
      }

      if (playlistId) {
        const data = await fetchPlaylistDetails(playlistId);
        if (data && data.playlist) {
          setPlaylist(data.playlist);
          setDurationText(data.durationFormatted || '');
        }
      }
    } catch (e) {
      console.log('Error loading playlist details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [playlistId]);

  const handlePlayAll = (shuffle = false) => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) return;
    if (shuffle && !isShuffle) {
      toggleShuffle();
    }
    playSong(playlist.songs[0], playlist.songs);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Listen to playlist "${playlist?.name}" on FOMO Music!`,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const creatorName = playlist?.creator?.user_name || user?.user_name || 'Creator';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#080E1E" />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navIconBtn}
        >
          <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0084FF" />
        </View>
      ) : (
        <FlatList
          data={playlist?.songs || []}
          keyExtractor={(item) => (item._id || item.id).toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <SongRowItem
              song={item}
              queue={playlist?.songs || []}
              index={index}
            />
          )}
          ListHeaderComponent={
            <View style={styles.headerComponent}>
              {/* Large Cover Art matching Screenshot 3 */}
              <View style={styles.artworkWrapper}>
                <Image
                  source={{
                    uri:
                      playlist?.coverUrl ||
                      (playlist?.songs && playlist?.songs[0]?.coverUrl) ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
                  }}
                  style={styles.artworkImage}
                />
              </View>

              {/* Title & Details matching Screenshot 3 */}
              <View style={styles.titleSection}>
                <Text style={styles.playlistTitle} numberOfLines={2}>
                  {playlist?.name || title || 'Playlist'}
                </Text>

                {/* Creator row */}
                <View style={styles.creatorRow}>
                  <View style={styles.creatorAvatarBox}>
                    <Ionicons name="person" size={14} color="#FFFFFF" />
                  </View>
                  <Ionicons name="arrow-forward" size={12} color="#8E8E8E" style={{ marginHorizontal: 4 }} />
                  <Text style={styles.creatorName}>{creatorName}</Text>
                </View>

                {/* Duration / Songs count */}
                <View style={styles.metaRow}>
                  <Ionicons name="globe-outline" size={14} color="#8E8E8E" style={{ marginRight: 6 }} />
                  <Text style={styles.metaText}>
                    {durationText || `${playlist?.songs?.length || 0} songs`}
                  </Text>
                </View>
              </View>

              {/* Action Buttons Row matching Screenshot 3 */}
              <View style={styles.actionRow}>
                <View style={styles.leftActions}>
                  <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7}>
                    <Ionicons name="arrow-down-circle-outline" size={24} color="#B3B3B3" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIcon}
                    activeOpacity={0.7}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-social-outline" size={24} color="#B3B3B3" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon} activeOpacity={0.7}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="#B3B3B3" />
                  </TouchableOpacity>
                </View>

                <View style={styles.rightActions}>
                  {/* Shuffle Button */}
                  <TouchableOpacity
                    style={styles.actionIcon}
                    activeOpacity={0.7}
                    onPress={toggleShuffle}
                  >
                    <Ionicons
                      name="shuffle"
                      size={26}
                      color={isShuffle ? '#0084FF' : '#A5B4FC'}
                    />
                  </TouchableOpacity>

                  {/* Big Blue Play Button */}
                  <TouchableOpacity
                    style={styles.bigBluePlayBtn}
                    activeOpacity={0.8}
                    onPress={() => handlePlayAll(false)}
                  >
                    <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter / Action Pills matching Screenshot 3 */}
              <View style={styles.pillsRow}>
                <TouchableOpacity
                  style={styles.actionPill}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Search')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.actionPillText}>Add</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} activeOpacity={0.8}>
                  <Ionicons name="pencil" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.actionPillText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="swap-vertical" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.actionPillText}>Sort</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>This playlist is empty</Text>
              <TouchableOpacity
                style={styles.addSongsBtn}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.addSongsBtnText}>Find and add songs</Text>
              </TouchableOpacity>
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
  topNav: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navIconBtn: {
    padding: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 160,
  },
  headerComponent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  artworkWrapper: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: '#282828',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    marginBottom: 16,
  },
  playlistTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  creatorAvatarBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#A5B4FC',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    padding: 6,
  },
  bigBluePlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121D38',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addSongsBtn: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addSongsBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
});
