export {
  verifyWalletSignature,
  generateAuthMessage,
  generateAuthNonce,
  verifyWalletWithDetails,
  type WalletVerificationResult,
} from "./walletVerification";

export {
  signup,
  loginWithWallet,
  logout,
  getCurrentSession,
  getCurrentUser,
  isWalletRegistered,
} from "./authService";
