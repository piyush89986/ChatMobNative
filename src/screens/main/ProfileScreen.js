import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
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
  const { user: authUser, logout, updateProfileData, serverUrl } = useAuth();
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);

        const formData = new FormData();
        const filename = asset.uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('avatar', {
          uri: asset.uri,
          name: filename,
          type,
        });

        const res = await uploadAvatar(formData);
        if (res && res.data) {
          await updateProfileData(res.data);
          Alert.alert('Success', 'Profile photo updated!');
        }
      }
    } catch (err) {
      console.log('Error uploading avatar:', err);
      Alert.alert('Upload Error', err.message || 'Failed to update avatar.');
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
        await updateProfileData(res.data);
        setEditing(false);
        Alert.alert('Success', 'Profile updated!');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* 1. Header matching Screenshot Image 5 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.headerUsername} numberOfLines={1}>
            {user?.user_name || 'Profile'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('CreatePost')}
          >
            <Ionicons name="add-circle-outline" size={26} color="#FFFFFF" />
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
        {/* 2. Top Profile Stats Section */}
        <View style={styles.profileTopSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePickAvatar}
            style={styles.avatarWrapper}
          >
            <Avatar
              uri={user?.avatar}
              name={user?.user_name}
              size={84}
              showStoryRing={false}
            />
            {isOwnProfile && (
              <View style={styles.avatarPlusBadge}>
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </View>
            )}
            {uploadingAvatar && (
              <View style={styles.avatarLoader}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>397</Text>
              <Text style={styles.statLabel}>followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>306</Text>
              <Text style={styles.statLabel}>following</Text>
            </View>
          </View>
        </View>

        {/* 3. Bio & Details */}
        <View style={styles.bioSection}>
          <Text style={styles.fullName}>{user?.user_name}</Text>
          <Text style={styles.roleText}>{user?.role || 'Direct Member'}</Text>
          <Text style={styles.bioText}>{user?.bio || 'Living the dream ✨'}</Text>
        </View>

        {/* 4. Action Buttons (Edit profile, Share profile) */}
        {isOwnProfile ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setEditing(!editing)}
            >
              <Text style={styles.actionBtnText}>{editing ? 'Cancel' : 'Edit profile'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Share Profile', `instagram.com/${user?.user_name}`)}
            >
              <Text style={styles.actionBtnText}>Share profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconPill}
              onPress={() => navigation.navigate('SearchUsers')}
            >
              <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.followBtn]}
              onPress={() => Alert.alert('Followed', `You followed ${user?.user_name}`)}
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

        {/* 5. Story Highlights Tray */}
        <View style={styles.highlightsContainer}>
          <View style={styles.highlightItem}>
            <TouchableOpacity
              style={styles.highlightPlusCircle}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.highlightLabel}>New</Text>
          </View>
        </View>

        {/* 6. Grid Navigation Tabs */}
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
            <Ionicons name="play-box-outline" size={24} color={activeTab === 'reels' ? '#FFFFFF' : '#737373'} />
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
            <Ionicons name="person-circle-outline" size={24} color={activeTab === 'tagged' ? '#FFFFFF' : '#737373'} />
          </TouchableOpacity>
        </View>

        {/* 7. Posts 3-Column Grid */}
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
          /* Empty Posts State matching Image 5 */
          <View style={styles.emptyGridContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="camera-outline" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.emptyGridTitle}>No posts yet</Text>
            <Text style={styles.emptyGridSubtitle}>
              When you share photos and videos, they will appear on your profile.
            </Text>
            <TouchableOpacity
              style={styles.shareFirstBtn}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <Text style={styles.shareFirstBtnText}>Share your first photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Log Out option */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out of Direct</Text>
        </TouchableOpacity>
      </ScrollView>

      <ServerConfigModal
        visible={showServerModal}
        onClose={() => setShowServerModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1A1A1A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUsername: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    maxWidth: 220,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBtn: {
    padding: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarPlusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  avatarLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  statLabel: {
    color: '#E0E0E0',
    fontSize: 12.5,
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  fullName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  roleText: {
    color: '#737373',
    fontSize: 12.5,
    marginTop: 1,
  },
  bioText: {
    color: '#F5F5F5',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#262626',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  followBtn: {
    backgroundColor: '#0095F6',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  actionIconPill: {
    backgroundColor: '#262626',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editForm: {
    backgroundColor: '#121212',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
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
  },
  highlightsContainer: {
    paddingHorizontal: 16,
    marginTop: 18,
    paddingBottom: 8,
  },
  highlightItem: {
    alignItems: 'center',
    width: 64,
  },
  highlightPlusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#303030',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 14,
  },
  gridTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  gridTabActive: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFFFFF',
  },
  centerLoader: {
    paddingVertical: 40,
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
  emptyGridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyGridTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyGridSubtitle: {
    color: '#737373',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  shareFirstBtn: {
    paddingVertical: 6,
  },
  shareFirstBtnText: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  logoutText: {
    color: '#ED4956',
    fontSize: 14,
    fontWeight: '600',
  },
});
