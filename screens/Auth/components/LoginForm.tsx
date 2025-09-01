import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { AuthCredentials, AuthError } from '../types';

interface LoginFormProps {
  onSubmit: (credentials: AuthCredentials) => Promise<void>;
  isLoading: boolean;
  error: AuthError | null;
  onClearError: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onClearError,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [formData, setFormData] = useState<AuthCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof AuthCredentials, value: string) => {
    if (error) onClearError();
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const isFormValid = formData.email.trim() !== '' && formData.password.trim() !== '';

  return (
    <View style={styles.container}>
      <TextInput
        label={t('auth.form.email')}
        value={formData.email}
        onChangeText={(text) => handleInputChange('email', text)}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error?.field === 'email'}
        disabled={isLoading}
        style={styles.input}
        accessible={true}
        accessibilityLabel={t('auth.form.email')}
      />
      <HelperText type="error" visible={error?.field === 'email'}>
        {error?.field === 'email' ? error.message : ''}
      </HelperText>

      <TextInput
        label={t('auth.form.password')}
        value={formData.password}
        onChangeText={(text) => handleInputChange('password', text)}
        mode="outlined"
        secureTextEntry={!showPassword}
        autoComplete="password"
        error={error?.field === 'password'}
        disabled={isLoading}
        style={styles.input}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          />
        }
        accessible={true}
        accessibilityLabel={t('auth.form.password')}
      />
      <HelperText type="error" visible={error?.field === 'password'}>
        {error?.field === 'password' ? error.message : ''}
      </HelperText>

      {error?.field === 'general' && (
        <HelperText type="error" visible={true} style={styles.generalError}>
          {error.message}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={!isFormValid || isLoading}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
        accessible={true}
        accessibilityLabel={t('auth.login.button')}
      >
        {t('auth.login.button')}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 8,
  },
  input: {
    marginBottom: 4,
  },
  generalError: {
    textAlign: 'center',
    marginTop: 8,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});
