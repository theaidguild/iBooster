# Network Screen Demo

To quickly test the Network Screen during development, you can modify `App.tsx` line 50:

```typescript
// Change this line:
const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');

// To this for direct testing:
const [currentScreen, setCurrentScreen] = useState<Screen>('network');
```

This will launch directly into the Network Screen for testing.

## Screen Features Implemented

✅ **NetworkStatusCard**: Shows network type (Wi-Fi, Cellular, etc.), connection status, and internet reachability  
✅ **LatencyTestCard**: Interactive latency testing with visual results and performance guide  
✅ **PerformanceTips**: Contextual tips for network optimization, with offline mode filtering  
✅ **Offline Banner**: Alert when network is unavailable  
✅ **Pull-to-refresh**: Manual refresh for network data  
✅ **Theming**: Full Material Design 3 theming with light/dark mode support  
✅ **Accessibility**: Proper labels, contrast, and semantic structure  

## Testing the Screen

The screen automatically detects network state on load and when returning to focus. 
You can test latency by tapping "Run Latency Test" (requires internet connection).
The offline state can be tested by disabling network connectivity.