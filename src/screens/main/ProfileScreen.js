import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { CustomInput } from '../../components/CustomInput';
import { ServerConfigModal } from '../../components/ServerConfigModal';
import { updateProfile, uploadAvatar } from '../../api/user';
import { getUserPosts } from '../../api/post';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = width / 3 - 1.5;

export const ProfileScreen = ({ navigation, route }) => {
  const { user: authUser, logout, updateProfileData } = useAuth();
  const targetUser = route.params?.targetUser;
  const isOwnProfile = !targetUser || targetUser._id === authUser?._id;
  const user = isOwnProfile ? authUser : targetUser;

  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState(user?.user_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);

  // Tab: 'grid' | 'reels' | 'reposts' | 'tagged'
  const [activeTab, setActiveTab] = useState('grid');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?._id) return;
      try {
        const res = await getUserPosts(user._id);
        if (res && res.data) {
          setUserPosts(res.data);
        }
      } catch (e) {
        console.log('Error fetching user posts:', e.message);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [user?._id]);

  const handlePickAvatar = async () => {
    if (!isOwnProfile) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageAsset = result.assets[0];
        setUploadingAvatar(true);

        const formData = new FormData();
        const filename = imageAsset.uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('avatar', {
          uri: imageAsset.uri,
          name: filename,
          type,
        });

        const res = await uploadAvatar(formData);
        if (res && res.data) {
          updateProfileData(res.data);
          Alert.alert('Success', 'Profile photo updated!');
        }
      }
    } catch (err) {
      console.log('Upload avatar error:', err);
      Alert.alert('Error', err.message || 'Could not update profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({
        user_name: userName.trim(),
        email: email.trim(),
        bio: bio.trim(),
      });
      if (res && res.data) {
        updateProfileData(res.data);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of FOMO?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. Header matching Screenshots 1 & 4 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {navigation.canGoBack() ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 10, padding: 2 }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('CreatePost')}
              style={styles.headerIconBtn}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.usernameRow} activeOpacity={0.7}>
            <Ionicons name="lock-closed" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.headerUsername} numberOfLines={1}>
              {user?.user_name || 'Profile'}
            </Text>
            <Ionicons name="chevron-down" size={15} color="#FFFFFF" style={{ marginLeft: 4 }} />
            <View style={styles.redHeaderDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {}}
          >
            <Ionicons name="at-outline" size={25} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowServerModal(true)}
          >
            <Ionicons name="menu-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. Top Profile Section matching Screenshots 1 & 4 */}
        <View style={styles.profileTopSection}>
          <View style={styles.avatarColumn}>
            {/* "Today's vibe..." speech bubble */}
            <View style={styles.vibeBubble}>
              <Text style={styles.vibeText}>Today's vibe...</Text>
              <View style={styles.vibeTail} />
            </View>

            {/* Profile Avatar */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickAvatar}
              style={styles.avatarWrapper}
            >
              <Avatar
                uri={user?.avatar}
                name={user?.user_name}
                size={82}
                showStoryRing={false}
              />
              {isOwnProfile && (
                <View style={styles.avatarPlusBadge}>
                  <Ionicons name="add" size={16} color="#000000" />
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarLoader}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Stats Column */}
          <View style={styles.statsColumn}>
            <Text style={styles.displayName} numberOfLines={1}>
              {user?.user_name || 'FOMO User'}
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userPosts.length}</Text>
                <Text style={styles.statLabel}>posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.followers?.length || 0}</Text>
                <Text style={styles.statLabel}>followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.following?.length || 0}</Text>
                <Text style={styles.statLabel}>following</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>
            {user?.bio || (isOwnProfile ? 'Add your bio...' : 'FOMO Member')}
          </Text>
        </View>

        {/* 4. Action Buttons (Edit profile, Share profile, +👤) */}
        {isOwnProfile ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setEditing(!editing)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>{editing ? 'Cancel' : 'Edit profile'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Share.share({ message: `Check out my FOMO profile: https://fomo.app/${user?.user_name}` }).catch(() => {})}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>Share profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconPill}
              onPress={() => navigation.navigate('SearchUsers')}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.followBtn]}
              onPress={() => {}}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('ChatDetail', { recipient: user })}
            >
              <Text style={styles.actionBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Form if toggle */}
        {editing && (
          <View style={styles.editForm}>
            <CustomInput label="Username" value={userName} onChangeText={setUserName} iconName="person-outline" />
            <CustomInput label="Email" value={email} onChangeText={setEmail} iconName="mail-outline" autoCapitalize="none" />
            <CustomInput label="Bio" value={bio} onChangeText={setBio} iconName="chatbubble-outline" multiline />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Story Highlights Tray with big + New button */}
        <View style={styles.highlightsContainer}>
          <View style={styles.highlightItem}>
            <TouchableOpacity
              style={styles.highlightPlusCircle}
              onPress={() => navigation.navigate('CreatePost')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.highlightLabel}>New</Text>
          </View>
        </View>

        {/* 6. Grid Navigation 4 Tabs (Grid, Reels, Reposts, Tagged) */}
        <View style={styles.gridTabs}>
          <TouchableOpacity
            style={[styles.gridTab, activeTab === 'grid' && styles.gridTabActive]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons name="grid" size={22} color={activeTab === 'grid' ? '#FFFFFF' : '#737373'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridTab, activeTab === 'reels' && styles.gridTabActive]}
            onPress={() => setActiveTab('reels')}
          >
            <Ionicons name="videocam-outline" size={24} color={activeTab === 'reels' ? '#FFFFFF' : '#737373'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridTab, activeTab === 'reposts' && styles.gridTabActive]}
            onPress={() => setActiveTab('reposts')}
          >
            <Ionicons name="repeat-outline" size={24} color={activeTab === 'reposts' ? '#FFFFFF' : '#737373'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridTab, activeTab === 'tagged' && styles.gridTabActive]}
            onPress={() => setActiveTab('tagged')}
          >
            <Ionicons name="camera-outline" size={24} color={activeTab === 'tagged' ? '#FFFFFF' : '#737373'} />
          </TouchableOpacity>
        </View>

        {/* 7. Posts 3-Column Grid or Empty State Illustration */}
        {loadingPosts ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : userPosts.length > 0 ? (
          <View style={styles.postsGrid}>
            {userPosts.map((post) => (
              <TouchableOpacity key={post._id} style={styles.gridImageWrapper} activeOpacity={0.8}>
                <Image source={{ uri: post.mediaUrl }} style={styles.gridImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          /* Empty State Illustration matching Screenshots 1 & 4 */
          <View style={styles.emptyIllustrationContainer}>
            <View style={styles.illustrationFrame}>
              <View style={styles.illustrationCurtains}>
                <View style={[styles.curtainPanel, { backgroundColor: '#D62976' }]} />
                <View style={styles.curtainCenter}>
                  <Ionicons name="paper-plane" size={28} color="#FFFFFF" style={{ transform: [{ rotate: '-25deg' }] }} />
                  <View style={styles.curtainCloud} />
                </View>
                <View style={[styles.curtainPanel, { backgroundColor: '#D62976' }]} />
              </View>
              <View style={styles.illustrationBottom}>
                <View style={styles.illustrationPinkDot} />
              </View>
            </View>
          </View>
        )}

        {/* Log Out option */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out of FOMO</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Backend Settings Modal */}
      <ServerConfigModal visible={showServerModal} onClose={() => setShowServerModal(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#000000',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerUsername: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    maxWidth: width * 0.45,
  },
  redHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF2D55',
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileTopSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'flex-start',
  },
  avatarColumn: {
    alignItems: 'center',
  },
  vibeBubble: {
    backgroundColor: '#262626',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    position: 'relative',
    alignItems: 'center',
  },
  vibeText: {
    color: '#D4D4D4',
    fontSize: 11,
    fontWeight: '500',
  },
  vibeTail: {
    position: 'absolute',
    bottom: -4,
    left: '45%',
    width: 8,
    height: 8,
    backgroundColor: '#262626',
    transform: [{ rotate: '45deg' }],
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarPlusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  avatarLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsColumn: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
    paddingTop: 12,
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  statLabel: {
    color: '#F5F5F5',
    fontSize: 13,
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  categoryText: {
    color: '#8E8E8E',
    fontSize: 14,
    marginBottom: 8,
  },
  addBannersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  addBannersText: {
    color: '#A8A8A8',
    fontSize: 13,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#262626',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtn: {
    backgroundColor: '#0095F6',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  actionIconPill: {
    backgroundColor: '#262626',
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editForm: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: '#0095F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  highlightsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  highlightItem: {
    alignItems: 'center',
  },
  highlightPlusCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: '#404040',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  highlightLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
  },
  gridTabs: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: '#262626',
    marginTop: 4,
  },
  gridTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  gridTabActive: {
    borderBottomColor: '#FFFFFF',
  },
  centerLoader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
  },
  gridImageWrapper: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyIllustrationContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  illustrationFrame: {
    width: 170,
    height: 190,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  illustrationCurtains: {
    flexDirection: 'row',
    width: '100%',
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FDEAEB',
  },
  curtainPanel: {
    width: 38,
    height: '100%',
  },
  curtainCenter: {
    flex: 1,
    backgroundColor: '#FFCAD4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  curtainCloud: {
    position: 'absolute',
    bottom: -10,
    width: 50,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#FF7A00',
  },
  illustrationBottom: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 4,
  },
  illustrationPinkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D62976',
  },
  logoutBtn: {
    marginTop: 30,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ED4956',
    fontWeight: '600',
    fontSize: 14,
  },
});
