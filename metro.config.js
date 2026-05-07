const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [
  ...config.resolver.assetExts,
  "onnx",
  "ort",
];

const optionalNativeStubs = {
  "@aws-sdk/client-kms": require.resolve("./utility/stubs/awsClientKms.js"),
  "@aws-sdk/client-lambda": require.resolve("./utility/stubs/awsClientLambda.js"),
  "@aws-sdk/credential-providers": require.resolve("./utility/stubs/awsCredentialProviders.js"),
  "brotli-wasm": require.resolve("./utility/stubs/brotliWasm.js"),
  "react-native-aes-gcm-crypto": require.resolve("./utility/stubs/reactNativeAesGcmCrypto.js"),
  "react-native-quick-crypto": require.resolve("./utility/stubs/reactNativeQuickCrypto.js"),
};

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["react-native", "browser", "require"];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (optionalNativeStubs[moduleName]) {
    return {
      type: "sourceFile",
      filePath: optionalNativeStubs[moduleName],
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

// THE FINAL FIX: Force Expo to use browser-compatible modules 
// whenever a Web3 library asks for a Node built-in.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve("crypto-browserify"),
  stream: require.resolve("stream-browserify"),
  events: require.resolve("events"),
  ...optionalNativeStubs,
};

module.exports = config;
