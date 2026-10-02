import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAppMode } from '../../context/AppModeContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(300, width * 0.78);

export const ProfileDrawerModal = ({ visible, onClose }) => {
  const { user } = useAuth();
  const { switchToSocial, returnToChoice } = useAppMode();

  const userInitial = user?.user_name ? user.user_name.charAt(0).toUpperCase() : '3';
  const userName = user?.user_name || 'User';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Left Drawer Content */}
        <SafeAreaView style={styles.drawerContainer} edges={['top', 'bottom', 'left']}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={styles.profileTextContainer}>
              <Text style={styles.userName} numberOfLines={1}>
                {userName}
              </Text>
              <Text style={styles.viewProfileText}>View profile</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {/* Switch to FOMO Social */}
            <TouchableOpacity
              style={[styles.menuItem, styles.socialHighlightItem]}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                switchToSocial();
              }}
            >
              <Ionicons name="paper-plane" size={20} color="#0084FF" />
              <View style={styles.menuItemTextContainer}>
                <Text style={[styles.menuItemText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  FOMO Social
                </Text>
                <Text style={styles.menuItemSub}>Switch to chat, feed & reels</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#A5B4FC" />
            </TouchableOpacity>

            {/* What's new */}
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="flash-outline" size={22} color="#FFFFFF" />
              <Text style={styles.menuItemText}>What's new</Text>
            </TouchableOpacity>

            {/* Listening history */}
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="time-outline" size={22} color="#FFFFFF" />
              <Text style={styles.menuItemText}>Listening history</Text>
            </TouchableOpacity>

            {/* Settings and privacy */}
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
              <Text style={styles.menuItemText}>Settings and privacy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Change Mode launcher option */}
          <TouchableOpacity
            style={styles.changeModeBtn}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              returnToChoice();
            }}
          >
            <Ionicons name="grid-outline" size={18} color="#A0A0A0" />
            <Text style={styles.changeModeText}>Change App Experience</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Backdrop on the right: Tap to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#0A1329',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
    elevation: 16,
    shadowColor: '#0084FF',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  backdrop: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewProfileText: {
    fontSize: 12,
    color: '#A5B4FC',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 14,
  },
  menuItems: {
    gap: 18,
    flex: 1,
    paddingTop: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  socialHighlightItem: {
    backgroundColor: 'rgba(0, 132, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 132, 255, 0.3)',
  },
  menuItemTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 14,
  },
  menuItemSub: {
    fontSize: 11,
    color: '#B3B3B3',
    marginTop: 2,
  },
  changeModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  changeModeText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '600',
  },
});
