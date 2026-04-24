import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const sentryDsn = process.env['EXPO_PUBLIC_SENTRY_DSN'] ?? '';
  const hasSentry = Boolean(sentryDsn && sentryDsn.startsWith('https://'));

  const plugins: ExpoConfig['plugins'] = [
    'expo-router',
    ['expo-camera', { barcodeScannerEnabled: true }],
  ];

  if (hasSentry) {
    plugins.push('sentry-expo', '@sentry/react-native');
  }

  return {
    ...config,
    name: '嫩叶ERP',
    slug: 'used-3c-erp-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'nenie-erp',
    // Reanimated 4 + react-native-worklets require the New Architecture on Android.
    // (Gradle fails with assertNewArchitectureEnabledTask if this is false.)
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.nenie.erp',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.nenie.erp',
      versionCode: 1,
      allowBackup: false,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.INTERNET',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
        'android.permission.WAKE_LOCK',
      ],
    },
    plugins,
    extra: {
      eas: {
        projectId: '23a4dc07-f9b5-41a1-bcfa-1df52f98197d',
      },
    },
  };
};
