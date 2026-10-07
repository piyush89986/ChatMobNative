import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadCustomSongApi } from '../../api/music';
import { useMusicPlayer } from '../../context/MusicPlayerContext';

const GENRES = ['Pop', 'Punjabi', 'Hip-Hop', 'Romantic', 'Lo-Fi', 'Rock', 'Acoustic', 'Indie'];

export const UploadMusicScreen = ({ navigation }) => {
  const { playSong } = useMusicPlayer();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Pick Audio File (.mp3, .wav, .m4a, audio/*)
  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0];
        setAudioFile(picked);

        // Auto-fill title from filename if empty
        if (!title && picked.name) {
          const cleanName = picked.name.replace(/\.[^/.]+$/, '');
          setTitle(cleanName);
        }
      }
    } catch (e) {
      console.log('Error picking audio:', e);
      Alert.alert('Error', 'Failed to pick audio file. Please try again.');
    }
  };

  // Pick Cover Artwork
  const handlePickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImage(result.assets[0]);
      }
    } catch (e) {
      console.log('Error picking cover:', e);
      Alert.alert('Error', 'Failed to pick cover image.');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a song title.');
      return;
    }
    if (!artist.trim()) {
      Alert.alert('Missing Field', 'Please enter the artist name.');
      return;
    }
    if (!audioFile) {
      Alert.alert('Audio File Missing', 'Please select an audio file to upload.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      formData.append('genre', genre);

      // Attach audio
      const audioUri = Platform.OS === 'android' ? audioFile.uri : audioFile.uri.replace('file://', '');
      const audioExt = audioFile.name?.split('.').pop()?.toLowerCase() || 'mp3';
      const audioMime =
        audioFile.mimeType ||
        (audioExt === 'mp3'
          ? 'audio/mpeg'
          : audioExt === 'wav'
          ? 'audio/wav'
          : audioExt === 'm4a'
          ? 'audio/mp4'
          : 'audio/mpeg');

      formData.append('audio', {
        uri: audioUri,
        name: audioFile.name || `audio_${Date.now()}.${audioExt}`,
        type: audioMime,
      });

      // Attach cover if selected
      if (coverImage) {
        const coverUri = Platform.OS === 'android' ? coverImage.uri : coverImage.uri.replace('file://', '');
        formData.append('cover', {
          uri: coverUri,
          name: `cover_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }

      const res = await uploadCustomSongApi(formData);
      if (res && res.song) {
        Alert.alert(
          'Upload Successful! 🎶',
          `"${res.song.title}" is now uploaded and added to your Library.`,
          [
            {
              text: 'Play Now',
              onPress: () => {
                playSong(res.song, [res.song]);
                navigation.navigate('Home');
              },
            },
            {
              text: 'OK',
              onPress: () => {
                setTitle('');
                setArtist('');
                setAudioFile(null);
                setCoverImage(null);
                navigation.navigate('YourLibrary');
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error('Upload song error:', err);
      Alert.alert('Upload Failed', err.message || 'Server error while uploading music.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Your Fav Music</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Art Box */}
        <TouchableOpacity style={styles.coverBox} activeOpacity={0.8} onPress={handlePickCover}>
          {coverImage ? (
            <Image source={{ uri: coverImage.uri }} style={styles.coverImagePreview} />
          ) : (
            <LinearGradient
              colors={['#162347', '#0B132B']}
              style={styles.coverPlaceholder}
            >
              <Ionicons name="image-outline" size={38} color="#0084FF" />
              <Text style={styles.coverPlaceholderText}>Add Cover Art (Optional)</Text>
              <Text style={styles.coverSubText}>Tap to select square poster</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>

        {/* Audio File Picker Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Audio File (MP3, WAV, M4A) *</Text>
          <TouchableOpacity
            style={[styles.audioPickerBtn, audioFile && styles.audioPickerBtnActive]}
            activeOpacity={0.8}
            onPress={handlePickAudio}
          >
            <View style={styles.audioPickerIconBox}>
              <Ionicons
                name={audioFile ? 'musical-notes' : 'cloud-upload-outline'}
                size={24}
                color={audioFile ? '#00D2FF' : '#94A3B8'}
              />
            </View>
            <View style={styles.audioPickerTextBox}>
              <Text style={styles.audioPickerTitle} numberOfLines={1}>
                {audioFile ? audioFile.name : 'Select Audio File'}
              </Text>
              <Text style={styles.audioPickerSub}>
                {audioFile
                  ? `${Math.round((audioFile.size || 0) / 1024)} KB • Ready to upload`
                  : 'Tap to browse your device'}
              </Text>
            </View>
            <Ionicons
              name={audioFile ? 'checkmark-circle' : 'chevron-forward'}
              size={22}
              color={audioFile ? '#00D2FF' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        {/* Song Info Form */}
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Song Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. My Favorite Melody"
            placeholderTextColor="#64748B"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Artist Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Arijit Singh or Your Name"
            placeholderTextColor="#64748B"
            value={artist}
            onChangeText={setArtist}
          />

          <Text style={styles.fieldLabel}>Genre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genresRow}>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genrePill, genre === g && styles.genrePillActive]}
                onPress={() => setGenre(g)}
              >
                <Text style={[styles.genrePillText, genre === g && styles.genrePillTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upload Submit Button */}
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleUpload}
          disabled={uploading}
        >
          <LinearGradient
            colors={['#0084FF', '#0052CC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.uploadBtnGradient}
          >
            {uploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.uploadBtnText}>Uploading your track...</Text>
              </View>
            ) : (
              <View style={styles.uploadingRow}>
                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.uploadBtnText}>Upload to FOMO Music</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Extra Bottom Space so button can scroll high above the floating Mini Player banner */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080E1E',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 200,
  },
  coverBox: {
    width: 170,
    height: 170,
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 132, 255, 0.3)',
    elevation: 6,
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  coverPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  coverSubText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  coverImagePreview: {
    width: '100%',
    height: '100%',
  },
  sectionCard: {
    backgroundColor: '#0F1A35',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#080E1E',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  audioPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080E1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  audioPickerBtnActive: {
    borderColor: '#0084FF',
    backgroundColor: 'rgba(0, 132, 255, 0.08)',
  },
  audioPickerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioPickerTextBox: {
    flex: 1,
  },
  audioPickerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  audioPickerSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  genresRow: {
    gap: 8,
    paddingVertical: 4,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#080E1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genrePillActive: {
    backgroundColor: '#0084FF',
    borderColor: '#0084FF',
  },
  genrePillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  genrePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  uploadBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    elevation: 4,
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  uploadBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomSpacer: {
    height: 70,
  },
});
