module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)'],
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    // Expo packages ship untranspiled ESM/TS in places; allow Babel to transform them.
    'node_modules/(?!((jest-)?react-native|@react-native|@sentry|sentry-expo|expo(nent)?|@expo(nent)?|expo-modules-core|@react-native-community|@react-navigation)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
