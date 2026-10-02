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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchUserLibrary } from '../../api/music';
import { CreatePlaylistModal } from '../../components/music/CreatePlaylistModal';
import { useAuth } from '../../context/AuthContext';

export const MusicLibraryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Playlists' | 'Albums' | 'Artists'
  const [libraryData, setLibraryData] = useState({
    likedSongsCount: 0,
    playlists: [],
    followedArtists: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadLibrary = async () => {
    try {
      const data = await fetchUserLibrary();
      if (data) {
        setLibraryData(data);
      }
    } catch (e) {
      console.log('Error loading library:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const userInitial = user?.user_name ? user.user_name.charAt(0).toUpperCase() : 'F';
  const userName = user?.user_name || 'User';

  const filterTabs = ['Playlists', 'Albums', 'Artists'];

  // Filter items based on activeTab
  const showPlaylists = activeTab === 'All' || activeTab === 'Playlists';
  const showArtists = activeTab === 'All' || activeTab === 'Artists';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#080E1E" />

      {/* Header matching Screenshot 2 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <Text style={styles.headerTitle}>Your Library</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setIsCreateOpen(true)}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pill Filter Tabs matching Screenshot 2 */}
      <View style={styles.pillsRow}>
        <TouchableOpacity
          style={[styles.pill, activeTab === 'All' && styles.activePill]}
          onPress={() => setActiveTab('All')}
        >
          <Text style={[styles.pillText, activeTab === 'All' && styles.activePillText]}>
            All
          </Text>
        </TouchableOpacity>

        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.pill, activeTab === tab && styles.activePill]}
            onPress={() => setActiveTab(activeTab === tab ? 'All' : tab)}
          >
            <Text style={[styles.pillText, activeTab === tab && styles.activePillText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort & Grid Toggle Row matching Screenshot 2 */}
      <View style={styles.sortRow}>
        <View style={styles.recentsBox}>
          <MaterialCommunityIcons name="swap-vertical" size={20} color="#FFFFFF" />
          <Text style={styles.recentsText}>Recents</Text>
        </View>

        <TouchableOpacity style={{ padding: 4 }}>
          <MaterialCommunityIcons name="view-grid-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0084FF" />
        </View>
      ) : (
        <FlatList
          data={[
            // Liked Songs pinned item (if showing playlists)
            ...(showPlaylists
              ? [
                  {
                    id: 'liked-songs-pin',
                    type: 'liked',
                    name: 'Liked Songs',
                    subtitle: `Playlist • 📌 ${userName}`,
                  },
                ]
              : []),
            // Custom playlists
            ...(showPlaylists
              ? libraryData.playlists.map((pl) => ({
                  id: pl._id,
                  type: 'playlist',
                  name: pl.name,
                  subtitle: `Playlist • ${userName}`,
                  coverUrl: pl.coverUrl || pl.songs[0]?.coverUrl,
                  data: pl,
                }))
              : []),
            // Followed artists
            ...(showArtists
              ? libraryData.followedArtists.map((art) => ({
                  id: art._id,
                  type: 'artist',
                  name: art.name,
                  subtitle: 'Artist',
                  coverUrl: art.avatarUrl,
                  data: art,
                }))
              : []),
          ]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadLibrary();
              }}
              tintColor="#0084FF"
            />
          }
          renderItem={({ item }) => {
            if (item.type === 'liked') {
              return (
                <TouchableOpacity
                  style={styles.itemRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('LikedSongs')}
                >
                  <LinearGradient
                    colors={['#0066FF', '#00D2FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.likedGradientBox}
                  >
                    <Ionicons name="heart" size={26} color="#FFFFFF" />
                  </LinearGradient>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>Liked Songs</Text>
                    <View style={styles.subtitleRow}>
                      <Ionicons name="pin" size={13} color="#0084FF" style={{ marginRight: 4 }} />
                      <Text style={styles.itemSubtitle}>
                        Playlist • {userName}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }

            if (item.type === 'artist') {
              return (
                <TouchableOpacity
                  style={styles.itemRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('ArtistDetail', { artistId: item.id })}
                >
                  <Image
                    source={{ uri: item.coverUrl }}
                    style={styles.artistRoundThumb}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>Artist</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            // Playlist
            return (
              <TouchableOpacity
                style={styles.itemRow}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('PlaylistDetail', {
                    playlistId: item.id,
                    title: item.name,
                  })
                }
              >
                <Image
                  source={{
                    uri:
                      item.coverUrl ||
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
                  }}
                  style={styles.playlistThumb}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your library is empty.</Text>
            </View>
          }
        />
      )}

      <CreatePlaylistModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newPl) => {
          loadLibrary();
          navigation.navigate('PlaylistDetail', { playlistId: newPl._id, title: newPl.name });
        }}
      />
    </SafeAreaView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 6,
  },
  pill: {
    backgroundColor: '#121D38',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activePill: {
    backgroundColor: '#0084FF',
    borderColor: '#0084FF',
  },
  pillText: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '600',
  },
  activePillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recentsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentsText: {
    color: '#FFFFFF',
    fontSize: 13,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  likedGradientBox: {
    width: 64,
    height: 64,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  playlistThumb: {
    width: 64,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#282828',
    marginRight: 14,
  },
  artistRoundThumb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#282828',
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#B3B3B3',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
});
