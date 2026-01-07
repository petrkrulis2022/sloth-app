import { db } from "@/db";
import { verifyWalletSignature } from "./walletVerification";
import type {
  User,
  AuthSession,
  SignupParams,
  LoginParams,
  AuthResponse,
} from "@/types/auth";

// Session storage key
const SESSION_KEY = "sloth_auth_session";

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates wallet address format
 */
function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Creates a new session for the user
 */
function createSession(user: User): AuthSession {
  const session: AuthSession = {
    userId: user.id,
    walletAddress: user.walletAddress,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  };

  // Store session in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return session;
}

/**
 * Converts database user record to User type
 */
function toUser(dbUser: {
  id: string;
  email: string;
  wallet_address: string;
  created_at: string;
  updated_at: string;
}): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    walletAddress: dbUser.wallet_address,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at),
  };
}

/**
 * Signs up a new user with email and wallet address.
 * Verifies wallet ownership via signature before creating account.
 */
export async function signup(params: SignupParams): Promise<AuthResponse> {
  const { email, walletAddress, signature, nonce } = params;

  // Validate email format
  if (!isValidEmail(email)) {
    return {
      success: false,
      error: "INVALID_EMAIL",
      message: "Please enter a valid email address.",
    };
  }

  // Validate wallet address format
  if (!isValidWalletAddress(walletAddress)) {
    return {
      success: false,
      error: "INVALID_SIGNATURE",
      message: "Invalid wallet address format.",
    };
  }

  // Verify wallet signature
  const isValidSignature = await verifyWalletSignature(
    walletAddress,
    signature,
    nonce
  );

  if (!isValidSignature) {
    return {
      success: false,
      error: "INVALID_SIGNATURE",
      message: "Signature verification failed. Please try again.",
    };
  }

  try {
    // Check if wallet is already registered
    const { data: existingWallet } = await db
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .limit(1);

    if (existingWallet && existingWallet.length > 0) {
      return {
        success: false,
        error: "WALLET_ALREADY_REGISTERED",
        message: "This wallet is already linked to another account.",
      };
    }

    // Check if email is already registered
    const { data: existingEmail } = await db
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .limit(1);

    if (existingEmail && existingEmail.length > 0) {
      return {
        success: false,
        error: "INVALID_EMAIL",
        message: "This email is already registered.",
      };
    }

    // Create new user
    const { data: newUser, error } = await db
      .from("users")
      .insert({
        email: email.toLowerCase(),
        wallet_address: walletAddress.toLowerCase(),
      })
      .select()
      .single();

    if (error || !newUser) {
      console.error("Failed to create user:", error);
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "Failed to create user account.",
      };
    }

    const user = toUser(newUser);
    const session = createSession(user);

    return {
      success: true,
      user,
      session,
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Logs in an existing user with their wallet address.
 * Verifies wallet ownership via signature.
 */
export async function loginWithWallet(
  params: LoginParams
): Promise<AuthResponse> {
  const { walletAddress, signature, nonce } = params;

  // Validate wallet address format
  if (!isValidWalletAddress(walletAddress)) {
    return {
      success: false,
      error: "INVALID_SIGNATURE",
      message: "Invalid wallet address format.",
    };
  }

  // Verify wallet signature
  const isValidSignature = await verifyWalletSignature(
    walletAddress,
    signature,
    nonce
  );

  if (!isValidSignature) {
    return {
      success: false,
      error: "INVALID_SIGNATURE",
      message: "Signature verification failed. Please try again.",
    };
  }

  try {
    // Find user by wallet address
    const { data: existingUser, error } = await db
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .limit(1);

    if (error) {
      console.error("Login query error:", error);
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: "An unexpected error occurred. Please try again.",
      };
    }

    if (!existingUser || existingUser.length === 0) {
      return {
        success: false,
        error: "WALLET_NOT_REGISTERED",
        message: "No account found. Please sign up first.",
      };
    }

    const user = toUser(existingUser[0]);
    const session = createSession(user);

    return {
      success: true,
      user,
      session,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Logs out the current user by clearing the session.
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Gets the current session if valid.
 */
export function getCurrentSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) {
    return null;
  }

  try {
    const session: AuthSession = JSON.parse(sessionData);
    session.expiresAt = new Date(session.expiresAt);

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      logout();
      return null;
    }

    return session;
  } catch {
    logout();
    return null;
  }
}

/**
 * Gets the current authenticated user.
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = getCurrentSession();
  if (!session) {
    return null;
  }

  try {
    const { data: existingUser, error } = await db
      .from("users")
      .select("*")
      .eq("id", session.userId)
      .limit(1);

    if (error || !existingUser || existingUser.length === 0) {
      logout();
      return null;
    }

    return toUser(existingUser[0]);
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Checks if a wallet address is registered.
 */
export async function isWalletRegistered(
  walletAddress: string
): Promise<boolean> {
  if (!isValidWalletAddress(walletAddress)) {
    return false;
  }

  try {
    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress.toLowerCase())
      .limit(1);

    return existingUser !== null && existingUser.length > 0;
  } catch (error) {
    console.error("Check wallet registration error:", error);
    return false;
  }
}
