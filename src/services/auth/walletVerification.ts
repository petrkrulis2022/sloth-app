import { verifyMessage } from "viem";
import { getSignMessage } from "@/config/wagmi";

/**
 * Verifies that a wallet signature is valid for the given address and nonce.
 * Uses viem's verifyMessage to cryptographically verify the signature.
 *
 * @param address - The wallet address that supposedly signed the message
 * @param signature - The signature to verify
 * @param nonce - The nonce used in the original message
 * @returns true if the signature is valid, false otherwise
 */
export async function verifyWalletSignature(
  address: string,
  signature: `0x${string}`,
  nonce: string
): Promise<boolean> {
  try {
    const message = getSignMessage(nonce);

    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature,
    });

    return isValid;
  } catch (error) {
    console.error("Wallet signature verification failed:", error);
    return false;
  }
}

/**
 * Generates a unique authentication message for wallet signing.
 * The message includes a nonce to prevent replay attacks.
 *
 * @param nonce - A unique identifier for this authentication attempt
 * @returns The message to be signed by the wallet
 */
export function generateAuthMessage(nonce: string): string {
  return getSignMessage(nonce);
}

/**
 * Generates a cryptographically secure nonce for authentication.
 * Uses crypto.randomUUID() for uniqueness.
 *
 * @returns A unique nonce string
 */
export function generateAuthNonce(): string {
  return crypto.randomUUID();
}

export type WalletVerificationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * Performs complete wallet verification with detailed result.
 *
 * @param address - The wallet address
 * @param signature - The signature to verify
 * @param nonce - The nonce used in the message
 * @returns Verification result with error details if failed
 */
export async function verifyWalletWithDetails(
  address: string,
  signature: `0x${string}`,
  nonce: string
): Promise<WalletVerificationResult> {
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return { isValid: false, error: "Invalid wallet address format" };
  }

  if (!signature || !signature.startsWith("0x")) {
    return { isValid: false, error: "Invalid signature format" };
  }

  if (!nonce || nonce.length === 0) {
    return { isValid: false, error: "Nonce is required" };
  }

  try {
    const isValid = await verifyWalletSignature(address, signature, nonce);

    if (!isValid) {
      return { isValid: false, error: "Signature verification failed" };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}
