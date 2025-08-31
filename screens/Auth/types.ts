export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  isGuest: boolean;
  provider: 'email' | 'apple' | 'guest';
  createdAt: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  name: string;
  confirmPassword: string;
}

export interface AuthError {
  field?: 'email' | 'password' | 'name' | 'confirmPassword' | 'general';
  message: string;
}

export interface AppleSignInResponse {
  identityToken: string;
  authorizationCode: string;
  user: {
    email?: string;
    name?: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  isGuest: boolean;
}

export type AuthMode = 'login' | 'signup';

export interface AuthFormState {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
  errors: Record<string, string>;
  isLoading: boolean;
}