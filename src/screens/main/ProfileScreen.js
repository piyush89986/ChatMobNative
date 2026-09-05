import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { CustomInput } from '../../components/CustomInput';
import { ServerConfigModal } from '../../components/ServerConfigModal';
import { updateProfile, uploadAvatar } from '../../api/user';
import * as ImagePicker from 'expo-image-picker';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfileData, serverUrl } = useAuth();
  const [editing, setEditing] = useState(false);
  const [userName, setUserName] = useState(user?.user_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gender, setGender] = useState(user?.gender || 'other');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);

  const handlePickAvatar = async () => {
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
        address: address.trim(),
        gender,
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
    Alert.alert('Log Out', 'Are you sure you want to log out of Direct?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Instagram Profile Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.user_name || 'Profile'}</Text>
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => setEditing(!editing)}
        >
          <Text style={styles.headerRightText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Instagram Profile Header Info */}
        <View style={styles.profileTopSection}>
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={user?.avatar}
              name={user?.user_name}
              size={86}
              showStoryRing={true}
            />
            {uploadingAvatar ? (
              <View style={styles.avatarLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.cameraBadge}
                onPress={handlePickAvatar}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats Counters */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>account</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Active</Text>
              <Text style={styles.statLabel}>status</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Direct</Text>
              <Text style={styles.statLabel}>chat</Text>
            </View>
          </View>
        </View>

        {/* User Bio Details */}
        <View style={styles.bioContainer}>
          <Text style={styles.displayName}>{user?.user_name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userBioText}>
            {user?.bio ? user.bio : 'Hey there! I am using Instagram Direct.'}
          </Text>
        </View>

        {/* Instagram Action Buttons: Edit Profile & Share Profile */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => setEditing(!editing)}
          >
            <Text style={styles.actionPillBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPillBtn}
            onPress={() => Alert.alert('Share Profile', `Share link for @${user?.user_name}`)}
          >
            <Text style={styles.actionPillBtnText}>Share Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Details or Edit Form */}
        <View style={styles.cardSection}>
          {editing ? (
            <View style={styles.formContainer}>
              <CustomInput
                label="Username"
                value={userName}
                onChangeText={setUserName}
                iconName="person-outline"
              />
              <CustomInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                iconName="mail-outline"
                autoCapitalize="none"
              />
              <CustomInput
                label="Bio"
                value={bio}
                onChangeText={setBio}
                iconName="chatbubble-outline"
                multiline
                numberOfLines={2}
              />
              <CustomInput
                label="Address"
                value={address}
                onChangeText={setAddress}
                iconName="location-outline"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#0095F6" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#0095F6" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{user?.address || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="male-female-outline" size={20} color="#0095F6" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{user?.gender || 'Not specified'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Advanced Settings & Logout */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionHeaderTitle}>SETTINGS</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowServerModal(true)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="server-outline" size={18} color="#A8A8A8" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Backend Server</Text>
              <Text style={styles.settingSubtitle} numberOfLines={1}>
                {serverUrl.replace(/^https?:\/\//, '')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#737373" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.logoutRow]}
            onPress={handleLogout}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(237, 73, 86, 0.15)' }]}>
              <Ionicons name="log-out-outline" size={18} color="#ED4956" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: '#ED4956' }]}>Log Out</Text>
              <Text style={styles.settingSubtitle}>Sign out from this device</Text>
            </View>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerRightBtn: {
    padding: 4,
  },
  headerRightText: {
    color: '#0095F6',
    fontSize: 14,
    fontWeight: '700',
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
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0095F6',
    borderRadius: 14,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#A8A8A8',
    fontSize: 12,
    marginTop: 2,
  },
  bioContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  userEmail: {
    color: '#737373',
    fontSize: 12.5,
    marginTop: 1,
  },
  userBioText: {
    color: '#E0E0E0',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 16,
  },
  actionPillBtn: {
    flex: 1,
    backgroundColor: '#262626',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionPillBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
  },
  cardSection: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  formContainer: {
    padding: 16,
  },
  saveBtn: {
    backgroundColor: '#0095F6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  infoList: {
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  infoTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  infoLabel: {
    color: '#737373',
    fontSize: 11,
    fontWeight: '500',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '500',
    marginTop: 2,
  },
  settingsSection: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionHeaderTitle: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  logoutRow: {
    borderColor: 'rgba(237, 73, 86, 0.3)',
  },
  settingIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingSubtitle: {
    color: '#737373',
    fontSize: 11.5,
    marginTop: 1,
  },
});
