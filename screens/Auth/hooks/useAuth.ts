import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import {
  AuthUser,
  AuthCredentials,
  SignUpData,
  AuthError,
  AuthState,
  AppleSignInResponse,
} from '../types';

// New storage keys for RocketIQ
const AUTH_STORAGE_KEY = '@RocketIQ:auth_token';
const USER_STORAGE_KEY = '@RocketIQ:user_data';
// Legacy keys to support migration from iBooster
const LEGACY_AUTH_STORAGE_KEY = '@iBooster:auth_token';
const LEGACY_USER_STORAGE_KEY = '@iBooster:user_data';

// Mock authentication delay
const AUTH_DELAY = 1500;

// Mock user database for demonstration
const mockUsers: Record<string, { email: string; name: string; password: string }> = {
  'test@example.com': {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
  },
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isGuest: false,
  });

  const initializeAuth = useCallback(async () => {
    try {
      // Try reading new keys first
      let [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(USER_STORAGE_KEY),
      ]);

      // If not found, attempt migration from legacy keys
      if (!token || !userData) {
        const [legacyToken, legacyUserData] = await Promise.all([
          AsyncStorage.getItem(LEGACY_AUTH_STORAGE_KEY),
          AsyncStorage.getItem(LEGACY_USER_STORAGE_KEY),
        ]);

        if (legacyToken && legacyUserData) {
          // Migrate to new keys and clean up old ones
          await Promise.all([
            AsyncStorage.setItem(AUTH_STORAGE_KEY, legacyToken),
            AsyncStorage.setItem(USER_STORAGE_KEY, legacyUserData),
            AsyncStorage.removeItem(LEGACY_AUTH_STORAGE_KEY),
            AsyncStorage.removeItem(LEGACY_USER_STORAGE_KEY),
          ]);

          token = legacyToken;
          userData = legacyUserData;
        }
      }

      if (token && userData) {
        const user: AuthUser = JSON.parse(userData);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          isGuest: user.isGuest,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const validateName = (name: string): string | null => {
    if (!name) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  };

  const signIn = useCallback(async (credentials: AuthCredentials): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate inputs
      const emailError = validateEmail(credentials.email);
      const passwordError = validatePassword(credentials.password);

      if (emailError) {
        throw { field: 'email', message: emailError };
      }
      if (passwordError) {
        throw { field: 'password', message: passwordError };
      }

      // Mock authentication delay
      await new Promise((resolve) => setTimeout(resolve, AUTH_DELAY));

      // Mock authentication logic
      const mockUser = mockUsers[credentials.email.toLowerCase()];
      if (!mockUser || mockUser.password !== credentials.password) {
        throw { field: 'general', message: 'Invalid email or password' };
      }

      const user: AuthUser = {
        id: `mock_${Date.now()}`,
        email: mockUser.email,
        name: mockUser.name,
        isGuest: false,
        provider: 'email',
        createdAt: new Date(),
      };

      // Store auth data
      const token = `mock_token_${Date.now()}`;
      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, token),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
      ]);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isGuest: false,
      });
    } catch (error) {
      const authError: AuthError = (error as AuthError).field
        ? (error as AuthError)
        : { field: 'general', message: 'Something went wrong. Please try again.' };

      setAuthState((prev) => ({ ...prev, isLoading: false, error: authError }));
      throw authError;
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate inputs
      const emailError = validateEmail(data.email);
      const passwordError = validatePassword(data.password);
      const nameError = validateName(data.name);

      if (emailError) {
        throw { field: 'email', message: emailError };
      }
      if (passwordError) {
        throw { field: 'password', message: passwordError };
      }
      if (nameError) {
        throw { field: 'name', message: nameError };
      }
      if (data.password !== data.confirmPassword) {
        throw { field: 'confirmPassword', message: 'Passwords do not match' };
      }

      // Mock authentication delay
      await new Promise((resolve) => setTimeout(resolve, AUTH_DELAY));

      // Check if user already exists
      if (mockUsers[data.email.toLowerCase()]) {
        throw { field: 'email', message: 'An account with this email already exists' };
      }

      // Create new user
      const user: AuthUser = {
        id: `mock_${Date.now()}`,
        email: data.email,
        name: data.name,
        isGuest: false,
        provider: 'email',
        createdAt: new Date(),
      };

      // Store new user in mock database
      mockUsers[data.email.toLowerCase()] = {
        email: data.email,
        name: data.name,
        password: data.password,
      };

      // Store auth data
      const token = `mock_token_${Date.now()}`;
      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, token),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
      ]);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isGuest: false,
      });
    } catch (error) {
      const authError: AuthError = (error as AuthError).field
        ? (error as AuthError)
        : { field: 'general', message: 'Something went wrong. Please try again.' };

      setAuthState((prev) => ({ ...prev, isLoading: false, error: authError }));
      throw authError;
    }
  }, []);

  const signInWithApple = useCallback(async (): Promise<void> => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const response: AppleSignInResponse = {
        identityToken: credential.identityToken || '',
        authorizationCode: credential.authorizationCode || '',
        user: {
          email: credential.email || undefined,
          name: credential.fullName
            ? {
                firstName: credential.fullName.givenName || '',
                lastName: credential.fullName.familyName || '',
              }
            : undefined,
        },
      };

      // Create user from Apple response
      const user: AuthUser = {
        id: credential.user,
        email: response.user.email || `${credential.user}@privaterelay.appleid.com`,
        name: response.user.name
          ? `${response.user.name.firstName} ${response.user.name.lastName}`.trim()
          : 'Apple User',
        isGuest: false,
        provider: 'apple',
        createdAt: new Date(),
      };

      // Store auth data
      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, credential.identityToken || ''),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
      ]);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isGuest: false,
      });
    } catch (error) {
      let authError: AuthError;

      if ((error as { code?: string }).code === 'ERR_CANCELED') {
        authError = { field: 'general', message: 'Sign in was cancelled' };
      } else {
        authError = { field: 'general', message: 'Apple Sign In failed. Please try again.' };
      }

      setAuthState((prev) => ({ ...prev, isLoading: false, error: authError }));
      throw authError;
    }
  }, []);

  const signInAsGuest = useCallback(async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const guestUser: AuthUser = {
        id: `guest_${Date.now()}`,
        email: '',
        name: 'Guest User',
        isGuest: true,
        provider: 'guest',
        createdAt: new Date(),
      };

      // Store guest data
      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, 'guest_token'),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestUser)),
      ]);

      setAuthState({
        user: guestUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isGuest: true,
      });
    } catch {
      const authError: AuthError = {
        field: 'general',
        message: 'Failed to continue as guest. Please try again.',
      };

      setAuthState((prev) => ({ ...prev, isLoading: false, error: authError }));
      throw authError;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_STORAGE_KEY),
        AsyncStorage.removeItem(USER_STORAGE_KEY),
      ]);

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isGuest: false,
      });
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  const checkAppleSignInAvailability = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') return false;

    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('Failed to check Apple Sign In availability:', error);
      return false;
    }
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signInWithApple,
    signInAsGuest,
    signOut,
    clearError,
    checkAppleSignInAvailability,
  };
};
