import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    '#3797EF', '#833AB4', '#C13584', '#E1306C',
    '#FD1D1D', '#F77737', '#00BA7C', '#5851DB',
  ];
  let hash = 0;
  const str = name || 'user';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar = ({
  uri,
  name,
  size = 48,
  isOnline = false,
  showOnlineBadge = false,
  showStoryRing = false,
  style,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  // Format dicebear to png or fallback to stylish initials
  let validUri = uri;
  if (validUri && validUri.includes('api.dicebear.com') && validUri.includes('/svg?')) {
    validUri = validUri.replace('/svg?', '/png?');
  }

  const badgeSize = Math.max(11, Math.floor(size * 0.28));
  const innerSize = showStoryRing ? size - 6 : size;

  const content = (
    <View style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2, overflow: 'hidden' }}>
      {validUri && !imageError ? (
        <Image
          source={{ uri: validUri }}
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: COLORS.cardBorder,
          }}
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallbackContainer,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text style={[styles.initialsText, { fontSize: Math.floor(innerSize * 0.38) }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[{ width: size, height: size, position: 'relative' }, style]}>
      {showStoryRing ? (
        <LinearGradient
          colors={['#CA1D7E', '#E05140', '#FCAF45']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[
            styles.storyRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <View
            style={[
              styles.storyInnerRing,
              {
                width: size - 3,
                height: size - 3,
                borderRadius: (size - 3) / 2,
              },
            ]}
          >
            {content}
          </View>
        </LinearGradient>
      ) : (
        content
      )}

      {showOnlineBadge && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: showStoryRing ? 1 : 0,
              right: showStoryRing ? 1 : 0,
              backgroundColor: isOnline ? COLORS.online : COLORS.offline,
              borderColor: COLORS.background,
              borderWidth: 2,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  storyRing: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  storyInnerRing: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  onlineBadge: {
    position: 'absolute',
    elevation: 4,
  },
});
