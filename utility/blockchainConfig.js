import { sepolia } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";

export const BANK_TOKEN_CONTRACT_ADDRESS =
  process.env.EXPO_PUBLIC_TOKEN_CONTRACT_ADDRESS ||
  "0x1F7fCA4EB335C2Cc5479Dc26cF0Fa015d5A7EA78";

export const BANK_TOKEN_DECIMALS = 18;
export const FREE_TEST_MONEY_AMOUNT = "100";

export const appChain = sepolia;

export const accountAbstraction = {
  chain: appChain,
  sponsorGas: true,
};

export const createBankWallet = () => createWallet("io.metamask");
