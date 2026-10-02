import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { createPlaylist } from '../../api/music';

export const CreatePlaylistModal = ({ visible, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await createPlaylist({
        name: name.trim(),
        description: description.trim(),
      });
      setName('');
      setDescription('');
      onClose();
      if (onCreated) onCreated(res);
    } catch (e) {
      console.log('Error creating playlist:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Give your playlist a name</Text>

          <TextInput
            style={styles.input}
            placeholder="My Playlist"
            placeholderTextColor="#777777"
            value={name}
            onChangeText={setName}
            autoFocus
            selectionColor="#0084FF"
          />

          <TextInput
            style={[styles.input, { height: 44, marginTop: 12 }]}
            placeholder="Optional description"
            placeholderTextColor="#777777"
            value={description}
            onChangeText={setDescription}
            selectionColor="#0084FF"
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createBtn, !name.trim() && styles.disabledBtn]}
              onPress={handleCreate}
              disabled={!name.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#0E1B38',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(0, 132, 255, 0.25)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#162347',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#A5B4FC',
    fontWeight: '700',
    fontSize: 15,
  },
  createBtn: {
    backgroundColor: '#0084FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    minWidth: 90,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#1C2A4A',
    opacity: 0.6,
  },
  createText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
