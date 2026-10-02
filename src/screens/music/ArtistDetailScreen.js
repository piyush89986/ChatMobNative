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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchArtistDetails, toggleFollowArtist } from '../../api/music';
import { SongRowItem } from '../../components/music/SongRowItem';
import { useMusicPlayer } from '../../context/MusicPlayerContext';

const { width } = Dimensions.get('window');

export const ArtistDetailScreen = ({ route, navigation }) => {
  const { artistId } = route.params || {};
  const { playSong } = useMusicPlayer();

  const [artist, setArtist] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [topSongs, setTopSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const loadArtist = async () => {
    try {
      const data = await fetchArtistDetails(artistId);
      if (data) {
        setArtist(data.artist);
        setIsFollowing(data.isFollowing);
        setTopSongs(data.topSongs || []);
      }
    } catch (e) {
      console.log('Error loading artist details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtist();
  }, [artistId]);

  const handleFollowToggle = async () => {
    setFollowLoading(true);
    try {
      const res = await toggleFollowArtist(artistId);
      if (res) {
        setIsFollowing(res.isFollowing);
      }
    } catch (e) {
      console.log('Error toggling follow:', e);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#080E1E" />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
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
          data={topSongs}
          keyExtractor={(item) => (item._id || item.id).toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <SongRowItem
              song={item}
              queue={topSongs}
              index={index}
            />
          )}
          ListHeaderComponent={
            <View style={styles.headerComponent}>
              {/* Banner / Avatar */}
              <View style={styles.bannerWrapper}>
                <Image
                  source={{ uri: artist?.bannerUrl || artist?.avatarUrl }}
                  style={styles.bannerImage}
                />
                <View style={styles.bannerGradient} />
                <Text style={styles.artistNameOnBanner}>{artist?.name}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.listenersText}>
                  {artist?.monthlyListeners || '1.5M'} monthly listeners
                </Text>

                <View style={styles.actionsRow}>
                  {/* Follow Button */}
                  <TouchableOpacity
                    style={[styles.followBtn, isFollowing && styles.followingBtn]}
                    onPress={handleFollowToggle}
                    disabled={followLoading}
                    activeOpacity={0.8}
                  >
                    {followLoading ? (
                      <ActivityIndicator size="small" color={isFollowing ? '#FFFFFF' : '#000000'} />
                    ) : (
                      <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Play Top Songs Button */}
                  {topSongs.length > 0 && (
                    <TouchableOpacity
                      style={styles.playBtn}
                      activeOpacity={0.8}
                      onPress={() => playSong(topSongs[0], topSongs)}
                    >
                      <Ionicons name="play" size={26} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Bio */}
              {artist?.bio ? (
                <Text style={styles.bioText}>{artist.bio}</Text>
              ) : null}

              <Text style={styles.popularTitle}>Popular Tracks</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No songs available for this artist yet.</Text>
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
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 10,
  },
  bannerWrapper: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#162347',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(8, 14, 30, 0.75)',
  },
  artistNameOnBanner: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  listenersText: {
    fontSize: 13,
    color: '#A5B4FC',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  followBtn: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
  },
  followingBtn: {
    borderColor: '#0084FF',
    backgroundColor: 'rgba(0, 132, 255, 0.15)',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  followingBtnText: {
    color: '#0084FF',
  },
  playBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  bioText: {
    fontSize: 13,
    color: '#B3B3B3',
    paddingHorizontal: 16,
    marginTop: 12,
    lineHeight: 18,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
});
