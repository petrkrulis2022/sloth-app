import { useWallet } from "@/hooks/useWallet";

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

export function WalletConnectButton({
  onConnect,
  onError,
  className = "",
  disabled = false,
}: WalletConnectButtonProps) {
  const { address, isConnected, isConnecting, error, connect, disconnect } =
    useWallet();

  const handleConnect = async () => {
    try {
      await connect();
      if (address && onConnect) {
        onConnect(address);
      }
    } catch (err) {
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Check if MetaMask is installed
  const isMetaMaskInstalled =
    typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  if (!isMetaMaskInstalled) {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled
          className={`px-4 py-2 rounded-lg bg-charcoal-800 text-muted cursor-not-allowed ${className}`}
        >
          MetaMask Not Installed
        </button>
        <p className="text-sm text-secondary">
          Please{" "}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 hover:text-teal-300 underline"
          >
            install MetaMask
          </a>{" "}
          to continue.
        </p>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-secondary">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={handleDisconnect}
          className={`px-4 py-2 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-primary transition-colors ${className}`}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleConnect}
        disabled={disabled || isConnecting}
        className={`px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isConnecting ? "Connecting..." : "Connect MetaMask"}
      </button>
      {error && <p className="text-sm text-red-400">{error.message}</p>}
    </div>
  );
}
