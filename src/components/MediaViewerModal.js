import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export const MediaViewerModal = ({
  visible,
  mediaUrl,
  mediaType = 'image',
  title = '',
  time = '',
  onClose,
}) => {
  if (!visible || !mediaUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleInfo}>
            {title ? <Text style={styles.titleText} numberOfLines={1}>{title}</Text> : null}
            {time ? <Text style={styles.timeText}>{time}</Text> : null}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="share-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Container */}
        <View style={styles.contentContainer}>
          {mediaType === 'image' ? (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : mediaType === 'video' ? (
            <View style={styles.placeholderContainer}>
              <Ionicons name="videocam-outline" size={64} color="#FFFFFF" />
              <Text style={styles.placeholderText}>Video Preview</Text>
              <Text style={styles.placeholderSub}>Tap to play in video player</Text>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="document-text-outline" size={64} color="#FFFFFF" />
              <Text style={styles.placeholderText}>{title || 'Document File'}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
    backgroundColor: '#000000',
    zIndex: 10,
  },
  closeBtn: {
    padding: 6,
  },
  titleInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  fullImage: {
    width: width,
    height: height * 0.8,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderSub: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
