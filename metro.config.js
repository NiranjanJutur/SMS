const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Block browser-only packages from being bundled.
 * firebase and @google/generative-ai use browser APIs (indexedDB, etc.)
 * that do not exist in React Native and will crash the app.
 * We redirect them to empty stub files instead.
 */
const config = {
  resolver: {
    extraNodeModules: {
      // Redirect firebase to an empty stub
      'firebase': path.resolve(__dirname, 'stubs/firebase.js'),
      'firebase/app': path.resolve(__dirname, 'stubs/firebase.js'),
      'firebase/firestore': path.resolve(__dirname, 'stubs/firebase.js'),
      'firebase/auth': path.resolve(__dirname, 'stubs/firebase.js'),
      // Redirect @google/generative-ai to an empty stub
      '@google/generative-ai': path.resolve(__dirname, 'stubs/generative-ai.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
