const unavailable = () => {
  throw new Error("react-native-aes-gcm-crypto is not installed in this Expo runtime.");
};

module.exports = {
  decrypt: unavailable,
  encrypt: unavailable,
};
