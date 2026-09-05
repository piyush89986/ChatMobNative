import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createPost, createStory, uploadMedia } from '../../api/post';

const { width } = Dimensions.get('window');

export const CreatePostScreen = ({ navigation, route }) => {
  const initialType = route?.params?.initialType || 'post'; // 'post' | 'reel' | 'story'
  const [postType, setPostType] = useState(initialType);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (route?.params?.initialType) {
      setPostType(route.params.initialType);
    }
  }, [route?.params?.initialType]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery permission is required to select photos and videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false, // Disabling native crop prevents Android video crashes and preserves full resolution
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      console.log('Error picking image:', e);
      Alert.alert('Error', 'Could not open media library: ' + e.message);
    }
  };

  const handleLaunchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      console.log('Error launching camera:', e);
      Alert.alert('Error', 'Could not open camera: ' + e.message);
    }
  };

  const isVideo = selectedImage && (
    selectedImage.type === 'video' ||
    (selectedImage.mimeType && selectedImage.mimeType.startsWith('video/')) ||
    (selectedImage.uri && selectedImage.uri.match(/\.(mp4|mov|avi|mkv|webm)$/i))
  );

  const handleShare = async () => {
    if (!selectedImage) {
      Alert.alert('Media Required', 'Please choose a photo or video to share.');
      return;
    }

    setLoading(true);
    try {
      let uploadedUrl = null;
      try {
        const formData = new FormData();
        const filename = selectedImage.fileName || selectedImage.uri.split('/').pop() || `fomo_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : (isVideo ? 'mp4' : 'jpg');
        const mimeType = selectedImage.mimeType || (isVideo ? `video/${ext}` : `image/${ext}`);

        formData.append('media', {
          uri: Platform.OS === 'android' ? selectedImage.uri : selectedImage.uri.replace('file://', ''),
          name: filename,
          type: mimeType,
        });

        const uploadRes = await uploadMedia(formData);
        if (uploadRes && uploadRes.data && uploadRes.data.url) {
          uploadedUrl = uploadRes.data.url;
        }
      } catch (uploadErr) {
        console.log('UploadMedia error, falling back to base64 or URI:', uploadErr.message);
      }

      const finalMediaUrl = uploadedUrl || (selectedImage.base64
        ? `data:${selectedImage.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg')};base64,${selectedImage.base64}`
        : selectedImage.uri);

      if (postType === 'story') {
        await createStory({
          mediaUrl: finalMediaUrl,
          mediaType: isVideo ? 'video' : 'image',
          caption: caption.trim(),
        });
        Alert.alert('Success', 'Added to your FOMO story!');
      } else if (postType === 'reel') {
        await createPost({
          mediaUrl: finalMediaUrl,
          mediaType: isVideo ? 'video' : 'video',
          isReel: true,
          caption: caption.trim(),
          location: location.trim(),
        });
        Alert.alert('Success', 'Reel shared to FOMO feed!');
      } else {
        await createPost({
          mediaUrl: finalMediaUrl,
          mediaType: isVideo ? 'video' : 'image',
          isReel: false,
          caption: caption.trim(),
          location: location.trim(),
        });
        Alert.alert('Success', 'Post shared to FOMO feed!');
      }

      navigation.goBack();
    } catch (err) {
      console.log('Share error:', err);
      Alert.alert('Upload Failed', err.message || 'Could not share. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const getHeaderTitle = () => {
    if (postType === 'story') return 'Add to Story';
    if (postType === 'reel') return 'New Reel';
    return 'New Post';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>

        <TouchableOpacity
          style={[styles.shareBtn, (!selectedImage || loading) && styles.shareBtnDisabled]}
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
        {/* Post Type Selector: 3 Tabs (Feed Post, Reel, Story) */}
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
            style={[styles.typeBtn, postType === 'reel' && styles.typeBtnActive]}
            onPress={() => setPostType('reel')}
          >
            <Text style={[styles.typeBtnText, postType === 'reel' && styles.typeBtnTextActive]}>
              Reel
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

        {/* Media Preview Box when media is selected */}
        {selectedImage ? (
          <View style={styles.previewBox}>
            {isVideo ? (
              <View style={styles.videoPreviewContainer}>
                <View style={styles.videoIconCircle}>
                  <Ionicons name="play" size={36} color="#FFFFFF" />
                </View>
                <Text style={styles.videoLabel}>Video Selected</Text>
                <Text style={styles.videoSublabel} numberOfLines={1}>
                  {selectedImage.fileName || 'Video ready for upload'}
                </Text>
              </View>
            ) : (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            {/* Media Action Overlay Badges */}
            <View style={styles.previewOverlayActions}>
              <TouchableOpacity style={styles.previewActionPill} onPress={handlePickImage}>
                <Ionicons name="images" size={16} color="#FFFFFF" />
                <Text style={styles.previewActionText}>Change</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.previewActionPill, styles.removePill]}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <Text style={[styles.previewActionText, { color: '#FF3B30' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* High-Contrast Vibrant Media Picker Box */
          <View style={styles.pickerBox}>
            <View style={styles.pickerIconHalo}>
              <Ionicons
                name={postType === 'reel' ? 'play-circle-outline' : postType === 'story' ? 'color-palette-outline' : 'images-outline'}
                size={48}
                color="#0095F6"
              />
            </View>
            <Text style={styles.pickerTitle}>
              {postType === 'reel' ? 'Choose Video for Reel' : 'Select Photo or Video'}
            </Text>
            <Text style={styles.pickerSubtitle}>
              Share memories with your friends on FOMO
            </Text>

            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.primaryPickerBtn} onPress={handlePickImage} activeOpacity={0.8}>
                <Ionicons name="images" size={20} color="#FFFFFF" />
                <Text style={styles.primaryPickerBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryPickerBtn} onPress={handleLaunchCamera} activeOpacity={0.8}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.secondaryPickerBtnText}>Open Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder={
              postType === 'story'
                ? 'Add text to your story...'
                : postType === 'reel'
                ? 'Write a reel caption, #tags...'
                : 'Write a caption...'
            }
            placeholderTextColor="#737373"
            style={styles.captionInput}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Location Input (For posts and reels) */}
        {postType !== 'story' && (
          <View style={styles.rowItem}>
            <Ionicons name="location-outline" size={22} color="#0095F6" />
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
    borderBottomColor: '#1F1F1F',
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  shareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareBtnDisabled: {
    opacity: 0.35,
  },
  shareBtnText: {
    color: '#0095F6',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 3,
    marginBottom: 18,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  typeBtnActive: {
    backgroundColor: '#303030',
  },
  typeBtnText: {
    color: '#8E8E8E',
    fontSize: 13,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pickerBox: {
    minHeight: 250,
    backgroundColor: '#121212',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#262626',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 18,
  },
  pickerIconHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 149, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  pickerSubtitle: {
    color: '#737373',
    fontSize: 12.5,
    marginBottom: 18,
    textAlign: 'center',
  },
  pickerActions: {
    width: '100%',
    gap: 10,
  },
  primaryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0095F6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryPickerBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  secondaryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#262626',
    paddingVertical: 11,
    borderRadius: 12,
  },
  secondaryPickerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  previewBox: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#1C1C1E',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333333',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPreviewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    padding: 20,
  },
  videoIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  videoSublabel: {
    color: '#8E8E8E',
    fontSize: 12,
    marginTop: 4,
  },
  previewOverlayActions: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  removePill: {
    backgroundColor: 'rgba(30, 0, 0, 0.8)',
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  previewActionText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  inputSection: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#262626',
  },
  captionInput: {
    color: '#FFFFFF',
    fontSize: 14.5,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 10,
  },
  rowInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    paddingVertical: 0,
  },
});
