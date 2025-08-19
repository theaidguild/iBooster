import React, { useRef } from 'react';
import { View, FlatList, StyleSheet, Dimensions, ListRenderItem, Alert } from 'react-native';
import { Text, Button, useTheme, Surface, Portal, Dialog, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingCard, OnboardingCardProps } from './components';

const { width } = Dimensions.get('window');

// Placeholder onboarding data
const onboardingData: OnboardingCardProps[] = [
  {
    title: 'Welcome to iBooster',
    subtitle:
      'Monitor your device performance and optimize your iPhone for better battery life and storage management.',
    illustration: 'welcome',
    testID: 'onboarding-card-0',
  },
  {
    title: 'Battery Health',
    subtitle:
      'Get real-time insights into your battery usage and receive personalized tips to extend battery life.',
    illustration: 'battery',
    testID: 'onboarding-card-1',
  },
  {
    title: 'Storage Optimizer',
    subtitle:
      'Analyze your storage usage and get recommendations to free up space and improve performance.',
    illustration: 'storage',
    testID: 'onboarding-card-2',
  },
  {
    title: 'Stay Informed',
    subtitle:
      'Receive notifications about important performance insights and optimization opportunities.',
    illustration: 'notifications',
    testID: 'onboarding-card-3',
  },
];

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const { state, actions } = useOnboarding(onboardingData.length);
  const [showPermissionDialog, setShowPermissionDialog] = React.useState(false);

  const isLastSlide = state.currentIndex === onboardingData.length - 1;

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const slideWidth = width;
    const currentIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    if (currentIndex !== state.currentIndex) {
      actions.goToSlide(currentIndex);
    }
  };

  const handleNext = () => {
    if (isLastSlide) {
      // On last slide, show permission dialog
      setShowPermissionDialog(true);
    } else {
      actions.nextSlide();
      flatListRef.current?.scrollToIndex({
        index: state.currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    actions.skipOnboarding();
    onComplete?.();
  };

  const handleRequestPermissions = async () => {
    setShowPermissionDialog(false);

    try {
      const granted = await actions.requestNotificationPermissions();

      if (granted) {
        Alert.alert(
          'Notifications Enabled',
          "You'll receive helpful performance tips and alerts.",
          [
            {
              text: 'Great!',
              onPress: () => {
                actions.completeOnboarding();
                onComplete?.();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in Settings if you change your mind.',
          [
            {
              text: 'OK',
              onPress: () => {
                actions.completeOnboarding();
                onComplete?.();
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Unable to request permissions. You can try again later in Settings.', [
        {
          text: 'OK',
          onPress: () => {
            actions.completeOnboarding();
            onComplete?.();
          },
        },
      ]);
    }
  };

  const handleSkipPermissions = () => {
    setShowPermissionDialog(false);
    actions.completeOnboarding();
    onComplete?.();
  };

  const renderCard: ListRenderItem<OnboardingCardProps> = ({ item }) => (
    <OnboardingCard {...item} />
  );

  const renderPaginationDot = (index: number) => (
    <View
      key={index}
      style={[
        styles.dot,
        {
          backgroundColor:
            index === state.currentIndex ? theme.colors.primary : theme.colors.outline,
        },
      ]}
      accessible={true}
      accessibilityLabel={`Page ${index + 1} of ${onboardingData.length}`}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      {/* Main content */}
      <View style={styles.content}>
        {/* App Logo/Title */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text
            variant="headlineLarge"
            style={[styles.appTitle, { color: theme.colors.primary }]}
            accessible={true}
            accessibilityRole="header"
          >
            📱 iBooster
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.appSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Optimize your iPhone performance
          </Text>
        </Surface>

        {/* Carousel */}
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderCard}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          keyExtractor={(_, index) => index.toString()}
          style={styles.carousel}
          accessible={false}
        />

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => renderPaginationDot(index))}
        </View>
      </View>

      {/* Bottom Controls */}
      <Surface style={[styles.bottomControls, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="text"
          onPress={handleSkip}
          style={styles.skipButton}
          labelStyle={{ color: theme.colors.onSurfaceVariant }}
          accessible={true}
          accessibilityLabel="Skip onboarding"
          accessibilityHint="Bypass the onboarding process"
        >
          Skip
        </Button>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.nextButton}
          accessible={true}
          accessibilityLabel={isLastSlide ? 'Get started' : 'Next slide'}
          accessibilityHint={
            isLastSlide
              ? 'Complete onboarding and start using the app'
              : 'Go to next onboarding slide'
          }
        >
          {isLastSlide ? 'Get Started' : 'Next'}
        </Button>
      </Surface>

      {/* Permission Dialog */}
      <Portal>
        <Dialog
          visible={showPermissionDialog}
          onDismiss={() => setShowPermissionDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>
            Enable Notifications
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
              Get helpful performance tips and important alerts about your device health. You can
              change this setting anytime in the app settings.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSkipPermissions} textColor={theme.colors.onSurfaceVariant}>
              Not Now
            </Button>
            <Button onPress={handleRequestPermissions}>Enable Notifications</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 1,
  },
  appTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  appSubtitle: {
    textAlign: 'center',
  },
  carousel: {
    flex: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 2,
  },
  skipButton: {
    minWidth: 80,
  },
  nextButton: {
    minWidth: 120,
  },
});
