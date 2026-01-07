import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Configure wagmi with MetaMask connector
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// Message to sign for wallet authentication
export const getSignMessage = (nonce: string): string => {
  return `Welcome to Sloth.app!

Sign this message to verify your wallet ownership.

Nonce: ${nonce}

This request will not trigger a blockchain transaction or cost any gas fees.`;
};

// Generate a random nonce for signing
export const generateNonce = (): string => {
  return crypto.randomUUID();
};
