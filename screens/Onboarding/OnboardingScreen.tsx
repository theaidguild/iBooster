import React, { useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ListRenderItem,
  Alert,
  Animated,
} from 'react-native';
import { Text, Button, useTheme, Surface, Portal, Dialog, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingCard, OnboardingCardProps } from './components';

const { width } = Dimensions.get('window');

// Enhanced onboarding content with benefit-focused copy
const onboardingData: OnboardingCardProps[] = [
  {
    title: 'Welcome to iBooster',
    subtitle:
      'Transform your iPhone into a performance powerhouse. Get real-time insights and save hours of battery life.',
    illustration: 'welcome',
    testID: 'onboarding-card-0',
  },
  {
    title: 'Extend Battery Life',
    subtitle:
      "Discover what's draining your battery and get personalized tips to extend your daily usage by 2+ hours.",
    illustration: 'battery',
    testID: 'onboarding-card-1',
  },
  {
    title: 'Free Up Storage',
    subtitle:
      'Reclaim gigabytes of space with smart analysis and one-tap optimization recommendations.',
    illustration: 'storage',
    testID: 'onboarding-card-2',
  },
  {
    title: 'Stay Optimized',
    subtitle:
      'Get timely alerts about performance issues and optimization opportunities before they impact you.',
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
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const isLastSlide = state.currentIndex === onboardingData.length - 1;

  // Animate progress bar when index changes
  React.useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: ((state.currentIndex + 1) / onboardingData.length) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [state.currentIndex, progressAnimation]);

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

  const renderPaginationDot = (index: number) => {
    const isActive = index === state.currentIndex;
    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: isActive ? theme.colors.primary : theme.colors.outline,
            transform: [{ scale: isActive ? 1.2 : 1 }],
            opacity: isActive ? 1 : 0.6,
          },
        ]}
        accessible={true}
        accessibilityLabel={`Page ${index + 1} of ${onboardingData.length}`}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />

      {/* Main content */}
      <View style={styles.content}>
        {/* App Logo/Title */}
        <View
          style={[styles.header, styles.headerGradient, { backgroundColor: theme.colors.surface }]}
        >
          <Text
            variant="headlineLarge"
            style={[styles.appTitle, { color: theme.colors.primary }]}
            accessible={true}
            accessibilityRole="header"
          >
            iBooster
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.appSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Optimize your iPhone performance
          </Text>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: progressAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text
              variant="labelSmall"
              style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
            >
              {state.currentIndex + 1} of {onboardingData.length}
            </Text>
          </View>
        </View>

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
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="start"
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
          labelStyle={[styles.skipButtonLabel, { color: theme.colors.outline }]}
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
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  appSubtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontWeight: '500',
  },
  carousel: {
    flex: 1,
    paddingVertical: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  skipButton: {
    minWidth: 80,
  },
  skipButtonLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  nextButton: {
    minWidth: 130,
    borderRadius: 24,
  },
});
