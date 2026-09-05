import { Platform } from 'react-native';

// Default Server Address:
// - Physical Android device on same Wi-Fi: 10.41.37.233:4000
// - Android Emulator: 10.0.2.2:4000
// - Web: localhost:4000
// Hosted Render Server URL
export const DEFAULT_HOST = 'https://mobailchatappbackend.onrender.com';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'chatsphere_auth_token',
  USER_DATA: 'chatsphere_user_data',
  SERVER_URL: 'chatsphere_server_url',
  ACTIVE_THEME: 'chatsphere_theme',
};
