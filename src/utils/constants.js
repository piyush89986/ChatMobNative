import { Platform } from 'react-native';

// Default Server Address:
// - Physical Android device on same Wi-Fi: 10.41.37.233:4000
// - Android Emulator: 10.0.2.2:4000
// - Web: localhost:4000
// Hosted Render Server URL
export const DEFAULT_HOST = 'https://mobailchatappbackend.onrender.com';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'fomo_auth_token',
  USER_DATA: 'fomo_user_data',
  SERVER_URL: 'fomo_server_url',
  ACTIVE_THEME: 'fomo_theme',
};
