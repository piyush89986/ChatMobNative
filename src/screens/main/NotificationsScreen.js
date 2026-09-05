import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/Avatar';
import { getNotifications } from '../../api/post';

export const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications();
      if (res && res.data) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.log('Error fetching notifications:', e.message);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifs();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#0095F6" />
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.notifRow}
              activeOpacity={0.7}
              onPress={() => {
                if (item.sender) {
                  navigation.navigate('Profile', { targetUser: item.sender });
                }
              }}
            >
              <Avatar
                uri={item.sender?.avatar}
                name={item.sender?.user_name || 'User'}
                size={44}
                showStoryRing={false}
              />
              <View style={styles.notifTextContainer}>
                <Text style={styles.notifText}>
                  <Text style={styles.usernameBold}>
                    {item.sender?.user_name || 'Someone'}{' '}
                  </Text>
                  {item.text || 'interacted with your post.'}
                </Text>
              </View>

              {item.post?.mediaUrl ? (
                <Image source={{ uri: item.post.mediaUrl }} style={styles.postThumbnail} />
              ) : null}
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#0095F6']}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        /* Clean Empty State when zero notifications */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-outline" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.emptyTitle}>Activity On Your Posts</Text>
          <Text style={styles.emptySubtitle}>
            When someone likes or comments on your posts or stories, you'll see them here.
          </Text>
        </View>
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
    borderBottomColor: '#1F1F1F',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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
  },
  notifTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  notifText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
  },
  usernameBold: {
    fontWeight: '700',
  },
  postThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1C1C1E',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#8E8E8E',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
});
