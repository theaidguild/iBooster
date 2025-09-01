import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SignUpData, AuthError } from '../types';

interface SignUpFormProps {
  onSubmit: (data: SignUpData) => Promise<void>;
  isLoading: boolean;
  error: AuthError | null;
  onClearError: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSubmit,
  isLoading,
  error,
  onClearError,
}) => {
  const { t } = useTranslation();
  // Theme available via PaperProvider context if needed later

  const [formData, setFormData] = useState<SignUpData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: keyof SignUpData, value: string) => {
    if (error) onClearError();
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
    } catch {
      // Error is handled by the hook
    }
  };

  const isFormValid =
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '';

  return (
    <View style={styles.container}>
      <TextInput
        label={t('auth.form.name')}
        value={formData.name}
        onChangeText={(text) => handleInputChange('name', text)}
        mode="outlined"
        autoCapitalize="words"
        autoComplete="name"
        error={error?.field === 'name'}
        disabled={isLoading}
        style={styles.input}
        accessible={true}
        accessibilityLabel={t('auth.form.name')}
      />
      <HelperText type="error" visible={error?.field === 'name'}>
        {error?.field === 'name' ? error.message : ''}
      </HelperText>

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
        autoComplete="password-new"
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

      <TextInput
        label={t('auth.form.confirmPassword')}
        value={formData.confirmPassword}
        onChangeText={(text) => handleInputChange('confirmPassword', text)}
        mode="outlined"
        secureTextEntry={!showConfirmPassword}
        autoComplete="password-new"
        error={error?.field === 'confirmPassword'}
        disabled={isLoading}
        style={styles.input}
        right={
          <TextInput.Icon
            icon={showConfirmPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          />
        }
        accessible={true}
        accessibilityLabel={t('auth.form.confirmPassword')}
      />
      <HelperText type="error" visible={error?.field === 'confirmPassword'}>
        {error?.field === 'confirmPassword' ? error.message : ''}
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
        accessibilityLabel={t('auth.signup.button')}
      >
        {t('auth.signup.button')}
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
