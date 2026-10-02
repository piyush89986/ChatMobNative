import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_MODE_KEY = '@fomo_app_mode_preference';

const AppModeContext = createContext({
  appMode: 'choice', // 'choice' | 'music' | 'social'
  setAppMode: () => {},
  switchToMusic: () => {},
  switchToSocial: () => {},
  returnToChoice: () => {},
  rememberChoice: false,
  setRememberChoice: () => {},
});

export const AppModeProvider = ({ children }) => {
  const [appMode, setAppModeState] = useState('choice');
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSavedMode = async () => {
      try {
        const saved = await AsyncStorage.getItem(APP_MODE_KEY);
        if (saved && (saved === 'music' || saved === 'social')) {
          setAppModeState(saved);
          setRememberChoice(true);
        } else {
          setAppModeState('choice');
        }
      } catch (e) {
        setAppModeState('choice');
      } finally {
        setIsReady(true);
      }
    };
    loadSavedMode();
  }, []);

  const setAppMode = async (mode, remember = rememberChoice) => {
    setAppModeState(mode);
    try {
      if (remember && mode !== 'choice') {
        await AsyncStorage.setItem(APP_MODE_KEY, mode);
      } else if (mode === 'choice') {
        await AsyncStorage.removeItem(APP_MODE_KEY);
      }
    } catch (e) {
      console.log('Error saving app mode:', e);
    }
  };

  const switchToMusic = () => setAppMode('music');
  const switchToSocial = () => setAppMode('social');
  const returnToChoice = () => setAppMode('choice', false);

  return (
    <AppModeContext.Provider
      value={{
        appMode,
        setAppMode,
        switchToMusic,
        switchToSocial,
        returnToChoice,
        rememberChoice,
        setRememberChoice,
        isReady,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => useContext(AppModeContext);
