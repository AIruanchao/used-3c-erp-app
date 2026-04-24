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

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: jest.fn(() => null),
  useCameraDevice: jest.fn(() => null),
  useCameraPermission: jest.fn(() => ({ hasPermission: true, requestPermission: jest.fn() })),
  useCodeScanner: jest.fn(() => ({})),
}));

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    cancelDeviceConnection: jest.fn(),
    onDeviceDisconnected: jest.fn(() => ({ remove: jest.fn() })),
    isDeviceConnected: jest.fn(() => false),
  })),
}));
