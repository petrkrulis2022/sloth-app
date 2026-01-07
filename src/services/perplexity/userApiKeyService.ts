/**
 * User API Key Service for managing Perplexity API keys
 * Handles encryption, storage, and retrieval of user API keys
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { supabase } from "../../config/supabase";
import { encrypt, decrypt } from "../crypto";

export type ApiKeyError =
  | "USER_NOT_FOUND"
  | "INVALID_API_KEY"
  | "ENCRYPTION_ERROR"
  | "UNKNOWN_ERROR";

export interface ApiKeyResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiKeyError;
  message?: string;
}

/**
 * Validates that an API key has a reasonable format
 * Perplexity API keys are typically prefixed with "pplx-"
 */
function isValidApiKeyFormat(apiKey: string): boolean {
  // Basic validation: non-empty and reasonable length
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }
  // Perplexity API keys are typically 40+ characters
  if (apiKey.length < 20) {
    return false;
  }
  return true;
}

/**
 * Saves or updates a user's Perplexity API key (encrypted)
 * Requirements: 1.2, 1.3, 1.5
 */
export async function saveUserApiKey(
  userId: string,
  apiKey: string
): Promise<ApiKeyResponse<void>> {
  try {
    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      return {
        success: false,
        error: "INVALID_API_KEY",
        message: "Invalid API key format",
      };
    }

    // Encrypt the API key
    let encryptedKey: string;
    try {
      encryptedKey = await encrypt(apiKey);
    } catch {
      return {
        success: false,
        error: "ENCRYPTION_ERROR",
        message: "Failed to encrypt API key",
      };
    }

    // Update the user record with the encrypted key
    const { error } = await supabase
      .from("users")
      .update({ perplexity_api_key_enc: encryptedKey })
      .eq("id", userId);

    if (error) {
      // Check if user doesn't exist
      if (error.code === "PGRST116") {
        return {
          success: false,
          error: "USER_NOT_FOUND",
          message: "User not found",
        };
      }
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: error.message,
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Gets the API key status for a user (does not return the actual key)
 * Requirements: 1.4, 1.6
 */
export async function getUserApiKeyStatus(
  userId: string
): Promise<ApiKeyResponse<{ hasApiKey: boolean }>> {
  try {
    // Suppress console errors for missing columns (expected during setup)
    let data = null;
    let error = null;

    try {
      const result = await supabase
        .from("users")
        .select("perplexity_api_key_enc")
        .eq("id", userId)
        .single();
      data = result.data;
      error = result.error;
    } catch {
      // Silently catch any network/query errors - assume no key
      return {
        success: true,
        data: { hasApiKey: false },
      };
    }

    if (error) {
      // If column doesn't exist or table not found, return false gracefully
      return {
        success: true,
        data: { hasApiKey: false },
      };
    }

    const hasApiKey = !!(data as any)?.perplexity_api_key_enc;

    return {
      success: true,
      data: { hasApiKey },
    };
  } catch (err) {
    console.warn("Failed to check API key status:", err);
    // Return false gracefully instead of throwing
    return {
      success: true,
      data: { hasApiKey: false },
    };
  }
}

/**
 * Gets the decrypted API key for a user (internal use only)
 * This should only be called server-side when making Perplexity API calls
 * Requirements: 6.4
 */
export async function getDecryptedApiKey(
  userId: string
): Promise<string | null> {
  try {
    // Suppress console errors for missing columns (expected during setup)
    let data = null;
    let error = null;

    try {
      const result = await supabase
        .from("users")
        .select("perplexity_api_key_enc")
        .eq("id", userId)
        .single();
      data = result.data;
      error = result.error;
    } catch {
      // Silently catch any network/query errors
      return null;
    }

    // Handle missing column or table gracefully (no console warnings needed)
    if (error) {
      return null;
    }

    if (!data?.perplexity_api_key_enc) {
      return null;
    }

    // Decrypt the API key
    try {
      const decryptedKey = await decrypt(data.perplexity_api_key_enc);
      return decryptedKey;
    } catch {
      // If decryption fails, return null
      return null;
    }
  } catch (err) {
    console.warn("Failed to get decrypted API key:", err);
    return null;
  }
}

/**
 * Removes a user's API key
 * Requirements: 1.5
 */
export async function removeUserApiKey(
  userId: string
): Promise<ApiKeyResponse<void>> {
  try {
    const { error } = await supabase
      .from("users")
      .update({ perplexity_api_key_enc: null })
      .eq("id", userId);

    if (error) {
      if (error.code === "PGRST116") {
        return {
          success: false,
          error: "USER_NOT_FOUND",
          message: "User not found",
        };
      }
      return {
        success: false,
        error: "UNKNOWN_ERROR",
        message: error.message,
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
    };
  }
}
