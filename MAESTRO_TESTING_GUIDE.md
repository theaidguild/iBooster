# 🎭 Maestro Testing Guide for iBooster

## 📋 Table of Contents

1. [What is Maestro?](#what-is-maestro)
2. [Installation & Setup](#installation--setup)
3. [Understanding Your App Structure](#understanding-your-app-structure)
4. [Basic Maestro Concepts](#basic-maestro-concepts)
5. [Test Flow Examples for iBooster](#test-flow-examples-for-ibooster)
6. [Advanced Testing Scenarios](#advanced-testing-scenarios)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [CI/CD Integration](#cicd-integration)

---

## 🎯 What is Maestro?

Maestro is a mobile UI testing framework that allows you to write tests in a simple YAML format. It's particularly powerful for React Native and Expo apps like iBooster because it:

- **Works across platforms**: Test both iOS and Android with the same test files
- **No code required**: Write tests in simple YAML syntax
- **Real device testing**: Tests run on actual devices/simulators
- **Fast execution**: Optimized for mobile app testing
- **Easy debugging**: Clear error messages and built-in screenshot capabilities

---

## 🚀 Installation & Setup

### 1. Install Maestro

```bash
# Install Maestro using Homebrew (macOS)
brew tap mobile-dev-inc/tap
brew install maestro

# Alternative: Install via curl
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

### 2. Setup for Your iBooster Project

Since your app uses Expo, you have several testing options:

#### Option A: Test with Expo Go (Recommended for Development)

```bash
# Start your Expo development server
yarn start

# In Expo Go app, scan QR code to load your app
# Then run Maestro tests
maestro test flows/
```

#### Option B: Test with Development Build

```bash
# Build development version
yarn prebuild
yarn ios  # or yarn android

# Run Maestro tests
maestro test flows/
```

### 3. Project Structure for Tests

Create a `maestro/` directory in your project root:

```
iBooster/
├── maestro/
│   ├── flows/
│   │   ├── onboarding.yaml
│   │   ├── home-navigation.yaml
│   │   ├── battery-monitoring.yaml
│   │   ├── storage-analysis.yaml
│   │   └── network-performance.yaml
│   ├── helpers/
│   │   └── common-actions.yaml
│   └── config/
│       └── maestro-config.yaml
```

---

## 🏗️ Understanding Your App Structure

Based on your `App.tsx`, your app has these key screens:

- **Onboarding Screen**: First-time user experience
- **Home Screen**: Main dashboard with navigation cards
- **Battery Screen**: Battery monitoring and tips
- **Storage Screen**: Storage analysis and cleanup
- **Network Screen**: Network performance monitoring

Your app uses:

- React Native Paper components
- Custom navigation (screen state management)
- AsyncStorage for onboarding persistence
- Dark/Light theme support

---

## 🧠 Basic Maestro Concepts

### Key Commands

| Command         | Description                 | Example                            |
| --------------- | --------------------------- | ---------------------------------- |
| `tapOn`         | Tap on an element           | `tapOn: "Get Started"`             |
| `assertVisible` | Check if element is visible | `assertVisible: "Battery Monitor"` |
| `inputText`     | Enter text into input       | `inputText: "test@email.com"`      |
| `swipe`         | Swipe gesture               | `swipe: { direction: left }`       |
| `scroll`        | Scroll in a direction       | `scroll: { direction: down }`      |
| `runFlow`       | Execute another test flow   | `runFlow: ../helpers/login.yaml`   |

### Element Selection Methods

```yaml
# By text content
tapOn: "Battery Monitor"

# By accessibility ID
tapOn:
  id: "battery-card"

# By index (when multiple elements match)
tapOn:
  text: "Start"
  index: 0

# By partial text match
tapOn:
  text: "Batt.*"
  regex: true
```

---

## 🧪 Test Flow Examples for iBooster

### 1. Onboarding Flow Test (`maestro/flows/onboarding.yaml`)

```yaml
appId: host.exp.Exponent # For Expo Go
---
# Test complete onboarding flow
- assertVisible: 'Welcome to iBooster'
- tapOn: 'Get Started'
- assertVisible: 'Monitor your device performance'
- tapOn: 'Continue'
- assertVisible: 'Get personalized tips'
- tapOn: 'Continue'
- assertVisible: 'Ready to optimize'
- tapOn: 'Start Using App'
- assertVisible: 'Device Health Score' # Should be on home screen now
```

### 2. Home Navigation Test (`maestro/flows/home-navigation.yaml`)

```yaml
appId: host.exp.Exponent
---
# Assuming user has completed onboarding
- runFlow: ../helpers/skip-onboarding.yaml
- assertVisible: 'Device Health Score'

# Test Battery navigation
- tapOn: 'Battery'
- assertVisible: 'Battery Monitor'
- tapOn: 'Back' # or navigate back button
- assertVisible: 'Device Health Score'

# Test Storage navigation
- tapOn: 'Storage'
- assertVisible: 'Storage Analysis'
- tapOn: 'Back'
- assertVisible: 'Device Health Score'

# Test Network navigation
- tapOn: 'Network'
- assertVisible: 'Network Performance'
- tapOn: 'Back'
- assertVisible: 'Device Health Score'
```

### 3. Battery Monitoring Test (`maestro/flows/battery-monitoring.yaml`)

```yaml
appId: host.exp.Exponent
---
- runFlow: ../helpers/navigate-to-battery.yaml
- assertVisible: 'Battery Monitor'

# Check battery level display
- assertVisible:
    id: 'battery-level' # Assuming you add testID

# Check battery status
- assertVisible: 'Charging Status'

# Test battery tips section
- scroll:
    direction: down
- assertVisible: 'Battery Tips'

# Test tip expansion (if you have expandable tips)
- tapOn: 'Reduce Screen Brightness'
- assertVisible: 'Lower your screen brightness'

# Navigate back
- tapOn: 'Back'
- assertVisible: 'Device Health Score'
```

### 4. Storage Analysis Test (`maestro/flows/storage-analysis.yaml`)

```yaml
appId: host.exp.Exponent
---
- runFlow: ../helpers/navigate-to-storage.yaml
- assertVisible: 'Storage Analysis'

# Check storage breakdown chart
- assertVisible: 'Storage Usage'

# Check if large files section exists
- scroll:
    direction: down
- assertVisible: 'Large Files'

# Test cleanup suggestions
- assertVisible: 'Cleanup Suggestions'
- tapOn: 'Clear Cache'
- assertVisible: 'Are you sure?' # Confirmation dialog
- tapOn: 'Cancel' # Don't actually clear in test

# Navigate back
- tapOn: 'Back'
- assertVisible: 'Device Health Score'
```

### 5. Theme Toggle Test (`maestro/flows/theme-toggle.yaml`)

```yaml
appId: host.exp.Exponent
---
# Test dark/light theme switching
- runFlow: ../helpers/navigate-to-home.yaml

# Capture current theme state
- takeScreenshot: 'theme-before.png'

# Toggle theme (assuming you have a theme toggle button)
- tapOn:
    id: 'theme-toggle'

# Wait for theme change animation
- waitForAnimationEnd

# Verify theme changed
- takeScreenshot: 'theme-after.png'
```

---

## 🏆 Advanced Testing Scenarios

### 1. Permission Handling (`maestro/flows/permissions.yaml`)

```yaml
appId: host.exp.Exponent
---
# Test app permissions flow
- assertVisible: 'Welcome to iBooster'
- tapOn: 'Get Started'

# Handle battery permission request
- waitForAnimationEnd
- tapOn: 'Allow' # System permission dialog
- assertVisible: 'Battery access granted'

# Handle notification permission
- tapOn: 'Continue'
- waitForAnimationEnd
- tapOn: 'Allow' # System permission dialog
- assertVisible: 'Notifications enabled'
```

### 2. Data Refresh Testing (`maestro/flows/data-refresh.yaml`)

```yaml
appId: host.exp.Exponent
---
- runFlow: ../helpers/navigate-to-battery.yaml
- assertVisible: 'Battery Monitor'

# Test pull-to-refresh functionality
- swipe:
    direction: down
    duration: 1000
- assertVisible: 'Refreshing...'
- wait: 2000 # Wait for refresh to complete
- assertVisible: 'Last updated'
```

### 3. Error State Testing (`maestro/flows/error-handling.yaml`)

```yaml
appId: host.exp.Exponent
---
# Test app behavior when permissions are denied
- assertVisible: 'Welcome to iBooster'
- tapOn: 'Get Started'
- tapOn: "Don't Allow" # Deny permission
- assertVisible: 'Permission required'
- assertVisible: 'Please enable battery access'
- tapOn: 'Retry'
```

### 4. Performance Testing (`maestro/flows/performance.yaml`)

```yaml
appId: host.exp.Exponent
---
- startRecording # Record performance metrics
- runFlow: onboarding.yaml
- runFlow: home-navigation.yaml
- runFlow: battery-monitoring.yaml
- stopRecording
```

---

## 📁 Helper Flows

Create reusable helper flows in `maestro/helpers/`:

### `common-actions.yaml`

```yaml
# Helper: Skip onboarding for tests that don't need it
skipOnboarding:
  - assertVisible: 'Welcome to iBooster'
  - tapOn: 'Skip'
  - assertVisible: 'Device Health Score'

# Helper: Navigate to home from any screen
navigateToHome:
  - tapOn: 'Home' # Assuming you have home button
  - assertVisible: 'Device Health Score'
```

### `navigate-to-battery.yaml`

```yaml
# Helper: Navigate to battery screen
- runFlow: common-actions.yaml
- tapOn: 'Battery'
- assertVisible: 'Battery Monitor'
```

---

## 💡 Best Practices

### 1. Add Test IDs to Your Components

In your React Native components, add `testID` props:

```tsx
// In your HomeScreen component
<Card testID="battery-card" onPress={onNavigateToBattery}>
  <Card.Title title="Battery" />
</Card>

// In your BatteryScreen component
<Text testID="battery-level">{batteryLevel}%</Text>
<Button testID="refresh-battery" onPress={refreshData}>
  Refresh
</Button>
```

### 2. Use Descriptive Test Names

```yaml
# Good
- assertVisible: 'Battery level should be displayed'
- tapOn: 'Refresh battery data button'

# Bad
- assertVisible: 'Text'
- tapOn: 'Button'
```

### 3. Add Screenshots for Visual Verification

```yaml
- takeScreenshot: 'home-screen.png'
- tapOn: 'Battery'
- takeScreenshot: 'battery-screen.png'
```

### 4. Use Waits Appropriately

```yaml
# Wait for animations
- waitForAnimationEnd

# Wait for specific duration
- wait: 2000

# Wait for element to appear
- waitUntilVisible: 'Loading complete'
```

### 5. Organize Tests by Feature

```
maestro/
├── flows/
│   ├── onboarding/
│   │   ├── first-launch.yaml
│   │   ├── permissions.yaml
│   │   └── skip-flow.yaml
│   ├── home/
│   │   ├── navigation.yaml
│   │   ├── refresh.yaml
│   │   └── theme-toggle.yaml
│   └── monitoring/
│       ├── battery.yaml
│       ├── storage.yaml
│       └── network.yaml
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Element Not Found

```yaml
# Problem: Element not found
- tapOn: 'Button' # Fails

# Solution: Add wait or check visibility first
- waitUntilVisible: 'Button'
- tapOn: 'Button'

# Or use more specific selector
- tapOn:
    id: 'submit-button'
```

#### 2. Timing Issues

```yaml
# Problem: Tapping too fast
- tapOn: 'Submit'
- tapOn: 'Confirm' # Might fail if dialog hasn't appeared

# Solution: Add waits
- tapOn: 'Submit'
- waitForAnimationEnd
- tapOn: 'Confirm'
```

#### 3. Platform-Specific Elements

```yaml
# Use platform conditions
- tapOn: 'Back'
  condition:
    platform: android

- tapOn: '< Back'
  condition:
    platform: ios
```

### Debug Commands

```bash
# Run test with verbose logging
maestro test --debug flows/onboarding.yaml

# Run test and save screenshots on failure
maestro test --screenshot-on-failure flows/

# Run specific test with custom app ID
maestro test --app-id com.yourapp.dev flows/test.yaml
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example (`.github/workflows/maestro.yml`)

```yaml
name: Maestro Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  maestro:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22.17.1'

      - name: Setup Yarn
        run: corepack enable

      - name: Install dependencies
        run: yarn install

      - name: Setup Maestro
        run: |
          brew tap mobile-dev-inc/tap
          brew install maestro

      - name: Start iOS Simulator
        run: |
          xcrun simctl boot "iPhone 15"

      - name: Build and start Expo
        run: |
          yarn prebuild:ios
          yarn ios --no-install --no-bundler &
          sleep 30  # Wait for app to start

      - name: Run Maestro Tests
        run: |
          maestro test maestro/flows/

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: maestro-results
          path: maestro/results/
```

### Test Script for package.json

Add to your `package.json`:

```json
{
  "scripts": {
    "test:maestro": "maestro test maestro/flows/",
    "test:maestro:watch": "maestro test --watch maestro/flows/",
    "test:maestro:debug": "maestro test --debug --screenshot-on-failure maestro/flows/"
  }
}
```

---

## 📊 Running Your First Tests

### Step 1: Create Your First Test

Create `maestro/flows/smoke-test.yaml`:

```yaml
appId: host.exp.Exponent
---
# Basic smoke test for iBooster
- assertVisible: 'iBooster' # App name or logo
- takeScreenshot: 'app-loaded.png'
```

### Step 2: Run the Test

```bash
# Make sure your Expo app is running
yarn start

# In Expo Go, load your app
# Then run Maestro test
maestro test maestro/flows/smoke-test.yaml
```

### Step 3: View Results

```bash
# Maestro will show results in terminal
# Screenshots saved to maestro/results/ (if configured)
# Check test report for detailed results
```

---

## 🎯 Specific Test Ideas for iBooster

Given your app's functionality, here are specific test scenarios:

1. **First Launch Experience**
   - Test onboarding flow completion
   - Verify permission requests
   - Check AsyncStorage persistence

2. **Dashboard Functionality**
   - Test all navigation cards
   - Verify data loading states
   - Test refresh functionality

3. **Battery Monitoring**
   - Test battery level display
   - Verify charging status
   - Test battery tips expansion

4. **Storage Analysis**
   - Test storage breakdown display
   - Verify large files detection
   - Test cleanup suggestions

5. **Network Performance**
   - Test network status display
   - Verify speed test functionality
   - Test connectivity alerts

6. **Theme and Settings**
   - Test light/dark mode toggle
   - Verify setting persistence
   - Test language switching (if implemented)

7. **Error Scenarios**
   - Test permission denial handling
   - Test network offline states
   - Test low battery scenarios

---

## 📚 Additional Resources

- **Maestro Documentation**: https://docs.maestro.dev/
- **Maestro GitHub**: https://github.com/mobile-dev-inc/maestro
- **React Native Testing**: https://reactnative.dev/docs/testing-overview
- **Expo Testing Guide**: https://docs.expo.dev/guides/testing/

---

## 🎉 Conclusion

Maestro provides a powerful and simple way to test your iBooster React Native app. Start with basic navigation tests and gradually add more complex scenarios. The YAML syntax makes tests readable and maintainable, while the real device testing ensures your app works as expected for users.

Remember to:

- Add testIDs to your React Native components
- Start with simple smoke tests
- Build up to complex user journey tests
- Use CI/CD integration for automated testing
- Take screenshots for visual verification

Happy testing! 🚀
