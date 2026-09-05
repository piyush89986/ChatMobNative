import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { COLORS } from '../theme/colors';
import { addComment } from '../api/post';

export const CommentsModal = ({
  visible,
  postId,
  initialComments = [],
  currentUser,
  onClose,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState(initialComments);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleAddComment = async () => {
    if (!inputText.trim() || !postId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSubmitting(true);

    // Optimistic comment
    const optimisticComment = {
      _id: 'temp_' + Date.now(),
      user: {
        _id: currentUser?._id,
        user_name: currentUser?.user_name,
        avatar: currentUser?.avatar,
      },
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, optimisticComment]);

    try {
      const res = await addComment(postId, textToSend);
      if (res && res.data) {
        setComments(res.data);
        if (onCommentAdded) onCommentAdded(res.data);
      }
    } catch (err) {
      console.log('Error adding comment:', err);
      // rollback
      setComments((prev) => prev.filter((c) => c._id !== optimisticComment._id));
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={styles.topDismiss}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            data={comments}
            keyExtractor={(item, index) => item._id || String(index)}
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <Avatar
                  uri={item.user?.avatar}
                  name={item.user?.user_name || 'User'}
                  size={36}
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentText}>
                    <Text style={styles.commentUsername}>
                      {item.user?.user_name || 'User'}{' '}
                    </Text>
                    {item.text}
                  </Text>
                  <Text style={styles.commentTime}>
                    {new Date(item.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <TouchableOpacity style={styles.commentLikeBtn}>
                  <Ionicons name="heart-outline" size={14} color="#737373" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No comments yet.</Text>
                <Text style={styles.emptySubtitle}>Start the conversation.</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />

          {/* Bottom Input */}
          <SafeAreaView style={styles.inputArea} edges={['bottom']}>
            <Avatar
              uri={currentUser?.avatar}
              name={currentUser?.user_name || 'Me'}
              size={34}
            />
            <View style={styles.inputWrapper}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={`Add a comment for ${currentUser?.user_name || 'author'}...`}
                placeholderTextColor="#737373"
                style={styles.textInput}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.postBtn,
                  !inputText.trim() && styles.postBtnDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!inputText.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#0095F6" />
                ) : (
                  <Text style={styles.postBtnText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  topDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#181818',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
    position: 'relative',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#404040',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  listContent: {
    padding: 16,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    color: '#F5F5F5',
    fontSize: 13.5,
    lineHeight: 18,
  },
  commentUsername: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commentTime: {
    color: '#737373',
    fontSize: 11,
    marginTop: 4,
  },
  commentLikeBtn: {
    padding: 4,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#737373',
    fontSize: 13,
    marginTop: 4,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#262626',
    backgroundColor: '#121212',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    paddingVertical: 6,
  },
  postBtn: {
    paddingHorizontal: 8,
  },
  postBtnDisabled: {
    opacity: 0.4,
  },
  postBtnText: {
    color: '#0095F6',
    fontWeight: '700',
    fontSize: 13.5,
  },
});
