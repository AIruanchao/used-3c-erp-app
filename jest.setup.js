// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock sentry-expo
jest.mock('sentry-expo', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock expo-constants (imported by lib/api.ts for optional extra config)
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

// Mock react-native-mmkv
const mockMmkvStore = new Map();
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn((key) => mockMmkvStore.get(key)),
    set: jest.fn((key, value) => { mockMmkvStore.set(key, value); }),
    remove: jest.fn((key) => { mockMmkvStore.delete(key); }),
    delete: jest.fn((key) => { mockMmkvStore.delete(key); }),
    clearAll: jest.fn(() => { mockMmkvStore.clear(); }),
  })),
}));

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: jest.fn(() => null),
}));
