import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserPlaylists, addSongToPlaylist } from '../../api/music';
import { CreatePlaylistModal } from './CreatePlaylistModal';

export const AddToPlaylistModal = ({ visible, song, onClose }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (visible) {
      loadPlaylists();
    }
  }, [visible]);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const data = await fetchUserPlaylists();
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Error loading playlists:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlaylist = async (playlist) => {
    if (!song) return;
    setAddingId(playlist._id);
    try {
      await addSongToPlaylist(playlist._id, song._id || song.id);
      Alert.alert('Added to Playlist', `Added "${song.title}" to "${playlist.name}"`);
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Could not add song to playlist');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add to playlist</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* New Playlist button */}
          <TouchableOpacity
            style={styles.newPlaylistBtn}
            onPress={() => setIsCreateOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.newIconBox}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.newPlaylistText}>New playlist</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="small" color="#0084FF" style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.playlistRow}
                  activeOpacity={0.7}
                  onPress={() => handleSelectPlaylist(item)}
                  disabled={addingId === item._id}
                >
                  <Image
                    source={{
                      uri:
                        item.coverUrl ||
                        (item.songs && item.songs[0]?.coverUrl) ||
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
                    }}
                    style={styles.playlistThumb}
                  />
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.songCount}>
                      {item.songs?.length || 0} songs
                    </Text>
                  </View>
                  {addingId === item._id && (
                    <ActivityIndicator size="small" color="#0084FF" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No playlists yet. Create one!</Text>
              }
            />
          )}

          <CreatePlaylistModal
            visible={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreated={(newPl) => {
              setPlaylists((prev) => [newPl, ...prev]);
              handleSelectPlaylist(newPl);
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0E1B38',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 132, 255, 0.25)',
    maxHeight: '75%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  newIconBox: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#3E3E3E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newPlaylistText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  playlistThumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#333333',
    marginRight: 14,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  songCount: {
    fontSize: 12,
    color: '#B3B3B3',
    marginTop: 2,
  },
  emptyText: {
    color: '#B3B3B3',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
