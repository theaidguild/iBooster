# 📱 iOS Performance Monitoring App Specification

## 🧭 App Overview

An iOS app built with React Native and TypeScript to monitor device performance, provide cleanup suggestions, and offer actionable tips to improve battery life, storage, and overall responsiveness.

---

## ✅ Features

- Battery monitoring and alerts
- Storage analysis and cleanup suggestions
- Network status and performance tips
- Device health score
- User-friendly dashboard
- Dark mode support
- Notification preferences

---

## 🖼️ Screens Breakdown

### 1. Welcome / Onboarding Screen

**Visual Layout**:

- Full-screen intro with app logo and brief description
- Carousel-style onboarding cards with illustrations
- Permission prompts (battery, storage, notifications)

**Functional Elements**:

- “Get Started” button
- “Skip” option
- Permission request modals

---

### 2. Home Dashboard

**Visual Layout**:

- Top section: Device Health Score (circular progress indicator)
- Middle section: Battery, Storage, Network cards with icons and status bars
- Bottom section: Quick Actions (“Run Cleanup”, “View Tips”)

**Functional Elements**:

- Tapable cards for navigation
- Real-time data updates
- Refresh button

---

### 3. Battery Monitor Screen

**Visual Layout**:

- Battery level graph (line chart for last 24h)
- Charging status indicator
- Tips section with expandable cards

**Functional Elements**:

- Toggle for low battery notifications
- Scrollable tips list
- Battery health summary

---

### 4. Storage Analyzer Screen

**Visual Layout**:

- Pie chart showing storage breakdown (Apps, Media, System, Free)
- List of large files with thumbnails and sizes
- Cleanup suggestions section

**Functional Elements**:

- Delete suggestion buttons (with confirmation)
- Redirect to iOS settings for app offloading
- Cache clearing for app

---

### 5. Network & Performance Screen

**Visual Layout**:

- Network type indicator (Wi-Fi, Cellular)
- Speed test summary (ping, download, upload)
- App usage stats (if available)

**Functional Elements**:

- Refresh network info
- Tips to reduce background activity
- Connectivity status alerts

---

### 6. Cleanup Assistant Screen

**Visual Layout**:

- Checklist-style layout with optimization tasks
- Icons for each task (e.g., trash bin, restart symbol)
- Status indicators (completed, pending)

**Functional Elements**:

- Action buttons for each suggestion
- Redirects to settings where needed
- Completion progress bar

---

### 7. Settings Screen

**Visual Layout**:

- List-style layout with toggles and dropdowns
- Sections: Notifications, Theme, Language, About

**Functional Elements**:

- Toggle switches
- Theme selector (light/dark)
- Link to privacy policy

---

### 8. Tips & Insights Screen

**Visual Layout**:

- Card-based layout with illustrations
- “Did You Know?” carousel
- External links to Apple support

**Functional Elements**:

- Scrollable tips feed
- Bookmark tips
- Share button

---

## 🎨 Style Guide

### Primary Colors

- Deep Blue: `#1E2A38`
- Electric Blue: `#007AFF`
- Cool Gray: `#F2F4F7`

### Accent Colors

- Green: `#34C759`
- Yellow: `#FFCC00`
- Red: `#FF3B30`

### Text Colors

- Dark Gray: `#333333`
- Medium Gray: `#666666`
- Light Gray: `#999999`

### Backgrounds

- White: `#FFFFFF`
- Light Gray: `#F8F8F8`

### Dark Mode Variant

- Background: `#121212`
- Card Background: `#1E1E1E`
- Text: `#E0E0E0`

---

## 🧰 Tech Stack

- React Native + TypeScript
- **React Native Paper**: [reactnativepaper.com](https://reactnativepaper.com/)
  - A Material Design UI library for React Native.
  - Provides a rich set of components like buttons, cards, dialogs, and progress bars.
  - Fully compatible with Expo and TypeScript.
  - Supports theming and accessibility out of the box.
- **Expo**: [docs.expo.dev](https://docs.expo.dev)
  - Development platform for React Native apps.
  - Provides managed workflow with pre-configured build tools.
  - Includes access to device APIs (battery, storage, notifications).
  - Simplifies deployment and over-the-air updates.
  - Built-in development tools and debugging capabilities.

---

## 🔀 Navigation Structure

- Bottom Tab Navigation for main sections
- Stack Navigation for detailed views
