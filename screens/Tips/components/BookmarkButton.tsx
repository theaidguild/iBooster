import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => void;
  size?: number;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  isBookmarked,
  onToggle,
  size = 24,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onToggle} style={styles.container}>
      <IconButton
        icon={isBookmarked ? 'bookmark' : 'bookmark-outline'}
        size={size}
        iconColor={isBookmarked ? theme.colors.primary : theme.colors.onSurfaceVariant}
        onPress={onToggle}
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
