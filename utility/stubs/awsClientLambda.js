class LambdaClient {
  send() {
    throw new Error("Thirdweb Lambda wallet recovery is not available in this Expo runtime.");
  }
}

class InvokeCommand {
  constructor(input) {
    this.input = input;
  }
}

module.exports = { InvokeCommand, LambdaClient };
