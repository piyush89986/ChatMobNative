import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchHomeMusic } from '../../api/music';
import { useMusicPlayer } from '../../context/MusicPlayerContext';
import { useAuth } from '../../context/AuthContext';
import { ProfileDrawerModal } from '../../components/music/ProfileDrawerModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.floor((width - 32 - 8) / 2);

export const MusicHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { playSong } = useMusicPlayer();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [feedData, setFeedData] = useState({
    quickGrid: [],
    jumpBackIn: [],
    recommended: [],
    artists: [],
  });

  const loadFeed = async () => {
    try {
      const data = await fetchHomeMusic();
      if (data) {
        setFeedData(data);
      }
    } catch (e) {
      console.log('Error loading music feed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleQuickGridPress = (item) => {
    if (item.type === 'liked') {
      navigation.navigate('LikedSongs');
    } else if (item.type === 'playlist') {
      navigation.navigate('PlaylistDetail', { playlistId: item.id, title: item.title });
    } else if (item.type === 'artist') {
      navigation.navigate('ArtistDetail', { artistId: item.id });
    } else if (item.type === 'song' && item.songData) {
      playSong(item.songData, feedData.jumpBackIn);
    }
  };

  // Avatar initial or "3" matching screenshot
  const userInitial = user?.user_name ? user.user_name.charAt(0).toUpperCase() : '3';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#080E1E" />

      {/* Top Bar matching exact Screenshot with Blue & White Theme */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          {/* Avatar Circle with Electric Blue accent: Tapping opens Profile Slider/Drawer */}
          <TouchableOpacity
            style={styles.avatarCircle}
            activeOpacity={0.8}
            onPress={() => setIsProfileDrawerOpen(true)}
          >
            <Text style={styles.avatarText}>{userInitial}</Text>
          </TouchableOpacity>

          {/* Filter Chip "All" with Blue & White theme */}
          <View style={styles.chipAll}>
            <Text style={styles.chipAllText}>All</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0084FF" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFeed();
              }}
              tintColor="#0084FF"
            />
          }
        >
          {/* 2-Column Quick Grid matching Screenshot in Blue & White Theme */}
          <View style={styles.quickGridContainer}>
            {feedData.quickGrid.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={styles.quickGridCard}
                activeOpacity={0.8}
                onPress={() => handleQuickGridPress(item)}
              >
                {item.type === 'liked' ? (
                  <LinearGradient
                    colors={['#0066FF', '#00D2FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.likedCoverBox}
                  >
                    <Ionicons name="heart" size={24} color="#FFFFFF" />
                  </LinearGradient>
                ) : (
                  <Image
                    source={{ uri: item.coverUrl }}
                    style={[
                      styles.quickGridImage,
                      item.type === 'artist' && styles.artistQuickImage,
                    ]}
                  />
                )}
                <View style={styles.quickGridTextBox}>
                  <Text style={styles.quickGridTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {/* Subtle listening progress indicator for podcasts/special items */}
                  {index === 1 && <View style={styles.cardProgressBar} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Jump back in Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jump back in</Text>
          </View>

          <FlatList
            horizontal
            data={feedData.jumpBackIn}
            keyExtractor={(item) => (item._id || item.id).toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.musicCard}
                activeOpacity={0.75}
                onPress={() => playSong(item, feedData.jumpBackIn)}
              >
                <Image
                  source={{ uri: item.coverUrl }}
                  style={styles.musicCardCover}
                />
                <Text style={styles.cardTypeLabel}>
                  {item.album === 'Single' ? 'Single' : 'Album'}
                </Text>
                <Text style={styles.musicCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.musicCardArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Recommended for today Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for today</Text>
          </View>

          <FlatList
            horizontal
            data={feedData.recommended}
            keyExtractor={(item) => (item._id || item.id).toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.musicCard}
                activeOpacity={0.75}
                onPress={() => playSong(item, feedData.recommended)}
              >
                <Image
                  source={{ uri: item.coverUrl }}
                  style={styles.musicCardCover}
                />
                <Text style={styles.cardTypeLabel}>Recommended</Text>
                <Text style={styles.musicCardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.musicCardArtist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </TouchableOpacity>
            )}
          />
        </ScrollView>
      )}

      {/* Profile Slider / Drawer Modal opened on clicking avatar */}
      <ProfileDrawerModal
        visible={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1E', // Rich Deep Oceanic Blue
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0084FF', // Electric Blue accent
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  avatarText: {
    color: '#FFFFFF', // Crisp White
    fontSize: 15,
    fontWeight: '800',
  },
  chipAll: {
    backgroundColor: '#0084FF', // Electric Blue
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chipAllText: {
    color: '#FFFFFF', // Crisp White
    fontSize: 13,
    fontWeight: '700',
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  quickGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  quickGridCard: {
    width: CARD_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121D38', // Deep Midnight Navy Card
    borderRadius: 6,
    overflow: 'hidden',
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  likedCoverBox: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickGridImage: {
    width: 56,
    height: 56,
    backgroundColor: '#1C2A4A',
  },
  artistQuickImage: {
    borderRadius: 28,
    width: 48,
    height: 48,
    marginLeft: 4,
  },
  quickGridTextBox: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  quickGridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 15,
  },
  cardProgressBar: {
    height: 2,
    backgroundColor: '#00D2FF', // Cyan / Electric Blue
    borderRadius: 1,
    marginTop: 4,
    width: '65%',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  musicCard: {
    width: 142,
  },
  musicCardCover: {
    width: 142,
    height: 142,
    borderRadius: 8,
    backgroundColor: '#162347',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTypeLabel: {
    fontSize: 11,
    color: '#A5B4FC',
    marginTop: 8,
    fontWeight: '500',
  },
  musicCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  musicCardArtist: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
