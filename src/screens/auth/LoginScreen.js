import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';
import { CustomInput } from '../../components/CustomInput';
import { ServerConfigModal } from '../../components/ServerConfigModal';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [loginUser, setLoginUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);

  const handleLogin = async () => {
    if (!loginUser.trim() || !password) {
      setErrorMessage('Please enter your username/email/phone and password');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await login(loginUser.trim(), password);
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* FOMO Branding */}
          <View style={styles.brandContainer}>
            <TouchableOpacity
              onLongPress={() => setShowServerModal(true)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#833AB4', '#FD1D1D', '#FCAF45']}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.9, y: 0.9 }}
                style={styles.logoBadge}
              >
                <Ionicons name="paper-plane" size={36} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.appName}>FOMO</Text>
            <Text style={styles.tagline}>
              Share stories, discover friends & connect
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Log in to FOMO</Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#ED4956" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            <CustomInput
              label="Username, phone, or email"
              placeholder="e.g. johndoe or user@mail.com"
              iconName="person-outline"
              value={loginUser}
              onChangeText={(text) => {
                setLoginUser(text);
                setErrorMessage('');
              }}
              autoCapitalize="none"
            />

            <CustomInput
              label="Password"
              placeholder="Password"
              iconName="lock-closed-outline"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage('');
              }}
            />

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerPrompt}>
              <Text style={styles.promptText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <ServerConfigModal
          visible={showServerModal}
          onClose={() => setShowServerModal(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#A8A8A8',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#121212',
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262626',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 18,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(237, 73, 86, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(237, 73, 86, 0.3)',
  },
  errorBannerText: {
    color: '#ED4956',
    fontSize: 12.5,
    flex: 1,
  },
  loginBtn: {
    backgroundColor: '#0095F6',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  promptText: {
    color: '#737373',
    fontSize: 13,
  },
  registerLink: {
    color: '#0095F6',
    fontSize: 13,
    fontWeight: '700',
  },
});
