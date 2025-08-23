# iBooster

Boost your device health with a friendly, insight-driven Expo app. iBooster helps you understand and improve battery usage, storage, and network performance with actionable tips, quick actions, and clear visualizations.

## ✨ Features

- Home dashboard with an overall health score and status cards
- Quick actions for common optimizations
- Battery insights with history charts
- Network status and latency test with performance tips
- Storage analysis with breakdown charts and large files list
- Guided onboarding to introduce app value
- Internationalization (English `en`, Brazilian Portuguese `pt-BR`)

## 🧰 Tech Stack

- React Native (Expo)
- TypeScript
- React Hooks for state/data
- EAS configuration (`eas.json`) for cloud builds
- i18n via JSON locale files (`locales/en.json`, `locales/pt-BR.json`)

> Note: This project is built with Expo. Prefer Expo-compatible libraries and avoid unsupported native modules.

## 📁 Project Structure

```
.
├── App.tsx
├── app.json
├── eas.json
├── i18n.ts
├── locales/
│   ├── en.json
│   └── pt-BR.json
├── screens/
│   ├── Battery/
│   ├── Home/
│   ├── Network/
│   ├── Onboarding/
│   └── Storage/
├── hooks/
│   ├── useBatteryMonitor.ts
│   ├── useNetworkPerformance.ts
│   ├── useOnboarding.ts
│   └── useStorageAnalyzer.ts
├── assets/
└── package.json
```

### Key Screens

- `Home`: Health score, status, quick actions
- `Battery`: Battery trends and insights
- `Network`: Status, latency testing, and tips
- `Storage`: Breakdown chart and large files
- `Onboarding`: Introductory flow

## 🚀 Getting Started

### Prerequisites

- macOS, Windows, or Linux
- Node.js managed via Volta
- Yarn
- Expo account (optional for EAS builds)

If you use Volta (recommended):

```zsh
curl https://get.volta.sh | bash
# Restart your shell, then:
volta install node@lts yarn
```

### Install dependencies

```zsh
yarn install
```

### Run the app (Expo Dev Server)

```zsh
yarn start
```

- Press `i` to open iOS Simulator, `a` for Android emulator, or `w` for Web.
- Or use platform shortcuts:

```zsh
yarn ios
# or
yarn android
# or
yarn web
```

### Useful scripts

```zsh
# Lint and fix
yarn lint
yarn lint:fix

# Format
yarn format
yarn format:check
```

### Native prebuild (when you need ios/android folders)

If you need to (re)generate native projects from your Expo config:

```zsh
yarn prebuild        # all platforms
# or
yarn prebuild:ios
# or
yarn prebuild:android
# or (clean rebuild)
yarn prebuild:clean
```

> A VS Code task "Run: yarn start (Expo)" is available to quickly start the dev server.

## 🌐 Internationalization (i18n)

- Add strings in `locales/en.json` and `locales/pt-BR.json`.
- Initialize/consume translations via `i18n.ts`.
- Keep keys consistent across all locale files.

## 🧪 Testing

Currently, there is no dedicated test setup in this repository. If you want to add tests, consider Jest + React Native Testing Library. We can wire this up on request.

## 🧹 Troubleshooting

- If dependencies feel out of sync, try a clean install:

```zsh
rm -rf .yarn/cache node_modules && rm yarn.lock .yarn/install-state.gz && yarn install
```

- Ensure you're using Node via Volta and Yarn for consistency.
- Clear Expo caches (only if needed):

```zsh
expo start -c
```

## 📦 EAS (Expo Application Services)

`eas.json` is included for managed CI/builds. To produce release builds:

```zsh
# Install the EAS CLI if you haven't
yarn global add eas-cli

# Configure once
eas login

# Build
eas build --platform ios
# or
eas build --platform android
```

Refer to the Expo/EAS docs for credentials and store submission guidance.

## 🧭 Contributing

- Follow the existing patterns: functional components, hooks, TypeScript.
- Reuse shared components and themes; keep styling consistent.
- Use Yarn and Volta; avoid `npm` and `nvm`.
- Run `yarn lint` and `yarn format` before committing.

## 🔒 License

This is proprietary software. All rights reserved. See the `LICENSE` file for the full terms. Redistribution, modification, or use outside of authorized contexts is prohibited without prior written consent from theaidguild.

---

Got feedback or want help adding features like tests or CI? Open an issue or reach out!
