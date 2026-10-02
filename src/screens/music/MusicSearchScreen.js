import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchMusic } from '../../api/music';
import { SongRowItem } from '../../components/music/SongRowItem';
import { useAuth } from '../../context/AuthContext';

const GENRE_CATEGORIES = [
  { name: 'Pop', color: '#8D67AB', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80' },
  { name: 'Hip-Hop', color: '#BA5D07', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80' },
  { name: 'Indie', color: '#E91429', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
  { name: 'Punjabi', color: '#E13300', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { name: 'Bollywood', color: '#D84000', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80' },
  { name: 'Romantic', color: '#E61E32', image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80' },
  { name: 'Lo-Fi', color: '#1E3264', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80' },
  { name: 'Rock', color: '#777777', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80' },
];

export const MusicSearchScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [results, setResults] = useState({ songs: [], artists: [], playlists: [] });
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const searchTimeoutRef = useRef(null);

  const handleSearch = (text, genre = selectedGenre) => {
    setQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text.trim() && !genre) {
      setResults({ songs: [], artists: [], playlists: [] });
      setLoading(false);
      setHasError(false);
      return;
    }

    setLoading(true);
    setHasError(false);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchMusic(text.trim(), genre);
        setResults(data || { songs: [], artists: [], playlists: [] });
      } catch (err) {
        console.log('Search error:', err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelectGenre = (genreName) => {
    const nextGenre = selectedGenre === genreName ? '' : genreName;
    setSelectedGenre(nextGenre);
    handleSearch(query, nextGenre);
  };

  const userInitial = user?.user_name ? user.user_name.charAt(0).toUpperCase() : 'F';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#080E1E" />

      {/* Top Header matching Screenshot 1 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Input Box matching Screenshot 1 */}
      <View style={styles.searchBoxWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={22} color="#0084FF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="What do you want to listen to?"
            placeholderTextColor="#666666"
            value={query}
            onChangeText={(text) => handleSearch(text)}
            autoCapitalize="none"
            selectionColor="#0084FF"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => handleSearch('')}
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={20} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0084FF" />
        </View>
      ) : hasError ? (
        /* Error State matching Screenshot 1 "Something went wrong - Have another go? - Try again" */
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>Have another go?</Text>
          <TouchableOpacity
            style={styles.tryAgainBtn}
            onPress={() => handleSearch(query)}
            activeOpacity={0.8}
          >
            <Text style={styles.tryAgainText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : query.trim().length > 0 || selectedGenre ? (
        /* Search Results */
        <FlatList
          data={results.songs}
          keyExtractor={(item) => (item._id || item.id).toString()}
          contentContainerStyle={{ paddingBottom: 160 }}
          renderItem={({ item }) => (
            <SongRowItem song={item} queue={results.songs} />
          )}
          ListHeaderComponent={
            results.artists.length > 0 ? (
              <View style={styles.artistsResultsContainer}>
                <Text style={styles.subheading}>Artists</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {results.artists.map((artist) => (
                    <TouchableOpacity
                      key={artist._id}
                      style={styles.artistResultCard}
                      onPress={() => navigation.navigate('ArtistDetail', { artistId: artist._id })}
                    >
                      <Image source={{ uri: artist.avatarUrl }} style={styles.artistResultThumb} />
                      <Text style={styles.artistResultName} numberOfLines={1}>
                        {artist.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={[styles.subheading, { marginTop: 16 }]}>Songs</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found for "{query}"</Text>
            </View>
          }
        />
      ) : (
        /* Browse Categories Grid */
        <ScrollView contentContainerStyle={styles.browseContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.browseTitle}>Browse all</Text>

          <View style={styles.genreGrid}>
            {GENRE_CATEGORIES.map((genre) => (
              <TouchableOpacity
                key={genre.name}
                style={[styles.genreCard, { backgroundColor: genre.color }]}
                activeOpacity={0.8}
                onPress={() => handleSelectGenre(genre.name)}
              >
                <Text style={styles.genreName}>{genre.name}</Text>
                <Image source={{ uri: genre.image }} style={styles.genreThumb} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
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
  cameraBtn: {
    padding: 6,
  },
  searchBoxWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  tryAgainBtn: {
    backgroundColor: '#0084FF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  tryAgainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  subheading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  artistsResultsContainer: {
    paddingVertical: 8,
  },
  artistResultCard: {
    width: 90,
    alignItems: 'center',
    marginLeft: 16,
  },
  artistResultThumb: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#282828',
  },
  artistResultName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#B3B3B3',
    fontSize: 15,
  },
  browseContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 160,
  },
  browseTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  genreCard: {
    width: '47.5%',
    height: 96,
    borderRadius: 8,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  genreName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '70%',
  },
  genreThumb: {
    width: 60,
    height: 60,
    position: 'absolute',
    bottom: -6,
    right: -10,
    transform: [{ rotate: '25deg' }],
    borderRadius: 4,
  },
});
