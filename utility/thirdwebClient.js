import { createThirdwebClient } from "thirdweb";

export const client = createThirdwebClient({ 
    clientId:
        process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID ||
        process.env.thirdweb_clientid ||
        "bc6b82f2e2ec6fdd0ba11bc88a64fe04"
});
