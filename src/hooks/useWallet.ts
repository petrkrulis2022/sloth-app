import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { useCallback, useState } from "react";
import { getSignMessage, generateNonce } from "@/config/wagmi";

export interface WalletState {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
}

export interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signAuthMessage: () => Promise<{ signature: string; nonce: string } | null>;
}

export function useWallet(): UseWalletReturn {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    try {
      setError(null);
      const metaMaskConnector = connectors.find(
        (connector) =>
          connector.id === "injected" || connector.name === "MetaMask"
      );

      if (!metaMaskConnector) {
        throw new Error(
          "MetaMask is not installed. Please install MetaMask to continue."
        );
      }

      await connectAsync({ connector: metaMaskConnector });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to connect wallet");
      setError(error);
      throw error;
    }
  }, [connectAsync, connectors]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    setError(null);
  }, [wagmiDisconnect]);

  const signAuthMessage = useCallback(async () => {
    try {
      setError(null);
      const nonce = generateNonce();
      const message = getSignMessage(nonce);

      const signature = await signMessageAsync({ message });

      return { signature, nonce };
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to sign message");
      setError(error);
      return null;
    }
  }, [signMessageAsync]);

  return {
    address,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    signAuthMessage,
  };
}
