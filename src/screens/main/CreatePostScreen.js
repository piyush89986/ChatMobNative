import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createPost, createStory } from '../../api/post';

export const CreatePostScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [postType, setPostType] = useState('post'); // 'post' | 'story'
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      console.log('Error picking image:', e);
    }
  };

  const handleLaunchCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Camera permission required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      console.log('Error launching camera:', e);
    }
  };

  const handleShare = async () => {
    if (!selectedImage) {
      Alert.alert('Photo Required', 'Please select a photo or video to share.');
      return;
    }

    setLoading(true);
    try {
      const mediaDataUri = selectedImage.base64
        ? `data:${selectedImage.mimeType || 'image/jpeg'};base64,${selectedImage.base64}`
        : selectedImage.uri;

      if (postType === 'story') {
        await createStory({
          mediaUrl: mediaDataUri,
          caption: caption.trim(),
        });
        Alert.alert('Success', 'Added to your story!');
      } else {
        await createPost({
          mediaUrl: mediaDataUri,
          caption: caption.trim(),
          location: location.trim(),
        });
        Alert.alert('Success', 'Post shared to feed!');
      }

      navigation.goBack();
    } catch (err) {
      console.log('Share error:', err);
      Alert.alert('Error', err.message || 'Could not share post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>New Post</Text>

        <TouchableOpacity
          style={[styles.shareBtn, !selectedImage && styles.shareBtnDisabled]}
          onPress={handleShare}
          disabled={!selectedImage || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#0095F6" />
          ) : (
            <Text style={styles.shareBtnText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Post vs Story toggle */}
        <View style={styles.typeSwitcher}>
          <TouchableOpacity
            style={[styles.typeBtn, postType === 'post' && styles.typeBtnActive]}
            onPress={() => setPostType('post')}
          >
            <Text style={[styles.typeBtnText, postType === 'post' && styles.typeBtnTextActive]}>
              Feed Post
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, postType === 'story' && styles.typeBtnActive]}
            onPress={() => setPostType('story')}
          >
            <Text style={[styles.typeBtnText, postType === 'story' && styles.typeBtnTextActive]}>
              Your Story
            </Text>
          </TouchableOpacity>
        </View>

        {/* Media Preview or Picker Box */}
        {selectedImage ? (
          <View style={styles.previewBox}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity style={styles.changeMediaBtn} onPress={handlePickImage}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.changeMediaText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pickerBox}>
            <Ionicons name="images-outline" size={54} color="#555555" />
            <Text style={styles.pickerTitle}>Select photo or video</Text>
            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.pickerBtn} onPress={handlePickImage}>
                <Ionicons name="images" size={18} color="#FFFFFF" />
                <Text style={styles.pickerBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerBtn, styles.cameraBtn]} onPress={handleLaunchCamera}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.pickerBtnText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            placeholderTextColor="#737373"
            style={styles.captionInput}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Location Input */}
        {postType === 'post' && (
          <View style={styles.rowItem}>
            <Ionicons name="location-outline" size={22} color="#FFFFFF" />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Add location"
              placeholderTextColor="#737373"
              style={styles.rowInput}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shareBtnDisabled: {
    opacity: 0.4,
  },
  shareBtnText: {
    color: '#0095F6',
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeBtnActive: {
    backgroundColor: '#303030',
  },
  typeBtnText: {
    color: '#737373',
    fontSize: 13,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickerBox: {
    height: 240,
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  pickerTitle: {
    color: '#A8A8A8',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#262626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cameraBtn: {
    backgroundColor: '#0095F6',
  },
  pickerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  previewBox: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  changeMediaBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeMediaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#262626',
  },
  captionInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  rowInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
});
