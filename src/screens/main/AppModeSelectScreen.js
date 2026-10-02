import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppMode } from '../../context/AppModeContext';

const { width, height } = Dimensions.get('window');

export const AppModeSelectScreen = () => {
  const { setAppMode } = useAppMode();
  const [remember, setRemember] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSelect = (mode) => {
    setAppMode(mode, remember);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollInner,
          { paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(20, insets.bottom + 12) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Branding */}
        <View style={styles.header}>
          <Text style={styles.brandTitle}>FOMO</Text>
          <Text style={styles.subtitle}>Choose your experience</Text>
        </View>

        {/* Choice Cards */}
        <View style={styles.cardsContainer}>
          {/* Option 1: FOMO Music */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleSelect('music')}
            style={styles.cardTouch}
          >
            <LinearGradient
              colors={['#0084FF', '#0047BA', '#080E1E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.musicIconBadge}>
                  <Ionicons name="musical-notes" size={26} color="#FFFFFF" />
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>MUSIC MODE</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>FOMO Music</Text>
                <Text style={styles.cardDesc}>
                  Stream songs, build playlists, search artists & loop your favorite music.
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.ctaTextBlue}>Open Music</Text>
                <Ionicons name="arrow-forward-circle" size={24} color="#00D2FF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Option 2: FOMO Social */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleSelect('social')}
            style={styles.cardTouch}
          >
            <LinearGradient
              colors={['#833AB4', '#FD1D1D', '#1D0813']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={styles.socialIconBadge}>
                  <Ionicons name="paper-plane" size={24} color="#FFFFFF" />
                </View>
                <View style={[styles.badgePill, { backgroundColor: 'rgba(253, 29, 29, 0.3)' }]}>
                  <Text style={[styles.badgeText, { color: '#FF7676' }]}>SOCIAL & CHAT</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>FOMO</Text>
                <Text style={styles.cardDesc}>
                  Explore feed, watch reels, chat directly & share stories with friends.
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.ctaTextPink}>Open FOMO Social</Text>
                <Ionicons name="arrow-forward-circle" size={24} color="#FD1D1D" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Remember choice toggle */}
        <TouchableOpacity
          style={styles.rememberRow}
          activeOpacity={0.8}
          onPress={() => setRemember(!remember)}
        >
          <View style={[styles.checkbox, remember && styles.checkboxActive]}>
            {remember && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.rememberText}>Remember my preference for next time</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollInner: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 12,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    marginTop: 6,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
    marginVertical: 10,
  },
  cardTouch: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  musicIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 132, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(253, 29, 29, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: 'rgba(0, 132, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: '#00D2FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardBody: {
    marginTop: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  cardDesc: {
    fontSize: 13,
    color: '#E0E0E0',
    marginTop: 4,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  ctaTextBlue: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  ctaTextPink: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#0084FF',
    borderColor: '#0084FF',
  },
  rememberText: {
    color: '#B3B3B3',
    fontSize: 12,
  },
});
