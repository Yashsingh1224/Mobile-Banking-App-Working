const unavailable = () => {
  throw new Error("Thirdweb AWS credential providers are not available in this Expo runtime.");
};

module.exports = {
  fromCognitoIdentity: unavailable,
  fromCognitoIdentityPool: unavailable,
};
