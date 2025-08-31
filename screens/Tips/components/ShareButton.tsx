import React from 'react';
import { TouchableOpacity, StyleSheet, Share, Platform, Alert } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface ShareButtonProps {
  title: string;
  content: string;
  url?: string;
  size?: number;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ title, content, url, size = 24 }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleShare = async () => {
    try {
      let shareContent = `${title}\n\n${content}`;

      if (url) {
        shareContent += `\n\n${t('tips.share.learnMore')}: ${url}`;
      }

      // Use localized app title instead of a hardcoded name
      shareContent += `\n\n${t('tips.share.sharedFrom')} ${t('onboarding.appTitle')}`;

      const result = await Share.share({
        message: shareContent,
        title: title,
        ...(Platform.OS === 'ios' && { url: url }),
      });

      if (result.action === Share.dismissedAction) {
        // User dismissed the share dialog
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(t('common.error'), t('tips.share.error'), [{ text: t('common.ok') }]);
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} style={styles.container}>
      <IconButton
        icon="share-variant"
        size={size}
        iconColor={theme.colors.onSurfaceVariant}
        onPress={handleShare}
        style={styles.button}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
  },
  button: {
    margin: 0,
  },
});
