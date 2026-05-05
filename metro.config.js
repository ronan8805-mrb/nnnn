// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for react-native-maps on web
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react-native-maps': 'react-native-web',
};

module.exports = config;
