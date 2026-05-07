class KMSClient {
  send() {
    throw new Error("Thirdweb KMS wallet migration is not available in this Expo runtime.");
  }
}

class GenerateDataKeyCommand {
  constructor(input) {
    this.input = input;
  }
}

module.exports = { GenerateDataKeyCommand, KMSClient };
