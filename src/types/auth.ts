export interface User {
  id: string;
  email: string;
  walletAddress: string;
  hasPerplexityApiKey?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  userId: string;
  walletAddress: string;
  expiresAt: Date;
}

export interface SignupParams {
  email: string;
  walletAddress: string;
  signature: `0x${string}`;
  nonce: string;
}

export interface LoginParams {
  walletAddress: string;
  signature: `0x${string}`;
  nonce: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export type AuthError =
  | "WALLET_NOT_REGISTERED"
  | "WALLET_ALREADY_REGISTERED"
  | "INVALID_SIGNATURE"
  | "INVALID_EMAIL"
  | "SESSION_EXPIRED"
  | "UNKNOWN_ERROR";

export interface AuthErrorResult {
  success: false;
  error: AuthError;
  message: string;
}

export interface AuthSuccessResult {
  success: true;
  user: User;
  session: AuthSession;
}

export type AuthResponse = AuthSuccessResult | AuthErrorResult;
