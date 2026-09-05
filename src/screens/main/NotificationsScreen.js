import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/Avatar';
import { getNotifications } from '../../api/post';

const SEED_NOTIFICATIONS = [
  {
    _id: 'n1',
    sender: {
      user_name: 'arun_dev',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    },
    type: 'like',
    text: 'liked your photo.',
    post: { mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150' },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: 'n2',
    sender: {
      user_name: 'maisamayhoon',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    },
    type: 'comment',
    text: 'commented: "Incredible shot! 🔥"',
    post: { mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150' },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: 'n3',
    sender: {
      user_name: 'vikas_2607__',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    },
    type: 'follow',
    text: 'started following you.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications();
      if (res && res.data && res.data.length > 0) {
        setNotifications(res.data);
      } else {
        setNotifications(SEED_NOTIFICATIONS);
      }
    } catch (e) {
      setNotifications(SEED_NOTIFICATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.notifRow}>
              <Avatar
                uri={item.sender?.avatar}
                name={item.sender?.user_name || 'User'}
                size={44}
                showStoryRing={true}
              />
              <View style={styles.notifTextContainer}>
                <Text style={styles.notifText}>
                  <Text style={styles.usernameText}>{item.sender?.user_name || 'User'} </Text>
                  {item.text}
                </Text>
                <Text style={styles.notifTime}>
                  {new Date(item.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {item.post?.mediaUrl ? (
                <Image
                  source={{ uri: item.post.mediaUrl }}
                  style={styles.postThumbnail}
                />
              ) : item.type === 'follow' ? (
                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followBtnText}>Follow</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchNotifs();
              }}
              tintColor="#FFFFFF"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
    gap: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifText: {
    color: '#E0E0E0',
    fontSize: 13.5,
    lineHeight: 18,
  },
  usernameText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  notifTime: {
    color: '#737373',
    fontSize: 11,
    marginTop: 2,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  followBtn: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
