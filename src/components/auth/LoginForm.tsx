import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { loginWithWallet, isWalletRegistered } from "@/services/auth";
import type { AuthResponse } from "@/types/auth";

interface LoginFormProps {
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: string) => void;
  onSwitchToSignup?: () => void;
}

export function LoginForm({
  onSuccess,
  onError,
  onSwitchToSignup,
}: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    address,
    isConnected,
    connect,
    signAuthMessage,
    error: walletError,
  } = useWallet();

  // Check if MetaMask is installed
  const isMetaMaskInstalled =
    typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  const handleLogin = async () => {
    setError(null);

    if (!isConnected || !address) {
      setError("Please connect your wallet first.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if wallet is registered
      const registered = await isWalletRegistered(address);
      if (!registered) {
        setError("No account found. Please sign up first.");
        setIsSubmitting(false);
        return;
      }

      // Sign authentication message
      const signResult = await signAuthMessage();
      if (!signResult) {
        setError("Message signing was cancelled. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const { signature, nonce } = signResult;

      // Call login service
      const response = await loginWithWallet({
        walletAddress: address,
        signature: signature as `0x${string}`,
        nonce,
      });

      if (response.success) {
        onSuccess?.(response);
      } else {
        const errorMessage = response.message;
        setError(errorMessage);
        onError?.(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      // Error is handled by useWallet hook
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <div className="w-full max-w-md p-6 bg-surface rounded-xl">
        <h2 className="text-xl font-semibold text-primary mb-4">
          MetaMask Required
        </h2>
        <p className="text-secondary mb-4">
          Sloth.app requires MetaMask for secure wallet authentication.
        </p>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-surface rounded-xl">
      <h2 className="text-xl font-semibold text-primary mb-6">Welcome Back</h2>

      <div className="space-y-4">
        {/* Wallet Connection */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Connect Your Wallet
          </label>
          {isConnected && address ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-charcoal-900 border border-default rounded-lg">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              <span className="text-primary">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              className="w-full px-3 py-2 bg-charcoal-800 hover:bg-charcoal-700 border border-default rounded-lg text-secondary hover:text-primary transition-colors"
            >
              Connect MetaMask
            </button>
          )}
          {walletError && (
            <p className="mt-1 text-sm text-red-400">{walletError.message}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isSubmitting || !isConnected}
          className="w-full px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing In..." : "Sign In with Wallet"}
        </button>
      </div>

      {/* Switch to Signup */}
      {onSwitchToSignup && (
        <p className="mt-4 text-center text-sm text-secondary">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToSignup}
            className="text-teal-400 hover:text-teal-300 underline"
          >
            Sign up
          </button>
        </p>
      )}
    </div>
  );
}
