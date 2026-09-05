import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { searchUsers } from '../../api/user';
import { createGroupChat } from '../../api/chat';
import { Avatar } from '../../components/Avatar';

export const CreateGroupScreen = ({ navigation }) => {
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setSearching(true);
      try {
        const res = await searchUsers(query.trim() || 'a'); // initial fetch or search
        if (res && res.data) {
          setUsers(res.data);
        }
      } catch (err) {
        console.log('Error searching:', err.message);
      } finally {
        setSearching(false);
      }
    };

    fetchUsers();
  }, [query]);

  const toggleSelectUser = (user) => {
    if (selectedUsers.some((u) => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Group Name Required', 'Please enter a name for your group.');
      return;
    }

    if (selectedUsers.length < 1) {
      Alert.alert('Add Members', 'Please select at least 1 other member.');
      return;
    }

    setCreating(true);
    try {
      const memberIds = selectedUsers.map((u) => u._id);
      const res = await createGroupChat({
        members: memberIds,
        groupName: groupName.trim(),
      });

      if (res && res.data) {
        navigation.replace('ChatDetail', {
          chatId: res.data._id,
          chatData: res.data,
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create group chat');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
        <TouchableOpacity
          style={[
            styles.createBtn,
            (!groupName.trim() || selectedUsers.length === 0) &&
              styles.createBtnDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createBtnText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Group Name Input */}
      <View style={styles.inputSection}>
        <View style={styles.groupIconPlaceholder}>
          <Ionicons name="camera-outline" size={24} color={COLORS.textMuted} />
        </View>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="Group Name..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.groupNameInput}
          maxLength={50}
        />
      </View>

      {/* Selected Users Chips Horizontal Reel */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedChipsScroll}
          >
            {selectedUsers.map((user) => (
              <TouchableOpacity
                key={user._id}
                style={styles.chip}
                onPress={() => toggleSelectUser(user)}
              >
                <Avatar uri={user.avatar} name={user.user_name} size={24} />
                <Text style={styles.chipText} numberOfLines={1}>
                  {user.user_name?.split(' ')[0]}
                </Text>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Member Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search contacts to add..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* User Selection List */}
      {searching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isSelected = selectedUsers.some((u) => u._id === item._id);

            return (
              <TouchableOpacity
                style={[styles.userRow, isSelected && styles.userRowSelected]}
                onPress={() => toggleSelectUser(item)}
                activeOpacity={0.7}
              >
                <Avatar uri={item.avatar} name={item.user_name} size={46} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.user_name}</Text>
                  <Text style={styles.userSubtitle}>
                    {item.email || item.phone}
                  </Text>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginLeft: 12,
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  createBtnDisabled: {
    opacity: 0.4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    gap: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  groupIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupNameInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  selectedSection: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  selectedChipsScroll: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  searchSection: {
    padding: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  userRowSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  userSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
