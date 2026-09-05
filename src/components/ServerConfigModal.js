import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export const ServerConfigModal = ({ visible, onClose }) => {
  const { serverUrl, updateServerUrl } = useAuth();
  const [customUrl, setCustomUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState('none'); // 'success' | 'error' | 'none'

  const presets = [
    { label: 'Wi-Fi IP (Phone)', url: 'http://10.41.37.233:4100' },
    { label: 'Android Emulator', url: 'http://10.0.2.2:4100' },
    { label: 'Localhost', url: 'http://localhost:4100' },
  ];

  const handleTestConnection = async (urlToTest = customUrl) => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const clean = urlToTest.trim().replace(/\/$/, '');
      const response = await axios.get(`${clean}/health`, { timeout: 4000 });
      if (response.data && response.data.status === 'OK') {
        setStatusType('success');
        setStatusMessage(`Connected! Server: ${response.data.message || 'Running'}`);
      } else {
        setStatusType('success');
        setStatusMessage('Connected to server!');
      }
    } catch (e) {
      setStatusType('error');
      setStatusMessage(`Cannot connect: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (customUrl.trim()) {
      await updateServerUrl(customUrl.trim());
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="server-outline" size={22} color={COLORS.primaryLight} />
              <Text style={styles.title}>Server Connection</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Enter your Node.js backend URL or choose a preset:
          </Text>

          {/* Presets */}
          <View style={styles.presetsRow}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.url}
                style={[
                  styles.presetChip,
                  customUrl === preset.url && styles.presetChipActive,
                ]}
                onPress={() => {
                  setCustomUrl(preset.url);
                  handleTestConnection(preset.url);
                }}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    customUrl === preset.url && styles.presetChipTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="http://10.41.37.233:4000"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Test Status Indicator */}
          {statusMessage && (
            <View
              style={[
                styles.statusBanner,
                statusType === 'success' ? styles.statusSuccess : styles.statusError,
              ]}
            >
              <Ionicons
                name={statusType === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={statusType === 'success' ? COLORS.success : COLORS.error}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: statusType === 'success' ? COLORS.success : COLORS.error },
                ]}
              >
                {statusMessage}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => handleTestConnection()}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color={COLORS.primaryLight} />
              ) : (
                <Text style={styles.testBtnText}>Test Server</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Apply & Save</Text>
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
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  presetChipActive: {
    backgroundColor: '#1E2342',
    borderColor: COLORS.primary,
  },
  presetChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  inputContainer: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  input: {
    color: COLORS.textPrimary,
    fontSize: 14,
    height: 48,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  testBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  testBtnText: {
    color: COLORS.primaryLight,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
